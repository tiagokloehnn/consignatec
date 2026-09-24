import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MonthYearPicker } from './components/MonthYearPicker';
import { KpiCards } from './components/KpiCards';
import { CategoryBudgetTable } from './components/CategoryBudgetTable';
import { ExpenseTable } from './components/ExpenseTable';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { ExpenseModal } from './components/ExpenseModal';
import { CategoryModal } from './components/CategoryModal';
import { DiagnosisModal } from './components/DiagnosisModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ResetModal } from './components/ResetModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthScreen } from './components/AuthScreen';
import { ToolsDashboard, ToolId } from './components/ToolsDashboard';
import { ProfileSettings, UserProfileData } from './components/ProfileSettings';
import { CategoryIcon } from './components/CategoryIcon';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import {
  CategoryItem,
  Expense,
  FinancialDiagnosis,
} from './types/finance';
import {
  DEFAULT_INCOME,
  DEFAULT_CATEGORIES,
  INITIAL_EXPENSES,
  formatBRL,
  formatDateBR,
  getCategoryStatus,
  monthYearToISOYearMonth,
} from './utils/formatters';
import { generateFinancialDiagnosis } from './services/aiService';
import {
  isSupabaseConfigured,
  fetchFromSupabase,
  saveExpenseToSupabase,
  deleteExpenseFromSupabase,
  saveIncomeToSupabase,
  getCurrentSupabaseUser,
  signOutSupabase,
} from './services/supabase';
import {
  BarChart3,
  Calendar,
  Archive,
  History,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEYS = {
  INCOME: 'finanzen_income_v2',
  MONTHLY_INCOMES: 'finanzen_monthly_incomes_v2',
  CATEGORIES: 'finanzen_categories_v2',
  EXPENSES: 'finanzen_expenses_v2',
  MONTH: 'finanzen_month_v2',
};

export default function App() {
  // Base default income
  const [baseIncome, setBaseIncome] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCOME);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
    return DEFAULT_INCOME;
  });

  // Monthly income storage (e.g. distinct salary/freelance for each month)
  const [monthlyIncomes, setMonthlyIncomes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTHLY_INCOMES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse monthly incomes', e);
      }
    }
    return { 'Setembro 2026': DEFAULT_INCOME };
  });

  // Dynamic Categories State
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved categories', e);
      }
    }
    return DEFAULT_CATEGORIES;
  });

  // Expenses State (Stores ALL expenses across all historical months)
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return INITIAL_EXPENSES;
      }
    }
    return INITIAL_EXPENSES;
  });

  // Current Month State
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MONTH) || 'Setembro 2026';
  });

  // Modals & UI State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryItem, setEditingCategoryItem] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<FinancialDiagnosis | null>(null);
  const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(() => {
    const saved = localStorage.getItem('finanzen_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // User Profile Settings Screen View State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Selected Tool state (null means the User is at the Tools Selection Dashboard)
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(() => {
    return (localStorage.getItem('consignatec_active_tool') as ToolId) || null;
  });

  const handleSelectTool = (toolId: ToolId) => {
    setSelectedTool(toolId);
    localStorage.setItem('consignatec_active_tool', toolId);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
    setIsProfileOpen(false);
    localStorage.removeItem('consignatec_active_tool');
  };

  const handleUpdateUserProfile = (updated: UserProfileData) => {
    setCurrentUser(updated);
    localStorage.setItem('finanzen_session_user', JSON.stringify(updated));
  };

  // Mobile View Switcher (Dashboard / Gastos / Metas / Tudo) - Defaults to 'dashboard' to prevent mobile overload
  const [mobileTab, setMobileTab] = useState<MobileTab>('dashboard');

  const loadUserCloudData = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remote = await fetchFromSupabase();
      if (remote) {
        if (remote.expenses && remote.expenses.length > 0) {
          setExpenses(remote.expenses);
        }
        if (remote.categories && remote.categories.length > 0) {
          setCategories(remote.categories);
        }
        if (remote.baseIncome !== undefined) {
          setBaseIncome(remote.baseIncome);
        }
        if (remote.monthlyIncomes && Object.keys(remote.monthlyIncomes).length > 0) {
          setMonthlyIncomes(remote.monthlyIncomes);
        }
      }
    } catch (e) {
      console.warn('Error loading cloud data:', e);
    }
  };

  // Supabase Initial Session Check
  useEffect(() => {
    if (isSupabaseConfigured) {
      getCurrentSupabaseUser().then((user) => {
        if (user) {
          const userName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '';
          const u = { id: user.id, email: user.email || '', name: userName };
          setCurrentUser(u);
          localStorage.setItem('finanzen_session_user', JSON.stringify(u));
          loadUserCloudData();
        } else {
          // If no active or confirmed Supabase session, invalidate any non-guest local session
          const saved = localStorage.getItem('finanzen_session_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (!parsed.isGuest) {
                setCurrentUser(null);
                localStorage.removeItem('finanzen_session_user');
              }
            } catch {
              setCurrentUser(null);
            }
          }
        }
      });
    }
  }, []);

  const handleLoginSuccess = async (user: { id: string; email: string; name?: string; phone?: string; isGuest?: boolean }) => {
    setCurrentUser(user);
    setSelectedTool(null);
    setIsProfileOpen(false);
    localStorage.removeItem('consignatec_active_tool');
    localStorage.setItem('finanzen_session_user', JSON.stringify(user));
    if (!user.isGuest && isSupabaseConfigured) {
      await loadUserCloudData();
    }
  };

  const handleExploreAsGuest = () => {
    const guestUser = { id: 'guest', email: 'visitante@finanzen.local', name: 'Visitante Demo', phone: '(41) 98888-7777', isGuest: true };
    setCurrentUser(guestUser);
    setSelectedTool(null);
    setIsProfileOpen(false);
    localStorage.removeItem('consignatec_active_tool');
    localStorage.setItem('finanzen_session_user', JSON.stringify(guestUser));
    setExpenses(INITIAL_EXPENSES);
    setCategories(DEFAULT_CATEGORIES);
    setBaseIncome(DEFAULT_INCOME);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await signOutSupabase();
    }
    localStorage.removeItem('finanzen_session_user');
    localStorage.removeItem('consignatec_active_tool');
    setCurrentUser(null);
    setSelectedTool(null);
    setIsProfileOpen(false);
    setDiagnosisData(null);
  };

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCOME, baseIncome.toString());
  }, [baseIncome]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_INCOMES, JSON.stringify(monthlyIncomes));
  }, [monthlyIncomes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONTH, currentMonth);
  }, [currentMonth]);

  // Year-Month ISO representation (e.g. "2026-09")
  const currentYearMonth = useMemo(() => {
    return monthYearToISOYearMonth(currentMonth);
  }, [currentMonth]);

  // Filtered Expenses for the active period
  const activeExpenses = useMemo(() => {
    if (currentMonth === 'all' || !currentYearMonth) {
      return expenses;
    }
    return expenses.filter((e) => e.data.startsWith(currentYearMonth));
  }, [expenses, currentMonth, currentYearMonth]);

  // Active Income for the selected month
  const activeIncome = useMemo(() => {
    if (currentMonth !== 'all' && monthlyIncomes[currentMonth] !== undefined) {
      return monthlyIncomes[currentMonth];
    }
    return baseIncome;
  }, [currentMonth, monthlyIncomes, baseIncome]);

  // Derived Calculations for the active month
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((cat) => {
      map[cat.name] = 0;
    });
    activeExpenses.forEach((exp) => {
      if (map[exp.categoria] === undefined) {
        map[exp.categoria] = 0;
      }
      map[exp.categoria] += exp.valor;
    });
    return map;
  }, [activeExpenses, categories]);

  const totalExpenses = useMemo(() => {
    return activeExpenses.reduce((sum, item) => sum + item.valor, 0);
  }, [activeExpenses]);

  const availableCategoryNames = useMemo(() => {
    return categories.map((c) => c.name);
  }, [categories]);

  // Handlers for Expenses
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    if (isSupabaseConfigured) {
      saveExpenseToSupabase(newExpense);
    }
  };

  const handleEditExpense = (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (!id) return;
    const updated: Expense = { ...expenseData, id };
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
    if (isSupabaseConfigured) {
      saveExpenseToSupabase(updated);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      const id = expenseToDelete.id;
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      if (isSupabaseConfigured) {
        deleteExpenseFromSupabase(id);
      }
      setExpenseToDelete(null);
    }
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  // Handlers for Category Management
  const handleOpenNewCategoryModal = () => {
    setEditingCategoryItem(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategoryItem(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (
    categoryData: Omit<CategoryItem, 'id'>,
    id?: string
  ) => {
    if (id) {
      const oldCat = categories.find((c) => c.id === id);
      if (oldCat && oldCat.name !== categoryData.name) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.categoria === oldCat.name ? { ...e, categoria: categoryData.name } : e
          )
        );
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...categoryData, id } : c))
      );
    } else {
      const newCat: CategoryItem = {
        ...categoryData,
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const handleDeleteCategory = (category: CategoryItem) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    }
  };

  const countExpensesForDeletedCategory = useMemo(() => {
    if (!categoryToDelete) return 0;
    return expenses.filter(
      (e) => e.categoria.toLowerCase() === categoryToDelete.name.toLowerCase()
    ).length;
  }, [categoryToDelete, expenses]);

  const handleUpdateBudget = (categoryName: string, newLimit: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.name.toLowerCase() === categoryName.toLowerCase()
          ? { ...cat, budget: newLimit }
          : cat
      )
    );
  };

  // Handlers for Income
  const handleUpdateIncome = (newIncome: number) => {
    setBaseIncome(newIncome);
    if (currentMonth !== 'all') {
      setMonthlyIncomes((prev) => ({
        ...prev,
        [currentMonth]: newIncome,
      }));
      if (isSupabaseConfigured) {
        saveIncomeToSupabase(currentMonth, newIncome);
      }
    } else {
      if (isSupabaseConfigured) {
        saveIncomeToSupabase('base', newIncome);
      }
    }
  };

  // Reset Data to Defaults / Zero
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const handleResetSelectedMonth = () => {
    if (currentMonth === 'all' || !currentYearMonth) {
      handleResetAllMonths();
      return;
    }
    // Remove only expenses of the currently selected month
    setExpenses((prev) => prev.filter((e) => !e.data.startsWith(currentYearMonth)));
    // Reset income of this month to 0
    setMonthlyIncomes((prev) => ({
      ...prev,
      [currentMonth]: 0,
    }));
    setDiagnosisData(null);
    setIsResetModalOpen(false);
  };

  const handleResetAllMonths = () => {
    setBaseIncome(0);
    setMonthlyIncomes({});
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        budget: 0,
      }))
    );
    setExpenses([]);
    setDiagnosisData(null);
    setIsResetModalOpen(false);
  };

  const handleRestoreSampleData = () => {
    setBaseIncome(DEFAULT_INCOME);
    setMonthlyIncomes({ 'Setembro 2026': DEFAULT_INCOME });
    setCategories(DEFAULT_CATEGORIES);
    setExpenses(INITIAL_EXPENSES);
    setCurrentMonth('Setembro 2026');
    setDiagnosisData(null);
    setIsResetModalOpen(false);
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    const listToExport = activeExpenses;
    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Forma de Pagamento',
      'Valor (R$)',
      'Status',
    ];
    const rows = listToExport.map((e) => [
      formatDateBR(e.data),
      `"${e.descricao.replace(/"/g, '""')}"`,
      `"${e.categoria}"`,
      `"${e.forma_pagamento}"`,
      e.valor.toFixed(2).replace('.', ','),
      `"${e.status}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `finanzen_despesas_${currentMonth.toLowerCase().replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Financial Diagnosis Request
  const handleOpenDiagnosis = async () => {
    setIsDiagnosisModalOpen(true);
    if (!diagnosisData) {
      await fetchDiagnosis();
    }
  };

  const fetchDiagnosis = async () => {
    setIsGeneratingDiagnosis(true);
    try {
      const categoriesPayload = categories.map((cat) => {
        const budget = cat.budget || 0;
        const spent = spendingByCategory[cat.name] || 0;
        const percent = budget > 0 ? (spent / budget) * 100 : 0;
        const status = getCategoryStatus(budget, spent);
        return { name: cat.name, budget, spent, percent, status };
      });

      const result = await generateFinancialDiagnosis({
        income: activeIncome,
        totalExpenses,
        categories: categoriesPayload,
        recentExpenses: activeExpenses,
      });

      setDiagnosisData(result);
    } catch (error) {
      console.error('Error generating diagnosis:', error);
    } finally {
      setIsGeneratingDiagnosis(false);
    }
  };

  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        onExploreAsGuest={handleExploreAsGuest}
      />
    );
  }

  // If user is accessing Profile Settings, render ProfileSettings
  if (isProfileOpen) {
    return (
      <ProfileSettings
        currentUser={currentUser}
        onUpdateUser={handleUpdateUserProfile}
        onBack={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
      />
    );
  }

  // If user is authenticated but hasn't selected a specific tool yet, show Tools Hub Dashboard
  if (!selectedTool) {
    return (
      <ToolsDashboard
        userName={currentUser.name}
        userEmail={currentUser.email}
        userPhone={currentUser.phone}
        isGuest={currentUser.isGuest}
        onSelectTool={handleSelectTool}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Executive Header */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onOpenDiagnosis={handleOpenDiagnosis}
        onExportData={handleExportCSV}
        onResetData={handleResetData}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConfigured}
        currentUser={currentUser}
        onLogout={handleLogout}
        onBackToTools={handleBackToTools}
        onOpenProfile={() => setIsProfileOpen(true)}
        isGeneratingDiagnosis={isGeneratingDiagnosis}
        selectedMonthExpensesCount={activeExpenses.length}
        totalExpensesCount={expenses.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12">
        {/* Month Context Banner & Archiving Guarantee (Desktop only to save mobile screen height) */}
        <section aria-label="Status do Mês e Arquivamento" className="hidden md:block">
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-50 border border-teal-200/90 text-teal-800 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    {currentMonth === 'all'
                      ? 'Visão Geral Consolidada (Todos os Meses)'
                      : `Mês de Referência: ${currentMonth}`}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Dados salvos</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  <strong>{activeExpenses.length} lançamento(s)</strong> ({formatBRL(totalExpenses)}). Histórico de <strong>{expenses.length} despesa(s)</strong> gravado.
                </p>
              </div>
            </div>

            {/* Quick Month Switcher Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <MonthYearPicker
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            </div>
          </div>
        </section>

        {/* Informative notice if active month has no expenses (e.g. freshly zeroed or new month) */}
        {activeExpenses.length === 0 && (
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-white border border-teal-200/90 text-teal-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-fadeIn shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {currentMonth === 'all'
                    ? 'Nenhum lançamento registrado no sistema.'
                    : `Lançamentos de ${currentMonth} estão zerados.`}
                </h3>
                <p className="text-[11px] sm:text-xs text-teal-800/90 mt-0.5">
                  1. Ajuste a renda deste mês no primeiro card de Indicadores.<br className="hidden sm:inline" />
                  2. Cadastre despesas pelo botão verde <strong>+ Novo Lançamento</strong> ou leitor com IA.
                  {expenses.length > 0 && currentMonth !== 'all' && (
                    <span className="block mt-1 font-semibold text-emerald-800">
                      ✓ Seus outros meses continuam gravados com segurança ({expenses.length} no histórico).
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold hover:bg-teal-900 transition-colors shrink-0 shadow-xs self-start sm:self-auto"
            >
              <span>+ Novo Lançamento em {currentMonth === 'all' ? 'Novo Mês' : currentMonth}</span>
            </button>
          </div>
        )}

        {/* Mobile Tab Segmented Quick Switcher */}
        <div className="flex md:hidden items-center justify-between bg-slate-200/80 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setMobileTab('tudo')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'tudo'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Tudo
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('dashboard')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'dashboard'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Resumo
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('despesas')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'despesas'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Gastos ({activeExpenses.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('metas')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'metas'
                ? 'bg-white text-teal-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Metas
          </button>
        </div>

        {/* 1. Painel de Indicadores Executivos (KPI Cards) - Visível no Resumo ou Tudo */}
        {(mobileTab === 'tudo' || mobileTab === 'dashboard') && (
          <section aria-label="Indicadores Executivos">
            <KpiCards
              income={activeIncome}
              totalExpenses={totalExpenses}
              onUpdateIncome={handleUpdateIncome}
            />
          </section>
        )}

        {/* 2. Visual Distribution Summary Card - Fica no Resumo e Metas para análise visual limpa */}
        {(mobileTab === 'tudo' || mobileTab === 'dashboard' || mobileTab === 'metas') && (
          <section
            aria-label="Distribuição dos Gastos"
            className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-800" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Distribuição Proporcional dos Gastos ({currentMonth})
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs text-slate-500">
                Total gasto no período:{' '}
                <strong className="text-slate-800">{formatBRL(totalExpenses)}</strong>
              </span>
            </div>

            {/* Segmented Distribution Bar */}
            {totalExpenses > 0 ? (
              <div className="space-y-3">
                <div className="h-3.5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 border border-slate-200">
                  {categories.map((cat) => {
                    const spent = spendingByCategory[cat.name] || 0;
                    const ratio = (spent / totalExpenses) * 100;
                    if (ratio <= 0) return null;
                    return (
                      <div
                        key={cat.id}
                        title={`${cat.name}: ${formatBRL(spent)} (${ratio.toFixed(1)}%)`}
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: cat.color,
                        }}
                        className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-90 transition-opacity"
                      />
                    );
                  })}
                </div>

                {/* Legend Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
                  {categories.map((cat) => {
                    const spent = spendingByCategory[cat.name] || 0;
                    const ratio = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0;
                    return (
                      <div
                        key={cat.id}
                        className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 truncate">
                            {cat.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[10px] sm:text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {ratio.toFixed(0)}%
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatBRL(spent).replace('R$', '').trim()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Nenhuma despesa registrada em {currentMonth} para calcular a distribuição.
              </div>
            )}
          </section>
        )}

        {/* 3. Recursos Inteligentes: Leitor Rápido de Gastos com IA - No mobile fica na aba Gastos ou Tudo */}
        {(mobileTab === 'tudo' || mobileTab === 'despesas') && (
          <section aria-label="Leitor Inteligente de Gastos">
            <NaturalLanguageInput
              onAddExpense={handleAddExpense}
              availableCategories={availableCategoryNames}
            />
          </section>
        )}

        {/* 4. Tabela de Metas & Orçamento por Categoria */}
        {(mobileTab === 'tudo' || mobileTab === 'metas') && (
          <section aria-label="Orçamento por Categoria">
            <CategoryBudgetTable
              categories={categories}
              spendingByCategory={spendingByCategory}
              onUpdateBudget={handleUpdateBudget}
              onOpenNewCategoryModal={handleOpenNewCategoryModal}
              onEditCategory={handleOpenEditCategoryModal}
              onDeleteCategory={handleDeleteCategory}
            />
          </section>
        )}

        {/* 4. Registro de Despesas Diárias (Lançamentos) */}
        {(mobileTab === 'tudo' || mobileTab === 'despesas') && (
          <section aria-label="Lançamentos de Despesas">
            <ExpenseTable
              expenses={activeExpenses}
              categories={categories}
              currentMonthLabel={currentMonth === 'all' ? 'Todos os Meses' : currentMonth}
              onOpenNewExpenseModal={handleOpenNewModal}
              onEditExpense={handleOpenEditModal}
              onDeleteExpense={handleDeleteExpense}
            />
          </section>
        )}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        onOpenNewExpense={handleOpenNewModal}
        onOpenDiagnosis={handleOpenDiagnosis}
        expensesCount={activeExpenses.length}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 pb-20 md:pb-6">
        <p>
          Consignatec &copy; {new Date().getFullYear()} &mdash; Ferramenta de Gestão Financeira &amp; Orçamento Pessoal.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Valores formatados no padrão nacional (R$). Arquivamento mensal contínuo e análise cognitiva potencializada por Google Gemini.
        </p>
      </footer>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={editingExpense ? handleEditExpense : handleAddExpense}
        initialExpense={editingExpense}
        categories={categories}
        defaultYearMonth={currentYearMonth}
      />

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        existingCategories={categories}
        initialCategory={editingCategoryItem}
      />

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Excluir Categoria de Orçamento"
        message={
          countExpensesForDeletedCategory > 0
            ? `A categoria "${categoryToDelete?.name}" possui ${countExpensesForDeletedCategory} despesa(s) registrada(s). Ao excluí-la, ela será removida da tabela de metas e planejamento mensal.`
            : `Tem certeza que deseja excluir a categoria "${categoryToDelete?.name}"? Esta ação removerá o planejamento de gastos desta categoria.`
        }
        confirmLabel="Excluir Categoria"
        cancelLabel="Cancelar"
        variant="danger"
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
        details={
          categoryToDelete && (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: `${categoryToDelete.color}20`,
                    color: categoryToDelete.color,
                  }}
                >
                  <CategoryIcon iconName={categoryToDelete.icon} className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {categoryToDelete.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Teto orçamentário: {formatBRL(categoryToDelete.budget)}
                  </div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">
                {countExpensesForDeletedCategory} lançamento(s)
              </span>
            </div>
          )
        }
      />

      {/* Delete Expense Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Excluir Lançamento"
        message="Tem certeza que deseja excluir esta despesa? O valor será deduzido do total de gastos e o saldo do orçamento será recalculado."
        confirmLabel="Excluir Lançamento"
        cancelLabel="Cancelar"
        variant="danger"
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDelete}
        details={
          expenseToDelete && (
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="font-bold text-sm text-slate-900">
                  {expenseToDelete.descricao}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDateBR(expenseToDelete.data)} &bull; {expenseToDelete.categoria} &bull; {expenseToDelete.forma_pagamento}
                </div>
              </div>
              <div className="text-base font-extrabold text-rose-600">
                {formatBRL(expenseToDelete.valor)}
              </div>
            </div>
          )
        }
      />

      {/* Reset Modal (Zero selected month or restore sample) */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetSelectedMonth={handleResetSelectedMonth}
        onResetAllMonths={handleResetAllMonths}
        onRestoreDemoData={handleRestoreSampleData}
        currentMonth={currentMonth}
        selectedMonthExpenseCount={activeExpenses.length}
        selectedMonthTotalSpent={totalExpenses}
        totalExpenseCount={expenses.length}
      />

      {/* AI Financial Diagnosis Modal */}
      <DiagnosisModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        diagnosis={diagnosisData}
        isLoading={isGeneratingDiagnosis}
        onRefresh={fetchDiagnosis}
      />

      {/* Supabase Cloud Database Integration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        expenses={expenses}
        categories={categories}
        baseIncome={baseIncome}
        monthlyIncomes={monthlyIncomes}
      />
    </div>
  );
}
