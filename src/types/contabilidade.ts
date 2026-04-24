/**
 * Types para Integração Contábil
 * Task #35 - APIs Contabilidade - Interface de Configuração
 */

export type TipoERP =
  | "totvs_protheus"
  | "sankhya_omegasoft"
  | "dominio_sistemas"
  | "alterdata"
  | "outro";

export interface ERPConfig {
  id: string;
  tipo: TipoERP;
  nome: string;
  descricao: string;
  logo?: string;
}

export interface CredenciaisERP {
  url_api: string;
  api_key?: string;
  api_secret?: string;
  usuario?: string;
  senha?: string;
  codigo_empresa: string;
  codigo_filial?: string;
}

export interface MapeamentoConta {
  id: string;
  categoria_financeira_id: string;
  categoria_financeira_nome: string;
  tipo_lancamento: "despesa" | "receita" | "transferencia";
  conta_contabil_erp: string;
  historico_padrao: string;
  centro_custo?: string;
  ativo: boolean;
}

export type StatusSincronizacao = "pendente" | "processando" | "sucesso" | "erro" | "aviso";
export type FrequenciaSincronizacao = "manual" | "diaria" | "semanal";
export type TipoOperacao =
  | "exportar_contas_pagar"
  | "exportar_contas_receber"
  | "exportar_movimentacao_caixa"
  | "importar_lancamentos_contabeis";

export interface ConfiguracaoIntegracao {
  id: string;
  erp_id: string;
  credenciais: CredenciaisERP;
  mapeamentos: MapeamentoConta[];
  sincronizacao_automatica: boolean;
  frequencia: FrequenciaSincronizacao;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LogSincronizacao {
  id: string;
  configuracao_id: string;
  tipo_operacao: TipoOperacao;
  status: StatusSincronizacao;
  data_inicio: string;
  data_fim?: string;
  registros_processados: number;
  registros_sucesso: number;
  registros_erro: number;
  mensagem?: string;
  detalhes?: Record<string, unknown>;
}

export interface PreviewSincronizacao {
  tipo: TipoOperacao;
  quantidade: number;
  valor_total: number;
  periodo_inicio: string;
  periodo_fim: string;
}

export interface ProgressoSincronizacao {
  status: StatusSincronizacao;
  progresso: number;
  mensagem: string;
  registrosProcessados: number;
  totalRegistros: number;
}

export const ERPS_SUPORTADOS: ERPConfig[] = [
  {
    id: "totvs_protheus",
    tipo: "totvs_protheus",
    nome: "TOTVS Protheus",
    descricao: "ERP completo com módulos financeiros, contábeis e fiscais. Suporte a APIs REST.",
  },
  {
    id: "sankhya_omegasoft",
    tipo: "sankhya_omegasoft",
    nome: "Sankhya Omegasoft",
    descricao: "Gestão empresarial integrada com foco em médias e grandes empresas.",
  },
  {
    id: "dominio_sistemas",
    tipo: "dominio_sistemas",
    nome: "Domínio Sistemas",
    descricao: "Solução completa para gestão contábil e fiscal.",
  },
  {
    id: "alterdata",
    tipo: "alterdata",
    nome: "Alterdata",
    descricao: "Sistema de gestão empresarial com módulos integrados.",
  },
  {
    id: "outro",
    tipo: "outro",
    nome: "Outro ERP",
    descricao: "Configuração genérica para integração com outros sistemas via API.",
  },
];

export const TIPOS_LANCAMENTO = [
  { value: "despesa", label: "Despesa" },
  { value: "receita", label: "Receita" },
  { value: "transferencia", label: "Transferência" },
] as const;

export const TIPOS_OPERACAO: { value: TipoOperacao; label: string }[] = [
  { value: "exportar_contas_pagar", label: "Exportar Contas a Pagar" },
  { value: "exportar_contas_receber", label: "Exportar Contas a Receber" },
  { value: "exportar_movimentacao_caixa", label: "Exportar Movimentação de Caixa" },
  { value: "importar_lancamentos_contabeis", label: "Importar Lançamentos Contábeis" },
];

export const FREQUENCIAS_SINCRONIZACAO: { value: FrequenciaSincronizacao; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
];
