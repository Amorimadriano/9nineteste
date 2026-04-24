/**
 * Preview visual da Nota Fiscal de Serviço
 * Exibe um resumo formatado antes da emissão
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NFSeFormData, statusCores } from "@/types/nfse-ui";
import { formatCurrency, formatCNPJ, formatCPF, formatDate } from "@/lib/nfse-utils";
import { FileText, Building2, User, Calendar, DollarSign, Receipt } from "lucide-react";

interface NotaPreviewProps {
  formData: NFSeFormData;
  numeroNota?: string;
  status?: string;
  certificadoNome?: string;
}

export function NotaPreview({
  formData,
  numeroNota = "-",
  status = "rascunho",
  certificadoNome,
}: NotaPreviewProps) {
  const statusStyle = statusCores[status as keyof typeof statusCores] || statusCores.rascunho;
  const { tomador, servico, retencoes } = formData;

  const totalRetencoes =
    (retencoes?.pis || 0) +
    (retencoes?.cofins || 0) +
    (retencoes?.inss || 0) +
    (retencoes?.ir || 0) +
    (retencoes?.csll || 0);

  return (
    <div className="space-y-4">
      {/* Header da Nota */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Receipt className="h-6 w-6 text-primary" />
                Pré-visualização da Nota Fiscal
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Verifique os dados antes de emitir
              </p>
            </div>
            <div className="text-right">
              <Badge
                className={`${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
              >
                {statusStyle.label}
              </Badge>
              <p className="text-sm font-medium mt-2">
                Nº {numeroNota}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Datas */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Data de Emissão:</span>{" "}
                {formatDate(new Date())}
              </span>
            </div>
            {certificadoNome && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Certificado:</span>{" "}
                  {certificadoNome}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Tomador */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Tomador
            </h4>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="font-medium text-lg">{tomador.razao_social}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">{tomador.tipo}:</span>{" "}
                  {tomador.tipo === "CNPJ"
                    ? formatCNPJ(tomador.documento)
                    : formatCPF(tomador.documento)}
                </p>
                <p>
                  <span className="text-muted-foreground">E-mail:</span>{" "}
                  {tomador.email}
                </p>
                {tomador.telefone && (
                  <p>
                    <span className="text-muted-foreground">Telefone:</span>{" "}
                    {tomador.telefone}
                  </p>
                )}
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">Endereço:</span>{" "}
                {tomador.endereco}, {tomador.numero}
                {tomador.complemento && ` - ${tomador.complemento}`}
                <br />
                {tomador.bairro} - {tomador.cidade}/{tomador.estado}
              </p>
            </div>
          </div>

          <Separator />

          {/* Serviço */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Serviço Prestado
            </h4>
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <p className="text-sm whitespace-pre-wrap">{servico.descricao}</p>

              {servico.cnae && (
                <p className="text-xs text-muted-foreground">
                  CNAE: {servico.cnae}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Item LC 116: {servico.item_lista_servico}
              </p>

              {servico.iss_retido && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  ISS Retido
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </h4>
            <div className="bg-muted rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Bruto:</span>
                  <span>{formatCurrency(servico.valor_bruto)}</span>
                </div>

                {servico.deducoes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deduções:</span>
                    <span>-{formatCurrency(servico.deducoes)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base de Cálculo:</span>
                  <span className="font-medium">{formatCurrency(servico.base_calculo)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ISS ({servico.aliquota_iss}%):
                  </span>
                  <span>{formatCurrency(servico.valor_iss)}</span>
                </div>

                {totalRetencoes > 0 && retencoes && (
                  <>
                    {retencoes.pis > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">PIS:</span>
                        <span>-{formatCurrency(retencoes.pis)}</span>
                      </div>
                    )}
                    {retencoes.cofins > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">COFINS:</span>
                        <span>-{formatCurrency(retencoes.cofins)}</span>
                      </div>
                    )}
                    {retencoes.inss > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">INSS:</span>
                        <span>-{formatCurrency(retencoes.inss)}</span>
                      </div>
                    )}
                    {retencoes.ir > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IR:</span>
                        <span>-{formatCurrency(retencoes.ir)}</span>
                      </div>
                    )}
                    {retencoes.csll > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CSLL:</span>
                        <span>-{formatCurrency(retencoes.csll)}</span>
                      </div>
                    )}
                  </>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold">Valor Líquido:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(servico.valor_liquido - totalRetencoes)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
