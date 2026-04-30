import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  carregarCertificado,
  construirXmlConsultaRps,
  criarEnvelopeSOAPGinfes,
  criarCabecalhoGinfes,
  enviarRequisicaoSOAP,
  parsearRespostaConsulta,
  getAmbiente,
  retry,
} from "../_shared/nfse-ginfes-client.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let notaId: string | undefined;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    if (!notaId) {
      return new Response(
        JSON.stringify({ error: "notaId e obrigatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: nota, error: notaError } = await supabase
      .from("notas_fiscais_servico")
      .select("*")
      .eq("id", notaId)
      .eq("user_id", user.id)
      .single();

    if (notaError || !nota) {
      throw new Error("Nota fiscal nao encontrada");
    }

    if (!nota.certificado_id) {
      throw new Error("Certificado nao vinculado a nota fiscal");
    }

    const { data: certificado, error: certError } = await supabase
      .from("certificados_nfse")
      .select("*")
      .eq("id", nota.certificado_id)
      .single();

    if (certError || !certificado) {
      throw new Error("Certificado nao encontrado");
    }

    if (!certificado.arquivo_pfx) {
      throw new Error("Certificado nao possui arquivo PFX");
    }

    const certDigital = await carregarCertificado(certificado.arquivo_pfx, certificado.senha || "");
    certDigital.inscricaoMunicipal = certificado.inscricao_municipal || "";
    certDigital.cnpj = certificado.cnpj || certDigital.cnpj || "";

    const ambiente = getAmbiente();
    let resultado;

    if (ambiente === "homologacao") {
      resultado = consultarHomologacao(nota, certificado);
    } else {
      resultado = await consultarProducao(nota, certDigital);
    }

    if (resultado.sucesso) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (resultado.numeroNfse) updateData.numero_nota = resultado.numeroNfse;
      if (resultado.codigoVerificacao) updateData.codigo_verificacao = resultado.codigoVerificacao;
      if (resultado.dataAutorizacao) updateData.data_autorizacao = resultado.dataAutorizacao;
      if (resultado.linkPdf) updateData.link_pdf = resultado.linkPdf;
      if (resultado.linkXml) updateData.link_xml = resultado.linkXml;
      if (resultado.linkNfse) updateData.link_nfse = resultado.linkNfse;
      if (resultado.xmlRetorno) updateData.xml_retorno = resultado.xmlRetorno;
      if (resultado.status) {
        updateData.status = resultado.status === "substituida" ? "cancelada" : resultado.status;
      }

      await supabase
        .from("notas_fiscais_servico")
        .update(updateData)
        .eq("id", notaId)
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify(resultado),
      { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro ao consultar NFS-e:", err);

    if (notaId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase
          .from("notas_fiscais_servico")
          .update({ status: "erro", mensagem_erro: (err as Error).message })
          .eq("id", notaId);
      } catch (dbErr) {
        console.error("Falha ao atualizar status de erro:", dbErr);
      }
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

function consultarHomologacao(nota: any, certificado: any) {
  return {
    sucesso: true,
    numeroNfse: nota.numero_nota || nota.numero_rps || "99999",
    codigoVerificacao: nota.codigo_verificacao || "HOM-VERIF-12345",
    dataEmissao: nota.data_emissao || new Date().toISOString(),
    dataAutorizacao: nota.data_autorizacao || new Date().toISOString(),
    status: nota.status || "autorizada",
    valorServicos: nota.valor_servico?.toString() || "0",
    valorIss: nota.valor_iss?.toString() || "0",
    baseCalculo: nota.base_calculo?.toString() || "0",
    aliquotaIss: nota.aliquota_iss?.toString() || "0",
    issRetido: false,
    tomador: {
      razaoSocial: nota.cliente_razao_social || nota.cliente_nome || "",
      cnpjCpf: nota.cliente_cnpj_cpf || "",
    },
    prestador: {
      cnpj: certificado.cnpj || "",
      inscricaoMunicipal: certificado.inscricao_municipal || "",
    },
    linkPdf: nota.link_pdf || undefined,
    linkXml: nota.link_xml || undefined,
    linkNfse: nota.link_nfse || undefined,
    discriminacao: nota.servico_descricao || "",
    itemListaServico: nota.servico_item_lista_servico || "",
    xmlRetorno: "<Consulta>true</Consulta>",
    xmlBruto: "<Consulta>true</Consulta>",
    mensagens: [{
      codigo: "E001",
      mensagem: "Consulta realizada com sucesso - ambiente de homologacao",
      tipo: "Sucesso",
    }],
  };
}

async function consultarProducao(nota: any, certDigital: any) {
  const numeroRps = nota.numero_rps || nota.numero_nota || "";
  const serie = nota.serie || "1";
  const tipo = nota.tipo_rps || "RPS";
  const cnpj = certDigital.cnpj;
  const inscricaoMunicipal = certDigital.inscricaoMunicipal;

  const xmlConsulta = construirXmlConsultaRps(numeroRps, serie, tipo, cnpj, inscricaoMunicipal);
  const cabecalho = criarCabecalhoGinfes();
  const soapEnvelope = criarEnvelopeSOAPGinfes("ConsultarNfsePorRpsV3", cabecalho, xmlConsulta, "producao");

  const soapResponse = await retry(() =>
    enviarRequisicaoSOAP(soapEnvelope, {
      certPem: certDigital.certPem,
      keyPem: certDigital.keyPem,
    })
  );

  const resultado = parsearRespostaConsulta(soapResponse);
  return { ...resultado, xmlEnvio: xmlConsulta, xmlBruto: soapResponse.substring(0, 8000) };
}
