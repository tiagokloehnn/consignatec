import React, { useState } from 'react';
import { DollarSign, TrendingDown, Wallet, PiggyBank, Edit3, Check, X } from 'lucide-react';
import { formatBRL, formatPercent } from '../utils/formatters';

interface KpiCardsProps {
  income: number;
  totalExpenses: number;
  onUpdateIncome: (newIncome: number) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  income,
  totalExpenses,
  onUpdateIncome,
}) => {
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncomeStr, setTempIncomeStr] = useState(income.toString());

  const availableBalance = income - totalExpenses;
  const isNegativeBalance = availableBalance < 0;

  // Taxa de Economia: (Saldo Disponível / Receita Total) * 100
  const savingsRate = income > 0 ? (availableBalance / income) * 100 : 0;

  const handleStartEdit = () => {
    setTempIncomeStr(income.toString());
    setIsEditingIncome(true);
  };

  const handleSaveIncome = () => {
    const cleaned = tempIncomeStr.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    if (!isNaN(val) && val >= 0) {
      onUpdateIncome(val);
    }
    setIsEditingIncome(false);
  };

  const handleCancelIncome = () => {
    setIsEditingIncome(false);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 lg:gap-4">
      {/* 1. Receita Total (R$) */}
      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-slate-500 truncate">
              Receita Total
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            {isEditingIncome ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-semibold text-slate-500">R$</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={tempIncomeStr}
                  onChange={(e) => setTempIncomeStr(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveIncome();
                    if (e.key === 'Escape') handleCancelIncome();
                  }}
                  className="w-full text-xs sm:text-sm font-bold text-slate-900 border border-teal-600 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-700 bg-white min-w-0"
                />
                <button
                  onClick={handleSaveIncome}
                  className="p-1 rounded bg-teal-800 text-white hover:bg-teal-900 shrink-0"
                  title="Salvar"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleCancelIncome}
                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 shrink-0"
                  title="Cancelar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline justify-between group gap-1">
                <div className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 truncate" title={formatBRL(income)}>
                  {formatBRL(income)}
                </div>
                <button
                  onClick={handleStartEdit}
                  className="p-1 text-slate-400 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors shrink-0 touch-manipulation"
                  title="Editar renda líquida esperada"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-1 border-t border-slate-50 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
          <span className="truncate">Renda esperada</span>
          <button
            onClick={handleStartEdit}
            className="text-[10px] sm:text-[11px] text-teal-800 hover:underline font-semibold shrink-0 ml-1"
          >
            Ajustar
          </button>
        </div>
      </div>

      {/* 2. Total de Despesas (R$) */}
      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-slate-500 truncate">
              Despesas
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 truncate" title={formatBRL(totalExpenses)}>
              {formatBRL(totalExpenses)}
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-1 border-t border-slate-50 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
          <span className="truncate">Total do mês</span>
          <span className="font-semibold text-slate-700 shrink-0 ml-1">
            {income > 0 ? ((totalExpenses / income) * 100).toFixed(0) : 0}% renda
          </span>
        </div>
      </div>

      {/* 3. Saldo Disponível (R$) */}
      <div
        className={`rounded-xl p-3 sm:p-4 lg:p-5 border shadow-xs relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between ${
          isNegativeBalance
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-white border-slate-200/80'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[10px] sm:text-xs font-semibold tracking-wider uppercase truncate ${
                isNegativeBalance ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              Saldo Livre
            </span>
            <div
              className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg flex items-center justify-center shrink-0 ${
                isNegativeBalance
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div
              className={`text-base sm:text-xl lg:text-2xl font-bold tracking-tight truncate ${
                isNegativeBalance ? 'text-rose-600' : 'text-teal-800'
              }`}
              title={formatBRL(availableBalance)}
            >
              {formatBRL(availableBalance)}
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-1 border-t border-slate-50 flex items-center justify-between text-[10px] sm:text-xs">
          <span className={`truncate ${isNegativeBalance ? 'text-rose-700' : 'text-slate-500'}`}>
            {isNegativeBalance ? 'Déficit' : 'Restante'}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-semibold shrink-0 ml-1 ${
              isNegativeBalance
                ? 'bg-rose-200 text-rose-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isNegativeBalance ? 'Atenção' : 'Positivo'}
          </span>
        </div>
      </div>

      {/* 4. Taxa de Economia (%) */}
      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-slate-500 truncate">
              Economia
            </span>
            <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <PiggyBank className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5 flex items-baseline justify-between gap-1">
            <div className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 truncate">
              {formatPercent(savingsRate)}
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                savingsRate >= 20
                  ? 'bg-emerald-100 text-emerald-800'
                  : savingsRate >= 10
                  ? 'bg-amber-100 text-amber-800'
                  : savingsRate > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {savingsRate >= 20
                ? 'Ótimo'
                : savingsRate >= 10
                ? 'Regular'
                : savingsRate > 0
                ? 'Baixo'
                : 'Negativo'}
            </span>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-1 border-t border-slate-50 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
          <span className="truncate">Meta: 20%</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 shrink-0 ml-1">50/30/20</span>
        </div>
      </div>
    </div>
  );
};
