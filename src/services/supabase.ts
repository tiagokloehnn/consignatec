import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Expense, CategoryItem } from '../types/finance';

const supabaseUrl = import.meta.env.VITE_CONSIGNATEC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_CONSIGNATEC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://xyzcompany.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface RemoteFinanceData {
  expenses: Expense[];
  categories?: CategoryItem[];
  baseIncome?: number;
  monthlyIncomes?: Record<string, number>;
}

/**
 * Auth Helpers
 */
export async function getCurrentSupabaseUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;
    if (user && !user.email_confirmed_at && !user.confirmed_at) {
      await supabase.auth.signOut();
      return null;
    }
    return user;
  } catch (err) {
    console.warn('Error fetching supabase session:', err);
    return null;
  }
}

export async function signInSupabase(email: string, password: string): Promise<{
  user: User | null;
  error: string | null;
  needsConfirmation?: boolean;
}> {
  if (!supabase) {
    return { user: null, error: 'Supabase não está configurado nas variáveis de ambiente (.env).' };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      const isUnconfirmed =
        msg.includes('not confirmed') ||
        msg.includes('confirm') ||
        msg.includes('verification') ||
        msg.includes('unconfirmed');
      return {
        user: null,
        error: isUnconfirmed
          ? 'E-mail não confirmado! O acesso está bloqueado até que você acesse seu e-mail e clique no link de confirmação.'
          : (error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message),
        needsConfirmation: isUnconfirmed,
      };
    }

    // Strict security check: User MUST have email_confirmed_at timestamp
    const confirmed = Boolean(data.user?.email_confirmed_at || data.user?.confirmed_at);
    if (!confirmed) {
      await supabase.auth.signOut();
      return {
        user: null,
        error: 'E-mail não confirmado! O acesso está estritamente bloqueado até a validação do link enviado para seu e-mail.',
        needsConfirmation: true,
      };
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Falha na autenticação' };
  }
}

export async function signUpSupabase(
  email: string,
  password: string,
  name?: string
): Promise<{
  user: User | null;
  session: any | null;
  needsEmailConfirmation: boolean;
  error: string | null;
}> {
  if (!supabase) {
    return { user: null, session: null, needsEmailConfirmation: true, error: 'Supabase não está configurado nas variáveis de ambiente (.env).' };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || '',
          name: name || '',
        },
      },
    });
    if (error) {
      return { user: null, session: null, needsEmailConfirmation: true, error: error.message };
    }

    // In Supabase with email confirmation enabled, email_confirmed_at is null
    const confirmed = Boolean(data.user?.email_confirmed_at || data.user?.confirmed_at);
    const needsEmailConfirmation = !confirmed;

    // Strict access blocking: sign out immediately upon sign up so user CANNOT enter without confirming
    await supabase.auth.signOut();

    return {
      user: data.user,
      session: null,
      needsEmailConfirmation,
      error: null,
    };
  } catch (err: any) {
    return { user: null, session: null, needsEmailConfirmation: true, error: err?.message || 'Falha ao registrar usuário' };
  }
}

export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    return { success: false, error: 'Supabase não configurado nas variáveis de ambiente.' };
  }
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao reenviar e-mail de confirmação' };
  }
}

export async function signOutSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Error signing out:', err);
  }
}

export interface UpdateProfileParams {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export async function updateSupabaseUserProfile(params: UpdateProfileParams): Promise<{
  success: boolean;
  error: string | null;
  emailNeedsConfirmation?: boolean;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase não está configurado.' };
  }
  try {
    const updatePayload: {
      email?: string;
      password?: string;
      phone?: string;
      data?: {
        name?: string;
        full_name?: string;
        phone?: string;
      };
    } = {};

    if (params.password && params.password.trim().length >= 6) {
      updatePayload.password = params.password.trim();
    }

    if (params.email && params.email.trim()) {
      updatePayload.email = params.email.trim();
    }

    if (params.name !== undefined || params.phone !== undefined) {
      updatePayload.data = {
        name: params.name?.trim(),
        full_name: params.name?.trim(),
        phone: params.phone?.trim(),
      };
    }

    const { data, error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      return { success: false, error: error.message };
    }

    // If email was updated, Supabase might send confirmation to new email
    const emailNeedsConfirmation = Boolean(params.email && data.user?.new_email);

    return {
      success: true,
      error: null,
      emailNeedsConfirmation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Falha ao atualizar perfil do usuário.',
    };
  }
}

/**
 * Fetch all finance data for the authenticated user from Supabase
 */
export async function fetchFromSupabase(): Promise<RemoteFinanceData | null> {
  if (!supabase) return null;

  try {
    const user = await getCurrentSupabaseUser();
    if (!user) {
      // Not logged in to Supabase
      return null;
    }

    const [expensesRes, categoriesRes, incomesRes] = await Promise.all([
      supabase.from('expenses').select('*').order('data', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('monthly_incomes').select('*'),
    ]);

    if (expensesRes.error) {
      console.warn('Supabase fetch expenses error:', expensesRes.error.message);
    }

    const expenses: Expense[] = (expensesRes.data || []).map((row) => ({
      id: row.id,
      data: row.data,
      descricao: row.descricao,
      categoria: row.categoria,
      forma_pagamento: row.forma_pagamento,
      valor: Number(row.valor),
      status: row.status,
    }));

    const categories: CategoryItem[] = (categoriesRes.data || []).map((row) => ({
      id: row.id,
      name: row.name,
      budget: Number(row.budget),
      color: row.color,
      icon: row.icon,
      classification: row.classification || 'necessidades',
    }));

    const monthlyIncomes: Record<string, number> = {};
    let baseIncome = 0;

    (incomesRes.data || []).forEach((row) => {
      if (row.month_key === 'base') {
        baseIncome = Number(row.amount);
      } else {
        monthlyIncomes[row.month_key] = Number(row.amount);
      }
    });

    return {
      expenses,
      categories: categories.length > 0 ? categories : undefined,
      baseIncome: baseIncome > 0 ? baseIncome : undefined,
      monthlyIncomes: Object.keys(monthlyIncomes).length > 0 ? monthlyIncomes : undefined,
    };
  } catch (err: any) {
    console.warn('Failed to fetch from Supabase:', err?.message || err);
    return null;
  }
}

/**
 * Upsert an expense in Supabase bound to the current authenticated user
 */
export async function saveExpenseToSupabase(expense: Expense): Promise<boolean> {
  if (!supabase) return false;

  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return false;

    const { error } = await supabase.from('expenses').upsert({
      id: expense.id,
      user_id: user.id,
      data: expense.data,
      descricao: expense.descricao,
      categoria: expense.categoria,
      forma_pagamento: expense.forma_pagamento,
      valor: expense.valor,
      status: expense.status,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase upsert expense error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase save error:', err?.message || err);
    return false;
  }
}

/**
 * Delete an expense in Supabase for current authenticated user
 */
export async function deleteExpenseFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return false;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.warn('Supabase delete expense error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase delete error:', err?.message || err);
    return false;
  }
}

/**
 * Delete all expenses of a specific year-month for current authenticated user
 */
export async function deleteMonthExpensesFromSupabase(yearMonth: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return false;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', user.id)
      .gte('data', `${yearMonth}-01`)
      .lte('data', `${yearMonth}-31`);

    if (error) {
      console.warn('Supabase delete month error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase delete month error:', err?.message || err);
    return false;
  }
}

/**
 * Save monthly income to Supabase for current authenticated user
 */
export async function saveIncomeToSupabase(monthKey: string, amount: number): Promise<boolean> {
  if (!supabase) return false;

  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return false;

    const { error } = await supabase.from('monthly_incomes').upsert({
      user_id: user.id,
      month_key: monthKey,
      amount,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase upsert income error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase save income error:', err?.message || err);
    return false;
  }
}

/**
 * Bulk upload local data to Supabase (Initial sync for user)
 */
export async function syncAllToSupabase(payload: {
  expenses: Expense[];
  categories: CategoryItem[];
  baseIncome: number;
  monthlyIncomes: Record<string, number>;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase não está configurado no arquivo .env' };
  }

  try {
    const user = await getCurrentSupabaseUser();
    if (!user) {
      return { success: false, message: 'Você precisa estar logado com sua conta para sincronizar na nuvem.' };
    }

    // 1. Sync Categories
    if (payload.categories.length > 0) {
      const catRows = payload.categories.map((c) => ({
        id: c.id,
        user_id: user.id,
        name: c.name,
        budget: c.budget,
        color: c.color,
        icon: c.icon,
        classification: c.classification,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('categories').upsert(catRows);
    }

    // 2. Sync Incomes
    const incomeRows = [
      { user_id: user.id, month_key: 'base', amount: payload.baseIncome, updated_at: new Date().toISOString() },
      ...Object.entries(payload.monthlyIncomes).map(([k, v]) => ({
        user_id: user.id,
        month_key: k,
        amount: v,
        updated_at: new Date().toISOString(),
      })),
    ];
    await supabase.from('monthly_incomes').upsert(incomeRows);

    // 3. Sync Expenses
    if (payload.expenses.length > 0) {
      const expenseRows = payload.expenses.map((e) => ({
        id: e.id,
        user_id: user.id,
        data: e.data,
        descricao: e.descricao,
        categoria: e.categoria,
        forma_pagamento: e.forma_pagamento,
        valor: e.valor,
        status: e.status,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('expenses').upsert(expenseRows);
    }

    return { success: true, message: 'Dados sincronizados com sua conta no Supabase com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Falha ao sincronizar com o Supabase' };
  }
}
