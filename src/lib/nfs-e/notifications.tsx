import { toast } from "@/hooks/use-toast";
import type { NotaFiscal, NFSeStatus } from "@/hooks/useNFSeSync";

/** Tipos de notificação */
export type TipoNotificacao = "sucesso" | "erro" | "aviso" | "info";

/** Interface de configuração de notificação */
export interface NotificacaoConfig {
  titulo: string;
  descricao: string;
  tipo: TipoNotificacao;
  duracao?: number;
  acao?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Notifica erro na emissão de nota fiscal
 */
export function notificarErro(
  notaId: string,
  erro: string,
  opcoes?: { permitirCorrecao?: boolean; onCorrecao?: () => void }
): void {
  const config: NotificacaoConfig = {
    titulo: "Erro na Emissão",
    descricao: erro,
    tipo: "erro",
  };

  if (opcoes?.permitirCorrecao) {
    config.acao = {
      label: "Corrigir",
      onClick: () => {
        opcoes.onCorrecao?.();
      },
    };
  }

  toast({
    title: config.titulo,
    description: config.descricao,
    variant: "destructive",
    ...(config.acao && {
      action: (
        <button
          onClick={config.acao.onClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
        >
          {config.acao.label}
        </button>
      ),
    }),
  });

  // Registrar notificação no console para analytics
  console.error(`[NFSe Error] Nota ${notaId}: ${erro}`);
}

/**
 * Notifica sucesso na emissão/autorização de nota fiscal
 */
export function notificarSucesso(
  nota: NotaFiscal,
  opcoes?: { onDownload?: () => void; onVisualizar?: () => void }
): void {
  const numeroNota = nota.numero_nota || nota.id.slice(0, 8).toUpperCase();
  const cliente = nota.cliente_nome;
  const valor = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(nota.valor_servico);

  const config: NotificacaoConfig = {
    titulo: "Nota Fiscal Autorizada!",
    descricao: `Nota ${numeroNota} para ${cliente} no valor de ${valor} foi autorizada pela prefeitura.`,
    tipo: "sucesso",
    duracao: 8000,
  };

  toast({
    title: config.titulo,
    description: (
      <div className="flex flex-col gap-2">
        <p>{config.descricao}</p>
        {nota.codigo_verificacao && (
          <p className="text-xs text-muted-foreground">
            Código de verificação: {nota.codigo_verificacao}
          </p>
        )}
      </div>
    ),
    variant: "default",
  });

  // Notificação do navegador (se permitido)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Nota Fiscal Autorizada", {
      body: `Nota ${numeroNota} - ${cliente} - ${valor}`,
      icon: "/favicon.ico",
      tag: nota.id,
    });
  }

  // Registrar evento
  console.log(`[NFSe Success] Nota ${nota.id} autorizada`);
}

/**
 * Notifica alerta de certificado expirando
 */
export function notificarCertificadoExpirando(
  dias: number,
  nomeCertificado?: string
): void {
  const nome = nomeCertificado || "Certificado Digital";
  let variant: "default" | "destructive" = "default";
  let icone = "⚠️";

  if (dias <= 0) {
    variant = "destructive";
    icone = "🚨";
  } else if (dias <= 7) {
    variant = "destructive";
    icone = "⏰";
  }

  const titulo =
    dias <= 0
      ? `${icone} Certificado Expirado`
      : dias <= 7
        ? `${icone} Certificado Expirando em Breve`
        : `${icone} Certificado Próximo da Expiração`;

  const descricao =
    dias <= 0
      ? `O ${nome} expirou. Renove imediatamente para continuar emitindo notas fiscais.`
      : dias === 1
        ? `O ${nome} expira amanhã. Renove o mais rápido possível.`
        : `O ${nome} expira em ${dias} dias. Planeje a renovação.`;

  toast({
    title: titulo,
    description: descricao,
    variant,
    duration: dias <= 7 ? 10000 : 6000,
  });

  // Registrar
  console.warn(`[NFSe Certificate] ${nome} expira em ${dias} dias`);
}

/**
 * Notifica mudança de status de uma nota fiscal
 */
export function notificarMudancaStatus(
  nota: NotaFiscal,
  statusAnterior: NFSeStatus,
  opcoes?: { onDetalhes?: () => void }
): void {
  const statusConfig: Record<
    NFSeStatus,
    { titulo: string; descricao: string; variant: "default" | "destructive" }
  > = {
    rascunho: {
      titulo: "Rascunho",
      descricao: "Nota em rascunho",
      variant: "default",
    },
    enviando: {
      titulo: "Enviando",
      descricao: "Nota sendo processada",
      variant: "default",
    },
    autorizada: {
      titulo: "Autorizada",
      descricao: "Nota autorizada pela prefeitura",
      variant: "default",
    },
    rejeitada: {
      titulo: "Rejeitada",
      descricao: "Nota rejeitada. Verifique os dados.",
      variant: "destructive",
    },
    cancelada: {
      titulo: "Cancelada",
      descricao: "Nota cancelada",
      variant: "default",
    },
    erro: {
      titulo: "Erro",
      descricao: "Ocorreu um erro ao processar a nota",
      variant: "destructive",
    },
  };

  const config = statusConfig[nota.status];
  const numeroNota = nota.numero_nota || nota.id.slice(0, 8).toUpperCase();

  toast({
    title: `${config.titulo} - Nota ${numeroNota}`,
    description: nota.mensagem_erro || config.descricao,
    variant: config.variant,
    ...(opcoes?.onDetalhes && {
      action: (
        <button
          onClick={opcoes.onDetalhes}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
        >
          Ver detalhes
        </button>
      ),
    }),
  });
}

/**
 * Notifica que uma nota pode ser cancelada (mesmo dia)
 */
export function notificarPodeCancelar(
  nota: NotaFiscal,
  onCancelar: () => void
): void {
  const numeroNota = nota.numero_nota || nota.id.slice(0, 8).toUpperCase();

  toast({
    title: "Nota Autorizada - Cancelamento Disponível",
    description: `Nota ${numeroNota} pode ser cancelada até o final do dia (regra São Paulo).`,
    duration: 10000,
    action: (
      <button
        onClick={onCancelar}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3"
      >
        Cancelar
      </button>
    ),
  });
}

/**
 * Notifica que um rascunho foi excluído por expiração
 */
export function notificarRascunhoExpirado(notaId: string): void {
  toast({
    title: "Rascunho Removido",
    description: `O rascunho ${notaId.slice(0, 8).toUpperCase()} foi excluído automaticamente após 30 dias.`,
    variant: "default",
  });
}

/**
 * Solicita permissão para notificações do navegador
 */
export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Mostra notificação de download concluído
 */
export function notificarDownloadConcluido(
  tipo: "PDF" | "XML",
  numeroNota: string
): void {
  toast({
    title: "Download Concluído",
    description: `${tipo} da nota ${numeroNota} foi baixado com sucesso.`,
    variant: "default",
    duration: 3000,
  });
}

/**
 * Notifica erro de conexão com a prefeitura
 */
export function notificarErroConexao(prefeitura?: string): void {
  const nome = prefeitura || "a prefeitura";

  toast({
    title: "Erro de Conexão",
    description: `Não foi possível conectar com ${nome}. Verifique sua conexão e tente novamente.`,
    variant: "destructive",
    duration: 8000,
  });
}

/**
 * Notifica que o limite de notas do plano foi atingido
 */
export function notificarLimiteAtingido(limite: number): void {
  toast({
    title: "Limite de Notas Atingido",
    description: `Você atingiu o limite de ${limite} notas fiscais no seu plano atual. Faça upgrade para continuar emitindo.`,
    variant: "destructive",
    duration: 10000,
  });
}

/**
 * Notifica sucesso no cancelamento
 */
export function notificarCancelamentoSucesso(
  nota: NotaFiscal,
  dataCancelamento: string
): void {
  const numeroNota = nota.numero_nota || nota.id.slice(0, 8).toUpperCase();

  toast({
    title: "Nota Cancelada",
    description: `Nota ${numeroNota} foi cancelada em ${new Date(dataCancelamento).toLocaleDateString("pt-BR")}.`,
    variant: "default",
  });
}

/**
 * Notifica erro no cancelamento
 */
export function notificarCancelamentoErro(motivo: string): void {
  toast({
    title: "Não Foi Possível Cancelar",
    description: motivo,
    variant: "destructive",
    duration: 8000,
  });
}
