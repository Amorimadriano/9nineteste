import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  carregarCertificado,
  construirXmlCancelamento,
  assinarXml,
  criarEnvelopeSOAP,
  enviarRequisicaoSOAP,
  parsearRespostaCancelamento,
  type CertificadoDigital,
} from "../_shared/nfse-ginfes-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let notaId: string | undefined;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    notaId = body.notaId;
    const motivoCancelamento = body.motivoCancelamento || "E007";

    if (!notaId) {
      return new Response(
        JSON.stringify({ error: "notaId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar nota
    const { data: nota, error: notaError } = await supabase
      .from("notas_fiscais_servico")
      .select("*")
      .eq("id", notaId)
      .eq("user_id", user.id)
      .single();

    if (notaError || !nota) {
      throw new Error("Nota fiscal não encontrada");
    }

    // Verificar se a nota pode ser cancelada
    if (nota.status !== "autorizada") {
      throw new Error(`Nota não pode ser cancelada. Status atual: ${nota.status}. Apenas notas autorizadas podem ser canceladas.`);
    }

    // Regra SP: so pode cancelar no mesmo dia da autorizacao
    if (nota.data_autorizacao) {
      const dataAut = new Date(nota.data_autorizacao);
      const hoje = new Date();
      if (dataAut.toDateString() !== hoje.toDateString()) {
        throw new Error("Nota não pode ser cancelada. Só é permitido cancelar no mesmo dia da autorização (regra São Paulo).");
      }
    }

    // Buscar certificado
    if (!nota.certificado_id) {
      throw new Error("Certificado não vinculado à nota fiscal");
    }

    const { data: certificado, error: certError } = await supabase
      .from("certificados_nfse")
      .select("*")
      .eq("id", nota.certificado_id)
      .single();

    if (certError || !certificado) {
      throw new Error("Certificado não encontrado");
    }

    if (!certificado.arquivo_pfx) {
      throw new Error("Certificado não possui arquivo PFX. Faça upload novamente.");
    }

    // Carregar certificado digital
    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");

    console.log(`Cancelando NFS-e número: ${nota.numero_nota || nota.numero_rps}`);

    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";
    let resultado;

    if (ambiente === "homologacao") {
      resultado = cancelarHomologacao(nota, certificado, motivoCancelamento);
    } else {
      resultado = await cancelarProducao(nota, certDigital, motivoCancelamento);
    }

    // Atualizar nota com resultado
    const updateData: any = {
      status: resultado.sucesso ? "cancelada" : "erro",
      motivo_cancelamento: motivoCancelamento,
    };

    if (resultado.xmlRetorno) {
      updateData.xml_retorno = resultado.xmlRetorno;
    }
    if (!resultado.sucesso) {
      updateData.mensagem_erro = resultado.mensagens?.map((m: any) => m.mensagem).join("; ");
    }

    await supabase
      .from("notas_fiscais_servico")
      .update(updateData)
      .eq("id", notaId)
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify(resultado),
      { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro ao cancelar NFS-e:", err);

    if (notaId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase
          .from("notas_fiscais_servico")
          .update({ status: "erro", mensagem_erro: (err as Error).message })
          .eq("id", notaId);
      } catch {}
    }

    return new Response(
      JSON.stringify({
        sucesso: false,
        mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function cancelarHomologacao(nota: any, certificado: any, motivoCancelamento: string) {
  console.log("Ambiente de homologação - retornando cancelamento simulado");
  const xmlEnvio = construirXmlCancelamento(
    nota.numero_nota || nota.numero_rps || "",
    certificado.cnpj || "",
    certificado.inscricao_municipal || "",
    motivoCancelamento
  );
  return {
    sucesso: true,
    xmlEnvio,
    xmlRetorno: "<Cancelamento>true</Cancelamento>",
    mensagens: [{
      codigo: "E001",
      mensagem: "Cancelamento processado com sucesso - ambiente de homologação",
      tipo: "Sucesso",
    }],
  };
}

async function cancelarProducao(nota: any, certDigital: CertificadoDigital, motivoCancelamento: string) {
  const numeroNfse = nota.numero_nota || nota.numero_rps || "";
  const cnpj = certDigital.cnpj;
  const inscricaoMunicipal = certDigital.inscricaoMunicipal;

  // Build cancellation XML
  const xmlCancelamento = construirXmlCancelamento(numeroNfse, cnpj, inscricaoMunicipal, motivoCancelamento);
  const pedidoId = `CANC${numeroNfse}`;

  // Sign the cancellation
  const signedXml = assinarXml(xmlCancelamento, certDigital, pedidoId);

  // Create SOAP envelope
  const soapEnvelope = criarEnvelopeSOAP("CancelarNfseV3", signedXml, cnpj, inscricaoMunicipal);

  // Send to GINFES
  const soapResponse = await enviarRequisicaoSOAP(soapEnvelope);

  // Parse response
  return parsearRespostaCancelamento(soapResponse);
}