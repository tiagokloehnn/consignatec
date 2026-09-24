import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  X,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Layers,
  Target,
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSelectedMonth: () => void;
  onResetAllMonths: () => void;
  onResetBudgetsToZero?: () => void;
  onRestoreDemoData: () => void;
  onRestoreDefaultCategories?: () => void;
  currentMonth: string;
  selectedMonthExpenseCount: number;
  selectedMonthTotalSpent: number;
  totalExpenseCount: number;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onResetSelectedMonth,
  onResetAllMonths,
  onResetBudgetsToZero,
  onRestoreDemoData,
  onRestoreDefaultCategories,
  currentMonth,
  selectedMonthExpenseCount,
  selectedMonthTotalSpent,
  totalExpenseCount,
}) => {
  const [showAllMonthsOption, setShowAllMonthsOption] = useState(false);

  if (!isOpen) return null;

  const isAllView = currentMonth === 'all';
  const otherMonthsCount = Math.max(0, totalExpenseCount - selectedMonthExpenseCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start gap-3 sm:gap-3.5 bg-gradient-to-r from-rose-50/60 via-amber-50/30 to-white shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1 pr-2 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {isAllView
                ? 'Zerar Lançamentos de Todos os Meses'
                : `Zerar Apenas o Mês de ${currentMonth}`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isAllView
                ? 'Você está visualizando todos os meses consolidados. Deseja zerar as despesas e receitas?'
                : `Esta operação irá apagar somente os lançamentos e valores referentes a ${currentMonth}. Seus dados de outros meses não serão afetados.`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breakdown Card */}
        <div className="p-4 sm:p-5 space-y-3 bg-slate-50/70 border-b border-slate-100 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Active Month Box */}
            <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>Será Zerado ({isAllView ? 'Geral' : currentMonth})</span>
              </div>
              <div className="mt-1.5">
                <div className="text-lg font-extrabold text-rose-600">
                  {selectedMonthExpenseCount} lançamento(s)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total de {formatBRL(selectedMonthTotalSpent)} e receita redefinida para R$ 0,00.
                </p>
              </div>
            </div>

            {/* Other Months Protected Box */}
            <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Permanece 100% Salvo</span>
              </div>
              <div className="mt-1.5">
                <div className="text-lg font-extrabold text-emerald-700">
                  {otherMonthsCount} lançamento(s)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {otherMonthsCount > 0
                    ? 'Despesas de meses anteriores e futuros continuam arquivadas no histórico.'
                    : 'Nenhum outro mês possui despesas cadastradas no momento.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2 text-xs text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Garantia de histórico:</strong> Seus orçamentos por categoria e os lançamentos dos outros períodos permanecem intactos no seu navegador.
            </p>
          </div>
        </div>

        {/* Optional Expandable: Zerar histórico total */}
        {!isAllView && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Deseja apagar todos os meses juntos?</span>
            <button
              type="button"
              onClick={() => setShowAllMonthsOption(!showAllMonthsOption)}
              className="font-semibold text-slate-700 hover:text-slate-900 underline ml-2"
            >
              {showAllMonthsOption ? 'Ocultar opção geral' : 'Ver opção de zerar tudo'}
            </button>
          </div>
        )}

        {showAllMonthsOption && !isAllView && (
          <div className="p-3 mx-4 my-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Zerar todas as despesas ({totalExpenseCount} lançamentos) de todos os anos?</span>
            </div>
            <button
              type="button"
              onClick={onResetAllMonths}
              className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold hover:bg-amber-700 text-[11px] shrink-0"
            >
              Zerar Histórico Todo
            </button>
          </div>
        )}

        {/* Gerenciamento de Metas & Orçamentos */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
            <Target className="h-4 w-4 text-teal-800 shrink-0" />
            <span>Orçamentos & Metas por Categoria:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onResetBudgetsToZero && (
              <button
                type="button"
                onClick={onResetBudgetsToZero}
                className="px-2.5 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors"
                title="Define o limite de todas as categorias para R$ 0,00 para preencher novos valores"
              >
                Zerar Metas (R$ 0,00)
              </button>
            )}
            {onRestoreDefaultCategories && (
              <button
                type="button"
                onClick={onRestoreDefaultCategories}
                className="px-2.5 py-1 rounded-lg bg-teal-100/80 hover:bg-teal-200 text-teal-950 text-[11px] font-bold transition-colors"
                title="Restaura a lista e tetos das categorias padrão"
              >
                Restaurar Categorias Padrão
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRestoreDemoData}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1.5 py-1"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Restaurar dados de exemplo</span>
            </button>

            {onRestoreDefaultCategories && (
              <button
                type="button"
                onClick={onRestoreDefaultCategories}
                className="text-xs font-semibold text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1.5 py-1"
              >
                <Layers className="h-3.5 w-3.5 text-teal-700" />
                <span>Restaurar categorias padrão</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onResetSelectedMonth}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-sm shadow-rose-600/20 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>
                {isAllView ? 'Zerar Todos os Meses' : `Zerar Apenas ${currentMonth}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
