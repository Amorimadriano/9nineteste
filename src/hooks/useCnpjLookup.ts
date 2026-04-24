import { useState } from "react";
import { toast } from "sonner";

/**
 * Interface para os dados retornados pela consulta de CNPJ
 * @interface CnpjData
 */
interface CnpjData {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
}

/**
 * Hook para consulta de CNPJ via BrasilAPI
 *
 * Consulta dados de empresa pelo CNPJ na BrasilAPI (brasilapi.com.br/api/cnpj/v1/)
 * e preenche automaticamente os campos do formulário com os dados retornados.
 *
 * @param setForm - Função do React setState para atualizar o formulário
 * @returns Objeto com função de consulta, estado de loading e função de limpeza
 *
 * @example
 * ```typescript
 * const { lookup, loading, cleanCnpj } = useCnpjLookup(setForm);
 *
 * // Em um input:
 * <Input
 *   onBlur={(e) => lookup(e.target.value)}
 *   disabled={loading}
 * />
 * ```
 *
 * @see {@link https://brasilapi.com.br/docs#tag/CNPJ}
 */
export function useCnpjLookup(setForm: (updater: (prev: any) => any) => void) {
  const [loading, setLoading] = useState(false);

  /**
   * Remove caracteres não numéricos do CNPJ
   * @param cnpj - CNPJ com ou sem formatação
   * @returns CNPJ com apenas números
   */
  const cleanCnpj = (cnpj: string) => cnpj.replace(/\D/g, "");

  /**
   * Realiza a consulta do CNPJ na BrasilAPI
   * @param cnpj - CNPJ a ser consultado (com ou sem formatação)
   * @returns Promise void - Atualiza o formulário automaticamente
   * @throws Não lança exceções, apenas exibe toast de erro
   */
  const lookup = async (cnpj: string) => {
    const clean = cleanCnpj(cnpj);
    if (clean.length !== 14) return;

    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();

      const telefone = data.ddd_telefone_1
        ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`
        : "";

      const endereco = [data.logradouro, data.numero, data.complemento]
        .filter(Boolean)
        .join(", ");

      setForm((prev: any) => ({
        ...prev,
        nome: data.razao_social || data.nome_fantasia || prev.nome,
        email: data.email || prev.email,
        telefone: telefone || prev.telefone,
        endereco: endereco || prev.endereco,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
      }));

      toast.success("Dados do CNPJ preenchidos automaticamente!");
    } catch {
      toast.error("Não foi possível consultar o CNPJ. Verifique o número digitado.");
    } finally {
      setLoading(false);
    }
  };

  return { lookup, loading, cleanCnpj };
}
