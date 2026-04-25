/**
 * Formulário de Tomador para NFS-e
 * Inclui busca automática por CNPJ via Brasil API
 */
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Building2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TomadorFormData } from "@/types/nfse-ui";
import { formatCNPJ, formatCPF, formatCEP, isValidCNPJ, isValidCPF } from "@/lib/nfse-utils";
import { supabase } from "@/integrations/supabase/client";

interface TomadorFormProps {
  value: TomadorFormData;
  onChange: (value: TomadorFormData) => void;
  errors?: Record<string, string>;
}

interface ViaCEPResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

interface BrasilAPICNPJResponse {
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

export function TomadorForm({ value, onChange, errors = {} }: TomadorFormProps) {
  const { toast } = useToast();
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Busca CNPJ via edge function (sem problema de CORS)
  const buscarCNPJ = async () => {
    const documentoLimpo = value.documento.replace(/\D/g, "");
    if (value.tipo === "CNPJ" && documentoLimpo.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoadingCNPJ(true);
    try {
      const { data, error } = await supabase.functions.invoke("consultar-cnpj", {
        body: { cnpj: documentoLimpo },
      });

      if (error) throw new Error(error.message);
      if (!data?.data) throw new Error("CNPJ não encontrado");

      const cnpjData: BrasilAPICNPJResponse = data.data;
      preencherDadosCNPJ(cnpjData);
    } catch (err: any) {
      toast({
        title: "Erro na consulta",
        description: err.message || "Não foi possível buscar os dados do CNPJ. Preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setLoadingCNPJ(false);
    }
  };

  const preencherDadosCNPJ = (data: BrasilAPICNPJResponse) => {
    const telefone = data.ddd_telefone_1
      ? data.ddd_telefone_1.replace(/\D/g, "").length >= 10
        ? `(${data.ddd_telefone_1.replace(/\D/g, "").slice(0, 2)}) ${data.ddd_telefone_1.replace(/\D/g, "").slice(2)}`
        : data.ddd_telefone_1
      : "";

    onChange({
      ...value,
      razao_social: data.razao_social || "",
      nome_fantasia: data.nome_fantasia || "",
      email: data.email || "",
      telefone,
      endereco: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.municipio || "",
      estado: data.uf || "",
      cep: data.cep?.replace(/\D/g, "") || "",
    });

    toast({
      title: "Dados preenchidos",
      description: "Informações do CNPJ carregadas com sucesso.",
    });
    setLoadingCNPJ(false);
  };

  // Busca CEP na ViaCEP
  const buscarCEP = async () => {
    const cepLimpo = value.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Digite um CEP válido com 8 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      onChange({
        ...value,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
        ibge: data.ibge || "",
      });

      toast({
        title: "Endereço preenchido",
        description: "CEP encontrado e endereço preenchido automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "Não foi possível buscar o CEP. Verifique o número digitado.",
        variant: "destructive",
      });
    } finally {
      setLoadingCEP(false);
    }
  };

  // Auto busca CEP quando completo
  useEffect(() => {
    const cepLimpo = value.cep.replace(/\D/g, "");
    if (cepLimpo.length === 8 && !value.endereco) {
      buscarCEP();
    }
  }, [value.cep]);

  const handleDocumentoChange = (documento: string) => {
    const tipo = value.tipo;
    const formatado = tipo === "CNPJ" ? formatCNPJ(documento) : formatCPF(documento);
    onChange({ ...value, documento: formatado });
  };

  const handleCEPChange = (cep: string) => {
    onChange({ ...value, cep: formatCEP(cep) });
  };

  const validarDocumento = () => {
    const limpo = value.documento.replace(/\D/g, "");
    if (value.tipo === "CNPJ") {
      return isValidCNPJ(limpo);
    }
    return isValidCPF(limpo);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Tipo de Documento */}
        <div className="space-y-3">
          <Label>Tipo de Pessoa</Label>
          <RadioGroup
            value={value.tipo}
            onValueChange={(tipo) => onChange({ ...value, tipo: tipo as "CPF" | "CNPJ", documento: "" })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CNPJ" id="cnpj" />
              <Label htmlFor="cnpj" className="cursor-pointer flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                CNPJ (Pessoa Jurídica)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CPF" id="cpf" />
              <Label htmlFor="cpf" className="cursor-pointer flex items-center gap-2">
                <User className="h-4 w-4" />
                CPF (Pessoa Física)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Documento */}
        <div className="space-y-2">
          <Label htmlFor="documento">
            {value.tipo === "CNPJ" ? "CNPJ" : "CPF"} *
          </Label>
          <div className="flex gap-2">
            <Input
              id="documento"
              value={value.documento}
              onChange={(e) => handleDocumentoChange(e.target.value)}
              placeholder={value.tipo === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
              maxLength={value.tipo === "CNPJ" ? 18 : 14}
              className={errors.documento ? "border-red-500" : ""}
            />
            {value.tipo === "CNPJ" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={buscarCNPJ}
                disabled={loadingCNPJ || value.documento.replace(/\D/g, "").length !== 14}
                title="Buscar CNPJ"
              >
                {loadingCNPJ ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          {errors.documento && (
            <p className="text-sm text-red-500">{errors.documento}</p>
          )}
          {value.documento && !validarDocumento() && (
            <p className="text-sm text-amber-600">
              {value.tipo === "CNPJ" ? "CNPJ" : "CPF"} inválido
            </p>
          )}
        </div>

        {/* Razão Social */}
        <div className="space-y-2">
          <Label htmlFor="razao_social">Razão Social *</Label>
          <Input
            id="razao_social"
            value={value.razao_social}
            onChange={(e) => onChange({ ...value, razao_social: e.target.value })}
            placeholder="Nome completo ou razão social"
            className={errors.razao_social ? "border-red-500" : ""}
          />
          {errors.razao_social && (
            <p className="text-sm text-red-500">{errors.razao_social}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="email@exemplo.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={value.telefone}
            onChange={(e) => onChange({ ...value, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>

        {/* CEP */}
        <div className="space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              value={value.cep}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={errors.cep ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={buscarCEP}
              disabled={loadingCEP || value.cep.replace(/\D/g, "").length !== 8}
              title="Buscar CEP"
            >
              {loadingCEP ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.cep && (
            <p className="text-sm text-red-500">{errors.cep}</p>
          )}
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={value.endereco}
              onChange={(e) => onChange({ ...value, endereco: e.target.value })}
              placeholder="Rua, Avenida, etc."
              className={errors.endereco ? "border-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero">Número *</Label>
            <Input
              id="numero"
              value={value.numero}
              onChange={(e) => onChange({ ...value, numero: e.target.value })}
              placeholder="123"
              className={errors.numero ? "border-red-500" : ""}
            />
          </div>
        </div>

        {/* Complemento */}
        <div className="space-y-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            value={value.complemento || ""}
            onChange={(e) => onChange({ ...value, complemento: e.target.value })}
            placeholder="Sala, Andar, etc. (opcional)"
          />
        </div>

        {/* Bairro, Cidade, Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro *</Label>
            <Input
              id="bairro"
              value={value.bairro}
              onChange={(e) => onChange({ ...value, bairro: e.target.value })}
              className={errors.bairro ? "border-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              value={value.cidade}
              onChange={(e) => onChange({ ...value, cidade: e.target.value })}
              className={errors.cidade ? "border-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <Input
              id="estado"
              value={value.estado}
              onChange={(e) => onChange({ ...value, estado: e.target.value.toUpperCase() })}
              maxLength={2}
              placeholder="SP"
              className={errors.estado ? "border-red-500" : ""}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
