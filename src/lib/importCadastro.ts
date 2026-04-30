import { isValidCPF, isValidCNPJ } from "./nfse-utils";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

// ============================================
// MAPEAMENTO FLEXÍVEL DE COLUNAS
// ============================================

export const COLUMN_KEYWORDS: Record<string, string[]> = {
  nome: ["nome", "razao social", "razaosocial", "razão social", "cliente", "fornecedor", "beneficiario", "beneficiário", "cedente", "pagador", "sacado", "nome principal", "nome fantasia", "nome_fantasia"],
  documento: ["documento", "cpf/cnpj", "cpf cnpj", "cnpj", "cpf", "cnpj/cpf", "cnpj cpf", "document", "doc", "cgc", "inscricao", "inscrição"],
  email: ["email", "e-mail", "mail", "correio eletronico", "correio eletrônico"],
  telefone: ["telefone", "tel", "fone", "celular", "mobile", "phone", "whatsapp", "contato"],
  endereco: ["endereco", "endereço", "logradouro", "rua", "avenida", "av.", "street", "address", "end"],
  numero: ["numero", "número", "num", "nº", "no", "nr"],
  complemento: ["complemento", "compl", "comp", "apto", "apartamento", "sala", "bloco", "andar"],
  bairro: ["bairro", "bairros", "neighborhood", "district"],
  cidade: ["cidade", "municipio", "município", "city", "localidade"],
  estado: ["estado", "uf", "state", "provincia", "província"],
  cep: ["cep", "codigo postal", "código postal", "zip", "zipcode", "postal code"],
  cnae: ["cnae", "cnae principal", "atividade principal", "codigo atividade", "código atividade"],
  natureza_juridica: ["natureza juridica", "natureza jurídica", "natureza", "tipo empresa", "tipo de empresa"],
  observacoes: ["observacoes", "observações", "obs", "observacao", "observação", "notas", "notes", "comentarios", "comentários"],
};

// ============================================
// FUNÇÕES DE NORMALIZAÇÃO
// ============================================

export function normalizarColuna(col: string): string {
  return col
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function mapearColunas(cabecalhos: string[]): Record<string, string> {
  const mapeamento: Record<string, string> = {};

  for (const col of cabecalhos) {
    const colNorm = normalizarColuna(col);
    for (const [campo, keywords] of Object.entries(COLUMN_KEYWORDS)) {
      if (mapeamento[campo]) continue; // já mapeado
      for (const kw of keywords) {
        const kwNorm = normalizarColuna(kw);
        if (colNorm === kwNorm || colNorm.includes(kwNorm) || kwNorm.includes(colNorm)) {
          mapeamento[campo] = col;
          break;
        }
      }
    }
  }

  return mapeamento;
}

export function limparDocumento(doc: string): string {
  return doc.replace(/\D/g, "").trim();
}

export function limparCep(cep: string): string {
  return cep.replace(/\D/g, "").trim().slice(0, 8);
}

export function validarDocumento(doc: string): { valido: boolean; tipo: "CPF" | "CNPJ" | null; limpo: string } {
  const limpo = limparDocumento(doc);
  if (limpo.length === 11 && isValidCPF(limpo)) {
    return { valido: true, tipo: "CPF", limpo };
  }
  if (limpo.length === 14 && isValidCNPJ(limpo)) {
    return { valido: true, tipo: "CNPJ", limpo };
  }
  return { valido: false, tipo: null, limpo };
}

// ============================================
// BUSCA DE CEP (ViaCEP)
// ============================================

export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
  erro?: boolean;
}

const cacheCep = new Map<string, EnderecoViaCep>();

export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
  const clean = limparCep(cep);
  if (clean.length !== 8) return null;

  if (cacheCep.has(clean)) return cacheCep.get(clean)!;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    const endereco: EnderecoViaCep = {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
      complemento: data.complemento || "",
    };

    cacheCep.set(clean, endereco);
    return endereco;
  } catch {
    return null;
  }
}

// ============================================
// TIPOS DE ERRO E RESULTADO
// ============================================

export interface ErroImportacao {
  linha: number;
  campo: string;
  valor: string;
  motivo: string;
}

export interface ResultadoImportacao {
  importados: number;
  atualizados: number;
  ignorados: number;
  erros: ErroImportacao[];
}

// ============================================
// GARANTIR SESSÃO ATIVA
// ============================================

async function garantirSessaoAtiva(userId: string): Promise<{ ok: boolean; erro?: string }> {
  // 1. Tenta obter a sessão atual
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError && sessionData.session && sessionData.session.user.id === userId) {
    return { ok: true };
  }

  // 2. Se não houver sessão ou o token expirou, tenta refresh
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshData.session) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  if (refreshData.session.user.id !== userId) {
    return { ok: false, erro: "ID do usuário não confere com a sessão ativa." };
  }

  return { ok: true };
}

function traduzirErroSupabase(error: any): string {
  const msg = error?.message || "";
  if (msg.includes("row-level security") || msg.includes("violates row-level security")) {
    return "Erro de permissão (RLS): verifique se está logado e se o usuário tem acesso a esta empresa.";
  }
  if (msg.includes("foreign key constraint")) {
    return "Erro de integridade: empresa ou vínculo inválido.";
  }
  if (msg.includes("unique constraint") || msg.includes("duplicate key")) {
    return "Registro duplicado detectado no banco de dados.";
  }
  return msg;
}

// ============================================
// FUNÇÃO PRINCIPAL DE IMPORTAÇÃO
// ============================================

export interface ImportOptions {
  tabela: "clientes" | "fornecedores";
  userId: string;
  empresaId?: string | null;
  session?: Session | null;
  rows: any[];
  existingData: any[];
}

export async function processarImportacao(options: ImportOptions): Promise<ResultadoImportacao> {
  const { tabela, userId, empresaId, session, rows, existingData } = options;

  const resultado: ResultadoImportacao = {
    importados: 0,
    atualizados: 0,
    ignorados: 0,
    erros: [],
  };

  if (rows.length === 0) return resultado;

  // ─── GARANTIR AUTENTICAÇÃO ───
  // Se temos a sessão do contexto, forçamos o client a usá-la explicitamente
  if (session?.access_token) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }

  // Testa se a sessão está realmente válida fazendo um select mínimo na própria tabela
  const { error: testError } = await (supabase.from(tabela) as any)
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (testError) {
    resultado.erros.push({
      linha: 0,
      campo: "autenticacao",
      valor: "",
      motivo: traduzirErroSupabase(testError),
    });
    return resultado;
  }

  // Cria mapeamento a partir do primeiro row (usa as chaves do objeto como cabeçalhos)
  const cabecalhos = Object.keys(rows[0]);
  const mapeamento = mapearColunas(cabecalhos);

  // Indexa registros existentes por documento limpo
  const existingByDoc = new Map<string, any>();
  for (const item of existingData) {
    const docClean = item.documento ? limparDocumento(item.documento) : "";
    if (docClean) existingByDoc.set(docClean, item);
  }

  const toInsert: any[] = [];
  const toUpdate: { id: string; data: any }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const linhaNum = i + 2; // +2 porque linha 1 é cabeçalho

    // Extrai dados do row baseado no mapeamento
    const record: any = {};
    for (const [campo, colNome] of Object.entries(mapeamento)) {
      const val = row[colNome];
      if (val !== undefined && val !== null && val !== "") {
        record[campo] = String(val).trim();
      }
    }

    // ─── NOME ───
    if (!record.nome) {
      resultado.erros.push({ linha: linhaNum, campo: "nome", valor: "", motivo: "Nome/Razão Social é obrigatório" });
      resultado.ignorados++;
      continue;
    }

    // ─── DOCUMENTO ───
    let docClean = "";
    if (record.documento) {
      const validacao = validarDocumento(record.documento);
      docClean = validacao.limpo;
      if (!validacao.valido) {
        resultado.erros.push({
          linha: linhaNum,
          campo: "documento",
          valor: record.documento,
          motivo: `CPF/CNPJ inválido (${validacao.limpo.length} dígitos)`,
        });
        resultado.ignorados++;
        continue;
      }
      record.documento = docClean;
    } else {
      resultado.erros.push({
        linha: linhaNum,
        campo: "documento",
        valor: "",
        motivo: "CPF/CNPJ é obrigatório",
      });
      resultado.ignorados++;
      continue;
    }

    // ─── CEP (busca ViaCEP se necessário) ───
    if (record.cep) {
      record.cep = limparCep(record.cep);
    }

    const precisaBuscarCep = record.cep &&
      (!record.endereco || !record.bairro || !record.cidade || !record.estado);

    if (precisaBuscarCep) {
      const endereco = await buscarEnderecoPorCep(record.cep);
      if (endereco) {
        if (!record.endereco && endereco.logradouro) record.endereco = endereco.logradouro;
        if (!record.bairro && endereco.bairro) record.bairro = endereco.bairro;
        if (!record.cidade && endereco.localidade) record.cidade = endereco.localidade;
        if (!record.estado && endereco.uf) record.estado = endereco.uf;
        if (!record.complemento && endereco.complemento) record.complemento = endereco.complemento;
      }
    }

    // ─── PREPARA PAYLOAD ───
    const payload: any = {
      ...record,
      user_id: userId,
    };
    if (empresaId) payload.empresa_id = empresaId;

    // ─── UPSERT ───
    const existing = existingByDoc.get(docClean);
    if (existing) {
      toUpdate.push({ id: existing.id, data: payload });
    } else {
      toInsert.push(payload);
      existingByDoc.set(docClean, { id: "pending", documento: docClean }); // previne duplicidade no mesmo lote
    }
  }

  // ─── EXECUTA INSERÇÕES ───
  if (toInsert.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const { error } = await (supabase.from(tabela) as any).insert(chunk);
      if (error) {
        // Se der erro em lote, tenta um a um para identificar qual falhou
        for (const item of chunk) {
          const { error: singleError } = await (supabase.from(tabela) as any).insert(item);
          if (singleError) {
            resultado.erros.push({
              linha: 0,
              campo: "insercao",
              valor: item.documento || "",
              motivo: traduzirErroSupabase(singleError),
            });
            resultado.ignorados++;
          } else {
            resultado.importados++;
          }
        }
      } else {
        resultado.importados += chunk.length;
      }
    }
  }

  // ─── EXECUTA ATUALIZAÇÕES ───
  for (const item of toUpdate) {
    const { error } = await (supabase.from(tabela) as any)
      .update(item.data)
      .eq("id", item.id);
    if (error) {
      resultado.erros.push({
        linha: 0,
        campo: "atualizacao",
        valor: item.data.documento || "",
        motivo: traduzirErroSupabase(error),
      });
      resultado.ignorados++;
    } else {
      resultado.atualizados++;
    }
  }

  return resultado;
}
