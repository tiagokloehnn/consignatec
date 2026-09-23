import React, { useState } from 'react';
import {
  Edit2,
  Check,
  X,
  Target,
  Plus,
  Trash2,
  Settings2,
} from 'lucide-react';
import { CategoryItem } from '../types/finance';
import {
  formatBRL,
  formatPercent,
  getCategoryStatus,
  getStatusBadgeConfig,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBudgetTableProps {
  categories: CategoryItem[];
  spendingByCategory: Record<string, number>;
  onUpdateBudget: (categoryName: string, newLimit: number) => void;
  onOpenNewCategoryModal: () => void;
  onEditCategory: (category: CategoryItem) => void;
  onDeleteCategory: (category: CategoryItem) => void;
}

export const CategoryBudgetTable: React.FC<CategoryBudgetTableProps> = ({
  categories,
  spendingByCategory,
  onUpdateBudget,
  onOpenNewCategoryModal,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempBudgetValue, setTempBudgetValue] = useState<string>('');

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setTempBudgetValue(cat.budget.toString());
  };

  const handleSaveBudget = (cat: CategoryItem) => {
    const cleaned = tempBudgetValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBudget(cat.name, parsed);
    }
    setEditingCategoryId(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
  };

  // Calculations for Total Row
  let totalBudget = 0;
  let totalSpent = 0;
  categories.forEach((cat) => {
    totalBudget += cat.budget || 0;
    totalSpent += spendingByCategory[cat.name] || 0;
  });
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalStatus = getCategoryStatus(totalBudget, totalSpent);
  const totalBadge = getStatusBadgeConfig(totalStatus);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-800" />
            <h2 className="text-base font-bold text-slate-900">
              Tabela de Metas & Orçamento por Categoria
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {categories.length} categorias
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe tetos de gastos, crie novas categorias ou exclua conforme sua necessidade orçamentária.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> &lt;90%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> 90-99%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span> &ge;100%
            </span>
          </div>

          <button
            onClick={onOpenNewCategoryModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-lg shadow-sm shadow-teal-900/10 transition-all self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (md:hidden) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {categories.length === 0 ? (
          <div className="py-8 px-4 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-500">
              Nenhuma categoria cadastrada.
            </p>
            <button
              onClick={onOpenNewCategoryModal}
              className="mt-2 text-xs font-semibold text-teal-800 hover:underline"
            >
              + Criar primeira categoria
            </button>
          </div>
        ) : (
          categories.map((cat) => {
            const budget = cat.budget || 0;
            const spent = spendingByCategory[cat.name] || 0;
            const remaining = budget - spent;
            const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
            const status = getCategoryStatus(budget, spent);
            const badge = getStatusBadgeConfig(status);
            const isEditing = editingCategoryId === cat.id;

            return (
              <div key={cat.id} className="p-4 bg-white hover:bg-slate-50/60 transition-colors">
                {/* Header: Icon, Name, Category Classification & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon iconName={cat.icon} className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-sm text-slate-900 block truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {cat.classification === 'necessidades'
                          ? 'Necessidade'
                          : cat.classification === 'desejos'
                          ? 'Desejo'
                          : 'Investimento'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-teal-800 hover:bg-teal-50"
                      title="Editar Categoria"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Uso da Meta:</span>
                    <span className="font-bold text-slate-800">{formatPercent(percentUsed)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${badge.barColor}`}
                      style={{
                        width: `${Math.min(Math.max(percentUsed, 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3 Metrics: Limite, Gasto, Saldo */}
                <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Meta (Limite)</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          value={tempBudgetValue}
                          onChange={(e) => setTempBudgetValue(e.target.value)}
                          className="w-full text-xs font-bold p-1 border border-teal-600 rounded bg-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveBudget(cat)}
                          className="p-1 rounded bg-teal-800 text-white"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 text-xs">{formatBRL(budget)}</span>
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="text-slate-400 hover:text-teal-800 p-0.5"
                          title="Ajustar Meta"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Gasto Real</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">{formatBRL(spent)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Saldo Livre</span>
                    <span
                      className={`font-bold text-xs mt-0.5 block ${
                        remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatBRL(remaining)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Total Row */}
        {categories.length > 0 && (
          <div className="p-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-semibold block text-[11px]">Total Orçado:</span>
              <span className="font-bold text-slate-900">{formatBRL(totalBudget)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[11px]">Total Gasto:</span>
              <span className="font-bold text-slate-900">{formatBRL(totalSpent)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-semibold block text-[11px]">Saldo Geral:</span>
              <span className={`font-bold ${totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatBRL(totalRemaining)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200">
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4 text-right">Orçamento Limite</th>
              <th className="py-3 px-4 text-right">Gasto Real</th>
              <th className="py-3 px-4 text-right">Saldo Restante</th>
              <th className="py-3 px-4 text-center w-28">% Utilizado</th>
              <th className="py-3 px-4 min-w-[140px]">Progresso Visual</th>
              <th className="py-3 px-4 text-center">Status Automático</th>
              <th className="py-3 px-4 text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-500">
                    Nenhuma categoria cadastrada.
                  </p>
                  <button
                    onClick={onOpenNewCategoryModal}
                    className="mt-2 text-xs font-semibold text-teal-800 hover:underline"
                  >
                    + Criar primeira categoria
                  </button>
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const budget = cat.budget || 0;
                const spent = spendingByCategory[cat.name] || 0;
                const remaining = budget - spent;
                const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
                const status = getCategoryStatus(budget, spent);
                const badge = getStatusBadgeConfig(status);

                // Visual Progress calculation
                const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);

                // Progress bar color rules:
                // Verde até 89%, Amarelo entre 90% e 99%, Vermelho a partir de 100%
                let barColorClass = 'bg-slate-300';
                if (budget > 0) {
                  if (percentUsed >= 100) {
                    barColorClass = 'bg-rose-500';
                  } else if (percentUsed >= 90) {
                    barColorClass = 'bg-amber-500';
                  } else {
                    barColorClass = 'bg-emerald-500';
                  }
                }

                const isEditing = editingCategoryId === cat.id;

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Categoria */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon iconName={cat.icon} className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-xs sm:text-sm text-slate-800 block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {cat.classification === 'necessidades'
                              ? 'Necessidade'
                              : cat.classification === 'desejos'
                              ? 'Desejo'
                              : 'Investimento'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Orçamento Limite (R$) */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-slate-400">R$</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            value={tempBudgetValue}
                            onChange={(e) => setTempBudgetValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveBudget(cat);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-24 text-right text-xs font-semibold py-1 px-1.5 border border-teal-600 rounded focus:outline-none focus:ring-1 focus:ring-teal-700 bg-white"
                          />
                          <button
                            onClick={() => handleSaveBudget(cat)}
                            className="p-1 rounded text-teal-800 hover:bg-teal-50"
                            title="Salvar Limite"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 group/edit">
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {formatBRL(budget)}
                          </span>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-800 transition-opacity"
                            title="Editar teto de gastos rapidamente"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Gasto Real (R$) */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900 text-xs sm:text-sm">
                      {formatBRL(spent)}
                    </td>

                    {/* Saldo Restante (R$) */}
                    <td className="py-3.5 px-4 text-right text-xs sm:text-sm">
                      <span
                        className={`font-semibold ${
                          budget === 0
                            ? 'text-slate-400'
                            : remaining < 0
                            ? 'text-rose-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {formatBRL(remaining)}
                      </span>
                    </td>

                    {/* % Utilizado */}
                    <td className="py-3.5 px-4 text-center font-medium text-xs sm:text-sm text-slate-700">
                      {budget === 0 ? '0,0%' : formatPercent(percentUsed)}
                    </td>

                    {/* Progresso Visual */}
                    <td className="py-3.5 px-4">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                          style={{ width: `${clampedPercent}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Status Automático */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Ações (Configurar / Excluir Categoria) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditCategory(cat)}
                          className="p-1.5 rounded text-slate-400 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                          title="Personalizar Categoria (Nome, Ícone, Cor, Classificação)"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCategory(cat)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Linha de Total Geral */}
          {categories.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-600">
                      Total Geral ({categories.length} Categorias)
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-xs sm:text-sm">
                  {formatBRL(totalBudget)}
                </td>
                <td className="py-4 px-4 text-right text-xs sm:text-sm text-slate-900">
                  {formatBRL(totalSpent)}
                </td>
                <td className="py-4 px-4 text-right text-xs sm:text-sm">
                  <span
                    className={
                      totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }
                  >
                    {formatBRL(totalRemaining)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center text-xs sm:text-sm">
                  {formatPercent(totalPercentUsed)}
                </td>
                <td className="py-4 px-4">
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full ${totalBadge.barColor}`}
                      style={{
                        width: `${Math.min(Math.max(totalPercentUsed, 0), 100)}%`,
                      }}
                    ></div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${totalBadge.bg} ${totalBadge.text} ${totalBadge.border}`}
                  >
                    <span>{totalBadge.icon}</span>
                    <span>{totalBadge.label}</span>
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
