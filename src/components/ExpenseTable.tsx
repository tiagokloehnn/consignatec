import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { Expense, CategoryName, PaymentMethod, ExpenseStatus, CategoryItem } from '../types/finance';
import {
  PAYMENT_METHODS,
  formatBRL,
  formatDateBR,
  getCategoryMeta,
} from '../utils/formatters';

interface ExpenseTableProps {
  expenses: Expense[];
  categories: CategoryItem[];
  currentMonthLabel?: string;
  onOpenNewExpenseModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  categories,
  currentMonthLabel,
  onOpenNewExpenseModal,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'data' | 'valor'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and Sort
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Search
        if (
          searchTerm &&
          !exp.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        // Category
        if (selectedCategory !== 'all' && exp.categoria !== selectedCategory) {
          return false;
        }
        // Payment
        if (selectedPayment !== 'all' && exp.forma_pagamento !== selectedPayment) {
          return false;
        }
        // Status
        if (selectedStatus !== 'all' && exp.status !== selectedStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'data') {
          const dateDiff = new Date(b.data).getTime() - new Date(a.data).getTime();
          return sortOrder === 'desc' ? dateDiff : -dateDiff;
        } else {
          return sortOrder === 'desc' ? b.valor - a.valor : a.valor - b.valor;
        }
      });
  }, [expenses, searchTerm, selectedCategory, selectedPayment, selectedStatus, sortField, sortOrder]);

  const totalFilteredValue = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.valor, 0);
  }, [filteredExpenses]);

  const toggleSort = (field: 'data' | 'valor') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case 'Pago':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" />
            Pago
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        );
      case 'Agendado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CalendarClock className="h-3 w-3" />
            Agendado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-teal-800" />
            <h2 className="text-base font-bold text-slate-900">
              Registro de Despesas Diárias
            </h2>
            {currentMonthLabel && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                {currentMonthLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lançamentos detalhados deste período. Seu histórico de todos os meses anteriores permanece 100% gravado e arquivado.
          </p>
        </div>

        <button
          onClick={onOpenNewExpenseModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm shadow-teal-900/20 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white text-base sm:text-xs transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {/* Filter Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-none sm:w-auto py-2 sm:py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs truncate min-w-[100px]"
          >
            <option value="all">Categorias (Todas)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Filter Forma Pagamento */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="flex-1 sm:flex-none sm:w-auto py-2 sm:py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs truncate min-w-[100px]"
          >
            <option value="all">Pagamentos (Todos)</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-none sm:w-auto py-2 sm:py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs truncate min-w-[85px]"
          >
            <option value="all">Status (Todos)</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Agendado">Agendado</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(searchTerm || selectedCategory !== 'all' || selectedPayment !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedPayment('all');
              setSelectedStatus('all');
            }}
            className="text-teal-800 hover:underline font-semibold py-1 px-1 self-start sm:self-auto text-xs shrink-0 touch-manipulation"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* MOBILE CARDS VIEW (md:hidden) */}
      <div className="block md:hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                {expenses.length === 0 ? (
                  <CreditCard className="h-6 w-6 text-teal-700" />
                ) : (
                  <Filter className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {expenses.length === 0 ? 'Nenhum lançamento no mês' : 'Nenhum lançamento encontrado'}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {expenses.length === 0
                  ? 'Cadastre seu primeiro gasto no botão abaixo para iniciar.'
                  : 'Tente alterar os termos da busca ou limpar os filtros.'}
              </p>
              <button
                onClick={onOpenNewExpenseModal}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>+ Novo Lançamento</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => {
              const meta = getCategoryMeta(exp.categoria, categories);

              return (
                <div
                  key={exp.id}
                  className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex flex-col gap-2"
                >
                  {/* Top: Category Tag + Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span>{exp.categoria}</span>
                    </span>

                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateBR(exp.data)}</span>
                    </div>
                  </div>

                  {/* Middle: Description + Value */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-slate-900 text-sm leading-snug flex-1">
                      {exp.descricao}
                    </div>
                    <div className="text-base font-bold text-slate-900 whitespace-nowrap">
                      {formatBRL(exp.valor)}
                    </div>
                  </div>

                  {/* Bottom: Payment Method + Status + Quick Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                        {exp.forma_pagamento}
                      </span>
                      {getStatusBadge(exp.status)}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditExpense(exp)}
                        className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition-colors flex items-center justify-center"
                        title="Editar Lançamento"
                        aria-label="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(exp)}
                        className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                        title="Excluir Lançamento"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile Footer Summary */}
            <div className="p-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {filteredExpenses.length} lançamento(s)
              </span>
              <div className="text-right">
                <span className="text-slate-500 text-[11px] block">Total Filtrado:</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatBRL(totalFilteredValue)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200">
              <th
                onClick={() => toggleSort('data')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Forma de Pagamento</th>
              <th
                onClick={() => toggleSort('valor')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Valor</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      {expenses.length === 0 ? (
                        <CreditCard className="h-6 w-6 text-teal-700" />
                      ) : (
                        <Filter className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-1">
                      {expenses.length === 0
                        ? 'Nenhum lançamento registrado'
                        : 'Nenhum lançamento encontrado'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {expenses.length === 0
                        ? 'A página está zerada. Cadastre despesas pelo botão abaixo ou digite seus gastos no leitor rápido com IA.'
                        : 'Nenhuma despesa encontrada para os filtros selecionados. Tente limpar os filtros ou o termo de busca.'}
                    </p>
                    <button
                      onClick={onOpenNewExpenseModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Cadastrar Primeiro Lançamento</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const meta = getCategoryMeta(exp.categoria, categories);

                return (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Data */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateBR(exp.data)}
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs sm:text-sm">
                      {exp.descricao}
                    </td>

                    {/* Categoria */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200/90 bg-slate-50 text-slate-800">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        {exp.categoria}
                      </span>
                    </td>

                    {/* Forma de Pagamento */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-xs">
                      {exp.forma_pagamento}
                    </td>

                    {/* Valor (R$) */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                      {formatBRL(exp.valor)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(exp.status)}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 rounded text-slate-400 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                          title="Editar Lançamento"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir Lançamento"
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

          {/* Table Summary Footer */}
          {filteredExpenses.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/90 font-semibold text-slate-800 border-t border-slate-200">
                <td colSpan={4} className="py-3.5 px-4 text-xs text-slate-500">
                  Exibindo {filteredExpenses.length} de {expenses.length} lançamentos
                </td>
                <td className="py-3.5 px-4 text-right text-xs sm:text-sm font-bold text-slate-900">
                  {formatBRL(totalFilteredValue)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
