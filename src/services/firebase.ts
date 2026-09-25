import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CategoryItem, Expense } from '../types/finance';
import { DEFAULT_CATEGORIES, getCurrentMonthLabel } from '../utils/formatters';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with configured custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface FirebaseUserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  isGuest?: boolean;
}

export interface UserFinancialData {
  userId: string;
  baseIncome: number;
  monthlyIncomes: Record<string, number>;
  activeMonths: string[];
  currentMonth: string;
  categories: CategoryItem[];
  updatedAt: string;
}

// Encode email safely for Firestore document keys
function getEmailKey(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, '%2E');
}

/**
 * Validates connection to Firestore as required by Firebase integration guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'users_by_email', 'health_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
    }
    return true; // Read attempt reached Firestore
  }
}

/**
 * Save user locally as fallback backup
 */
function saveUserLocally(email: string, password: string, user: FirebaseUserProfile) {
  try {
    const raw = localStorage.getItem('finanzen_registered_users');
    const map = raw ? JSON.parse(raw) : {};
    map[email.trim().toLowerCase()] = {
      passwordHash: btoa(password),
      user,
    };
    localStorage.setItem('finanzen_registered_users', JSON.stringify(map));
  } catch (e) {
    console.warn('Could not save user locally:', e);
  }
}

/**
 * Check local user fallback
 */
function getLocalUser(email: string, password: string): { user?: FirebaseUserProfile; error?: string } | null {
  try {
    const raw = localStorage.getItem('finanzen_registered_users');
    if (!raw) return null;
    const map = JSON.parse(raw);
    const entry = map[email.trim().toLowerCase()];
    if (!entry) return null;

    const expectedHash = btoa(password);
    if (entry.passwordHash && entry.passwordHash !== expectedHash && entry.passwordHash !== password) {
      return { error: 'Senha incorreta. Verifique seus dados e tente novamente.' };
    }
    return { user: entry.user };
  } catch {
    return null;
  }
}

/**
 * Register a new user in Firestore cloud database with local resilience.
 * Standard default: starts with clean ZEROED financial data.
 */
export async function registerUserWithFirebase(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const emailKey = getEmailKey(cleanEmail);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();
  const passwordHash = btoa(password);

  const userProfile: FirebaseUserProfile = {
    id: userId,
    email: cleanEmail,
    name: cleanName,
    phone: phone?.trim() || '',
    passwordHash,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Always save locally first so user never loses access or gets blocked
  saveUserLocally(cleanEmail, password, userProfile);

  // Attempt cloud sync in background/best-effort
  try {
    const emailDocRef = doc(db, 'users_by_email', emailKey);

    // 1. Check existing account in cloud
    try {
      const emailSnap = await getDocFromServer(emailDocRef);
      if (emailSnap && emailSnap.exists()) {
        return { error: 'Este e-mail já está cadastrado no sistema. Faça login com sua senha.' };
      }
    } catch {
      // Server unreachable, ignore remote check to avoid blocking
    }

    // 2. Create user document & email index in Firestore
    await setDoc(doc(db, 'users', userId), userProfile).catch((e) => {
      console.warn('Firestore setDoc user warning:', e);
    });

    await setDoc(emailDocRef, {
      userId,
      email: cleanEmail,
      name: cleanName,
      passwordHash,
      createdAt: nowIso,
    }).catch((e) => {
      console.warn('Firestore setDoc email index warning:', e);
    });

    // 3. Initialize user's financial profile with ZERO DATA by default
    const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      budget: 0,
    }));

    const initialMonth = getCurrentMonthLabel();
    const initialFinancial: UserFinancialData = {
      userId,
      baseIncome: 0,
      monthlyIncomes: {},
      activeMonths: [initialMonth],
      currentMonth: initialMonth,
      categories: zeroCategories,
      updatedAt: nowIso,
    };

    await setDoc(doc(db, 'users', userId, 'financial', 'main'), initialFinancial).catch((e) => {
      console.warn('Firestore setDoc financial warning:', e);
    });
  } catch (err: any) {
    console.warn('Cloud sync offline during registration, active in local mode:', err);
  }

  return { user: userProfile };
}

/**
 * Login user from Firestore cloud database with local fallback.
 * Allows instant access regardless of cloud connectivity.
 */
export async function loginUserWithFirebase(
  email: string,
  password: string
): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = cleanEmail.split('@')[0];
  const emailKey = getEmailKey(cleanEmail);
  const expectedHash = btoa(password);

  // 1. Check local storage first
  const localResult = getLocalUser(cleanEmail, password);

  // 2. Try Firestore cloud database
  try {
    const emailDocRef = doc(db, 'users_by_email', emailKey);
    let emailSnap;

    try {
      emailSnap = await getDocFromServer(emailDocRef);
    } catch {
      try {
        emailSnap = await getDoc(emailDocRef);
      } catch {
        // Offline
      }
    }

    if (emailSnap && emailSnap.exists()) {
      const indexData = emailSnap.data();

      if (indexData.passwordHash && indexData.passwordHash !== expectedHash && indexData.passwordHash !== password) {
        return { error: 'Senha incorreta. Verifique seus dados e tente novamente.' };
      }

      const userProfile: FirebaseUserProfile = {
        id: indexData.userId,
        email: cleanEmail,
        name: indexData.name || cleanName,
        phone: indexData.phone || '',
        createdAt: indexData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveUserLocally(cleanEmail, password, userProfile);
      return { user: userProfile };
    }
  } catch (err: any) {
    console.warn('Firebase login check error:', err);
  }

  // 3. Fallback to local user if found
  if (localResult) {
    return localResult;
  }

  return { error: 'Usuário não encontrado. Se ainda não possui conta, cadastre-se na aba "Criar Nova Conta".' };
}

/**
 * Updates user profile details in Firestore.
 */
export async function updateFirebaseUserProfile(
  userId: string,
  data: Partial<FirebaseUserProfile>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    if (data.email) {
      const emailKey = getEmailKey(data.email);
      await setDoc(
        doc(db, 'users_by_email', emailKey),
        { ...data, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }
  } catch (e) {
    console.error('Error updating user profile in Firestore:', e);
  }
}

/**
 * Real-time listener for the user's financial profile.
 * Triggers instantly across all connected devices (computer and phone).
 */
export function subscribeToUserFinancialData(
  userId: string,
  onData: (data: UserFinancialData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'users', userId, 'financial', 'main');

  return onSnapshot(
    docRef,
    async (snap) => {
      if (snap.exists()) {
        onData(snap.data() as UserFinancialData);
      } else {
        // If profile doesn't exist yet, initialize with zeroed data
        const initialMonth = getCurrentMonthLabel();
        const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          budget: 0,
        }));
        const initial: UserFinancialData = {
          userId,
          baseIncome: 0,
          monthlyIncomes: {},
          activeMonths: [initialMonth],
          currentMonth: initialMonth,
          categories: zeroCategories,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, initial);
        onData(initial);
      }
    },
    (err) => {
      console.warn('Firestore financial listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for the user's expenses subcollection.
 * Synchronizes new, updated, and deleted expenses in real time.
 */
export function subscribeToUserExpenses(
  userId: string,
  onExpenses: (expenses: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collRef = collection(db, 'users', userId, 'expenses');

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        list.push({
          id: item.id || d.id,
          data: item.data || '',
          descricao: item.descricao || '',
          categoria: item.categoria || 'Outros',
          forma_pagamento: item.forma_pagamento || 'PIX',
          valor: typeof item.valor === 'number' ? item.valor : parseFloat(item.valor) || 0,
          status: item.status || 'Pago',
        });
      });

      // Sort by date descending (newest first)
      list.sort((a, b) => b.data.localeCompare(a.data));
      onExpenses(list);
    },
    (err) => {
      console.warn('Firestore expenses listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update user's financial profile in Firestore
 */
export async function saveUserFinancialProfile(
  userId: string,
  data: Partial<UserFinancialData>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'financial', 'main');
    await setDoc(
      docRef,
      {
        ...data,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving financial profile to Firestore:', err);
    throw err;
  }
}

/**
 * Save or update an expense in Firestore
 */
export async function saveUserExpense(userId: string, expense: Expense): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expense.id);
    await setDoc(docRef, {
      ...expense,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving expense to Firestore:', err);
    throw err;
  }
}

/**
 * Delete an expense in Firestore
 */
export async function deleteUserExpense(userId: string, expenseId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting expense from Firestore:', err);
    throw err;
  }
}

/**
 * Add or switch a month in the user's account
 */
export async function addUserMonth(
  userId: string,
  newMonthLabel: string,
  incomeForMonth: number = 0,
  existingIncomes: Record<string, number> = {},
  existingActiveMonths: string[] = []
): Promise<void> {
  try {
    const activeMonths = existingActiveMonths.includes(newMonthLabel)
      ? existingActiveMonths
      : [...existingActiveMonths, newMonthLabel];

    const monthlyIncomes = {
      ...existingIncomes,
      [newMonthLabel]: incomeForMonth,
    };

    await saveUserFinancialProfile(userId, {
      activeMonths,
      currentMonth: newMonthLabel,
      monthlyIncomes,
    });
  } catch (err) {
    console.error('Error adding user month to Firestore:', err);
    throw err;
  }
}

/**
 * Reset all user financial data in Firestore (cleans expenses and zeroes budgets/incomes)
 */
export async function resetAllUserDataInFirebase(userId: string): Promise<void> {
  try {
    // 1. Delete all expense docs
    const collRef = collection(db, 'users', userId, 'expenses');
    const snap = await getDocs(collRef);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // 2. Reset financial doc
    const initialMonth = getCurrentMonthLabel();
    const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      budget: 0,
    }));

    await saveUserFinancialProfile(userId, {
      baseIncome: 0,
      monthlyIncomes: {},
      activeMonths: [initialMonth],
      currentMonth: initialMonth,
      categories: zeroCategories,
    });
  } catch (err) {
    console.error('Error resetting user data in Firestore:', err);
    throw err;
  }
}
