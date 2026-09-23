-- ==============================================================================
-- Schema SQL Multi-Usuário do FinanZen para o Supabase (PostgreSQL)
-- Garante isolamento estrito de dados entre usuários via Row Level Security (RLS)
-- Cada usuário enxerga e altera exclusivamente suas próprias despesas e receitas.
-- ==============================================================================

-- 1. Tabela de Categorias e Orçamentos por Usuário
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

-- 2. Tabela de Receitas Mensais por Usuário
CREATE TABLE IF NOT EXISTS public.monthly_incomes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    month_key TEXT NOT NULL, -- 'base' para salário padrão ou 'Setembro 2026'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, month_key)
);

-- 3. Tabela de Despesas e Lançamentos Diários por Usuário
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

-- 4. Índices para performance máxima de consulta por usuário
CREATE INDEX IF NOT EXISTS idx_expenses_user_data ON public.expenses (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_cat ON public.expenses (user_id, categoria);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON public.monthly_incomes (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);

-- 5. Ativar Row Level Security (RLS) - NENHUM dado é exposto sem autenticação
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS Estritas para Despesas (Apenas o próprio criador acessa)
DROP POLICY IF EXISTS "Usuário lê apenas suas despesas" ON public.expenses;
CREATE POLICY "Usuário lê apenas suas despesas"
    ON public.expenses FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere apenas suas despesas" ON public.expenses;
CREATE POLICY "Usuário insere apenas suas despesas"
    ON public.expenses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza apenas suas despesas" ON public.expenses;
CREATE POLICY "Usuário atualiza apenas suas despesas"
    ON public.expenses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário deleta apenas suas despesas" ON public.expenses;
CREATE POLICY "Usuário deleta apenas suas despesas"
    ON public.expenses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 7. Políticas de RLS Estritas para Receitas Mensais
DROP POLICY IF EXISTS "Usuário lê apenas suas receitas" ON public.monthly_incomes;
CREATE POLICY "Usuário lê apenas suas receitas"
    ON public.monthly_incomes FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere ou atualiza suas receitas" ON public.monthly_incomes;
CREATE POLICY "Usuário insere ou atualiza suas receitas"
    ON public.monthly_incomes FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Políticas de RLS Estritas para Categorias
DROP POLICY IF EXISTS "Usuário lê apenas suas categorias" ON public.categories;
CREATE POLICY "Usuário lê apenas suas categorias"
    ON public.categories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere ou atualiza suas categorias" ON public.categories;
CREATE POLICY "Usuário insere ou atualiza suas categorias"
    ON public.categories FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
