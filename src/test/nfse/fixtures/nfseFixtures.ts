/**
 * Fixtures para testes de integração NFS-e
 * Inclui XMLs de resposta e dados de nota fiscal para testes
 */

import type { NFSeEmissaoData, CertificadoDigital } from "../../../types/nfse";

/**
 * Dados válidos de nota fiscal para testes
 */
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
    cnpj: "98765432000196",
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
    valorLiquidoNfse: 877.0,
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

/**
 * Dados de nota fiscal com CPF (pessoa física)
 */
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
 * XML de resposta de autorização bem-sucedida (ABRASF)
 */
export const xmlRespostaAutorizacao = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GerarNfseResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
      <GerarNfseResult>
        <ListaNfse>
          <Nfse>
            <InfNfse>
              <Numero>12345</Numero>
              <CodigoVerificacao>A1B2C3D4</CodigoVerificacao>
              <DataEmissao>2024-01-15T10:00:00</DataEmissao>
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
                <ValorLiquidoNfse>877.00</ValorLiquidoNfse>
              </ValoresNfse>
              <PrestadorServico>
                <IdentificacaoPrestador>
                  <Cnpj>12345678000195</Cnpj>
                  <InscricaoMunicipal>123456</InscricaoMunicipal>
                </IdentificacaoPrestador>
                <RazaoSocial>Empresa Teste LTDA</RazaoSocial>
              </PrestadorServico>
              <TomadorServico>
                <IdentificacaoTomador>
                  <CnpjCpf>
                    <Cnpj>98765432000196</Cnpj>
                  </CnpjCpf>
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
        </ListaNfse>
      </GerarNfseResult>
    </GerarNfseResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de rejeição
 */
export const xmlRespostaRejeicao = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GerarNfseResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
      <GerarNfseResult>
        <ListaMensagemRetorno>
          <MensagemRetorno>
            <Codigo>E1</Codigo>
            <Mensagem>CNPJ do prestador inválido</Mensagem>
            <Correcao>Verifique o CNPJ informado e tente novamente</Correcao>
          </MensagemRetorno>
          <MensagemRetorno>
            <Codigo>E2</Codigo>
            <Mensagem>Alíquota inválida para o município</Mensagem>
            <Correcao>Informe uma alíquota válida para o código de tributação</Correcao>
          </MensagemRetorno>
        </ListaMensagemRetorno>
      </GerarNfseResult>
    </GerarNfseResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de consulta
 */
export const xmlRespostaConsulta = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultarNfseRpsResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
      <ConsultarNfseRpsResult>
        <Nfse>
          <InfNfse>
            <Numero>12345</Numero>
            <CodigoVerificacao>A1B2C3D4</CodigoVerificacao>
            <DataEmissao>2024-01-15T10:00:00</DataEmissao>
            <DataCancelamento></DataCancelamento>
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
              <ValorLiquidoNfse>877.00</ValorLiquidoNfse>
            </ValoresNfse>
            <PrestadorServico>
              <IdentificacaoPrestador>
                <Cnpj>12345678000195</Cnpj>
                <InscricaoMunicipal>123456</InscricaoMunicipal>
              </IdentificacaoPrestador>
              <RazaoSocial>Empresa Teste LTDA</RazaoSocial>
            </PrestadorServico>
            <TomadorServico>
              <IdentificacaoTomador>
                <CnpjCpf>
                  <Cnpj>98765432000196</Cnpj>
                </CnpjCpf>
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
            <NfseSubstituida>0</NfseSubstituida>
          </InfNfse>
        </Nfse>
      </ConsultarNfseRpsResult>
    </ConsultarNfseRpsResponse>
  </soap:Body>
</soap:Envelope>`;

/**
 * XML de resposta de cancelamento
 */
export const xmlRespostaCancelamento = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CancelarNfseResponse xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
      <CancelarNfseResult>
        <NfseCancelamento>
          <Confirmacao>
            <DataHoraCancelamento>2024-01-15T14:30:00</DataHoraCancelamento>
            <InscricaoMunicipalPrestador>123456</InscricaoMunicipalPrestador>
            <Sucesso>true</Sucesso>
          </Confirmacao>
        </NfseCancelamento>
      </CancelarNfseResult>
    </CancelarNfseResponse>
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

/**
 * Certificado digital mock para testes
 */
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

/**
 * Configuração de ambiente de teste
 */
export const configuracaoAmbienteTeste = {
  urlHomologacao: "https://nfse-homologacao.prefeitura.sp.gov.br/ws",
  urlProducao: "https://nfse.prefeitura.sp.gov.br/ws",
  ambiente: "homologacao" as const,
  versao: "2.04",
  timeoutMs: 30000,
  retryAttempts: 3,
};

/**
 * Dados inválidos para testes de validação
 */
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

/**
 * CNPJs válidos para testes (com dígito verificador correto)
 */
export const cnpjsValidos = [
  "12345678000195",
  "11222333000181",
  "00000000000191", // CNPJ Brasil
];

/**
 * CNPJs inválidos para testes
 */
export const cnpjsInvalidos = [
  "11111111111111",
  "00000000000000",
  "12345678000100",
  "12345",
  "123456789012345",
  "abcdefghijklmn",
  "",
];

/**
 * CPFs válidos para testes (com dígito verificador correto)
 */
export const cpfsValidos = [
  "11144477735",
  "52998224725",
  "15548275706",
];

/**
 * CPFs inválidos para testes
 */
export const cpfsInvalidos = [
  "11111111111",
  "00000000000",
  "12345678900",
  "1234567890",
  "123456789012",
  "abcdefghijk",
  "",
];

/**
 * Casos de cálculo esperados
 */
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
    baseCalculoEsperada: 900.0,
    valorIssEsperado: 45.0,
    valorLiquidoEsperado: 877.0,
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
