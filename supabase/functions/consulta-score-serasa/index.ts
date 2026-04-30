const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
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

/**
 * Edge Function para consulta de Score de Crédito na Serasa Experian
 *
 * Documentação API Serasa:
 * https://developer.serasa.com.br/
 *
 * Endpoints disponíveis:
 * - Score Empresas (Pessoa Jurídica)
 * - Score Pessoas (Pessoa Física)
 * - Dados Cadastrais
 * - Análise de Crédito Completa
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ConsultaScoreRequest {
  documento: string; // CPF ou CNPJ
  tipo: "pf" | "pj";
  // Opcional: filtros adicionais
  incluirDadosCadastrais?: boolean;
  incluirAnaliseCredito?: boolean;
}

interface ConsultaScoreResponse {
  sucesso: boolean;
  documento?: string;
  tipo?: "pf" | "pj";
  score?: number;
  classificacao?: string;
  risco?: "baixo" | "medio" | "alto" | "muito_alto";
  probabilidadeInadimplencia?: number;
  dadosCadastrais?: {
    nome?: string;
    nomeFantasia?: string;
    situacao?: string;
    dataSituacao?: string;
  };
  mensagem?: string;
  erro?: string;
}

// CORS headers

// Configurações da API Serasa (devem ser configuradas via variáveis de ambiente)
const SERASA_API_URL = Deno.env.get("SERASA_API_URL") || "https://api.serasa.com.br";
const SERASA_CLIENT_ID = Deno.env.get("SERASA_CLIENT_ID");
const SERASA_CLIENT_SECRET = Deno.env.get("SERASA_CLIENT_SECRET");

/**
 * Obtém token de acesso OAuth2 da Serasa
 */
async function obterTokenSerasa(): Promise<string | null> {
  try {
    const response = await fetch(`${SERASA_API_URL}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SERASA_CLIENT_ID || "",
        client_secret: SERASA_CLIENT_SECRET || "",
      }),
    });

    if (!response.ok) {
      console.error("Erro ao obter token Serasa:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erro na requisição de token:", error);
    return null;
  }
}

/**
 * Consulta score na API Serasa
 */
async function consultarScoreSerasa(
  documento: string,
  tipo: "pf" | "pj",
  token: string
): Promise<ConsultaScoreResponse | null> {
  try {
    // Endpoint varia conforme tipo de documento
    const endpoint = tipo === "pj"
      ? `${SERASA_API_URL}/v1/score/empresas/${documento}`
      : `${SERASA_API_URL}/v1/score/pessoas/${documento}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Subscription-Key": SERASA_CLIENT_ID || "",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          sucesso: false,
          erro: "Documento não encontrado na base Serasa",
        };
      }
      if (response.status === 401) {
        return {
          sucesso: false,
          erro: "Credenciais inválidas. Verifique as configurações.",
        };
      }
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    // Normaliza resposta da API
    return {
      sucesso: true,
      documento,
      tipo,
      score: data.score || data.scoreEmpresas?.score,
      classificacao: data.classificacao || data.scoreEmpresas?.classificacaoRisco,
      risco: data.risco,
      probabilidadeInadimplencia: data.probabilidadeInadimplencia,
      dadosCadastrais: {
        nome: data.nome || data.razaoSocial,
        nomeFantasia: data.nomeFantasia,
        situacao: data.situacaoCadastral,
        dataSituacao: data.dataSituacaoCadastral,
      },
    };
  } catch (error) {
    console.error("Erro na consulta Serasa:", error);
    return {
      sucesso: false,
      erro: "Erro ao consultar Serasa. Tente novamente mais tarde.",
    };
  }
}

/**
 * Simula resposta da Serasa para testes (quando não há credenciais)
 */
function simularConsultaSerasa(
  documento: string,
  tipo: "pf" | "pj"
): ConsultaScoreResponse {
  // Gera score pseudo-aleatório baseado no documento (consistente para o mesmo doc)
  const hash = documento.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = 300 + (hash % 700); // Score entre 300 e 1000

  let classificacao: string;
  let risco: "baixo" | "medio" | "alto" | "muito_alto";

  if (score >= 800) {
    classificacao = "AAA";
    risco = "baixo";
  } else if (score >= 600) {
    classificacao = "AA";
    risco = "baixo";
  } else if (score >= 500) {
    classificacao = "A";
    risco = "medio";
  } else if (score >= 400) {
    classificacao = "B";
    risco = "alto";
  } else {
    classificacao = "C";
    risco = "muito_alto";
  }

  return {
    sucesso: true,
    documento,
    tipo,
    score,
    classificacao,
    risco,
    probabilidadeInadimplencia: Math.round((1000 - score) / 10),
    dadosCadastrais: {
      nome: tipo === "pj" ? "EMPRESA DEMONSTRACAO LTDA" : "PESSOA DEMONSTRACAO",
      nomeFantasia: tipo === "pj" ? "DEMONSTRACAO" : undefined,
      situacao: "ATIVA",
    },
    mensagem: "⚠️ MODO SIMULAÇÃO: Configure as credenciais da Serasa para consultas reais",
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(req);
  return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ConsultaScoreRequest = await req.json();
    const { documento, tipo, incluirDadosCadastrais, incluirAnaliseCredito } = body;

    // Validações
    if (!documento) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "Documento não informado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const docLimpo = documento.replace(/\D/g, "");

    if (tipo === "pj" && docLimpo.length !== 14) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "CNPJ inválido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (tipo === "pf" && docLimpo.length !== 11) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "CPF inválido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verifica se tem credenciais configuradas
    if (!SERASA_CLIENT_ID || !SERASA_CLIENT_SECRET) {
      console.log("Credenciais Serasa não configuradas. Usando modo simulação.");

      const resultadoSimulado = simularConsultaSerasa(docLimpo, tipo);

      return new Response(
        JSON.stringify(resultadoSimulado),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Obtém token OAuth2
    const token = await obterTokenSerasa();

    if (!token) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "Não foi possível autenticar na API Serasa. Verifique as credenciais.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Realiza consulta
    const resultado = await consultarScoreSerasa(docLimpo, tipo, token);

    return new Response(
      JSON.stringify(resultado),
      {
        status: resultado?.sucesso ? 200 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Erro na requisição:", error);
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: "Erro interno do servidor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
