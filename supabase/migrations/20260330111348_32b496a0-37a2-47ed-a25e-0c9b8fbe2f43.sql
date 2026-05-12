
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categorias" ON public.categorias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clientes" ON public.clientes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fornecedores" ON public.fornecedores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contas a Receber
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')),
  documento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contas_receber" ON public.contas_receber FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contas a Pagar
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  documento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contas_pagar" ON public.contas_pagar FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lancamentos do Fluxo de Caixa
CREATE TABLE public.lancamentos_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  conta_receber_id UUID REFERENCES public.contas_receber(id) ON DELETE SET NULL,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lancamentos_caixa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lancamentos_caixa" ON public.lancamentos_caixa FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_lancamentos_caixa_updated_at BEFORE UPDATE ON public.lancamentos_caixa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_contas_receber_user ON public.contas_receber(user_id);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX idx_contas_pagar_user ON public.contas_pagar(user_id);
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX idx_lancamentos_caixa_user ON public.lancamentos_caixa(user_id);
CREATE INDEX idx_lancamentos_caixa_data ON public.lancamentos_caixa(data_lancamento);
CREATE INDEX idx_categorias_user ON public.categorias(user_id);
CREATE INDEX idx_clientes_user ON public.clientes(user_id);
CREATE INDEX idx_fornecedores_user ON public.fornecedores(user_id);
