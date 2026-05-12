import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dados retornados pela BrasilAPI para consulta de CNPJ
 */
interface BrasilApiCnpjResponse {
  razao_social?: string;
  nome_fantasia?: string;
  email?: string | null;
  ddd_telefone_1?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cnae_fiscal_descricao?: string | null;
  natureza_juridica?: string | null;
}

/**
 * Mapeamento de campos do formulário para os campos da API
 * Permite personalizar quais campos do form recebem cada dado da API
 */
interface FieldMapping {
  razaoSocial?: string;      // campo do form para razao_social
  nomeFantasia?: string;       // campo do form para nome_fantasia
  nome?: string;              // campo do form para nome (usado em cliente/fornecedor)
  email?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cnae?: string;              // CNAE principal descricao
  naturezaJuridica?: string;   // natureza juridica
}

/**
 * Hook para consulta de CNPJ via BrasilAPI
 *
 * Consulta dados de empresa pelo CNPJ na BrasilAPI e preenche automaticamente
 * os campos do formulário com os dados retornados.
 *
 * @example
 * ```typescript
 * const { lookup, loading } = useCnpjLookup(setForm, {
 *   nome: "nome",
 *   email: "email",
 *   telefone: "telefone",
 *   endereco: "endereco",
 *   cidade: "cidade",
 *   estado: "estado",
 * });
 *
 * <Button onClick={() => lookup(form.documento)} disabled={loading}>
 *   {loading ? <Loader2 className="animate-spin" /> : <Search />}
 * </Button>
 * ```
 */
export function useCnpjLookup(
  setForm: (updater: (prev: any) => any) => void,
  mapping: FieldMapping = {}
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const defaultMapping: Required<FieldMapping> = {
    razaoSocial: "razao_social",
    nomeFantasia: "nome_fantasia",
    nome: "nome",
    email: "email",
    telefone: "telefone",
    cep: "cep",
    endereco: "endereco",
    numero: "numero",
    complemento: "complemento",
    bairro: "bairro",
    cidade: "cidade",
    estado: "estado",
    cnae: "cnae",
    naturezaJuridica: "natureza_juridica",
    ...mapping,
  };

  const cleanCnpj = useCallback((cnpj: string) => cnpj.replace(/\D/g, ""), []);

  const formatTelefone = (dddTelefone?: string | null): string => {
    if (!dddTelefone) return "";
    const clean = dddTelefone.replace(/\D/g, "");
    if (clean.length >= 10) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, clean.length - 4)}-${clean.substring(clean.length - 4)}`;
    }
    if (clean.length >= 8) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    }
    return clean;
  };

  const lookup = useCallback(
    async (cnpj: string) => {
      const clean = cleanCnpj(cnpj);

      if (clean.length !== 14) {
        toast({
          title: "CNPJ inválido",
          description: "Digite um CNPJ válido com 14 dígitos.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      console.log(`[useCnpjLookup] Consultando CNPJ via edge function: ${clean}`);

      try {
        // Use edge function (avoids CORS / network blocks) with BrasilAPI + ReceitaWS fallback
        const { data: resp, error: fnError } = await supabase.functions.invoke("consultar-cnpj", {
          body: { cnpj: clean },
        });

        if (fnError) {
          console.error("[useCnpjLookup] Erro edge function:", fnError);
          throw new Error(fnError.message || "Erro ao consultar CNPJ");
        }
        if (resp?.error) {
          throw new Error(resp.error);
        }

        const data: BrasilApiCnpjResponse = resp?.data || {};
        console.log("[useCnpjLookup] Dados recebidos:", data);

        const telefone = formatTelefone(data.ddd_telefone_1);
        const cep = data.cep ? data.cep.replace(/\D/g, "") : "";

        setForm((prev: any) => {
          const next = { ...prev };

          // Razão Social / Nome
          if (data.razao_social) {
            if (defaultMapping.razaoSocial && defaultMapping.razaoSocial !== "-") {
              next[defaultMapping.razaoSocial] = data.razao_social;
            }
            if (defaultMapping.nome && defaultMapping.nome !== "-") {
              next[defaultMapping.nome] = data.razao_social;
            }
          }

          // Nome Fantasia
          if (data.nome_fantasia && defaultMapping.nomeFantasia && defaultMapping.nomeFantasia !== "-") {
            next[defaultMapping.nomeFantasia] = data.nome_fantasia;
          }

          // Email
          if (data.email && defaultMapping.email && defaultMapping.email !== "-") {
            next[defaultMapping.email] = data.email;
          }

          // Telefone
          if (telefone && defaultMapping.telefone && defaultMapping.telefone !== "-") {
            next[defaultMapping.telefone] = telefone;
          }

          // CEP
          if (cep && defaultMapping.cep && defaultMapping.cep !== "-") {
            next[defaultMapping.cep] = cep;
          }

          // Endereço
          if (data.logradouro && defaultMapping.endereco && defaultMapping.endereco !== "-") {
            next[defaultMapping.endereco] = data.logradouro;
          }

          // Número
          if (data.numero && defaultMapping.numero && defaultMapping.numero !== "-") {
            next[defaultMapping.numero] = data.numero;
          }

          // Complemento
          if (data.complemento && defaultMapping.complemento && defaultMapping.complemento !== "-") {
            next[defaultMapping.complemento] = data.complemento;
          }

          // Bairro
          if (data.bairro && defaultMapping.bairro && defaultMapping.bairro !== "-") {
            next[defaultMapping.bairro] = data.bairro;
          }

          // Cidade
          if (data.municipio && defaultMapping.cidade && defaultMapping.cidade !== "-") {
            next[defaultMapping.cidade] = data.municipio;
          }

          // Estado
          if (data.uf && defaultMapping.estado && defaultMapping.estado !== "-") {
            next[defaultMapping.estado] = data.uf;
          }

          // CNAE Principal
          if (data.cnae_fiscal_descricao && defaultMapping.cnae && defaultMapping.cnae !== "-") {
            next[defaultMapping.cnae] = data.cnae_fiscal_descricao;
          }

          // Natureza Juridica
          if (data.natureza_juridica && defaultMapping.naturezaJuridica && defaultMapping.naturezaJuridica !== "-") {
            next[defaultMapping.naturezaJuridica] = data.natureza_juridica;
          }

          console.log("[useCnpjLookup] Form atualizado:", next);
          return next;
        });

        toast({
          title: "Dados preenchidos!",
          description: `CNPJ ${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12)} consultado com sucesso.`,
        });
      } catch (err: any) {
        console.error("[useCnpjLookup] Erro na consulta:", err);
        toast({
          title: "Erro na consulta",
          description: err.message || "Não foi possível consultar o CNPJ. Verifique sua conexão.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [cleanCnpj, defaultMapping, setForm, toast]
  );

  return { lookup, loading, cleanCnpj };
}
