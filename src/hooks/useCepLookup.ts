import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

interface FieldMapping {
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string;
}

export function useCepLookup(
  setForm: (updater: (prev: any) => any) => void,
  mapping: FieldMapping = {}
) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const defaultMapping: Required<FieldMapping> = {
    logradouro: "endereco_logradouro",
    bairro: "endereco_bairro",
    cidade: "endereco_cidade",
    estado: "endereco_uf",
    complemento: "endereco_complemento",
    ...mapping,
  };

  const cleanCep = useCallback((cep: string) => cep.replace(/\D/g, ""), []);

  const lookup = useCallback(
    async (cep: string) => {
      const clean = cleanCep(cep);

      if (clean.length !== 8) {
        toast({
          title: "CEP inválido",
          description: "Digite um CEP válido com 8 dígitos.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Erro ${res.status} ao consultar CEP.`);
        }

        const data: ViaCepResponse = await res.json();

        if (data.erro) {
          throw new Error("CEP não encontrado.");
        }

        setForm((prev: any) => {
          const next = { ...prev };

          if (data.logradouro && defaultMapping.logradouro) {
            next[defaultMapping.logradouro] = data.logradouro;
          }
          if (data.bairro && defaultMapping.bairro) {
            next[defaultMapping.bairro] = data.bairro;
          }
          if (data.localidade && defaultMapping.cidade) {
            next[defaultMapping.cidade] = data.localidade;
          }
          if (data.uf && defaultMapping.estado) {
            next[defaultMapping.estado] = data.uf;
          }
          if (data.complemento && defaultMapping.complemento) {
            next[defaultMapping.complemento] = data.complemento;
          }

          return next;
        });

        toast({
          title: "Endereço preenchido!",
          description: `CEP ${clean.substring(0, 5)}-${clean.substring(5)} consultado com sucesso.`,
        });
      } catch (err: any) {
        toast({
          title: "Erro na consulta",
          description: err.message || "Não foi possível consultar o CEP. Verifique sua conexão.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [cleanCep, defaultMapping, setForm, toast]
  );

  return { lookup, loading, cleanCep };
}
