import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  carregarCertificado,
  construirXmlRps,
  construirXmlLoteRps,
  assinarLoteCompleto,
  criarEnvelopeSOAPGinfes,
  criarCabecalhoGinfes,
  enviarRequisicaoSOAP,
  parsearRespostaEmissao,
  getAmbiente,
  formatarDataNfse,
  retry,
} from "../_shared/nfse-ginfes-client.ts";

// Types
interface DadosNota {
  identificacaoRps: { numero: string; serie: string; tipo: string };
  dataEmissao: string;
  competencia: string;
  naturezaOperacao: number;
  regimeTributario: number;
  optanteSimplesNacional: boolean;
  incentivoFiscal: boolean;
  emitente: {
    cnpj: string;
    inscricaoMunicipal: string;
    razaoSocial: string;
    endereco: { logradouro: string; numero: string; bairro: string; codigoMunicipio: string; uf: string; cep: string };
  };
  tomador: {
    tipoDocumento: string;
    cnpjCpf: string;
    razaoSocial: string;
    nomeFantasia?: string;
    email?: string;
    telefone?: string;
    inscricaoMunicipal?: string;
    endereco: { logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string };
  };
  servico: {
    descricao: string;
    codigo: string;
    codigoCnae?: string;
    cnae?: string;
    codigoTributacao?: string;
    discriminacao?: string;
    itemListaServico: string;
    valores: { valorServicos: number; valorDeducoes: number; valorPis: number; valorCofins: number; valorInss: number; valorIr: number; valorCsll: number; valorIss: number; valorLiquido: number };
    aliquotaIss: number;
    issRetido: boolean;
  };
}

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
    const certificadoId = body.certificadoId;

    if (!notaId || !certificadoId) {
      return new Response(
        JSON.stringify({ error: "notaId e certificadoId sao obrigatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: certificado, error: certError } = await supabase
      .from("certificados_nfse")
      .select("*")
      .eq("id", certificadoId)
      .eq("user_id", user.id)
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

    if (!certDigital.cnpj) {
      throw new Error("CNPJ nao encontrado no certificado");
    }

    await supabase
      .from("notas_fiscais_servico")
      .update({ status: "enviando" })
      .eq("id", notaId)
      .eq("user_id", user.id);

    const { data: nota, error: notaError } = await supabase
      .from("notas_fiscais_servico")
      .select("*")
      .eq("id", notaId)
      .eq("user_id", user.id)
      .single();

    if (notaError || !nota) {
      throw new Error("Nota fiscal nao encontrada");
    }

    const dadosNota: DadosNota = {
      identificacaoRps: {
        numero: nota.numero_rps || nota.numero_nota || gerarNumeroRps(),
        serie: nota.serie || "1",
        tipo: nota.tipo_rps || "RPS",
      },
      dataEmissao: formatarDataNfse(nota.data_emissao || new Date().toISOString()),
      competencia: nota.data_competencia || new Date().toISOString().split("T")[0],
      naturezaOperacao: nota.natureza_operacao || 1,
      regimeTributario: nota.regime_tributario || 1,
      optanteSimplesNacional: nota.regime_tributario === 1,
      incentivoFiscal: false,
      emitente: {
        cnpj: certDigital.cnpj,
        inscricaoMunicipal: certDigital.inscricaoMunicipal,
        razaoSocial: certificado.razao_social || certDigital.razaoSocial || "",
        endereco: {
          logradouro: certificado.logradouro || "",
          numero: certificado.numero || "",
          bairro: certificado.bairro || "",
          codigoMunicipio: certificado.codigo_municipio || "3550308",
          uf: certificado.uf || "SP",
          cep: certificado.cep || "",
        },
      },
      tomador: {
        tipoDocumento: nota.cliente_tipo_documento || "CNPJ",
        cnpjCpf: nota.cliente_cnpj_cpf || "",
        razaoSocial: nota.cliente_razao_social || nota.cliente_nome || "",
        nomeFantasia: nota.cliente_nome_fantasia || "",
        email: nota.cliente_email || "",
        telefone: nota.cliente_telefone || "",
        endereco: {
          logradouro: nota.cliente_endereco || "",
          numero: nota.cliente_numero || "",
          complemento: nota.cliente_complemento || "",
          bairro: nota.cliente_bairro || "",
          cidade: nota.cliente_cidade || "",
          uf: nota.cliente_estado || "",
          cep: nota.cliente_cep || "",
        },
      },
      servico: {
        descricao: nota.servico_descricao || "",
        codigo: nota.servico_codigo || nota.servico_item_lista_servico || "",
        cnae: nota.servico_cnae || nota.cnae || "",
        codigoTributacao: nota.servico_codigo_tributacao || nota.codigo_tributacao || "",
        discriminacao: nota.servico_discriminacao || "",
        itemListaServico: nota.servico_item_lista_servico || "",
        valores: {
          valorServicos: parseFloat(nota.valor_servico) || 0,
          valorDeducoes: parseFloat(nota.valor_deducoes) || 0,
          valorPis: parseFloat(nota.retencao_pis) || 0,
          valorCofins: parseFloat(nota.retencao_cofins) || 0,
          valorInss: parseFloat(nota.retencao_inss) || 0,
          valorIr: parseFloat(nota.retencao_ir) || 0,
          valorCsll: parseFloat(nota.retencao_csll) || 0,
          valorIss: parseFloat(nota.valor_iss) || 0,
          valorLiquido: parseFloat(nota.valor_liquido) || 0,
        },
        aliquotaIss: parseFloat(nota.aliquota_iss) || 0.05,
        issRetido: nota.iss_retido || false,
      },
    };

    const ambiente = getAmbiente();
    let resultado;

    if (ambiente === "homologacao") {
      resultado = emitirHomologacao(dadosNota);
    } else {
      resultado = await emitirProducao(dadosNota, certDigital);
    }

    const updateData: any = {
      status: resultado.sucesso ? "autorizada" : "rejeitada",
      xml_envio: (resultado as any).xmlEnvio || null,
      xml_retorno: resultado.xmlRetorno || null,
      numero_nota: resultado.numeroNfse || nota.numero_nota,
      protocolo: resultado.protocolo || null,
      codigo_verificacao: resultado.codigoVerificacao || null,
      link_nfse: (resultado as any).linkNfse || null,
      data_autorizacao: resultado.sucesso ? new Date().toISOString() : null,
      mensagem_erro: resultado.sucesso ? null : resultado.mensagens?.map((m: any) => m.mensagem).join("; "),
    };

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
    console.error("Erro ao emitir NFS-e:", err);

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

function gerarNumeroRps(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${timestamp}${random}`;
}

function emitirHomologacao(dadosNota: DadosNota) {
  return {
    sucesso: true,
    numeroNfse: dadosNota.identificacaoRps.numero,
    protocolo: `PROT${Date.now()}`,
    codigoVerificacao: `HOM${Date.now().toString(36).toUpperCase()}`,
    linkNfse: `https://homologacao.ginfes.com.br/visualizar/${dadosNota.identificacaoRps.numero}`,
    xmlEnvio: "<homologacao>simulado</homologacao>",
    xmlRetorno: "<Compl>true</Compl>",
    mensagens: [{
      codigo: "AA001",
      mensagem: "RPS processado com sucesso - ambiente de homologacao",
      tipo: "Sucesso",
    }],
  };
}

async function emitirProducao(dadosNota: DadosNota, certDigital: any) {
  const xmlRps = construirXmlRps(dadosNota);
  const { xml: xmlLote, loteId } = construirXmlLoteRps(dadosNota, xmlRps);
  const signedLote = assinarLoteCompleto(xmlLote, certDigital);

  const cabecalho = criarCabecalhoGinfes();
  const soapEnvelope = criarEnvelopeSOAPGinfes("RecepcionarLoteRpsV3", cabecalho, signedLote, "producao");

  const soapResponse = await retry(() =>
    enviarRequisicaoSOAP(soapEnvelope, {
      certPem: certDigital.certPem,
      keyPem: certDigital.keyPem,
    })
  );

  const resultado = parsearRespostaEmissao(soapResponse);
  return { ...resultado, xmlEnvio: signedLote };
}
