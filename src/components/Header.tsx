import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Wallet,
  Database,
  LogOut,
  User as UserIcon,
  MoreVertical,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { MonthYearPicker } from './MonthYearPicker';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenDiagnosis: () => void;
  onExportData: () => void;
  onResetData: () => void;
  onOpenSupabase?: () => void;
  isSupabaseConnected?: boolean;
  currentUser?: { id: string; email: string; name?: string; phone?: string; isGuest?: boolean } | null;
  onLogout?: () => void;
  onBackToTools?: () => void;
  onOpenProfile?: () => void;
  isGeneratingDiagnosis?: boolean;
  selectedMonthExpensesCount?: number;
  totalExpensesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  onOpenDiagnosis,
  onExportData,
  onResetData,
  onOpenSupabase,
  isSupabaseConnected = false,
  currentUser,
  onLogout,
  onBackToTools,
  onOpenProfile,
  isGeneratingDiagnosis = false,
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        {/* DESKTOP LAYOUT (md:flex) */}
        <div className="hidden md:flex md:items-center md:justify-between gap-4">
          {/* Logo & Title & Back to Tools Hub */}
          <div className="flex items-center gap-3">
            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                title="Voltar para a página principal de todas as ferramentas"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/90 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 text-teal-800" />
                <LayoutGrid className="h-3.5 w-3.5 text-teal-800" />
                <span>Todas as Ferramentas</span>
              </button>
            )}

            <div className="h-10 w-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-900/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Consignatec
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  Gestão &amp; Orçamento
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Central de Ferramentas &bull; consignatec.com.br
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Month & Year Selector */}
            <MonthYearPicker
              currentMonth={currentMonth}
              onMonthChange={onMonthChange}
            />

            {/* Supabase Cloud Button */}
            {onOpenSupabase && (
              <button
                type="button"
                onClick={onOpenSupabase}
                title={isSupabaseConnected ? "Conectado ao Supabase na nuvem" : "Configurar banco de dados Supabase na nuvem"}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg transition-colors ${
                  isSupabaseConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Database className="h-3.5 w-3.5 text-teal-700" />
                <span>{isSupabaseConnected ? 'Nuvem Ativa' : 'Supabase'}</span>
              </button>
            )}

            {/* Back to Tools Hub button */}
            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                title="Voltar ao Painel Geral de Ferramentas Consignatec"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-colors cursor-pointer"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-teal-700" />
                <span>Outras Ferramentas</span>
              </button>
            )}

            {/* Quick Actions */}
            <button
              onClick={onExportData}
              title="Exportar planilha em formato CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar</span>
            </button>

            <button
              onClick={onResetData}
              title="Restaurar e zerar lançamentos do mês selecionado"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
              <span>Restaurar</span>
            </button>

            {/* Gemini Diagnosis Button */}
            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 rounded-lg shadow-sm shadow-teal-900/20 transition-all transform active:scale-95 disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
              <span>{isGeneratingDiagnosis ? 'Analisando...' : 'Diagnóstico IA'}</span>
            </button>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title={`Configurações do Usuário (${currentUser.name || currentUser.email}). Clique para editar nome, e-mail, senha e celular.`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-transparent hover:border-teal-200 rounded-lg text-xs font-semibold text-slate-700 max-w-[160px] truncate transition-colors cursor-pointer group"
                >
                  <UserIcon className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">
                    {currentUser.name || (currentUser.isGuest ? 'Visitante' : currentUser.email.split('@')[0])}
                  </span>
                  <Settings className="h-3 w-3 text-slate-400 group-hover:text-teal-700 shrink-0 ml-0.5" />
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sair da conta"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT (md:hidden) */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {/* Top Row: Back to Tools, Brand & User Profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBackToTools && (
                <button
                  type="button"
                  onClick={onBackToTools}
                  title="Voltar para a página principal de todas as ferramentas"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg shadow-2xs hover:bg-teal-100 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-teal-800" />
                  <LayoutGrid className="h-3 w-3 text-teal-800" />
                  <span className="text-[11px]">Ferramentas</span>
                </button>
              )}

              <div className="h-8 w-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <Wallet className="h-4 w-4" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Consignatec
              </h1>
            </div>

            <div className="flex items-center gap-1.5">
              {currentUser && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-teal-50 border border-transparent hover:border-teal-200 rounded-lg text-xs font-semibold text-slate-700 max-w-[130px] truncate cursor-pointer"
                  title="Configurações da Conta"
                >
                  <UserIcon className="h-3 w-3 text-teal-700 shrink-0" />
                  <span className="truncate text-[11px]">
                    {currentUser.name ? currentUser.name.split(' ')[0] : (currentUser.isGuest ? 'Demo' : currentUser.email.split('@')[0])}
                  </span>
                </button>
              )}

              {/* More Actions Dropdown Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMoreActions && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn"
                    onClick={() => setShowMoreActions(false)}
                  >
                    {onOpenProfile && (
                      <button
                        onClick={onOpenProfile}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                        <span>Minha Conta / Dados</span>
                      </button>
                    )}
                    {onBackToTools && (
                      <button
                        onClick={onBackToTools}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-teal-800 font-semibold hover:bg-teal-50"
                      >
                        <LayoutGrid className="h-3.5 w-3.5 text-teal-700" />
                        <span>Painel de Ferramentas</span>
                      </button>
                    )}
                    {onOpenSupabase && (
                      <button
                        onClick={onOpenSupabase}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50"
                      >
                        <Database className="h-3.5 w-3.5 text-teal-700" />
                        <span>{isSupabaseConnected ? 'Status Nuvem (Ativo)' : 'Configurar Supabase'}</span>
                      </button>
                    )}
                    <button
                      onClick={onExportData}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={onResetData}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                      <span>Restaurar / Zerar Mês</span>
                    </button>
                    {onLogout && (
                      <div className="border-t border-slate-100 my-1 pt-1">
                        <button
                          onClick={onLogout}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row on Mobile: Month Picker & Quick Diagnosis CTA */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <MonthYearPicker
                currentMonth={currentMonth}
                onMonthChange={onMonthChange}
              />
            </div>

            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
              <span>{isGeneratingDiagnosis ? '...' : 'IA'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
