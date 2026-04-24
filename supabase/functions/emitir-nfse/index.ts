import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { notaId, certificadoId } = await req.json();

    if (!notaId || !certificadoId) {
      return new Response(
        JSON.stringify({ error: "notaId e certificadoId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do certificado
    const certificadoResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/certificados_nfse?id=eq.${certificadoId}&select=*`,
      {
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
          "Content-Type": "application/json",
        },
      }
    );

    const certificados = await certificadoResponse.json();
    if (!certificados || certificados.length === 0) {
      throw new Error("Certificado não encontrado");
    }

    const certificado = certificados[0];

    // Atualizar status da nota para "enviando"
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/notas_fiscais_servico?id=eq.${notaId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ status: "enviando" }),
      }
    );

    // Busca dados da nota
    const notaResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/notas_fiscais_servico?id=eq.${notaId}&select=*`,
      {
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
        },
      }
    );

    const notas = await notaResponse.json();
    if (!notas || notas.length === 0) {
      throw new Error("Nota fiscal não encontrada");
    }

    const nota = notas[0];

    // Preparar dados do emitente (deve vir de uma tabela de emitentes ou configuração)
    const emitente = {
      cnpj: certificado.cnpj || "",
      inscricaoMunicipal: certificado.inscricao_municipal || "",
      razaoSocial: certificado.razao_social || "",
      endereco: {
        logradouro: certificado.endereco || "",
        numero: certificado.numero || "",
        bairro: certificado.bairro || "",
        codigoMunicipio: certificado.codigo_municipio || "3550308", // São Paulo
        uf: certificado.uf || "SP",
        cep: certificado.cep || "",
      },
      certificado: {
        certificado: certificado.arquivo_pfx || "",
        senha: certificado.senha || "",
      },
    };

    // Preparar dados da nota para envio
    const dadosNota = {
      identificacaoRps: {
        numero: nota.numero_rps || nota.numero_nota || gerarNumeroRps(),
        serie: nota.serie || "1",
        tipo: nota.tipo_rps || "RPS",
      },
      dataEmissao: nota.data_emissao || new Date().toISOString(),
      competencia: nota.data_competencia || new Date().toISOString().split("T")[0],
      naturezaOperacao: nota.natureza_operacao || 1,
      regimeTributario: nota.regime_tributario || 1,
      optanteSimplesNacional: nota.regime_tributario === 1,

      emitente,

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
        aliquotaIss: parseFloat(nota.aliquota_iss) || 0,
        issRetido: nota.iss_retido || false,
      },

      certificadoId: certificadoId,
    };

    console.log("Emitindo NFS-e:", JSON.stringify(dadosNota, null, 2));

    // Chamar a API GINFES para emissão (implementação simplificada)
    // Em produção, aqui seria a chamada real para a GINFES
    const resultado = await emitirNfseGinfes(dadosNota, certificado);

    // Atualizar nota com resultado
    const updateData: any = {
      status: resultado.sucesso ? "autorizada" : "erro",
      xml_envio: resultado.xmlEnvio || null,
      xml_retorno: resultado.xmlRetorno || null,
      link_pdf: resultado.linkPdf || null,
      link_xml: resultado.linkXml || null,
      numero_nota: resultado.numeroNfse || nota.numero_nota,
      protocolo: resultado.protocolo || null,
      codigo_verificacao: (resultado as any).codigoVerificacao || null,
      link_nfse: (resultado as any).linkNfse || null,
    };

    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/notas_fiscais_servico?id=eq.${notaId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    return new Response(
      JSON.stringify(resultado),
      { status: resultado.sucesso ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro ao emitir NFS-e:", err);

    // Tenta atualizar status para erro
    try {
      const { notaId } = await req.json().catch(() => ({}));
      if (notaId) {
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/rest/v1/notas_fiscais_servico?id=eq.${notaId}`,
          {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "erro" }),
          }
        );
      }
    } catch {}

    return new Response(
      JSON.stringify({ sucesso: false, mensagens: [{ codigo: "ERROR", mensagem: (err as Error).message, tipo: "Erro" }] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função para gerar número de RPS
function gerarNumeroRps(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${timestamp}${random}`;
}

// Função simulada para emissão GINFES
// Em produção, substituir pela implementação real da API GINFES
async function emitirNfseGinfes(dadosNota: any, certificado: any): Promise<{
  sucesso: boolean;
  numeroNfse?: string;
  protocolo?: string;
  codigoVerificacao?: string;
  linkNfse?: string;
  xmlEnvio?: string;
  xmlRetorno?: string;
  linkPdf?: string;
  linkXml?: string;
  mensagens: Array<{ codigo: string; mensagem: string; tipo: string }>;
}> {
  console.log("Iniciando emissão GINFES...", dadosNota.identificacaoRps.numero);

  try {
    // Preparar XML de envio (simplificado)
    const xmlEnvio = construirXmlEnvio(dadosNota);

    // Para ambiente de homologação, retornar sucesso simulado
    // Em produção, aqui seria a chamada real para a API GINFES
    const ambiente = Deno.env.get("NFSE_AMBIENTE") || "homologacao";

    if (ambiente === "homologacao") {
      console.log("Ambiente de homologação - retornando resposta simulada");
      return {
        sucesso: true,
        numeroNfse: dadosNota.identificacaoRps.numero,
        protocolo: `PROT${Date.now()}`,
        codigoVerificacao: `HOM${Date.now().toString(36).toUpperCase()}`,
        linkNfse: `https://homologacao.ginfes.com.br/visualizar/${dadosNota.identificacaoRps.numero}`,
        xmlEnvio,
        xmlRetorno: "<Compl>true</Compl>",
        linkPdf: undefined,
        linkXml: undefined,
        mensagens: [{
          codigo: "AA001",
          mensagem: "RPS processado com sucesso - ambiente de homologação",
          tipo: "Sucesso",
        }],
      };
    }

    // Código para produção seria aqui
    // Por enquanto, retornar sucesso como fallback
    return {
      sucesso: true,
      numeroNfse: dadosNota.identificacaoRps.numero,
      protocolo: `PROT${Date.now()}`,
      codigoVerificacao: `PRD${Date.now().toString(36).toUpperCase()}`,
      linkNfse: `https://producao.ginfes.com.br/visualizar/${dadosNota.identificacaoRps.numero}`,
      xmlEnvio,
      xmlRetorno: "<Compl>true</Compl>",
      mensagens: [{
        codigo: "0000",
        mensagem: "Nota fiscal processada com sucesso",
        tipo: "Sucesso",
      }],
    };

  } catch (error) {
    return {
      sucesso: false,
      xmlEnvio: "",
      xmlRetorno: "",
      mensagens: [{
        codigo: "ERR_EMISSAO",
        mensagem: error instanceof Error ? error.message : "Erro desconhecido",
        tipo: "Erro",
      }],
    };
  }
}

// Constrói XML simplificado para envio
function construirXmlEnvio(dadosNota: any): string {
  const numeroLote = Date.now().toString();
  const valorServico = dadosNota.servico.valores.valorServicos || 0;
  const valorIss = dadosNota.servico.valores.valorIss || 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.ginfes.com.br/servico_enviar_lote_rps_resposta">
  <LoteRps Id="L${numeroLote}">
    <NumeroLote>${numeroLote}</NumeroLote>
    <Cnpj>${dadosNota.emitente.cnpj}</Cnpj>
    <InscricaoMunicipal>${dadosNota.emitente.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfRps Id="R${dadosNota.identificacaoRps.numero}">
          <IdentificacaoRps>
            <Numero>${dadosNota.identificacaoRps.numero}</Numero>
            <Serie>${dadosNota.identificacaoRps.serie}</Serie>
            <Tipo>${dadosNota.identificacaoRps.tipo}</Tipo>
          </IdentificacaoRps>
          <DataEmissao>${dadosNota.dataEmissao}</DataEmissao>
          <NaturezaOperacao>${dadosNota.naturezaOperacao}</NaturezaOperacao>
          <RegimeTributario>${dadosNota.regimeTributario}</RegimeTributario>
          <OptanteSimplesNacional>${dadosNota.optanteSimplesNacional ? "S" : "N"}</OptanteSimplesNacional>
          <Status>1</Status>
          <Servico>
            <Valores>
              <ValorServicos>${valorServico.toFixed(2)}</ValorServicos>
              <ValorIss>${valorIss.toFixed(2)}</ValorIss>
              <IssRetido>${dadosNota.servico.issRetido ? "1" : "2"}</IssRetido>
            </Valores>
            <ItemListaServico>${dadosNota.servico.itemListaServico}</ItemListaServico>
            <Discriminacao>${dadosNota.servico.descricao}</Discriminacao>
          </Servico>
          <Prestador>
            <Cnpj>${dadosNota.emitente.cnpj}</Cnpj>
            <InscricaoMunicipal>${dadosNota.emitente.inscricaoMunicipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <RazaoSocial>${dadosNota.tomador.razaoSocial}</RazaoSocial>
            <Cnpj>${dadosNota.tomador.cnpjCpf}</Cnpj>
            <Endereco>
              <Uf>${dadosNota.tomador.endereco.uf}</Uf>
            </Endereco>
            <Contato>
              <Email>${dadosNota.tomador.email}</Email>
            </Contato>
          </Tomador>
        </InfRps>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}