// CNAB 240 - Remessa de Pagamento (FEBRABAN)
// Layout: Header Arquivo + Header Lote + [Segmento A + Segmento B]* + Trailer Lote + Trailer Arquivo
import { CnabEmpresa, CnabPagamento, CnabPagamentoBoleto, CnabPagamentoConvenio, CnabJ52Info, BANCOS_CNAB } from "./types";
import { padRight, padLeft, formatDate, formatHora, formatValue, onlyNumbers, extrairContaEDV } from "./utils";

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
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
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
  l += formatHora(new Date());                               // 152-157  Hora de Geração (HHMMSS)
  l += padLeft(sequencial.toString(), 6);                    // 158-163  NSA
  l += "107";                                                // 164-166  Nº Versão Layout
  l += padLeft("0", 5);                                      // 167-171  Densidade Gravação
  l += padRight("", 20);                                     // 172-191  Reservado Banco
  l += padRight("", 20);                                     // 192-211  Reservado Empresa
  l += padRight("", 29);                                     // 212-240  Brancos
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// HEADER DE LOTE (Registro 1) — Pagamento — 240 posições
// Tipo Operação C (Crédito), Tipo Serviço 20 (Pagamento Fornecedores)
// ─────────────────────────────────────────────────────────────
function headerLote(empresa: CnabEmpresa, sequencial: number): string {
  const { c } = bc(empresa);
  const { conta, dv } = getContaEDV(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "1";                                                  //   8      Tipo de Registro
  l += "C";                                                  //   9      Tipo Operação (C=Crédito)
  l += "20";                                                 //  10- 11  Tipo Serviço (20=Pagto Fornecedores)
  l += "41";                                                 //  12- 13  Forma Lançamento (41=TED)
  l += "046";                                                //  14- 16  Nº Versão Layout Lote
  l += " ";                                                  //  17      Branco
  l += "2";                                                  //  18      Tipo Inscrição (2=CNPJ)
  l += padLeft(onlyNumbers(empresa.cnpj), 14);               //  19- 32  Nº Inscrição
  l += padRight("", 20);                                     //  34- 53  Código Convênio
  l += padLeft(onlyNumbers(empresa.agencia), 5);             //  54- 58  Agência
  l += padLeft("", 1);                                       //  59      DV Agência
  l += padLeft(conta, 12);                                   //  60- 71  Conta (sem DV)
  l += padLeft(dv, 1);                                       //  72      DV Conta
  l += " ";                                                  //  73      DV Ag/Conta
  l += padRight(empresa.razaoSocial.toUpperCase(), 30);      //  74-103  Nome Empresa
  l += padRight("", 40);                                     // 104-143  Informação genérica opcional
  l += padRight(empresa.endereco || "", 30);                 // 144-173  Endereço Empresa
  l += padLeft(empresa.numero || "", 5);                       // 174-178  Número
  l += padRight(empresa.complemento || "", 15);                // 179-193  Complemento
  l += padRight(empresa.cidade || "", 20);                   // 194-213  Cidade
  const cepLimpo = onlyNumbers(empresa.cep || "");
  l += padLeft(cepLimpo.substring(0, 5), 5);                // 214-218  CEP (5 primeiros)
  l += padLeft(cepLimpo.substring(5, 8), 3);                  // 219-221  Complemento CEP (3 últimos)
  l += padRight(empresa.estado || "", 2);                    // 222-223  Estado
  l += padRight("", 8);                                      // 224-231  Brancos
  l += padRight("", 10);                                     // 232-240  Ocorrências (retorno)
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// SEGMENTO A (Registro 3) — Dados do Pagamento — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoA(empresa: CnabEmpresa, pag: CnabPagamento, seq: number): string {
  const { c } = bc(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial
  l += "A";                                                  //  14      Código Segmento
  l += "0";                                                  //  15      Tipo Movimento (0=Inclusão)
  l += "00";                                                 //  16- 17  Código Instrução (00=Inclusão)
  l += "000";                                                //  18- 20  Câmara de Compensação
  l += padLeft(onlyNumbers(pag.bancoDestino), 3);            //  21- 23  Banco Favorecido
  l += padLeft(onlyNumbers(pag.agenciaDestino), 5);          //  24- 28  Agência Favorecido
  l += " ";                                                  //  29      DV Agência
  l += padLeft(onlyNumbers(pag.contaDestino), 12);           //  30- 41  Conta Favorecido
  l += padLeft(pag.digitoContaDestino || "", 1);             //  42      DV Conta
  l += " ";                                                  //  43      DV Ag/Conta
  l += padRight(pag.favorecidoNome.toUpperCase(), 30);       //  44- 73  Nome Favorecido
  l += padRight("", 20);                                     //  74- 93  Nº Doc Atribuído pela Empresa
  l += formatDate(pag.dataVencimento);                       //  94-101  Data do Pagamento
  l += "BRL";                                                // 102-104  Tipo Moeda
  l += padLeft("0", 15);                                     // 105-119  Quantidade de Moeda
  l += padLeft(formatValue(pag.valor), 15);                  // 120-134  Valor do Pagamento
  l += padRight("", 20);                                     // 135-154  Nº Doc Atribuído pelo Banco
  l += padLeft("0", 8);                                      // 155-162  Data Real da Efetivação
  l += padLeft("0", 15);                                     // 163-177  Valor Real da Efetivação
  l += padRight("", 18);                                     // 178-195  Brancos (posições de identificação Pix)
  l += padRight(pag.favorecidoIspb || "", 8);                 // 196-203  Código ISPB (para Pix)
  l += "01";                                                 // 204-205  Tipo de Conta: 01=CC, 02=Pagamento, 03=Poupança
  l += padRight("", 14);                                     // 206-219  Brancos
  l += padLeft(pag.finalidadeTed || "", 5);                   // 220-224  Código Finalidade TED: 00004=Salários, 00005=Fornecedores, 00010=Crédito em Conta
  l += padRight("", 6);                                      // 225-230  Brancos
  l += padRight("", 10);                                     // 231-240  Ocorrências (retorno)
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// SEGMENTO B (Registro 3) — Dados Complementares — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoB(empresa: CnabEmpresa, pag: CnabPagamento, seq: number): string {
  const { c } = bc(empresa);
  const docNum = onlyNumbers(pag.favorecidoDocumento);
  const cepNum = onlyNumbers(pag.favorecidoCep || "");

  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial
  l += "B";                                                  //  14      Código Segmento
  l += padRight("", 3);                                      //  15- 17  Brancos
  l += docNum.length > 11 ? "2" : "1";                      //  18      Tipo Inscrição (1=CPF, 2=CNPJ)
  l += padLeft(docNum, 14);                                  //  19- 32  Nº Inscrição (CPF/CNPJ)
  l += padRight(pag.favorecidoEndereco || "", 35);          //  33- 67  Logradouro
  l += padRight(pag.favorecidoNumero || "", 5);               //  68- 72  Número
  l += padRight(pag.favorecidoComplemento || "", 15);       //  73- 87  Complemento
  l += padRight(pag.favorecidoBairro || "", 15);            //  88-102  Bairro
  l += padRight(pag.favorecidoCidade || "", 15);            // 103-117  Cidade
  l += padLeft(cepNum.substring(0, 8), 8);                  // 118-125  CEP (8 posições)
  l += padRight(pag.favorecidoEstado || "", 2);               // 126-127  Estado
  l += padRight("", 105);                                    // 128-232  Brancos
  l += padLeft(onlyNumbers(pag.favorecidoIspb || ""), 8);     // 233-240  Código ISPB
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
  l += padLeft(qtdRegistros.toString(), 6);                  //  18- 23  Qtd Registros Lote
  l += padLeft(formatValue(valorTotal), 18);                 //  24- 41  Somatória Valores
  l += padLeft("0", 18);                                     //  42- 59  Somatória Qtd Moedas
  l += padLeft("0", 6);                                      //  60- 65  Nº Aviso de Débito
  l += padRight("", 165);                                    //  66-230  Brancos
  l += padRight("", 10);                                     // 231-240  Ocorrências
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
// SEGMENTO J (Registro 3) — Pagamento de Cobranças (Boleto) — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoJ(empresa: CnabEmpresa, boleto: CnabPagamentoBoleto, seq: number): string {
  const { c } = bc(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial
  l += "J";                                                  //  14      Código Segmento
  l += "0";                                                  //  15      Tipo Movimento (0=Inclusão)
  l += "00";                                                 //  16- 17  Código Instrução (00=Inclusão)
  l += padRight(onlyNumbers(boleto.codigoBarras), 44);       //  18- 61  Código de Barras
  l += padRight(boleto.nomeBeneficiario.substring(0, 30).toUpperCase(), 30); //  62- 91  Nome do Beneficiário
  l += formatDate(boleto.dataVencimento);                   //  92- 99  Data de Vencimento
  l += padLeft(formatValue(boleto.valorNominal), 15);         // 100-114  Valor Nominal
  l += padLeft(formatValue(boleto.valorDescontoAbatimento || 0), 15); // 115-129  Valor Desconto + Abatimento
  l += padLeft(formatValue(boleto.valorMoraMulta || 0), 15);  // 130-144  Valor Mora + Multa
  l += formatDate(boleto.dataPagamento);                      // 145-152  Data do Pagamento
  l += padLeft(formatValue(boleto.valorPagamento), 15);       // 153-167  Valor do Pagamento
  l += padLeft("0", 15);                                      // 168-182  Quantidade da Moeda
  l += padLeft(boleto.numeroDocumentoEmpresa || "", 20);       // 183-202  Nº Documento Empresa
  l += padLeft(boleto.nossoNumero || "", 20);                  // 203-222  Nosso Número
  l += padRight("", 8);                                       // 223-230  Brancos
  l += padRight("", 10);                                      // 231-240  Ocorrências (retorno)
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// SEGMENTO J-52 (Registro 3) — Dados do Pagador/Beneficiário — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoJ52(empresa: CnabEmpresa, info: CnabJ52Info, seq: number): string {
  const { c } = bc(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial
  l += "J";                                                  //  14      Código Segmento
  l += " ";                                                  //  15      Branco
  l += "00";                                                 //  16- 17  Código Instrução
  l += "52";                                                 //  18- 19  Identificação Registro Opcional (52)
  l += info.tipoInscricaoPagador;                           //  20      Tipo Inscrição Pagador
  l += padLeft(onlyNumbers(info.documentoPagador), 15);       //  21- 35  Nº Inscrição Pagador
  l += padRight(info.nomePagador.substring(0, 40).toUpperCase(), 40); //  36- 75  Nome do Pagador
  l += info.tipoInscricaoBeneficiario;                      //  76      Tipo Inscrição Beneficiário
  l += padLeft(onlyNumbers(info.documentoBeneficiario), 15); //  77- 91  Nº Inscrição Beneficiário
  l += padRight(info.nomeBeneficiario.substring(0, 40).toUpperCase(), 40); //  92-131  Nome do Beneficiário
  l += padRight("", 56);                                      // 132-187  Brancos
  l += padRight(info.numeroDocumento || "", 53);              // 188-240  Nº Documento Atribuído Empresa
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// SEGMENTO O (Registro 3) — Pagamento de Convênios/Tributos — 240 posições
// ─────────────────────────────────────────────────────────────
function segmentoO(empresa: CnabEmpresa, convenio: CnabPagamentoConvenio, seq: number): string {
  const { c } = bc(empresa);
  let l = "";
  l += padLeft(c, 3);                                        //   1-  3  Código Banco
  l += "0001";                                               //   4-  7  Lote de Serviço
  l += "3";                                                  //   8      Tipo de Registro
  l += padLeft(seq.toString(), 5);                           //   9- 13  Nº Sequencial
  l += "O";                                                  //  14      Código Segmento
  l += "0";                                                  //  15      Tipo Movimento (0=Inclusão)
  l += "00";                                                 //  16- 17  Código Instrução (00=Inclusão)
  l += padRight(onlyNumbers(convenio.codigoBarras), 44);      //  18- 61  Código de Barras
  l += padRight(convenio.nomeConcessionaria.substring(0, 30).toUpperCase(), 30); //  62- 91  Nome da Concessionária
  l += formatDate(convenio.dataVencimento);                   //  92- 99  Data de Vencimento
  l += formatDate(convenio.dataPagamento);                    // 100-107  Data do Pagamento
  l += padLeft(formatValue(convenio.valorPagamento), 15);     // 108-122  Valor do Pagamento
  l += padRight(convenio.seuNumero || "", 20);                // 123-142  Seu Número
  l += padLeft(convenio.nossoNumero || "", 20);                // 143-162  Nosso Número
  l += padRight("", 68);                                      // 163-230  Brancos
  l += padRight("", 10);                                      // 231-240  Ocorrências (retorno)
  return l.substring(0, 240);
}

// ─────────────────────────────────────────────────────────────
// GERAÇÃO DO ARQUIVO COMPLETO - TED
// ─────────────────────────────────────────────────────────────
export function gerarRemessaPagamento(empresa: CnabEmpresa, pagamentos: CnabPagamento[], sequencial = 1): string {
  const lines: string[] = [];
  lines.push(headerArquivo(empresa, sequencial));
  lines.push(headerLote(empresa, sequencial));

  let valorTotal = 0;
  let seq = 1;
  for (const pag of pagamentos) {
    lines.push(segmentoA(empresa, pag, seq));
    lines.push(segmentoB(empresa, pag, seq));
    valorTotal += pag.valor;
    seq++;
  }

  const qtdRegistrosLote = 2 + pagamentos.length * 2;
  lines.push(trailerLote(empresa, qtdRegistrosLote, valorTotal));

  const qtdRegistrosArquivo = lines.length + 1;
  lines.push(trailerArquivo(empresa, 1, qtdRegistrosArquivo));

  return lines.join("\r\n");
}

// ─────────────────────────────────────────────────────────────
// GERAÇÃO DO ARQUIVO - Pagamento de Boletos (Segmento J)
// ─────────────────────────────────────────────────────────────
export function gerarRemessaBoleto(empresa: CnabEmpresa, boletos: CnabPagamentoBoleto[], info52?: CnabJ52Info[], sequencial = 1): string {
  const lines: string[] = [];
  lines.push(headerArquivo(empresa, sequencial));
  lines.push(headerLote(empresa, sequencial));

  let valorTotal = 0;
  let seq = 1;
  for (let i = 0; i < boletos.length; i++) {
    lines.push(segmentoJ(empresa, boletos[i], seq));
    seq++;
    // Se houver informações J52 para este boleto
    if (info52 && info52[i]) {
      lines.push(segmentoJ52(empresa, info52[i], seq));
      seq++;
    }
    valorTotal += boletos[i].valorPagamento;
  }

  // Trailer: header + trailer + segmentos J + segmentos J52 (se houver)
  const qtdJ52 = info52 ? info52.length : 0;
  const qtdRegistrosLote = 2 + boletos.length + qtdJ52;
  lines.push(trailerLote(empresa, qtdRegistrosLote, valorTotal));

  const qtdRegistrosArquivo = lines.length + 1;
  lines.push(trailerArquivo(empresa, 1, qtdRegistrosArquivo));

  return lines.join("\r\n");
}

// ─────────────────────────────────────────────────────────────
// GERAÇÃO DO ARQUIVO - Pagamento de Convênios (Segmento O)
// ─────────────────────────────────────────────────────────────
export function gerarRemessaConvenio(empresa: CnabEmpresa, convenios: CnabPagamentoConvenio[], sequencial = 1): string {
  const lines: string[] = [];
  lines.push(headerArquivo(empresa, sequencial));
  lines.push(headerLote(empresa, sequencial));

  let valorTotal = 0;
  let seq = 1;
  for (const conv of convenios) {
    lines.push(segmentoO(empresa, conv, seq));
    valorTotal += conv.valorPagamento;
    seq++;
  }

  const qtdRegistrosLote = 2 + convenios.length;
  lines.push(trailerLote(empresa, qtdRegistrosLote, valorTotal));

  const qtdRegistrosArquivo = lines.length + 1;
  lines.push(trailerArquivo(empresa, 1, qtdRegistrosArquivo));

  return lines.join("\r\n");
}
