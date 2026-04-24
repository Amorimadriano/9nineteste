/**
 * Tipos para componentes de Conciliação de Cartões
 * @agente-frontend
 */

import type {
  BandeiraCartao,
  StatusTransacaoCartao,
  TipoTransacaoCartao,
  TransacaoCartao,
  SugestaoMatchCartao,
  ResumoConciliacaoCartao,
  FiltrosTransacaoCartao,
} from '@/types/cartoes';

export type {
  BandeiraCartao,
  StatusTransacaoCartao,
  TipoTransacaoCartao,
  TransacaoCartao,
  SugestaoMatchCartao,
  ResumoConciliacaoCartao,
  FiltrosTransacaoCartao,
};

export interface CandidatoMatch {
  id: string;
  tipo: 'conta_receber' | 'lancamento';
  descricao: string;
  valor: number;
  data: string;
  status?: string;
}

export interface MatchSuggestionProps {
  transacao: TransacaoCartao;
  sugestao: SugestaoMatchCartao;
  candidato: CandidatoMatch;
  onAceitar: () => void;
  onRecusar: () => void;
}

export interface TabelaTransacoesProps {
  transacoes: TransacaoCartao[];
  onSelecionar?: (ids: string[]) => void;
  onConciliar?: (id: string) => void;
  onDesconciliar?: (id: string) => void;
  onConciliarManual?: (transacao: TransacaoCartao) => void;
  onExcluir?: (id: string) => void;
  loading?: boolean;
}

export interface ImportarExtratoProps {
  onImportar: (transacoes: Partial<TransacaoCartao>[]) => Promise<void>;
}

export interface ConciliacaoManualModalProps {
  transacao: TransacaoCartao | null;
  candidatos: CandidatoMatch[];
  onClose: () => void;
  onConciliar: (transacaoId: string, candidatoId: string, candidatoTipo: string) => Promise<void>;
  onConciliarDireto: (transacaoId: string) => Promise<void>;
}

export interface ResumoConciliacaoProps {
  resumo: ResumoConciliacaoCartao;
  loading?: boolean;
}
