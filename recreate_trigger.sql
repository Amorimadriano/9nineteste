CREATE TRIGGER tg_criar_empresa_padrao
    AFTER INSERT ON public.assinaturas_mecanico
    FOR EACH ROW
    EXECUTE FUNCTION public.criar_empresa_padrao();
