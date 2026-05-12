
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only seed if user has no categories yet
  IF EXISTS (SELECT 1 FROM public.categorias WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, descricao) VALUES
    -- RECEITAS
    (p_user_id, '1.1 Receita com Serviços', 'receita', 'Receitas operacionais com prestação de serviços'),
    (p_user_id, '1.2 Receita com Vendas', 'receita', 'Receitas operacionais com vendas de produtos'),
    (p_user_id, '1.3 Receitas Financeiras', 'receita', 'Juros, rendimentos e aplicações financeiras'),
    (p_user_id, '1.4 Outras Receitas Operacionais', 'receita', 'Demais receitas operacionais'),
    (p_user_id, '1.5 Receitas não Operacionais', 'receita', 'Receitas extraordinárias e não operacionais'),

    -- DEDUÇÕES
    (p_user_id, '2.1 Impostos sobre Vendas', 'despesa', 'ISS, ICMS, PIS, COFINS e outros tributos sobre faturamento'),
    (p_user_id, '2.2 Outras Deduções', 'despesa', 'Devoluções, descontos concedidos e abatimentos'),

    -- CUSTOS VARIÁVEIS
    (p_user_id, '2.4 Custo de Mercadoria Vendida (CMV)', 'despesa', 'Custos diretos das mercadorias vendidas'),
    (p_user_id, '2.5 Custo de Serviço Prestado (CSP)', 'despesa', 'Custos diretos dos serviços prestados'),

    -- GASTOS COM PESSOAL
    (p_user_id, '2.3 Salários e Encargos', 'despesa', 'Folha de pagamento, FGTS, INSS, férias, 13º'),
    (p_user_id, '2.31 Benefícios', 'despesa', 'Vale transporte, vale alimentação, plano de saúde'),
    (p_user_id, '2.32 Pró-labore', 'despesa', 'Retirada dos sócios'),

    -- GASTOS COM MARKETING
    (p_user_id, '3.1 Marketing e Publicidade', 'despesa', 'Anúncios, campanhas, mídia digital e impressa'),
    (p_user_id, '3.12 Eventos e Patrocínios', 'despesa', 'Feiras, congressos e patrocínios'),

    -- GASTOS COM OCUPAÇÃO
    (p_user_id, '3.3 Aluguel', 'despesa', 'Aluguel de imóvel e condomínio'),
    (p_user_id, '3.33 Energia e Água', 'despesa', 'Contas de energia elétrica e água'),
    (p_user_id, '3.34 Internet e Telefone', 'despesa', 'Telecomunicações e internet'),
    (p_user_id, '3.35 Manutenção e Reparos', 'despesa', 'Manutenção predial e de equipamentos'),

    -- SERVIÇOS DE TERCEIROS
    (p_user_id, '3.30 Contabilidade', 'despesa', 'Serviços contábeis e assessoria fiscal'),
    (p_user_id, '3.31 Serviços de TI', 'despesa', 'Softwares, hospedagem e suporte técnico'),
    (p_user_id, '3.32 Consultoria e Assessoria', 'despesa', 'Consultorias diversas e assessoria jurídica'),

    -- MATERIAL DE ESCRITÓRIO
    (p_user_id, '3.311 Material de Escritório', 'despesa', 'Papelaria, suprimentos e materiais diversos'),

    -- GASTOS NÃO OPERACIONAIS
    (p_user_id, '3.4 Despesas Financeiras', 'despesa', 'Juros, tarifas bancárias, IOF e multas'),
    (p_user_id, '3.5 Depreciação e Amortização', 'despesa', 'Depreciação de ativos e amortização'),
    (p_user_id, '4.1 Perdas e Baixas', 'despesa', 'Perdas com inadimplência e baixas de ativos'),
    (p_user_id, '5.1 Outras Despesas não Operacionais', 'despesa', 'Despesas extraordinárias'),

    -- IR E CSLL
    (p_user_id, '2.107 Imposto de Renda', 'despesa', 'IRPJ - Imposto de Renda Pessoa Jurídica'),
    (p_user_id, '2.108 CSLL', 'despesa', 'Contribuição Social sobre o Lucro Líquido');
END;
$$;
