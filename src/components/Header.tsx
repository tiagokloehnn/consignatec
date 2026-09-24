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
        {/* DESKTOP & TABLET LAYOUT (md:flex) */}
        <div className="hidden md:flex md:items-center md:justify-between gap-3 lg:gap-4">
          {/* Logo & Title & Back to Tools Hub */}
          <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                title="Voltar para a página principal de todas as ferramentas"
                className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/90 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer active:scale-95 shrink-0"
              >
                <ChevronLeft className="h-4 w-4 text-teal-800" />
                <LayoutGrid className="h-3.5 w-3.5 text-teal-800" />
                <span className="hidden lg:inline">Todas as Ferramentas</span>
                <span className="lg:hidden">Ferramentas</span>
              </button>
            )}

            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-900/20 shrink-0">
              <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 lg:gap-2">
                <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 truncate">
                  Consignatec
                </h1>
                <span className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shrink-0 hidden sm:inline-block">
                  Gestão &amp; Orçamento
                </span>
              </div>
              <p className="text-[11px] lg:text-xs text-slate-500 truncate">
                Central de Ferramentas &bull; consignatec.com.br
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
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
                className={`inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold border rounded-lg transition-colors ${
                  isSupabaseConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Database className="h-3.5 w-3.5 text-teal-700" />
                <span className="hidden xl:inline">{isSupabaseConnected ? 'Nuvem Ativa' : 'Supabase'}</span>
              </button>
            )}

            {/* Quick Actions: Exportar & Restaurar */}
            <button
              onClick={onExportData}
              title="Exportar planilha em formato CSV"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Exportar</span>
            </button>

            <button
              onClick={onResetData}
              title="Restaurar e zerar lançamentos do mês selecionado"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
              <span className="hidden xl:inline">Restaurar</span>
            </button>

            {/* Gemini Diagnosis Button */}
            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 rounded-lg shadow-sm shadow-teal-900/20 transition-all transform active:scale-95 disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
              <span className="hidden sm:inline">{isGeneratingDiagnosis ? 'Analisando...' : 'Diagnóstico IA'}</span>
              <span className="sm:hidden">{isGeneratingDiagnosis ? '...' : 'IA'}</span>
            </button>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title={`Configurações do Usuário (${currentUser.name || currentUser.email}). Clique para editar.`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-transparent hover:border-teal-200 rounded-lg text-xs font-semibold text-slate-700 max-w-[140px] lg:max-w-[170px] truncate transition-colors cursor-pointer group"
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
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT (md:hidden) */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Top Row: Back to Tools, Brand & User Profile */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {onBackToTools && (
                <button
                  type="button"
                  onClick={onBackToTools}
                  title="Voltar para a página principal de ferramentas"
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg shadow-2xs hover:bg-teal-100 transition-colors shrink-0 touch-manipulation"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-teal-800" />
                  <LayoutGrid className="h-3.5 w-3.5 text-teal-800" />
                </button>
              )}

              <div className="h-8 w-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">
                  Consignatec
                </h1>
                <p className="text-[10px] text-slate-500 leading-none truncate">
                  Gestão Financeira
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {currentUser && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-teal-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 max-w-[110px] truncate cursor-pointer touch-manipulation"
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
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMoreActions && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn"
                    onClick={() => setShowMoreActions(false)}
                  >
                    {onOpenProfile && (
                      <button
                        onClick={onOpenProfile}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        <span>Minha Conta / Dados</span>
                      </button>
                    )}
                    {onBackToTools && (
                      <button
                        onClick={onBackToTools}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-teal-800 font-semibold hover:bg-teal-50"
                      >
                        <LayoutGrid className="h-4 w-4 text-teal-700" />
                        <span>Painel de Ferramentas</span>
                      </button>
                    )}
                    {onOpenSupabase && (
                      <button
                        onClick={onOpenSupabase}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50"
                      >
                        <Database className="h-4 w-4 text-teal-700" />
                        <span>{isSupabaseConnected ? 'Status Nuvem (Ativo)' : 'Configurar Supabase'}</span>
                      </button>
                    )}
                    <button
                      onClick={onExportData}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={onResetData}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50"
                    >
                      <RotateCcw className="h-4 w-4 text-rose-500" />
                      <span>Restaurar / Zerar Mês</span>
                    </button>
                    {onLogout && (
                      <div className="border-t border-slate-100 my-1 pt-1">
                        <button
                          onClick={onLogout}
                          className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 font-medium"
                        >
                          <LogOut className="h-4 w-4" />
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
            <div className="flex-1 min-w-0">
              <MonthYearPicker
                currentMonth={currentMonth}
                onMonthChange={onMonthChange}
              />
            </div>

            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs shrink-0 touch-manipulation min-h-[38px]"
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
