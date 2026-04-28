/**
 * Tipos adicionais para UI de NFS-e
 * Estende os tipos existentes com formas simplificadas para formulários
 */

import { TomadorServico, Servico, NFSeDB } from "./nfse";

/** Status possíveis de uma NFS-e (para UI) */
export type NFSeStatus =
  | "rascunho"
  | "enviando"
  | "autorizada"
  | "rejeitada"
  | "cancelada"
  | "substituida"
  | "erro";

/** Tomador simplificado para formulário */
export interface TomadorFormData {
  tipo: "CPF" | "CNPJ";
  documento: string;
  razao_social: string;
  nome_fantasia?: string;
  email: string;
  telefone?: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  ibge?: string;
}

/** Serviço simplificado para formulário */
export interface ServicoFormData {
  descricao: string;
  valor_bruto: number;
  deducoes: number;
  base_calculo: number;
  aliquota_iss: number;
  iss_retido: boolean;
  valor_iss: number;
  valor_liquido: number;
  cnae?: string;
  item_lista_servico: string;
  codigo_tributacao?: string;
  discriminacao?: string;
}

/** Retenções para formulário */
export interface RetencoesFormData {
  pis: number;
  cofins: number;
  inss: number;
  ir: number;
  csll: number;
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_inss: number;
  aliquota_ir: number;
  aliquota_csll: number;
}

/** Dados completos do formulário de emissão */
export interface NFSeFormData {
  tomador: TomadorFormData;
  servico: ServicoFormData;
  retencoes: RetencoesFormData;
  certificado_id?: string;
}

/** Resumo de nota para preview */
export interface NotaResumo {
  id?: string;
  numero_nota?: string;
  serie?: string;
  status: NFSeStatus;
  tomador: {
    razao_social: string;
    documento: string;
    endereco: string;
    cidade: string;
    estado: string;
  };
  servico: {
    descricao: string;
    valor_bruto: number;
    valor_iss: number;
    valor_liquido: number;
    aliquota_iss: number;
    iss_retido: boolean;
  };
  data_emissao?: string;
  data_competencia?: string;
}

/** Item do histórico */
export interface NFSeHistoricoItem {
  id: string;
  numero_nota: string;
  serie: string;
  status: NFSeStatus;
  tomador_nome: string;
  tomador_documento: string;
  data_emissao: string;
  valor_total: number;
  link_pdf?: string;
  link_xml?: string;
}

/** Filtros do histórico */
export interface NFSeFiltros {
  periodo_inicio?: string;
  periodo_fim?: string;
  status?: NFSeStatus | "todos";
  tomador?: string;
  numero_nota?: string;
}

/** CNAE */
export interface CNAE {
  codigo: string;
  descricao: string;
}

/** Item da Lista de Serviços */
export interface ItemListaServico {
  codigo: string;
  descricao: string;
  aliquota_padrao?: number;
}

/** Informações do certificado */
export interface CertificadoInfo {
  id: string;
  nome: string;
  valido_ate: string;
  emissor?: string;
  ativo: boolean;
  proximo_de_expirar: boolean;
  dias_para_expirar: number;
}

/** Cores de status para UI */
export const statusCores: Record<NFSeStatus, { bg: string; text: string; border: string; label: string }> = {
  rascunho: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", label: "Rascunho" },
  enviando: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", label: "Enviando" },
  autorizada: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "Autorizada" },
  rejeitada: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "Rejeitada" },
  cancelada: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", label: "Cancelada" },
  substituida: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "Substituida" },
  erro: { bg: "bg-red-100", text: "text-red-800", border: "border-red-400", label: "Erro" },
};

/** CNAEs padrão para TI */
export const CNAES_PADRAO: CNAE[] = [
  { codigo: "6201500", descricao: "Desenvolvimento de programas de computador sob encomenda" },
  { codigo: "6202300", descricao: "Desenvolvimento e licenciamento de programas de computador customizáveis" },
  { codigo: "6203100", descricao: "Desenvolvimento e licenciamento de programas de computador não-customizáveis" },
  { codigo: "6204000", descricao: "Consultoria em tecnologia da informação" },
  { codigo: "6209100", descricao: "Suporte técnico, manutenção e outros serviços em tecnologia da informação" },
  { codigo: "6311900", descricao: "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet" },
  { codigo: "7020400", descricao: "Atividades de consultoria em gestão empresarial, exceto consultoria técnica específica" },
  { codigo: "7319002", descricao: "Agenciamento de espaços para publicidade exceto em veículos de comunicação" },
  { codigo: "7410201", descricao: "Design de interiores" },
  { codigo: "7410299", descricao: "Atividades de design não especificadas anteriormente" },
  { codigo: "7490104", descricao: "Atividades de intermediação e agenciamento de serviços e negócios em geral" },
];

/** Itens da Lista de Serviços (LC 116/2003) */
export const ITENS_LISTA_SERVICO: ItemListaServico[] = [
  { codigo: "1.01", descricao: "Análise e desenvolvimento de sistemas", aliquota_padrao: 2.0 },
  { codigo: "1.02", descricao: "Programação", aliquota_padrao: 2.0 },
  { codigo: "1.03", descricao: "Processamento de dados e congêneres", aliquota_padrao: 2.0 },
  { codigo: "1.04", descricao: "Elaboração de programas de computadores", aliquota_padrao: 2.0 },
  { codigo: "1.05", descricao: "Licenciamento ou cessão de direito de uso de programas de computação", aliquota_padrao: 2.0 },
  { codigo: "1.06", descricao: "Assessoria e consultoria em informática", aliquota_padrao: 2.0 },
  { codigo: "1.07", descricao: "Suporte técnico em informática", aliquota_padrao: 2.0 },
  { codigo: "1.08", descricao: "Planejamento e desenvolvimento de páginas para internet", aliquota_padrao: 2.0 },
  { codigo: "1.09", descricao: "Hospedagem de páginas na internet", aliquota_padrao: 2.0 },
  { codigo: "17.01", descricao: "Assessoria e consultoria em publicidade e propaganda", aliquota_padrao: 2.0 },
  { codigo: "17.02", descricao: "Planejamento de campanhas de publicidade e propaganda", aliquota_padrao: 2.0 },
  { codigo: "17.03", descricao: "Criação de anúncios publicitários", aliquota_padrao: 2.0 },
  { codigo: "17.04", descricao: "Agenciamento de espaços para publicidade", aliquota_padrao: 2.0 },
  { codigo: "17.05", descricao: "Agenciamento de material publicitário", aliquota_padrao: 2.0 },
  { codigo: "17.06", descricao: "Seleção e agenciamento de veículos para divulgação", aliquota_padrao: 2.0 },
  { codigo: "17.07", descricao: "Produção de material publicitário", aliquota_padrao: 2.0 },
  { codigo: "17.08", descricao: "Pesquisa de mercado, de opinião e de mídia", aliquota_padrao: 2.0 },
  { codigo: "17.09", descricao: "Promoção de vendas, eventos e patrocínios", aliquota_padrao: 2.0 },
  { codigo: "17.10", descricao: "Relações públicas", aliquota_padrao: 2.0 },
  { codigo: "25.01", descricao: "Consultoria e assessoria empresarial", aliquota_padrao: 2.0 },
  { codigo: "25.02", descricao: "Planejamento empresarial", aliquota_padrao: 2.0 },
  { codigo: "25.03", descricao: "Organização de empresas", aliquota_padrao: 2.0 },
  { codigo: "25.04", descricao: "Gestão de negócios", aliquota_padrao: 2.0 },
];

/** Valores iniciais */
export const TOMADOR_INICIAL: TomadorFormData = {
  tipo: "CNPJ",
  documento: "",
  razao_social: "",
  nome_fantasia: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export const SERVICO_INICIAL: ServicoFormData = {
  descricao: "",
  valor_bruto: 0,
  deducoes: 0,
  base_calculo: 0,
  aliquota_iss: 2.0,
  iss_retido: false,
  valor_iss: 0,
  valor_liquido: 0,
  cnae: "",
  item_lista_servico: "",
  codigo_tributacao: "",
  discriminacao: "",
};

// Alíquotas padrão conforme legislação brasileira
// PIS: 0,65% (cumulativo) ou 1,65% (não cumulativo) - usando 0,65% como padrão
// COFINS: 3% (cumulativo) ou 7,6% (não cumulativo) - usando 3% como padrão
// INSS: 11% para tomadores de serviços de cooperativas/autônomos
export const RETENCOES_INICIAL: RetencoesFormData = {
  pis: 0,
  cofins: 0,
  inss: 0,
  ir: 0,
  csll: 0,
  aliquota_pis: 0.65,
  aliquota_cofins: 3,
  aliquota_inss: 11,
  aliquota_ir: 0,
  aliquota_csll: 0,
};

// Alíquotas alternativas (não cumulativas) - para empresas do lucro real
export const ALIQUOTAS_NAO_CUMULATIVAS = {
  pis: 1.65,
  cofins: 7.6,
  inss: 11,
  ir: 0,
  csll: 0,
};

// Alíquotas cumulativas (padrão para empresas do simples nacional)
export const ALIQUOTAS_CUMULATIVAS = {
  pis: 0.65,
  cofins: 3,
  inss: 11,
  ir: 0,
  csll: 0,
};

// Alíquotas lucro presumido (base 8% para IRPJ e CSLL sobre receita)
export const ALIQUOTAS_LUCRO_PRESUMIDO = {
  pis: 0.65,
  cofins: 3,
  inss: 0, // Não incide INSS na prestação de serviços
  ir: 1.2, // 8% base * 15% alíquota
  csll: 1.08, // 8% base * 13% alíquota
};
