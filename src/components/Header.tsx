import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Wallet,
  Cloud,
  CheckCircle2,
  LogOut,
  User as UserIcon,
  MoreVertical,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  Settings,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { MonthYearPicker } from './MonthYearPicker';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeMonths?: string[];
  onAddMonth?: (month: string) => void;
  onOpenDiagnosis: () => void;
  onExportData: () => void;
  onResetData: () => void;
  isCloudSynced?: boolean;
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
  activeMonths = [],
  onAddMonth,
  onOpenDiagnosis,
  onExportData,
  onResetData,
  isCloudSynced = true,
  currentUser,
  onLogout,
  onBackToTools,
  onOpenProfile,
  isGeneratingDiagnosis = false,
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);

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
              activeMonths={activeMonths}
              onAddMonth={onAddMonth}
            />

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Cloud Sync Status Button */}
            <button
              type="button"
              onClick={() => setShowSyncInfoModal(true)}
              title="Sincronização em tempo real ativa no banco de dados na nuvem (PC & Celular)"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold border rounded-lg transition-colors bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
            >
              <div className="relative">
                <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="hidden xl:inline">Banco na Nuvem</span>
              <span className="xl:hidden">Nuvem</span>
            </button>

            {/* Quick Actions: Exportar & Restaurar */}
            <button
              onClick={onExportData}
              title="Exportar planilha em formato CSV"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Exportar</span>
            </button>

            <button
              onClick={onResetData}
              title="Restaurar e zerar lançamentos do usuário"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
              <span className="hidden xl:inline">Zerar Dados</span>
            </button>

            {/* Gemini Diagnosis Button */}
            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              title="Consultor IA Especialista para analisar saúde orçamentária"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-800 rounded-lg hover:bg-teal-900 transition-all shadow-xs hover:shadow disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingDiagnosis ? 'animate-spin' : ''}`} />
              <span>Diagnóstico IA</span>
            </button>

            {/* User Profile CTA */}
            {currentUser && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-800 transition-colors max-w-[150px] truncate cursor-pointer"
                  title="Configurações da Conta"
                >
                  <UserIcon className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">
                    {currentUser.name || (currentUser.isGuest ? 'Visitante Demo' : currentUser.email.split('@')[0])}
                  </span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Encerrar sessão"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT (< md) */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Top Row: Back to Tools, Brand & User Profile */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {onBackToTools && (
                <button
                  type="button"
                  onClick={onBackToTools}
                  title="Voltar para a página principal de ferramentas"
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg shadow-2xs hover:bg-teal-100 transition-colors shrink-0 touch-manipulation cursor-pointer"
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
              {/* PWA Mobile Install Quick CTA */}
              <PWAInstallButton variant="header" />

              {/* Cloud badge button */}
              <button
                type="button"
                onClick={() => setShowSyncInfoModal(true)}
                className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 touch-manipulation cursor-pointer"
                title="Banco de dados na nuvem ativo"
              >
                <Cloud className="h-3.5 w-3.5" />
              </button>

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
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
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
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        <span>Minha Conta / Dados</span>
                      </button>
                    )}
                    {onBackToTools && (
                      <button
                        onClick={onBackToTools}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-teal-800 font-semibold hover:bg-teal-50 cursor-pointer"
                      >
                        <LayoutGrid className="h-4 w-4 text-teal-700" />
                        <span>Painel de Ferramentas</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowSyncInfoModal(true)}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    >
                      <Cloud className="h-4 w-4 text-emerald-600" />
                      <span>Sincronização Nuvem (PC & Celular)</span>
                    </button>
                    <button
                      onClick={onExportData}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={onResetData}
                      className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4 text-rose-500" />
                      <span>Zerar Dados</span>
                    </button>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 border-t border-slate-100 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair da Conta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Month Selector & AI Diagnosis */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <MonthYearPicker
                currentMonth={currentMonth}
                onMonthChange={onMonthChange}
                activeMonths={activeMonths}
                onAddMonth={onAddMonth}
              />
            </div>
            <button
              onClick={onOpenDiagnosis}
              disabled={isGeneratingDiagnosis}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-800 rounded-xl hover:bg-teal-900 transition-colors shadow-2xs shrink-0 touch-manipulation cursor-pointer"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingDiagnosis ? 'animate-spin' : ''}`} />
              <span>Diagnóstico</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Sync Information Modal */}
      {showSyncInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Cloud className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Banco de Dados na Nuvem Conectado
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  Sincronização em Tempo Real Ativa
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Todas as suas receitas, despesas e orçamentos estão sendo gravados diretamente no banco de dados na nuvem (Firestore). Você pode alternar livremente entre o computador e o celular:
            </p>

            <div className="space-y-2.5 mb-6 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Monitor className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">No Computador:</span>
                  Lançamentos e orçamentos salvos instantaneamente no seu perfil na nuvem.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Smartphone className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">No Celular:</span>
                  Basta fazer login com o mesmo e-mail para encontrar todos os seus meses e gastos sincronizados.
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero dados falsos no cache: novos meses são iniciados sob demanda.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSyncInfoModal(false)}
              className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
