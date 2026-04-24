/**
 * XML Builder para NFS-e (Nota Fiscal de Serviços Eletrônica)
 * Constrói XML conforme padrão ABRASF
 */

import type { NFSeEmissaoData } from "../../types/nfse";

export class NFSeXMLBuilder {
  /**
   * Constrói XML de RPS (Recibo Provisório de Serviços)
   */
  buildRPS(data: NFSeEmissaoData): string {
    // Validações obrigatórias
    if (!data.prestador?.cnpj) {
      throw new Error("CNPJ do prestador é obrigatório");
    }
    if (!data.prestador?.inscricaoMunicipal) {
      throw new Error("Inscrição municipal do prestador é obrigatória");
    }
    if (!data.tomador?.cnpj && !data.tomador?.cpf) {
      throw new Error("CNPJ ou CPF do tomador é obrigatório");
    }
    if (data.servico?.valorServicos <= 0) {
      throw new Error("Valor dos serviços deve ser maior que zero");
    }
    if (!data.servico?.itemListaServico) {
      throw new Error("Item da lista de serviço é obrigatório");
    }
    if (!data.servico?.discriminacao) {
      throw new Error("Discriminação do serviço é obrigatória");
    }

    const valores = this.formatarValores(data.servico);

    return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
  <LoteRps>
    <NumeroLote>1</NumeroLote>
    <Cnpj>${data.prestador.cnpj}</Cnpj>
    <InscricaoMunicipal>${data.prestador.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfRps>
          <IdentificacaoRps>
            <Numero>${data.numero}</Numero>
            <Serie>${data.serie}</Serie>
            <Tipo>${data.tipo}</Tipo>
          </IdentificacaoRps>
          <DataEmissao>${data.dataEmissao}</DataEmissao>
          <NaturezaOperacao>${data.naturezaOperacao}</NaturezaOperacao>
          <OptanteSimplesNacional>${data.optanteSimplesNacional}</OptanteSimplesNacional>
          <IncentivadorCultural>${data.incentivadorCultural}</IncentivadorCultural>
          <Status>${data.status}</Status>
          <Servico>
            <Valores>
              <ValorServicos>${valores.valorServicos}</ValorServicos>
              <ValorDeducoes>${valores.valorDeducoes}</ValorDeducoes>
              <ValorPis>${valores.valorPis}</ValorPis>
              <ValorCofins>${valores.valorCofins}</ValorCofins>
              <ValorInss>${valores.valorInss}</ValorInss>
              <ValorIr>${valores.valorIr}</ValorIr>
              <ValorCsll>${valores.valorCsll}</ValorCsll>
              <IssRetido>${data.servico.issRetido}</IssRetido>
              <ValorIss>${valores.valorIss}</ValorIss>
              <ValorIssRetido>${valores.valorIssRetido}</ValorIssRetido>
              <OutrasRetencoes>${valores.outrasRetencoes}</OutrasRetencoes>
              <BaseCalculo>${valores.baseCalculo}</BaseCalculo>
              <Aliquota>${valores.aliquota}</Aliquota>
              <ValorLiquidoNfse>${valores.valorLiquidoNfse}</ValorLiquidoNfse>
              <ValorDescontoIncondicionado>${valores.valorDescontoIncondicionado}</ValorDescontoIncondicionado>
              <ValorDescontoCondicionado>${valores.valorDescontoCondicionado}</ValorDescontoCondicionado>
            </Valores>
            <ItemListaServico>${this.escapeXml(data.servico.itemListaServico)}</ItemListaServico>
            <CodigoCnae>${data.servico.codigoCnae || ""}</CodigoCnae>
            <CodigoTributacaoMunicipio>${data.servico.codigoTributacaoMunicipio}</CodigoTributacaoMunicipio>
            <Discriminacao>${this.escapeXml(data.servico.discriminacao)}</Discriminacao>
            <CodigoMunicipio>${data.servico.codigoMunicipio}</CodigoMunicipio>
            <ExigibilidadeISS>${data.servico.exigibilidadeISS}</ExigibilidadeISS>
            <MunicipioIncidencia>${data.servico.municipioIncidencia || data.servico.codigoMunicipio}</MunicipioIncidencia>
          </Servico>
          <Prestador>
            <Cnpj>${data.prestador.cnpj}</Cnpj>
            <InscricaoMunicipal>${data.prestador.inscricaoMunicipal}</InscricaoMunicipal>
            <RazaoSocial>${this.escapeXml(data.prestador.razaoSocial)}</RazaoSocial>
            ${data.prestador.nomeFantasia ? `<NomeFantasia>${this.escapeXml(data.prestador.nomeFantasia)}</NomeFantasia>` : ""}
            <Endereco>
              <Endereco>${this.escapeXml(data.prestador.endereco.logradouro)}</Endereco>
              <Numero>${this.escapeXml(data.prestador.endereco.numero)}</Numero>
              <Complemento>${this.escapeXml(data.prestador.endereco.complemento || "")}</Complemento>
              <Bairro>${this.escapeXml(data.prestador.endereco.bairro)}</Bairro>
              <CodigoMunicipio>${data.prestador.endereco.codigoMunicipio}</CodigoMunicipio>
              <Uf>${data.prestador.endereco.uf}</Uf>
              <Cep>${data.prestador.endereco.cep}</Cep>
            </Endereco>
            <Contato>
              <Telefone>${data.prestador.contato.telefone}</Telefone>
              <Email>${data.prestador.contato.email}</Email>
            </Contato>
          </Prestador>
          <Tomador>
            ${data.tomador.cnpj ? `<Cnpj>${data.tomador.cnpj}</Cnpj>` : ""}
            ${data.tomador.cpf ? `<Cpf>${data.tomador.cpf}</Cpf>` : ""}
            ${data.tomador.inscricaoMunicipal ? `<InscricaoMunicipal>${data.tomador.inscricaoMunicipal}</InscricaoMunicipal>` : ""}
            <RazaoSocial>${this.escapeXml(data.tomador.razaoSocial)}</RazaoSocial>
            <Endereco>
              <Endereco>${this.escapeXml(data.tomador.endereco.logradouro)}</Endereco>
              <Numero>${this.escapeXml(data.tomador.endereco.numero)}</Numero>
              <Complemento>${this.escapeXml(data.tomador.endereco.complemento || "")}</Complemento>
              <Bairro>${this.escapeXml(data.tomador.endereco.bairro)}</Bairro>
              <CodigoMunicipio>${data.tomador.endereco.codigoMunicipio}</CodigoMunicipio>
              <Uf>${data.tomador.endereco.uf}</Uf>
              <Cep>${data.tomador.endereco.cep}</Cep>
            </Endereco>
            <Contato>
              <Telefone>${data.tomador.contato.telefone}</Telefone>
              <Email>${data.tomador.contato.email}</Email>
            </Contato>
          </Tomador>
        </InfRps>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
  }

  /**
   * Constrói XML assinado com certificado digital
   */
  buildSignedRPS(data: NFSeEmissaoData, certificadoPem: string): string {
    const xml = this.buildRPS(data);
    const certificadoClean = certificadoPem
      .replace("-----BEGIN CERTIFICATE-----", "")
      .replace("-----END CERTIFICATE-----", "")
      .replace(/\s/g, "");

    return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <Reference URI="">
        <Transforms>
          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </Transforms>
        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <DigestValue></DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue></SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>${certificadoClean}</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
  ${xml.replace(/<\?xml[^?]*\?>/, "")}
</EnviarLoteRpsEnvio>`;
  }

  /**
   * Constrói XML de lote com múltiplos RPS
   */
  buildLote(dados: NFSeEmissaoData[]): string {
    if (dados.length === 0) {
      throw new Error("Lote deve conter pelo menos um RPS");
    }

    const rpsList = dados.map((data) => this.buildRPS(data));
    return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
  <LoteRps>
    <NumeroLote>1</NumeroLote>
    <Cnpj>${dados[0].prestador.cnpj}</Cnpj>
    <InscricaoMunicipal>${dados[0].prestador.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>${dados.length}</QuantidadeRps>
    <ListaRps>
      ${rpsList.join("\n")}
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
  }

  /**
   * Formata valores numéricos com casas decimais
   */
  private formatarValores(servico: NFSeEmissaoData["servico"]): Record<string, string> {
    return {
      valorServicos: servico.valorServicos.toFixed(2),
      valorDeducoes: servico.valorDeducoes.toFixed(2),
      valorPis: servico.valorPis.toFixed(2),
      valorCofins: servico.valorCofins.toFixed(2),
      valorInss: servico.valorInss.toFixed(2),
      valorIr: servico.valorIr.toFixed(2),
      valorCsll: servico.valorCsll.toFixed(2),
      valorIss: servico.valorIss.toFixed(2),
      valorIssRetido: servico.valorIssRetido.toFixed(2),
      outrasRetencoes: servico.outrasRetencoes.toFixed(2),
      baseCalculo: servico.baseCalculo.toFixed(2),
      aliquota: servico.aliquota.toFixed(4),
      valorLiquidoNfse: servico.valorLiquidoNfse.toFixed(2),
      valorDescontoIncondicionado: servico.valorDescontoIncondicionado.toFixed(2),
      valorDescontoCondicionado: servico.valorDescontoCondicionado.toFixed(2),
    };
  }

  /**
   * Escapa caracteres especiais do XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
