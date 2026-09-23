import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Cloud,
  RefreshCw,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { isSupabaseConfigured, syncAllToSupabase } from '../services/supabase';
import { Expense, CategoryItem } from '../types/finance';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  categories: CategoryItem[];
  baseIncome: number;
  monthlyIncomes: Record<string, number>;
}

const SQL_SCHEMA = `-- Copie e execute este script no SQL Editor do Supabase:
-- Garante isolamento estrito de dados por usuário com Row Level Security (RLS)

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    color TEXT NOT NULL DEFAULT '#14B8A6',
    icon TEXT NOT NULL DEFAULT 'Tag',
    classification TEXT NOT NULL DEFAULT 'necessidades',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS public.monthly_incomes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    month_key TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pago',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_data ON public.expenses (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_cat ON public.expenses (user_id, categoria);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê apenas suas despesas" ON public.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário insere apenas suas despesas" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza apenas suas despesas" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário deleta apenas suas despesas" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuário gerencia suas receitas" ON public.monthly_incomes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário gerencia suas categorias" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  expenses,
  categories,
  baseIncome,
  monthlyIncomes,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCHEMA);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncAllToSupabase({
        expenses,
        categories,
        baseIncome,
        monthlyIncomes,
      });
      setSyncStatus(res.message);
    } catch (e: any) {
      setSyncStatus(e.message || 'Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start gap-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white shrink-0">
          <div className="h-10 w-10 rounded-xl bg-teal-800 text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1 pr-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Integração com Supabase (PostgreSQL)
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado à Nuvem
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Modo Local Ativo
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Persistência remota e segura dos seus lançamentos, receitas e metas em banco de dados na nuvem.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Banner */}
          {isSupabaseConfigured ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">
                    Supabase configurado e sincronizado!
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Seus dados de despesas e receitas estão sendo armazenados no banco PostgreSQL na nuvem.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Forçar Sincronização'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/90 text-teal-950 flex items-start gap-3">
              <Cloud className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs sm:text-sm text-slate-900">
                  Como conectar seu projeto do Supabase em 3 passos:
                </p>
                <p className="text-xs text-teal-800/90 mt-1 leading-relaxed">
                  Enquanto o Supabase não estiver configurado no arquivo <code>.env</code>, o FinanZen continuará funcionando normalmente com segurança no armazenamento local do seu navegador.
                </p>
              </div>
            </div>
          )}

          {syncStatus && (
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Setup Guide */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="h-4 w-4 text-teal-700" />
              <span>Passo a Passo de Configuração</span>
            </h4>

            <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside">
              <li className="leading-relaxed">
                Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-teal-700 font-bold hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="h-3 w-3" /></a> e crie um projeto gratuito.
              </li>
              <li className="leading-relaxed">
                No menu lateral do Supabase, clique em <strong>SQL Editor</strong> &rarr; <strong>New query</strong>, cole o script abaixo e clique em <strong>Run</strong>:
              </li>
            </ol>

            {/* SQL Snippet Preview Box */}
            <div className="relative rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans text-xs">supabase-schema.sql</span>
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-[11px] font-sans font-semibold transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="max-h-40 overflow-y-auto text-emerald-400 leading-relaxed pr-2">
                {SQL_SCHEMA}
              </pre>
            </div>

            <ol start={3} className="space-y-2 text-xs text-slate-600 list-decimal list-inside">
              <li className="leading-relaxed">
                Vá em <strong>Project Settings &gt; API</strong> no painel do Supabase e adicione suas chaves no arquivo <code>.env</code>:
              </li>
            </ol>

            <div className="p-3 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-800 space-y-1">
              <div>VITE_SUPABASE_URL="https://seu-projeto.supabase.co"</div>
              <div>VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>O arquivo <code>supabase-schema.sql</code> também foi criado na raiz do seu projeto.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
