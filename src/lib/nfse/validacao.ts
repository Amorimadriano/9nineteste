/**
 * Validações NFSe
 * Valida CNPJ, CPF, campos obrigatórios e regras de negócio
 */

import type { NFSeEmissaoData } from "../../types/nfse";

interface ValidacaoResult {
  valido: boolean;
  erro?: string;
  cnpjLimpo?: string;
}

interface ValidacaoResultCPF {
  valido: boolean;
  erro?: string;
  cpfLimpo?: string;
}

interface ValidacaoCamposResult {
  valido: boolean;
  erros: Array<{
    campo: string;
    mensagem: string;
  }>;
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): ValidacaoResult {
  if (!cnpj) {
    return { valido: false, erro: "CNPJ é obrigatório" };
  }

  // Verifica se é string
  if (typeof cnpj !== "string") {
    return { valido: false, erro: "CNPJ deve ser uma string" };
  }

  // Remove formatação
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  // Verifica tamanho
  if (cnpjLimpo.length !== 14) {
    return { valido: false, erro: "CNPJ deve ter 14 dígitos", cnpjLimpo };
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return { valido: false, erro: "CNPJ inválido (dígitos iguais)", cnpjLimpo };
  }

  // Calcula dígitos verificadores
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return { valido: false, erro: "CNPJ inválido (dígito verificador)", cnpjLimpo };
  }

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return { valido: false, erro: "CNPJ inválido (dígito verificador)", cnpjLimpo };
  }

  return { valido: true, cnpjLimpo };
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const resultado = validarCNPJ(cnpj);
  if (!resultado.valido || !resultado.cnpjLimpo) return "";

  const clean = resultado.cnpjLimpo;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): ValidacaoResultCPF {
  if (!cpf) {
    return { valido: false, erro: "CPF é obrigatório" };
  }

  // Verifica se é string
  if (typeof cpf !== "string") {
    return { valido: false, erro: "CPF deve ser uma string" };
  }

  // Remove formatação
  const cpfLimpo = cpf.replace(/\D/g, "");

  // Verifica tamanho
  if (cpfLimpo.length !== 11) {
    return { valido: false, erro: "CPF deve ter 11 dígitos", cpfLimpo };
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, erro: "CPF inválido (dígitos iguais)", cpfLimpo };
  }

  // Calcula dígitos verificadores
  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) {
    return { valido: false, erro: "CPF inválido (dígito verificador)", cpfLimpo };
  }

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) {
    return { valido: false, erro: "CPF inválido (dígito verificador)", cpfLimpo };
  }

  return { valido: true, cpfLimpo };
}

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  const resultado = validarCPF(cpf);
  if (!resultado.valido || !resultado.cpfLimpo) return "";

  const clean = resultado.cpfLimpo;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

/**
 * Limpa documento (remove formatação)
 */
export function limparDocumento(documento: string): string {
  return documento.replace(/\D/g, "");
}

/**
 * Valida campos obrigatórios
 */
export function validarCamposObrigatorios(data: NFSeEmissaoData): ValidacaoCamposResult {
  const erros: Array<{ campo: string; mensagem: string }> = [];

  // Prestador
  if (!data.prestador?.cnpj) {
    erros.push({ campo: "prestador.cnpj", mensagem: "CNPJ do prestador é obrigatório" });
  } else if (!validarCNPJ(data.prestador.cnpj).valido) {
    erros.push({ campo: "prestador.cnpj", mensagem: "CNPJ do prestador é inválido" });
  }

  if (!data.prestador?.inscricaoMunicipal) {
    erros.push({ campo: "prestador.inscricaoMunicipal", mensagem: "Inscrição municipal do prestador é obrigatória" });
  }

  if (!data.prestador?.razaoSocial) {
    erros.push({ campo: "prestador.razaoSocial", mensagem: "Razão social do prestador é obrigatória" });
  }

  // Tomador
  if (!data.tomador?.cnpj && !data.tomador?.cpf) {
    erros.push({ campo: "tomador.cnpj", mensagem: "CNPJ ou CPF do tomador é obrigatório" });
  }

  if (data.tomador?.cnpj && !validarCNPJ(data.tomador.cnpj).valido) {
    erros.push({ campo: "tomador.cnpj", mensagem: "CNPJ do tomador é inválido" });
  }

  if (data.tomador?.cpf && !validarCPF(data.tomador.cpf).valido) {
    erros.push({ campo: "tomador.cpf", mensagem: "CPF do tomador é inválido" });
  }

  if (!data.tomador?.razaoSocial) {
    erros.push({ campo: "tomador.razaoSocial", mensagem: "Razão social do tomador é obrigatória" });
  }

  // Serviço
  if (!data.servico?.discriminacao) {
    erros.push({ campo: "servico.discriminacao", mensagem: "Discriminação do serviço é obrigatória" });
  }

  if (!data.servico?.itemListaServico) {
    erros.push({ campo: "servico.itemListaServico", mensagem: "Item da lista de serviço é obrigatório" });
  }

  if (!data.servico?.codigoTributacaoMunicipio) {
    erros.push({ campo: "servico.codigoTributacaoMunicipio", mensagem: "Código de tributação municipal é obrigatório" });
  }

  if (!data.servico?.codigoMunicipio) {
    erros.push({ campo: "servico.codigoMunicipio", mensagem: "Código do município é obrigatório" });
  } else if (data.servico.codigoMunicipio.length !== 7) {
    erros.push({ campo: "servico.codigoMunicipio", mensagem: "Código do município deve ter 7 dígitos" });
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Valida valores numéricos
 */
export function validarValores(data: NFSeEmissaoData): ValidacaoCamposResult {
  const erros: Array<{ campo: string; mensagem: string }> = [];

  if (data.servico?.valorServicos <= 0) {
    erros.push({ campo: "servico.valorServicos", mensagem: "Valor dos serviços deve ser maior que zero" });
  }

  if (data.servico?.valorServicos < 0) {
    erros.push({ campo: "servico.valorServicos", mensagem: "Valor dos serviços não pode ser negativo" });
  }

  if (data.servico?.valorDeducoes < 0) {
    erros.push({ campo: "servico.valorDeducoes", mensagem: "Valor das deduções não pode ser negativo" });
  }

  if (data.servico?.aliquota < 0) {
    erros.push({ campo: "servico.aliquota", mensagem: "Alíquota não pode ser negativa" });
  }

  if (data.servico?.aliquota > 100) {
    erros.push({ campo: "servico.aliquota", mensagem: "Alíquota não pode ser maior que 100%" });
  }

  if (data.servico?.valorPis < 0) {
    erros.push({ campo: "servico.valorPis", mensagem: "Valor do PIS não pode ser negativo" });
  }

  if (data.servico?.valorCofins < 0) {
    erros.push({ campo: "servico.valorCofins", mensagem: "Valor do COFINS não pode ser negativo" });
  }

  if (data.servico?.valorInss < 0) {
    erros.push({ campo: "servico.valorInss", mensagem: "Valor do INSS não pode ser negativo" });
  }

  if (data.servico?.valorIr < 0) {
    erros.push({ campo: "servico.valorIr", mensagem: "Valor do IR não pode ser negativo" });
  }

  if (data.servico?.valorCsll < 0) {
    erros.push({ campo: "servico.valorCsll", mensagem: "Valor do CSLL não pode ser negativo" });
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Valida data de competência
 */
export function validarDataCompetencia(data: NFSeEmissaoData): ValidacaoCamposResult {
  const erros: Array<{ campo: string; mensagem: string }> = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Validar competência
  if (data.competencia) {
    const competencia = new Date(data.competencia);
    if (isNaN(competencia.getTime())) {
      erros.push({ campo: "competencia", mensagem: "Data de competência inválida" });
    } else if (competencia > hoje) {
      erros.push({ campo: "competencia", mensagem: "Data de competência não pode ser futura" });
    }
  }

  // Validar data de emissão
  if (data.dataEmissao) {
    const dataEmissao = new Date(data.dataEmissao);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    if (isNaN(dataEmissao.getTime())) {
      erros.push({ campo: "dataEmissao", mensagem: "Data de emissão inválida" });
    } else if (dataEmissao >= amanha) {
      erros.push({ campo: "dataEmissao", mensagem: "Data de emissão não pode ser futura" });
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
