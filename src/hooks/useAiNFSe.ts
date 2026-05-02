/**
 * Hooks React especializados para funcionalidades IA do NFSe
 *
 * Usam TanStack Query para cache e gerenciamento de estado.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  sugerirServico,
  analisarTomador,
  validarPreEmissao,
  traduzirErroGinfes,
  sugerirRetencoes,
  analisarLoteNotas,
  type SugestaoServico,
  type AnalisePreEmissao,
  type ErroTraduzido,
  type AnaliseTomador,
} from "@/lib/nfse/ai";

/** Hook para sugerir item de serviço com base em descrição natural */
export function useSugerirServico() {
  const [sugestao, setSugestao] = useState<SugestaoServico | null>(null);

  const mutation = useMutation<SugestaoServico, Error, string>({
    mutationFn: sugerirServico,
    onSuccess: setSugestao,
  });

  return {
    sugerir: mutation.mutate,
    sugerirAsync: mutation.mutateAsync,
    sugestao,
    isLoading: mutation.isPending,
    error: mutation.error,
    clear: useCallback(() => setSugestao(null), []),
  };
}

/** Hook para validar dados do tomador com IA */
export function useAnalisarTomador() {
  const [analise, setAnalise] = useState<AnaliseTomador | null>(null);

  const mutation = useMutation<AnaliseTomador, Error, Parameters<typeof analisarTomador>[0]>({
    mutationFn: analisarTomador,
    onSuccess: setAnalise,
  });

  return {
    analisar: mutation.mutate,
    analisarAsync: mutation.mutateAsync,
    analise,
    isLoading: mutation.isPending,
    error: mutation.error,
    clear: useCallback(() => setAnalise(null), []),
  };
}

/** Hook para validação prévia de emissão */
export function useValidarPreEmissao() {
  const [resultado, setResultado] = useState<AnalisePreEmissao | null>(null);

  const mutation = useMutation<AnalisePreEmissao, Error, Record<string, any>>({
    mutationFn: validarPreEmissao,
    onSuccess: setResultado,
  });

  return {
    validar: mutation.mutate,
    validarAsync: mutation.mutateAsync,
    resultado,
    isLoading: mutation.isPending,
    error: mutation.error,
    clear: useCallback(() => setResultado(null), []),
  };
}

/** Hook para traduzir erros do GINFES */
export function useTraduzirErroGinfes() {
  const [traducao, setTraducao] = useState<ErroTraduzido | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation<ErroTraduzido, Error, { codigo: string; mensagem: string; xmlContexto?: string }>({
    mutationFn: ({ codigo, mensagem, xmlContexto }) => traduzirErroGinfes(codigo, mensagem, xmlContexto),
    onSuccess: (data, variables) => {
      // Cacheia traduções para reutilização
      queryClient.setQueryData(["nfse", "erro", variables.codigo], data);
      setTraducao(data);
    },
  });

  return {
    traduzir: mutation.mutate,
    traduzirAsync: mutation.mutateAsync,
    traducao,
    isLoading: mutation.isPending,
    error: mutation.error,
    clear: useCallback(() => setTraducao(null), []),
  };
}

/** Hook para sugerir retenções */
export function useSugerirRetencoes() {
  const [sugestao, setSugestao] = useState<{
    pis: number;
    cofins: number;
    inss: number;
    ir: number;
    csll: number;
    justificativa: string;
  } | null>(null);

  const mutation = useMutation<
    { pis: number; cofins: number; inss: number; ir: number; csll: number; justificativa: string },
    Error,
    { valorBruto: number; itemListaServico: string; tomadorRegime?: string }
  >({
    mutationFn: ({ valorBruto, itemListaServico, tomadorRegime }) =>
      sugerirRetencoes(valorBruto, itemListaServico, tomadorRegime),
    onSuccess: setSugestao,
  });

  return {
    sugerir: mutation.mutate,
    sugerirAsync: mutation.mutateAsync,
    sugestao,
    isLoading: mutation.isPending,
    error: mutation.error,
    clear: useCallback(() => setSugestao(null), []),
  };
}

/** Hook para análise de lote de notas */
export function useAnalisarLoteNotas() {
  const [resumo, setResumo] = useState<string | null>(null);

  const mutation = useMutation<string, Error, Array<Record<string, any>>>({
    mutationFn: analisarLoteNotas,
    onSuccess: setResumo,
  });

  return {
    analisar: mutation.mutate,
    analisarAsync: mutation.mutateAsync,
    resumo,
    isLoading: mutation.isPending,
    error: mutation.error,
    clear: useCallback(() => setResumo(null), []),
  };
}
