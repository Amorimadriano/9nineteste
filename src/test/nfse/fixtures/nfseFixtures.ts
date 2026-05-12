/**
 * Fixtures para testes de integração NFS-e (API Paulistana)
 * XMLs de resposta seguem layout API Paulistana (Prefeitura de São Paulo)
 */

import type { NFSeEmissaoData, CertificadoDigital } from "../../../types/nfse";

export const dadosNotaFiscalValida: NFSeEmissaoData = {
  numero: 1,
  serie: "1",
  tipo: "1",
  naturezaOperacao: "1",
  optanteSimplesNacional: 1,
  incentivadorCultural: 2,
  status: "1",
  dataEmissao: "2024-01-15T10:00:00",
  competencia: "2024-01-15",
  prestador: {
    cnpj: "12345678000195",
    inscricaoMunicipal: "123456",
    razaoSocial: "Empresa Teste LTDA",
    nomeFantasia: "Empresa Teste",
    endereco: {
      logradouro: "Rua Teste",
      numero: "100",
      complemento: "Sala 1",
      bairro: "Centro",
      codigoMunicipio: "3550308",
      uf: "SP",
      cep: "01001000",
    },
    contato: {
      telefone: "1133334444",
      email: "teste@empresa.com",
    },
  },
  tomador: {
    cnpj: "98765432000198",
    inscricaoMunicipal: "654321",
    razaoSocial: "Tomador Teste LTDA",
    endereco: {
      logradouro: "Av Teste",
      numero: "200",
      complemento: "Andar 2",
      bairro: "Jardins",
      codigoMunicipio: "3550308",
      uf: "SP",
      cep: "01415001",
    },
    contato: {
      telefone: "1155556666",
      email: "tomador@cliente.com",
    },
  },
  servico: {
    valorServicos: 1000.0,
    valorDeducoes: 100.0,
    valorPis: 6.5,
    valorCofins: 3.0,
    valorInss: 11.0,
    valorIr: 1.5,
    valorCsll: 1.0,
    issRetido: 1,
    valorIss: 50.0,
    valorIssRetido: 50.0,
    outrasRetencoes: 0.0,
    baseCalculo: 900.0,
    aliquota: 5.0,
    valorLiquidoNfse: 827.0,
    valorDescontoIncondicionado: 0.0,
    valorDescontoCondicionado: 0.0,
    itemListaServico: "14.01",
    codigoCnae: "6203100",
    codigoTributacaoMunicipio: "620310000",
    discriminacao: "Desenvolvimento de software",
    codigoMunicipio: "3550308",
    exigibilidadeISS: 1,
    municipioIncidencia: "3550308",
  },
  construcaoCivil: undefined,
  intermediario: undefined,
  condicoesPagamento: {
    tipo: "A_VISTA",
    prazo: 0,
    parcelas: 1,
  },
};

export const dadosNotaFiscalCPF: NFSeEmissaoData = {
  ...dadosNotaFiscalValida,
  tomador: {
    cpf: "52998224725",
    razaoSocial: "Joao da Silva",
    endereco: {
      logradouro: "Rua Teste",
      numero: "50",
      bairro: "Centro",
      codigoMunicipio: "3550308",
      uf: "SP",
      cep: "01001000",
    },
    contato: {
      telefone: "11999999999",
      email: "joao@email.com",
    },
  },
};

/**
 * XML de resposta de autorização bem-sucedida (API Paulistana)
 * Inclui envelope SOAP 1.1 e return com CDATA
 */
export const xmlRespostaAutorizacao = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:EnvioLoteRPSResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<EnvioLoteRPSResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Protocolo>PROT123456789</Protocolo>
  <ListaMensagemRetorno/>
</EnvioLoteRPSResposta>]]></return>
    </ns2:EnvioLoteRPSResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta com NFSe já processada (consulta após emissão)
 */
export const xmlRespostaAutorizacaoComNfse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:EnvioLoteRPSResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<ConsultarNFeResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <ListaNfse>
    <CompNfse>
      <Nfse>
        <InfNfse>
          <Numero>12345</Numero>
          <CodigoVerificacao>A1B2C3D4</CodigoVerificacao>
          <DataEmissaoNfse>2024-01-15T10:00:00</DataEmissaoNfse>
          <ValoresNfse>
            <ValorServicos>1000.00</ValorServicos>
            <ValorDeducoes>100.00</ValorDeducoes>
            <ValorPis>6.50</ValorPis>
            <ValorCofins>3.00</ValorCofins>
            <ValorInss>11.00</ValorInss>
            <ValorIr>1.50</ValorIr>
            <ValorCsll>1.00</ValorCsll>
            <IssRetido>1</IssRetido>
            <ValorIss>50.00</ValorIss>
            <ValorIssRetido>50.00</ValorIssRetido>
            <OutrasRetencoes>0.00</OutrasRetencoes>
            <BaseCalculo>900.00</BaseCalculo>
            <Aliquota>5.00</Aliquota>
            <ValorLiquidoNfse>827.00</ValorLiquidoNfse>
          </ValoresNfse>
          <PrestadorServico>
            <Cnpj>12345678000195</Cnpj>
            <InscricaoMunicipal>123456</InscricaoMunicipal>
            <RazaoSocial>Empresa Teste LTDA</RazaoSocial>
          </PrestadorServico>
          <TomadorServico>
            <IdentificacaoTomador>
              <CpfCnpj>
                <Cnpj>98765432000198</Cnpj>
              </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>Tomador Teste LTDA</RazaoSocial>
          </TomadorServico>
          <DeclaracaoPrestacaoServico>
            <Rps>
              <IdentificacaoRps>
                <Numero>1</Numero>
                <Serie>1</Serie>
                <Tipo>1</Tipo>
              </IdentificacaoRps>
            </Rps>
          </DeclaracaoPrestacaoServico>
        </InfNfse>
      </Nfse>
    </CompNfse>
  </ListaNfse>
</ConsultarNFeResposta>]]></return>
    </ns2:EnvioLoteRPSResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de rejeição (API Paulistana)
 */
export const xmlRespostaRejeicao = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:EnvioLoteRPSResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<EnvioLoteRPSResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <ListaMensagemRetorno>
    <MensagemRetorno>
      <Codigo>1001</Codigo>
      <Mensagem>CNPJ do prestador inválido</Mensagem>
      <Correcao>Verifique o CNPJ informado e tente novamente</Correcao>
    </MensagemRetorno>
    <MensagemRetorno>
      <Codigo>1002</Codigo>
      <Mensagem>Alíquota inválida para o município</Mensagem>
      <Correcao>Informe uma alíquota válida para o código de tributação</Correcao>
    </MensagemRetorno>
  </ListaMensagemRetorno>
</EnvioLoteRPSResposta>]]></return>
    </ns2:EnvioLoteRPSResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de consulta por número (API Paulistana)
 */
export const xmlRespostaConsulta = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:ConsultaNFeResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<ConsultaNFeResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Detalhe>
    <NFe>
      <NumeroNFe>12345</NumeroNFe>
      <CodigoVerificacao>A1B2C3D4</CodigoVerificacao>
      <DataEmissaoNFe>2024-01-15T10:00:00</DataEmissaoNFe>
      <ValoresNfse>
        <ValorServicos>1000.00</ValorServicos>
        <ValorDeducoes>100.00</ValorDeducoes>
        <ValorPis>6.50</ValorPis>
        <ValorCofins>3.00</ValorCofins>
        <ValorInss>11.00</ValorInss>
        <ValorIr>1.50</ValorIr>
        <ValorCsll>1.00</ValorCsll>
        <IssRetido>1</IssRetido>
        <ValorIss>50.00</ValorIss>
        <ValorIssRetido>50.00</ValorIssRetido>
        <OutrasRetencoes>0.00</OutrasRetencoes>
        <BaseCalculo>900.00</BaseCalculo>
        <Aliquota>5.00</Aliquota>
        <ValorLiquidoNfse>827.00</ValorLiquidoNfse>
      </ValoresNfse>
      <PrestadorServico>
        <Cnpj>12345678000195</Cnpj>
        <InscricaoMunicipal>123456</InscricaoMunicipal>
        <RazaoSocial>Empresa Teste LTDA</RazaoSocial>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj>
            <Cnpj>98765432000198</Cnpj>
          </CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>Tomador Teste LTDA</RazaoSocial>
      </TomadorServico>
      <NfseSubstituida>0</NfseSubstituida>
    </NFe>
  </Detalhe>
</ConsultaNFeResposta>]]></return>
    </ns2:ConsultaNFeResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de consulta com NFSe não encontrada
 */
export const xmlRespostaConsultaNaoEncontrada = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:ConsultaNFeResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<ConsultaNFeResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <ListaMensagemRetorno>
    <MensagemRetorno>
      <Codigo>1005</Codigo>
      <Mensagem>NFS-e não encontrada</Mensagem>
    </MensagemRetorno>
  </ListaMensagemRetorno>
</ConsultaNFeResposta>]]></return>
    </ns2:ConsultaNFeResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de cancelamento bem-sucedido (API Paulistana)
 */
export const xmlRespostaCancelamento = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:CancelamentoNFeResponse xmlns:ns2="http://www.prefeitura.sp.gov.br/nfe">
      <return><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<CancelamentoNFeResposta xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <NfseCancelamento>
    <Confirmacao>
      <DataHoraCancelamento>2024-01-15T14:30:00</DataHoraCancelamento>
      <InscricaoMunicipalPrestador>123456</InscricaoMunicipalPrestador>
      <Sucesso>true</Sucesso>
    </Confirmacao>
  </NfseCancelamento>
</CancelamentoNFeResposta>]]></return>
    </ns2:CancelamentoNFeResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de erro SOAP (timeout/erro 500)
 */
export const xmlErroSOAP500 = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>Erro interno no servidor</faultstring>
      <detail>
        <ErrorCode>500</ErrorCode>
        <ErrorMessage>Serviço temporariamente indisponível. Tente novamente em alguns instantes.</ErrorMessage>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de timeout SOAP
 */
export const xmlErroTimeout = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>Tempo de resposta excedido</faultstring>
      <detail>
        <ErrorCode>408</ErrorCode>
        <ErrorMessage>O servidor não respondeu dentro do tempo limite esperado</ErrorMessage>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

export const certificadoDigitalMock: CertificadoDigital = {
  id: "cert-001",
  nome: "Certificado Teste",
  cnpj: "12345678000195",
  serialNumber: "AB:CD:EF:12:34:56",
  validadeInicio: "2024-01-01T00:00:00",
  validadeFim: "2030-01-01T23:59:59",
  arquivoPem: "-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiUMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\nBAYTAkJSMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX\naWRnaXRzIFB0eSBMdGQwHhcNMTYwNDI2MjEyMDUzWhcNMjYwNDI0MjEyMDUzWjBF\nMQswCQYDVQQGEwJCUjETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50\nZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\nCgKCAQEAuQGTzVqFVm4n4zZqJzLFe1vI\n-----END CERTIFICATE-----",
  senha: "senha-teste-123",
  ativo: true,
};

export const configuracaoAmbienteTeste = {
  urlHomologacao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  urlProducao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  ambiente: "homologacao" as const,
  versao: "1",
  timeoutMs: 30000,
  retryAttempts: 3,
};

export const dadosNotaFiscalInvalida = {
  semCnpj: {
    ...dadosNotaFiscalValida,
    tomador: {
      ...dadosNotaFiscalValida.tomador,
      cnpj: undefined,
      cpf: undefined,
    },
  },
  valorNegativo: {
    ...dadosNotaFiscalValida,
    servico: {
      ...dadosNotaFiscalValida.servico,
      valorServicos: -100,
    },
  },
  dataFutura: {
    ...dadosNotaFiscalValida,
    competencia: "2030-12-31",
  },
  cnpjInvalido: {
    ...dadosNotaFiscalValida,
    tomador: {
      ...dadosNotaFiscalValida.tomador,
      cnpj: "11111111111111",
    },
  },
  cpfInvalido: {
    ...dadosNotaFiscalValida,
    tomador: {
      ...dadosNotaFiscalValida.tomador,
      cnpj: undefined,
      cpf: "11111111111",
    },
  },
};

export const cnpjsValidos = [
  "12345678000195",
  "00000000000191",
  "98765432000198",
];

export const cnpjsInvalidos = [
  "11111111111111",
  "00000000000000",
  "12345678000100",
  "12345",
  "123456789012345",
  "abcdefghijklmn",
  "",
];

export const cpfsValidos = [
  "52998224725",
  "12312312387",
  "11122233396",
];

export const cpfsInvalidos = [
  "11111111111",
  "00000000000",
  "12345678900",
  "1234567890",
  "123456789012",
  "abcdefghijk",
  "",
];

export const casosCalculo = [
  {
    descricao: "Cálculo básico sem deduções",
    valorServicos: 1000.0,
    valorDeducoes: 0.0,
    aliquota: 5.0,
    issRetido: 2,
    baseCalculoEsperada: 1000.0,
    valorIssEsperado: 50.0,
    valorLiquidoEsperado: 1000.0,
  },
  {
    descricao: "Cálculo com deduções",
    valorServicos: 1000.0,
    valorDeducoes: 100.0,
    aliquota: 5.0,
    issRetido: 2,
    baseCalculoEsperada: 900.0,
    valorIssEsperado: 45.0,
    valorLiquidoEsperado: 900.0,
  },
  {
    descricao: "Cálculo com ISS retido",
    valorServicos: 1000.0,
    valorDeducoes: 0.0,
    aliquota: 5.0,
    issRetido: 1,
    baseCalculoEsperada: 1000.0,
    valorIssEsperado: 50.0,
    valorLiquidoEsperado: 950.0,
  },
  {
    descricao: "Cálculo com retenções",
    valorServicos: 1000.0,
    valorDeducoes: 100.0,
    aliquota: 5.0,
    issRetido: 1,
    valorPis: 6.5,
    valorCofins: 3.0,
    valorInss: 11.0,
    valorIr: 1.5,
    valorCsll: 1.0,
    valorIssRetido: 50.0,
    baseCalculoEsperada: 900.0,
    valorIssEsperado: 45.0,
    valorLiquidoEsperado: 827.0,
  },
  {
    descricao: "Cálculo com alíquota zero",
    valorServicos: 1000.0,
    valorDeducoes: 0.0,
    aliquota: 0.0,
    issRetido: 2,
    baseCalculoEsperada: 1000.0,
    valorIssEsperado: 0.0,
    valorLiquidoEsperado: 1000.0,
  },
];
