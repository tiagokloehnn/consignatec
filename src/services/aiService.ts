import { Expense, CategoryName, PaymentMethod, ExpenseStatus, FinancialDiagnosis } from '../types/finance';

export interface ParseExpenseResult {
  data: string;
  descricao: string;
  categoria: CategoryName;
  forma_pagamento: PaymentMethod;
  valor: number;
  status: ExpenseStatus;
}

export async function parseNaturalLanguageExpense(
  text: string,
  referenceDate?: string,
  availableCategories?: string[]
): Promise<ParseExpenseResult> {
  const response = await fetch('/api/parse-expense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      referenceDate: referenceDate || new Date().toISOString().split('T')[0],
      availableCategories,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Falha na requisição' }));
    throw new Error(err.error || 'Erro ao interpretar gasto com IA');
  }

  return response.json();
}

export async function generateFinancialDiagnosis(payload: {
  income: number;
  totalExpenses: number;
  categories: Array<{
    name: string;
    budget: number;
    spent: number;
    percent: number;
    status: string;
  }>;
  recentExpenses: Expense[];
}): Promise<FinancialDiagnosis> {
  const response = await fetch('/api/diagnostico', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Falha na requisição' }));
    throw new Error(err.error || 'Erro ao gerar diagnóstico financeiro');
  }

  return response.json();
}
