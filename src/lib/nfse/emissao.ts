/**
 * Funções de emissão NFS-e
 */

import type { NFSeEmissaoData, NFSeResposta, Servico } from "../../types/nfse";

/**
 * Calcula valores da NFSe
 */
export function calcularValoresNFSe(data: {
  valorServicos: number;
  valorDeducoes: number;
  aliquota: number;
}): {
  baseCalculo: number;
  valorIss: number;
  valorLiquido: number;
} {
  const baseCalculo = data.valorServicos - data.valorDeducoes;
  const valorIss = (baseCalculo * data.aliquota) / 100;
  const valorLiquido = baseCalculo - valorIss;

  return {
    baseCalculo: parseFloat(baseCalculo.toFixed(2)),
    valorIss: parseFloat(valorIss.toFixed(2)),
    valorLiquido: parseFloat(valorLiquido.toFixed(2)),
  };
}

/**
 * Emite NFSe via Supabase edge function
 */
export async function emitirNFSe(data: NFSeEmissaoData): Promise<NFSeResposta> {
  // Emissão real é feita pelo backend (Supabase edge function)
  // que tem acesso ao certificado digital para assinatura
  throw new Error(
    "Emissão de NFS-e deve ser feita via Supabase edge function (emitir-nfse). " +
    "Use a função do backend que tem acesso ao certificado digital para assinatura."
  );
}
