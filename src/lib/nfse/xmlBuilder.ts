/**
 * XML Builder para NFS-e (Nota Fiscal de Serviços Eletrônica)
 * Constrói XML conforme padrão ABRASF
 */

import type { NFSeEmissaoData } from "../../types/nfse";

export class NFSeXMLBuilder {
  /**
   * Constrói XML de RPS (Recibo Provisório de Serviços)
   * Uses GINFES v03 namespace
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
    const loteId = `LOTE${Date.now()}`;
    const rpsId = `R${data.prestador.cnpj.replace(/\D/g, "")}${data.numero}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.ginfes.com.br/servico_enviar_lote_rps_envio_v03.xsd">
  <LoteRps Id="${loteId}">
    <NumeroLote>1</NumeroLote>
    <Cnpj>${data.prestador.cnpj.replace(/\D/g, "")}</Cnpj>
    <InscricaoMunicipal>${data.prestador.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfRps Id="${rpsId}">
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
            ${data.servico.codigoCnae ? `<CodigoCnae>${data.servico.codigoCnae}</CodigoCnae>` : ""}
            ${data.servico.codigoTributacaoMunicipio ? `<CodigoTributacaoMunicipio>${data.servico.codigoTributacaoMunicipio}</CodigoTributacaoMunicipio>` : ""}
            <Discriminacao>${this.escapeXml(data.servico.discriminacao)}</Discriminacao>
            <CodigoMunicipio>${data.servico.codigoMunicipio}</CodigoMunicipio>
            <ExigibilidadeISS>${data.servico.exigibilidadeISS}</ExigibilidadeISS>
            ${data.servico.municipioIncidencia ? `<MunicipioIncidencia>${data.servico.municipioIncidencia}</MunicipioIncidencia>` : ""}
          </Servico>
          <Prestador>
            <Cnpj>${data.prestador.cnpj.replace(/\D/g, "")}</Cnpj>
            <InscricaoMunicipal>${data.prestador.inscricaoMunicipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                ${data.tomador.cnpj ? `<Cnpj>${data.tomador.cnpj.replace(/\D/g, "")}</Cnpj>` : ""}
                ${data.tomador.cpf ? `<Cpf>${data.tomador.cpf.replace(/\D/g, "")}</Cpf>` : ""}
              </CpfCnpj>
              ${data.tomador.inscricaoMunicipal ? `<InscricaoMunicipal>${data.tomador.inscricaoMunicipal}</InscricaoMunicipal>` : ""}
            </IdentificacaoTomador>
            <RazaoSocial>${this.escapeXml(data.tomador.razaoSocial)}</RazaoSocial>
            ${data.tomador.endereco?.logradouro ? `
            <Endereco>
              <Logradouro>${this.escapeXml(data.tomador.endereco.logradouro)}</Logradouro>
              <Numero>${this.escapeXml(data.tomador.endereco.numero || "")}</Numero>
              ${data.tomador.endereco.complemento ? `<Complemento>${this.escapeXml(data.tomador.endereco.complemento)}</Complemento>` : ""}
              <Bairro>${this.escapeXml(data.tomador.endereco.bairro || "")}</Bairro>
              <CodigoMunicipio>${data.tomador.endereco.codigoMunicipio || ""}</CodigoMunicipio>
              <Uf>${data.tomador.endereco.uf || ""}</Uf>
              <Cep>${data.tomador.endereco.cep || ""}</Cep>
            </Endereco>` : ""}
            ${data.tomador.contato?.email ? `<Contato><Email>${data.tomador.contato.email}</Email>${data.tomador.contato.telefone ? `<Telefone>${data.tomador.contato.telefone}</Telefone>` : ""}</Contato>` : ""}
          </Tomador>
        </InfRps>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
  }

  /**
   * Constrói XML de RPS com placeholder para assinatura digital.
   * A assinatura real deve ser feita pelo backend (Supabase edge function)
   * usando node-forge, pois requer acesso à chave privada.
   * O certificadoPem é incluído como referência, mas o DigestValue e SignatureValue
   * serão preenchidos pelo serviço de assinatura no backend.
   */
  buildSignedRPS(data: NFSeEmissaoData, certificadoPem: string): string {
    // Just build the RPS XML - signing is done by the backend
    return this.buildRPS(data);
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
