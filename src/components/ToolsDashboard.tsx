import React from 'react';
import {
  Wallet,
  Calculator,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  BadgePercent,
  Landmark,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Scale,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type ToolId = 'finance_manager' | 'consignado_sim' | 'margem_calc' | 'quitar_dividas';

interface ToolsDashboardProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  isGuest?: boolean;
  onSelectTool: (toolId: ToolId) => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
}

interface ToolCard {
  id: ToolId;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  features: string[];
  isAvailable: boolean;
}

export const ToolsDashboard: React.FC<ToolsDashboardProps> = ({
  userName,
  userEmail,
  userPhone,
  isGuest,
  onSelectTool,
  onOpenProfile,
  onLogout,
}) => {
  const tools: ToolCard[] = [
    {
      id: 'finance_manager',
      title: 'Gestão Financeira & Orçamento',
      subtitle: 'Controle inteligente de gastos e metas 50-30-20',
      badge: 'Ativo & Disponível',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Planeje seus meses, registre despesas, defina metas para necessidades/desejos/investimentos e receba diagnóstico executivo gerado por Inteligência Artificial.',
      icon: Wallet,
      iconBg: 'bg-teal-50 border-teal-200',
      iconColor: 'text-teal-800',
      features: [
        'Diagnóstico Financeiro com IA (Google Gemini)',
        'Classificação automática e metas de orçamento',
        'Controle mês a mês com persistência segura',
        'Exportação de relatórios em CSV',
      ],
      isAvailable: true,
    },
    {
      id: 'margem_calc',
      title: 'Calculadora de Margem Consignável',
      subtitle: 'Simule sua capacidade de crédito consignado',
      badge: 'Em Breve',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description:
        'Calcule exatamente quanto da sua renda líquida mensal (INSS, Servidor Público ou CLT) pode ser comprometida com margem livre para consignado ou cartão benefício.',
      icon: Calculator,
      iconBg: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-700',
      features: [
        'Cálculo de margem de 35% e cartão de 5%',
        'Compatível com INSS, SIAPE e Governos Estaduais',
        'Estimativa de valor liberado na conta',
      ],
      isAvailable: false,
    },
    {
      id: 'consignado_sim',
      title: 'Simulador de Portabilidade & Redução de Juros',
      subtitle: 'Compare taxas e descubra troco em dinheiro',
      badge: 'Em Breve',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      description:
        'Analise seus contratos de empréstimo atuais e descubra quanto você economiza reduzindo as parcelas ou recebendo troco à vista com a Consignatec.',
      icon: TrendingUp,
      iconBg: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-700',
      features: [
        'Comparador de taxas de juros nominais e CET',
        'Cálculo de troco disponível para resgate',
        'Redução imediata do valor das parcelas',
      ],
      isAvailable: false,
    },
    {
      id: 'quitar_dividas',
      title: 'Planejador de Quitação de Dívidas',
      subtitle: 'Método bola de neve e redução de juros caros',
      badge: 'Em Breve',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      description:
        'Estratégia prática para eliminar juros abusivos de rotativo do cartão e cheque especial, trocando por linhas saudáveis e planejando a liberdade financeira.',
      icon: Scale,
      iconBg: 'bg-rose-50 border-rose-200',
      iconColor: 'text-rose-700',
      features: [
        'Comparação entre Método Bola de Neve e Avalanche',
        'Priorização automática das dívidas mais caras',
        'Cronograma estimado de quitação total',
      ],
      isAvailable: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900 flex flex-col">
      {/* Header Corporativo Consignatec */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-900/20 shrink-0">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                  Consignatec
                </h1>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 shrink-0 hidden sm:inline-block">
                  Hub de Ferramentas
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                Central de Ferramentas &bull; consignatec.com.br
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* PWA Install Quick Action */}
            <PWAInstallButton variant="header" />

            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                title="Configurações da Conta (Nome, E-mail, Senha, Celular)"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 hover:border-teal-200 rounded-xl transition-colors cursor-pointer touch-manipulation"
              >
                <div className="h-6 w-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {userName ? userName.slice(0, 1).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-slate-900">
                    {userName ? userName.split(' ')[0] : 'Minha Conta'}
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">Configurações</span>
                </div>
                <Settings className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer touch-manipulation"
              title="Sair da conta"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 flex-1 w-full space-y-5 sm:space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10 space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Plataforma Integrada Consignatec</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Olá, {userName ? userName.split(' ')[0] : 'seja bem-vindo(a)'}! Escolha uma ferramenta:
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tenha controle total sobre suas receitas, despesas, planejamento e simulações de crédito.
              Selecione abaixo o módulo que deseja utilizar no momento:
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 sm:p-7 relative ${
                  tool.isAvailable
                    ? 'border-slate-200/90 hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-900/5 cursor-pointer ring-1 ring-transparent hover:ring-teal-500/20 active:scale-[0.99]'
                    : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                }`}
                onClick={() => {
                  if (tool.isAvailable) {
                    onSelectTool(tool.id);
                  }
                }}
              >
                <div className="space-y-3 sm:space-y-4">
                  {/* Top line: Icon & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center border ${tool.iconBg} ${tool.iconColor} shrink-0`}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <span
                      className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${tool.badgeColor} shrink-0`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {tool.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                    {tool.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-600 flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {tool.isAvailable ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTool(tool.id);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Acessar Ferramenta</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed border border-slate-200">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Módulo em desenvolvimento</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Support Info */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center text-center gap-2.5 sm:gap-3 text-xs text-slate-600 max-w-2xl mx-auto">
          <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-800">
              Ambiente Seguro &amp; Protegido
            </p>
            <p className="text-[11px] text-slate-500">
              Seus dados financeiros são criptografados e isolados por conta de usuário.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>
          Consignatec &copy; {new Date().getFullYear()} &mdash; Hub Central de Ferramentas e Soluções Financeiras.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Todos os direitos reservados &bull; consignatec.com.br
        </p>
      </footer>
    </div>
  );
};
