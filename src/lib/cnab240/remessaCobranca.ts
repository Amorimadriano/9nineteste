// CNAB 240 - Remessa de Cobrança (FEBRABAN)
// Layout: Header Arquivo + Header Lote + [Segmento P + Segmento Q]* + Trailer Lote + Trailer Arquivo
import { CnabEmpresa, CnabBoleto, BANCOS_CNAB } from "./types";
import { padRight, padLeft, formatDate, formatValue, onlyNumbers, extrairContaEDV } from "./utils";

// Helper para obter conta e DV corretamente
function getContaEDV(empresa: CnabEmpresa) {
  return extrairContaEDV(empresa.conta, empresa.digitoConta);
}

function bc(empresa: CnabEmpresa) {
  const c = empresa.codigoBanco || "077";
  const n = empresa.nomeBanco || BANCOS_CNAB[c] || "BANCO";
  return { c, n };
}

// ─────────────────────────────────────────────────────────────
// HEADER DE ARQUIVO (Registro 0) — 240 posições
// ─────────────────────────────────────────────────────────────
function headerArquivo(empresa: CnabEmpresa, sequencial: number): string {
  const { c, n } = bc(empresa);
  const { conta, dv } = getContaEDV(empresa);
  let l = "";
  l += padLeft(c, 3);                                       //   1-  3  Código Banco
  l += "0000";                                               //   4-  7  Lote de Serviço
  l += "0";                                                  //   8      Tipo de Registro
  l += padRight("", 9);                                      //   9- 17  Brancos
  l += "2";                                                  //  18      Tipo Inscrição (2=CNPJ)
  l += padLeft(onlyNumbers(empresa.cnpj), 14);               //  19- 32  Nº Inscrição (CNPJ)
  l += padRight("", 20);                                     //  33- 52  Código Convênio
  l += padLeft(onlyNumbers(empresa.agencia), 5);             //  53- 57  Agência
  l += padLeft("", 1);                                       //  58      DV Agência
  l += padLeft(conta, 12);                                   //  59- 70  Conta (sem DV)
  l += padLeft(dv, 1);                                       //  71      DV Conta
  l += " ";                                                  //  72      DV Ag/Conta
  l += padRight(empresa.razaoSocial.toUpperCase(), 30);      //  73-102  Nome Empresa
  l += padRight(n.toUpperCase(), 30);                        // 103-132  Nome Banco
  l += padRight("", 10);                                     // 133-142  Brancos
  l += "1";                                                  // 143      Código Remessa (1=Remessa)
  l += formatDate(new Date());                               // 144-151  Data de Geração
  l += padLeft("0", 6);                                      // 152-157  Hora de Geração
  l += padLeft(sequencial.toString(), 6);                    // 158-163  NSA
  l += "107";                                                // 164-166  Nº Versão Layout
  l += padLeft("0", 5);                                      // 167-171  Densidade Gravação
  l += padRight("", 20);                                     //  172-191  Reservado Banco
  l += padRight("", 20);                                     // 192-211  Reservado Empresa
  l += padRight("", 29);                                     // 212-240  Brancos
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// HEADER DE LOTE (Registro 1) — Cobrança — 240 posições
// ─────────────────────────────────────────────────────────────
function headerLote(empresa: CnabEmpresa, sequencial: number): string {
  const { c } = bc(empresa);
  const { conta, dv } = getContaEDV(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "1";                                                  //   8      Tipo de Registro
  l += "R";                                                  //   9      Tipo Operação (R=Remessa)
  l += "01";                                                 //  10- 11  Tipo Serviço (01=Cobrança)
  l += "00";                                                 //  12- 13  Forma Lançamento
  l += "046";                                                //  14- 16  Nº Versão Layout Lote
  l += " ";                                                  //  17      Branco
  l += "2";                                                  //  18      Tipo Inscrição (2=CNPJ)
  l += padLeft(onlyNumbers(empresa.cnpj), 15);               //  19- 33  Nº Inscrição
  l += padRight("", 20);                                     //  34- 53  Código Convênio
  l += padLeft(onlyNumbers(empresa.agencia), 5);             //  54- 58  Agência
  l += padLeft("", 1);                                       //  59      DV Agência
  l += padLeft(conta, 12);                                   //  60- 71  Conta (sem DV)
  l += padLeft(dv, 1);                                       //  72      DV Conta
  l += " ";                                                  //  73      DV Ag/Conta
  l += padRight(empresa.razaoSocial.toUpperCase(), 30);      //  74-103  Nome Empresa
  l += padRight("", 40);                                     // 104-143  Mensagem 1
  l += padRight("", 40);                                     // 144-183  Mensagem 2
  l += padLeft(sequencial.toString(), 8);                    // 184-191  Nº Remessa/Retorno
  l += formatDate(new Date());                               //  192-199  Data Gravação
  l += padLeft("0", 8);                                      // 200-207  Data Crédito
  l += padRight("", 33);                                     // 208-240  Brancos
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// SEGMENTO P (Registro 3) — Dados do Título — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoP(empresa: CnabEmpresa, boleto: CnabBoleto, seq: number): string {
  const { c } = bc(empresa);
  const { conta, dv } = getContaEDV(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial Registro
  l += "P";                                                  //  14      Código Segmento
  l += " ";                                                  //  15      Branco
  l += "01";                                                 //  16- 17  Código de Movimento (01=Entrada)
  l += padLeft(onlyNumbers(empresa.agencia), 5);             //  18- 22  Agência Mantenedora
  l += " ";                                                  //  23      DV Agência
  l += padLeft(conta, 12);                                   //  24- 35  Nº Conta Corrente (sem DV)
  l += padLeft(dv, 1);                                       //  36      DV Conta
  l += " ";                                                  //  37      DV Ag/Conta
  l += padRight("", 9);                                      //  38- 46  ID Título no Banco (uso banco)
  l += padLeft(boleto.nossoNumero, 11);                      //  47- 57  Nosso Número
  l += "1";                                                  //  58      Código Carteira (1=Simples)
  l += "1";                                                  //  59      Forma de Cadastro (1=Com Registro)
  l += "2";                                                  //  60      Tipo de Documento (2=Escritural)
  l += padLeft("0", 2);                                      //  61- 62  ID Emissão do Boleto
  l += padLeft("0", 2);                                      //  63- 64  ID Distribuição
  l += padRight(boleto.nossoNumero, 15);                     //  65- 79  Nº do Documento de Cobrança
  l += formatDate(boleto.dataVencimento);                    //  80- 87  Data de Vencimento
  l += padLeft(formatValue(boleto.valor), 15);               //  88-102  Valor Nominal do Título
  l += padLeft("0", 5);                                      // 103-107  Agência Encarregada Cobrança
  l += " ";                                                  // 108      DV Agência Cobradora
  l += "02";                                                 // 109-110  Espécie do Título (02=DM)
  l += "N";                                                  // 111      Aceite (N=Não)
  l += formatDate(new Date());                               // 112-119  Data de Emissão
  l += "0";                                                  // 120      Código do Juros de Mora (0=Isento)
  l += padLeft("0", 8);                                      // 121-128  Data do Juros de Mora
  l += padLeft("0", 15);                                     // 129-143  Juros de Mora por Dia/Taxa
  l += "0";                                                  // 144      Código do Desconto 1
  l += padLeft("0", 8);                                      // 145-152  Data do Desconto 1
  l += padLeft("0", 15);                                     // 153-167  Valor/Percentual do Desconto 1
  l += padLeft("0", 15);                                     // 168-182  Valor do IOF a Ser Recolhido
  l += padLeft("0", 15);                                     // 183-197  Valor do Abatimento
  l += padRight(boleto.nossoNumero, 25);                     // 198-222  ID do Título na Empresa
  l += "3";                                                  // 223      Código p/ Protesto (3=Não protestar)
  l += padLeft("0", 2);                                      // 224-225  Prazo p/ Protesto
  l += "1";                                                  // 226      Código p/ Baixa/Devolução
  l += padLeft("0", 3);                                      // 227-229  Prazo p/ Baixa/Devolução
  l += "09";                                                 // 230-231  Código da Moeda (09=Real)
  l += padLeft("0", 10);                                     // 232-240  Nº do Contrato (9) + branco (1) → 240 - fica 10 com truncamento
  // Nota: Pos 232-240 = 9 posições. padLeft("0",10) gera 10, substring(0,240) corta a última.
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// SEGMENTO Q (Registro 3) — Dados do Sacado — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoQ(empresa: CnabEmpresa, boleto: CnabBoleto, seq: number): string {
  const { c } = bc(empresa);
  const docNum = onlyNumbers(boleto.sacadoDocumento);
  const cepNum = onlyNumbers(boleto.sacadoCep || "");

  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial
  l += "Q";                                                  //  14      Código Segmento
  l += " ";                                                  //  15      Branco
  l += "01";                                                 //  16- 17  Código de Movimento
  l += docNum.length > 11 ? "2" : "1";                      //  18      Tipo Inscrição Sacado (1 pos)
  l += padLeft(docNum, 15);                                  //  19- 33  Nº Inscrição Sacado (15 pos)
  l += padRight(boleto.sacadoNome.toUpperCase(), 40);        //  34- 73  Nome do Sacado
  l += padRight(boleto.sacadoEndereco || "", 40);            //  74-113  Endereço do Sacado
  l += padRight("", 15);                                     // 114-128  Bairro
  l += padLeft(cepNum.substring(0, 5), 5);                   // 129-133  CEP (5 primeiros)
  l += padLeft(cepNum.substring(5, 8), 3);                   // 134-136  Sufixo CEP (3 últimos)
  l += padRight(boleto.sacadoCidade || "", 15);              // 137-151  Cidade
  l += padRight(boleto.sacadoEstado || "", 2);               // 152-153  UF
  l += "0";                                                  // 154      Tipo Inscrição Sacador/Avalista
  l += padLeft("0", 15);                                     // 155-169  Nº Inscrição Sacador/Avalista
  l += padRight("", 40);                                     // 170-209  Nome Sacador/Avalista
  l += padLeft("0", 3);                                      // 210-212  Cód Banco Correspondente
  l += padRight("", 20);                                     // 213-232  Nosso Nº no Banco Correspondente
  l += padRight("", 8);                                      // 233-240  Brancos
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// TRAILER DE LOTE (Registro 5) — 240 posições
// ─────────────────────────────────────────────────────────────
function trailerLote(empresa: CnabEmpresa, qtdRegistros: number, valorTotal: number): string {
  const { c } = bc(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "5";                                                  //   8      Tipo de Registro
  l += padRight("", 9);                                      //   9- 17  Brancos
  l += padLeft(qtdRegistros.toString(), 6);                  //  18- 23  Qtd Registros no Lote (6 pos)
  l += padLeft(formatValue(valorTotal), 17);                 //  24- 40  Somatória Valores (17 pos)
  l += " ";                                                  //  41      Uso Exclusivo FEBRABAN
  l += padLeft("0", 18);                                     //  42- 59  Somatória Qtd Moedas
  l += padLeft("0", 6);                                      //  60- 65  Nº Aviso de Débito
  l += padRight("", 165);                                    //  66-230  Brancos
  l += padRight("", 10);                                     // 231-240  Cód Ocorrências (retorno)
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// TRAILER DE ARQUIVO (Registro 9) — 240 posições
// ─────────────────────────────────────────────────────────────
function trailerArquivo(empresa: CnabEmpresa, qtdLotes: number, qtdRegistros: number): string {
  const { c } = bc(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "9999";                                               //   4-  7  Lote de Serviço
  l += "9";                                                  //   8      Tipo de Registro
  l += padRight("", 9);                                      //   9- 17  Brancos
  l += padLeft(qtdLotes.toString(), 6);                      //  18- 23  Qtd de Lotes
  l += padLeft(qtdRegistros.toString(), 6);                  //  24- 29  Qtd de Registros
  l += padLeft("0", 6);                                      //  30- 35  Qtd de Contas p/ Conciliação
  l += padRight("", 205);                                    //  36-240  Brancos
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// GERAÇÃO DO ARQUIVO COMPLETO
// ─────────────────────────────────────────────────────────────
export function gerarRemessaCobranca(empresa: CnabEmpresa, boletos: CnabBoleto[], sequencial = 1): string {
  const lines: string[] = [];
  lines.push(headerArquivo(empresa, sequencial));
  lines.push(headerLote(empresa, sequencial));

  let valorTotal = 0;
  let seq = 1;
  for (const boleto of boletos) {
    lines.push(segmentoP(empresa, boleto, seq));
    lines.push(segmentoQ(empresa, boleto, seq));
    valorTotal += boleto.valor;
    seq++;
  }

  // Trailer do lote: header lote (1) + trailer lote (1) + segmentos P+Q (boletos*2)
  const qtdRegistrosLote = 2 + boletos.length * 2;
  lines.push(trailerLote(empresa, qtdRegistrosLote, valorTotal));

  // Trailer do arquivo: contagem total incluindo ele mesmo
  const qtdRegistrosArquivo = lines.length + 1;
  lines.push(trailerArquivo(empresa, 1, qtdRegistrosArquivo));

  return lines.join("\r\n");
}
