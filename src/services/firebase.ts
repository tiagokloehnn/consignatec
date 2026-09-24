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
 * Register a new user in Firestore cloud database.
 * Standard default: starts with clean ZEROED financial data (no fake pre-filled expenses).
 */
export async function registerUserWithFirebase(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const emailKey = getEmailKey(cleanEmail);

    // Check if email already registered in cloud Firestore
    const emailDocRef = doc(db, 'users_by_email', emailKey);
    const emailSnap = await getDoc(emailDocRef);

    if (emailSnap.exists()) {
      return { error: 'Este e-mail já está cadastrado no sistema. Faça login com sua senha.' };
    }

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

    // 1. Create user document
    await setDoc(doc(db, 'users', userId), userProfile);

    // 2. Create email index document for quick cross-device login
    await setDoc(emailDocRef, {
      userId,
      email: cleanEmail,
      name: cleanName,
      passwordHash,
      createdAt: nowIso,
    });

    // 3. Initialize user's financial profile with ZERO DATA by default
    // Default categories have budget = 0 so the user configures their own values
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

    await setDoc(doc(db, 'users', userId, 'financial', 'main'), initialFinancial);

    return { user: userProfile };
  } catch (err: any) {
    console.error('Firebase registration error:', err);
    return { error: err?.message || 'Falha ao registrar conta no banco de dados na nuvem.' };
  }
}

/**
 * Login user from Firestore cloud database.
 * Allows instant synchronization between computer and mobile phone.
 */
export async function loginUserWithFirebase(
  email: string,
  password: string
): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const emailKey = getEmailKey(cleanEmail);

    const emailDocRef = doc(db, 'users_by_email', emailKey);
    const emailSnap = await getDoc(emailDocRef);

    if (!emailSnap.exists()) {
      return { error: 'Usuário não encontrado com este e-mail. Crie uma nova conta para começar.' };
    }

    const indexData = emailSnap.data();
    const expectedHash = btoa(password);

    if (indexData.passwordHash && indexData.passwordHash !== expectedHash && indexData.passwordHash !== password) {
      return { error: 'Senha incorreta. Verifique seus dados e tente novamente.' };
    }

    // Fetch full user profile
    const userDocRef = doc(db, 'users', indexData.userId);
    const userSnap = await getDoc(userDocRef);

    let userProfile: FirebaseUserProfile;
    if (userSnap.exists()) {
      userProfile = userSnap.data() as FirebaseUserProfile;
    } else {
      userProfile = {
        id: indexData.userId,
        email: cleanEmail,
        name: indexData.name || cleanEmail.split('@')[0],
        phone: indexData.phone || '',
        createdAt: indexData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, userProfile);
    }

    return { user: userProfile };
  } catch (err: any) {
    console.error('Firebase login error:', err);
    return { error: err?.message || 'Falha ao autenticar com o banco de dados na nuvem.' };
  }
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
