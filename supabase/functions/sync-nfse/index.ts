const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
  "https://ninebpofinanceiro.lovable.app",
  "https://ninebpofinanceiro.vercel.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Interface da nota fiscal */
interface NotaFiscal {
  id: string;
  user_id: string;
  numero_nota?: string | null;
  serie?: string | null;
  status: string;
  cliente_nome: string;
  cliente_cnpj_cpf?: string | null;
  servico_descricao: string;
  servico_codigo: string;
  valor_servico: number;
  valor_iss: number;
  aliquota_iss: number;
  data_emissao: string;
  data_competencia: string;
  data_autorizacao?: string | null;
  codigo_verificacao?: string | null;
  link_nfse?: string | null;
  link_pdf?: string | null;
  link_xml?: string | null;
  mensagem_erro?: string | null;
  certificado_id?: string | null;
  prefeitura_codigo?: string | null;
  updated_at?: string;
}

/** Interface de resposta da prefeitura (simulada) */
interface PrefeituraResponse {
  status: "autorizada" | "rejeitada" | "processando" | "erro";
  numeroNota?: string;
  codigoVerificacao?: string;
  linkPDF?: string;
  linkXML?: string;
  mensagemErro?: string;
  dataAutorizacao?: string;
}

/**
 * Consulta real na prefeitura via edge function consultar-nfse
 */
async function consultarPrefeituraSP(
  nota: NotaFiscal,
  certificado: any,
  supabaseUrl: string,
  authHeader: string
): Promise<PrefeituraResponse> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/consultar-nfse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ notaId: nota.id }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`consultar-nfse retornou ${res.status}: ${text}`);
    }

    const data = await res.json();

    // Mapeia resposta para formato interno
    if (data.sucesso) {
      const statusMap: Record<string, PrefeituraResponse["status"]> = {
        autorizada: "autorizada",
        cancelada: "autorizada",
        rejeitada: "rejeitada",
        enviando: "processando",
        rascunho: "processando",
      };
      const mappedStatus = statusMap[data.status || "autorizada"] || "autorizada";

      return {
        status: mappedStatus,
        numeroNota: data.numeroNfse || nota.numero_nota || undefined,
        codigoVerificacao: data.codigoVerificacao || nota.codigo_verificacao || undefined,
        linkPDF: data.linkPdf || nota.link_pdf || undefined,
        linkXML: data.linkXml || nota.link_xml || undefined,
        dataAutorizacao: data.dataAutorizacao || nota.data_autorizacao || undefined,
      };
    }

    // Se não teve sucesso mas tem mensagens, pode ser rejeição
    if (data.mensagens && data.mensagens.length > 0) {
      return {
        status: "rejeitada",
        mensagemErro: data.mensagens.map((m: any) => m.mensagem).join("; "),
      };
    }

    // Resposta ambígua — tenta análise de IA via orquestrador
    if (data.xmlBruto) {
      const analise = await analisarRespostaAmbiguaComIA(data.xmlBruto, authHeader, supabaseUrl);
      if (analise) return analise;
    }

    return { status: "processando" };
  } catch (err) {
    console.error("Erro ao consultar prefeitura via consultar-nfse:", err);
    return {
      status: "erro",
      mensagemErro: (err as Error).message,
    };
  }
}

/**
 * Analisa resposta ambígua da prefeitura via Orquestrador Multi-LLM
 */
async function analisarRespostaAmbiguaComIA(
  xml: string,
  authHeader: string,
  supabaseUrl: string
): Promise<PrefeituraResponse | null> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        taskType: "code",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em parsing de XML de resposta da Prefeitura de São Paulo (API Paulistana). Analise o XML e determine o status real da nota. Retorne APENAS um JSON válido com: { status: 'autorizada' | 'rejeitada' | 'processando' | 'erro', numeroNota?: string, codigoVerificacao?: string, mensagemErro?: string }.",
          },
          {
            role: "user",
            content: `XML de resposta da prefeitura:\n${xml.substring(0, 3000)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || "";
    const clean = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(clean);

    if (parsed.status) {
      return {
        status: parsed.status,
        numeroNota: parsed.numeroNota,
        codigoVerificacao: parsed.codigoVerificacao,
        mensagemErro: parsed.mensagemErro,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Processa sincronização em batch de múltiplas notas
 */
async function processarBatch(
  notas: NotaFiscal[],
  supabaseAdmin: any,
  supabaseUrl: string,
  authHeader: string
): Promise<{
  processadas: number;
  autorizadas: number;
  rejeitadas: number;
  erros: number;
}> {
  const resultados = {
    processadas: 0,
    autorizadas: 0,
    rejeitadas: 0,
    erros: 0,
  };

  for (const nota of notas) {
    try {
      // Buscar certificado
      const { data: certificado } = await supabaseAdmin
        .from("certificados_nfse")
        .select("*")
        .eq("id", nota.certificado_id)
        .single();

      if (!certificado) {
        console.warn(`Certificado não encontrado para nota ${nota.id}`);
        resultados.erros++;
        continue;
      }

      // Consultar prefeitura
      const resposta = await consultarPrefeituraSP(nota, certificado, supabaseUrl, authHeader);

      // Atualizar nota se houver mudança de status
      if (resposta.status !== nota.status && resposta.status !== "processando") {
        const updateData: Partial<NotaFiscal> = {
          status: resposta.status,
          updated_at: new Date().toISOString(),
        };

        if (resposta.status === "autorizada") {
          updateData.numero_nota = resposta.numeroNota || undefined;
          updateData.codigo_verificacao = resposta.codigoVerificacao || undefined;
          updateData.link_pdf = resposta.linkPDF || undefined;
          updateData.link_xml = resposta.linkXML || undefined;
          updateData.data_autorizacao = resposta.dataAutorizacao || undefined;
          updateData.mensagem_erro = null;
          resultados.autorizadas++;
        } else if (resposta.status === "rejeitada") {
          updateData.mensagem_erro = resposta.mensagemErro;
          resultados.rejeitadas++;
        }

        await supabaseAdmin
          .from("notas_fiscais_servico")
          .update(updateData)
          .eq("id", nota.id);

        // Registrar log
        await supabaseAdmin.from("nfse_sync_logs").insert({
          nota_id: nota.id,
          user_id: nota.user_id,
          status: resposta.status,
          mensagem: resposta.mensagemErro || `Sincronização: ${resposta.status}`,
          detalhes: resposta,
        });
      }

      resultados.processadas++;
    } catch (err) {
      console.error(`Erro ao processar nota ${nota.id}:`, err);
      resultados.erros++;
    }
  }

  return resultados;
}

/**
 * Handler principal da Edge Function
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Criar cliente com autenticação
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Cliente admin para operações sem RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse do body
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "consultar": {
        const { notaId } = body;

        if (!notaId) {
          throw new Error("notaId é obrigatório");
        }

        // Buscar nota
        const { data: nota, error: notaError } = await supabaseAdmin
          .from("notas_fiscais_servico")
          .select("*")
          .eq("id", notaId)
          .eq("user_id", user.id)
          .single();

        if (notaError || !nota) {
          throw new Error("Nota não encontrada");
        }

        // Buscar certificado
        const { data: certificado } = await supabaseAdmin
          .from("certificados_nfse")
          .select("*")
          .eq("id", nota.certificado_id)
          .single();

        // Consultar prefeitura
        const resposta = await consultarPrefeituraSP(nota, certificado, SUPABASE_URL, authHeader);

        // Se mudou de status, atualizar
        if (resposta.status !== nota.status && resposta.status !== "processando") {
          const updateData: Partial<NotaFiscal> = {
            status: resposta.status,
            updated_at: new Date().toISOString(),
          };

          if (resposta.status === "autorizada") {
            updateData.numero_nota = resposta.numeroNota || undefined;
            updateData.codigo_verificacao = resposta.codigoVerificacao || undefined;
            updateData.link_pdf = resposta.linkPDF || undefined;
            updateData.link_xml = resposta.linkXML || undefined;
            updateData.data_autorizacao = resposta.dataAutorizacao || undefined;
            updateData.mensagem_erro = null;
          } else if (resposta.status === "rejeitada") {
            updateData.mensagem_erro = resposta.mensagemErro;
          }

          await supabaseAdmin
            .from("notas_fiscais_servico")
            .update(updateData)
            .eq("id", notaId);

          // Registrar log
          await supabaseAdmin.from("nfse_sync_logs").insert({
            nota_id: notaId,
            user_id: user.id,
            status: resposta.status,
            mensagem: resposta.mensagemErro || `Sincronização: ${resposta.status}`,
            detalhes: resposta,
          });

          // Buscar nota atualizada
          const { data: notaAtualizada } = await supabaseAdmin
            .from("notas_fiscais_servico")
            .select("*")
            .eq("id", notaId)
            .single();

          return new Response(
            JSON.stringify({
              success: true,
              nota: notaAtualizada,
              mudouStatus: true,
              statusAnterior: nota.status,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            nota,
            mudouStatus: false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "batch": {
        const { notaIds } = body;

        if (!Array.isArray(notaIds)) {
          throw new Error("notaIds deve ser um array");
        }

        // Buscar notas
        const { data: notas, error: notasError } = await supabaseAdmin
          .from("notas_fiscais_servico")
          .select("*")
          .in("id", notaIds)
          .eq("user_id", user.id);

        if (notasError) {
          throw new Error(notasError.message);
        }

        const resultados = await processarBatch(notas || [], supabaseAdmin, SUPABASE_URL, authHeader);

        return new Response(
          JSON.stringify({
            success: true,
            ...resultados,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "syncPendentes": {
        // Buscar todas as notas em estado 'enviando' do usuário
        const { data: notas, error: notasError } = await supabaseAdmin
          .from("notas_fiscais_servico")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "enviando");

        if (notasError) {
          throw new Error(notasError.message);
        }

        const resultados = await processarBatch(notas || [], supabaseAdmin, SUPABASE_URL, authHeader);

        // Registrar execução do cron
        await supabaseAdmin.from("nfse_cron_logs").insert({
          user_id: user.id,
          tipo: "sync_pendentes",
          notas_processadas: resultados.processadas,
          notas_autorizadas: resultados.autorizadas,
          notas_rejeitadas: resultados.rejeitadas,
          erros: resultados.erros,
        });

        return new Response(
          JSON.stringify({
            success: true,
            ...resultados,
            totalPendentes: notas?.length || 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancelar": {
        const { notaId, motivo } = body;

        if (!notaId || !motivo) {
          throw new Error("notaId e motivo são obrigatórios");
        }

        // Buscar nota
        const { data: nota, error: notaError } = await supabaseAdmin
          .from("notas_fiscais_servico")
          .select("*")
          .eq("id", notaId)
          .eq("user_id", user.id)
          .single();

        if (notaError || !nota) {
          throw new Error("Nota não encontrada");
        }

        if (nota.status !== "autorizada") {
          throw new Error("Só é possível cancelar notas autorizadas");
        }

        // Verificar se está no mesmo dia (regra SP)
        const dataAutorizacao = new Date(nota.data_autorizacao || "");
        const hoje = new Date();
        const mesmoDia =
          dataAutorizacao.getDate() === hoje.getDate() &&
          dataAutorizacao.getMonth() === hoje.getMonth() &&
          dataAutorizacao.getFullYear() === hoje.getFullYear();

        if (!mesmoDia) {
          throw new Error(
            "Nota só pode ser cancelada no mesmo dia da autorização (regra São Paulo)"
          );
        }

        // Simular cancelamento na prefeitura
        // Em produção, chamar API real de cancelamento

        // Atualizar status
        await supabaseAdmin
          .from("notas_fiscais_servico")
          .update({
            status: "cancelada",
            mensagem_erro: `Cancelada: ${motivo}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", notaId);

        // Registrar log
        await supabaseAdmin.from("nfse_sync_logs").insert({
          nota_id: notaId,
          user_id: user.id,
          status: "cancelada",
          mensagem: `Nota cancelada: ${motivo}`,
          detalhes: { motivo, data_cancelamento: new Date().toISOString() },
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Nota cancelada com sucesso",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
  } catch (error) {
    console.error("Erro na Edge Function sync-nfse:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
