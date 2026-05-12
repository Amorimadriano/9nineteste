/**
 * Tipos para funcionalidades IA do módulo NFSe
 */

export interface SugestaoServico {
  itemListaServico: string;
  cnae: string;
  sugestaoDescricao: string;
  aliquotaSugerida: number;
  confianca: "alta" | "media" | "baixa";
}

export interface AnalisePreEmissao {
  valido: boolean;
  problemas: Array<{ campo: string; mensagem: string; severidade: "erro" | "aviso" }>;
  sugestoes: string[];
}

export interface ErroTraduzido {
  codigoOriginal: string;
  mensagemOriginal: string;
  explicacao: string;
  acaoSugerida: string;
  documentacao?: string;
}

export interface AnaliseTomador {
  consistente: boolean;
  alertas: Array<{ tipo: "divergencia" | "incompleto" | "suspeito"; mensagem: string }>;
  sugestoes: string[];
}
