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
import { ArrowLeft, Save, Building2 } from "lucide-react";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";

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

  const { data: cnpjData, isLoading: loadingCnpj } = useCnpjLookup(
    form.cnpj.replace(/\D/g, "")
  );

  // Auto-preencher ao receber dados do CNPJ
  useState(() => {
    if (cnpjData) {
      setForm((prev) => ({
        ...prev,
        razao_social: cnpjData.razao_social || prev.razao_social,
        nome_fantasia: cnpjData.nome_fantasia || prev.nome_fantasia,
        endereco_logradouro: cnpjData.logradouro || prev.endereco_logradouro,
        endereco_numero: cnpjData.numero || prev.endereco_numero,
        endereco_complemento:
          cnpjData.complemento || prev.endereco_complemento,
        endereco_bairro: cnpjData.bairro || prev.endereco_bairro,
        endereco_cidade: cnpjData.municipio || prev.endereco_cidade,
        endereco_uf: cnpjData.uf || prev.endereco_uf,
        telefone: cnpjData.telefone || prev.telefone,
        email: cnpjData.email || prev.email,
      }));
    }
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    // 1. Criar empresa
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

    // 2. Vincular usuário como admin
    await supabase.from("usuario_empresas").insert({
      user_id: user.id,
      empresa_id: empresa.id,
      role: "admin",
    });

    // 3. Selecionar automaticamente
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => handleChange("cnpj", e.target.value)}
                  />
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

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label>CEP</Label>
                  <Input
                    value={form.endereco_cep}
                    onChange={(e) => handleChange("endereco_cep", e.target.value)}
                  />
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
                    onChange={(e) => handleChange("endereco_uf", e.target.value.toUpperCase())}
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
