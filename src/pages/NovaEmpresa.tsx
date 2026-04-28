import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Stepper from "@/components/ui/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Building2, Search, Loader2 } from "lucide-react";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { useCepLookup } from "@/hooks/useCepLookup";

const SEGMENTOS = [
  "Advocacia",
  "Clínicas Médicas",
  "Varejo",
  "Indústria",
  "Serviços",
  "Tecnologia",
  "Construção Civil",
  "Educação",
  "Outro",
];

const STEPS = [
  { label: "Dados Cadastrais", description: "CNPJ e informações básicas" },
  { label: "Configurações", description: "Bancos e certificado digital" },
  { label: "Permissões", description: "Operadores e acessos" },
];

export default function NovaEmpresa() {
  const { user } = useAuth();
  const { selecionarEmpresa } = useEmpresa();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    cnpj: "",
    razao_social: "",
    nome_fantasia: "",
    cnae: "",
    natureza_juridica: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    segmento: "",
    endereco_cep: "",
    endereco_logradouro: "",
    endereco_numero: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
    telefone: "",
    email: "",
  });

  const { lookup: lookupCnpj, loading: loadingCnpj } = useCnpjLookup(setForm, {
    razaoSocial: "razao_social",
    nomeFantasia: "nome_fantasia",
    email: "email",
    telefone: "telefone",
    cep: "endereco_cep",
    endereco: "endereco_logradouro",
    numero: "endereco_numero",
    complemento: "endereco_complemento",
    bairro: "endereco_bairro",
    cidade: "endereco_cidade",
    estado: "endereco_uf",
    cnae: "cnae",
    naturezaJuridica: "natureza_juridica",
  });

  const { lookup: lookupCep, loading: loadingCep } = useCepLookup(setForm, {
    logradouro: "endereco_logradouro",
    bairro: "endereco_bairro",
    cidade: "endereco_cidade",
    estado: "endereco_uf",
    complemento: "endereco_complemento",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    const { data: empresa, error: errEmp } = await supabase
      .from("empresas")
      .insert({
        razao_social: form.razao_social,
        nome_fantasia: form.nome_fantasia || null,
        cnpj: form.cnpj.replace(/\D/g, ""),
        inscricao_estadual: form.inscricao_estadual || null,
        inscricao_municipal: form.inscricao_municipal || null,
        segmento: form.segmento || null,
        endereco_cep: form.endereco_cep || null,
        endereco_logradouro: form.endereco_logradouro || null,
        endereco_numero: form.endereco_numero || null,
        endereco_complemento: form.endereco_complemento || null,
        endereco_bairro: form.endereco_bairro || null,
        endereco_cidade: form.endereco_cidade || null,
        endereco_uf: form.endereco_uf || null,
        telefone: form.telefone || null,
        email: form.email || null,
      })
      .select()
      .single();

    if (errEmp || !empresa) {
      toast({
        title: "Erro ao criar empresa",
        description: errEmp?.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    await supabase.from("usuario_empresas").insert({
      user_id: user.id,
      empresa_id: empresa.id,
      role: "admin",
    });

    await selecionarEmpresa(empresa.id);

    toast({ title: "Empresa criada com sucesso!" });
    setSaving(false);
    navigate("/");
  };

  const canProceed = () => {
    if (step === 0) {
      return (
        form.cnpj.replace(/\D/g, "").length >= 14 &&
        form.razao_social.trim().length > 0
      );
    }
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-display">Nova Empresa</h1>
      </div>

      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="p-6 space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              {/* CNPJ com lupa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={form.cnpj}
                      onChange={(e) => handleChange("cnpj", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => lookupCnpj(form.cnpj)}
                      disabled={loadingCnpj}
                      title="Consultar CNPJ"
                    >
                      {loadingCnpj ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {loadingCnpj && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Consultando Receita Federal...
                    </p>
                  )}
                </div>
                <div>
                  <Label>Razão Social *</Label>
                  <Input
                    value={form.razao_social}
                    onChange={(e) =>
                      handleChange("razao_social", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={form.nome_fantasia}
                    onChange={(e) =>
                      handleChange("nome_fantasia", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Segmento de Atuação</Label>
                  <Select
                    value={form.segmento}
                    onValueChange={(v) => handleChange("segmento", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTOS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CNAE e Natureza Jurídica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>CNAE Principal</Label>
                  <Input
                    value={form.cnae}
                    onChange={(e) => handleChange("cnae", e.target.value)}
                    placeholder="Ex: Comércio varejista..."
                  />
                </div>
                <div>
                  <Label>Natureza Jurídica</Label>
                  <Input
                    value={form.natureza_juridica}
                    onChange={(e) =>
                      handleChange("natureza_juridica", e.target.value)
                    }
                    placeholder="Ex: Sociedade Empresária..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={form.inscricao_estadual}
                    onChange={(e) =>
                      handleChange("inscricao_estadual", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Inscrição Municipal</Label>
                  <Input
                    value={form.inscricao_municipal}
                    onChange={(e) =>
                      handleChange("inscricao_municipal", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* CEP com lupa */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00000-000"
                      value={form.endereco_cep}
                      onChange={(e) =>
                        handleChange("endereco_cep", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => lookupCep(form.endereco_cep)}
                      disabled={loadingCep}
                      title="Consultar CEP"
                    >
                      {loadingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {loadingCep && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Consultando ViaCEP...
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={form.endereco_logradouro}
                    onChange={(e) =>
                      handleChange("endereco_logradouro", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input
                    value={form.endereco_numero}
                    onChange={(e) =>
                      handleChange("endereco_numero", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Complemento</Label>
                  <Input
                    value={form.endereco_complemento}
                    onChange={(e) =>
                      handleChange("endereco_complemento", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={form.endereco_bairro}
                    onChange={(e) =>
                      handleChange("endereco_bairro", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={form.endereco_cidade}
                    onChange={(e) =>
                      handleChange("endereco_cidade", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input
                    maxLength={2}
                    value={form.endereco_uf}
                    onChange={(e) =>
                      handleChange("endereco_uf", e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => handleChange("telefone", e.target.value)}
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure as integrações bancárias e certificado digital na
                tela de <strong>Bancos e Cartões</strong> e{" "}
                <strong>NFSe {'>'} Configurações</strong> após criar a empresa.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Após criar a empresa, você poderá convidar operadores e
                configurar permissões na tela de{" "}
                <strong>Usuários</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Por padrão, você será o administrador desta empresa.
              </p>
            </div>
          )}

          {/* Navegação do stepper */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Anterior
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !canProceed()}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Criar Empresa"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
