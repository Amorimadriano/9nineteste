import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { supabase } from "@/integrations/supabase/client";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { Building2, Save, Upload, Trash2, Loader2, MapPin, Phone, Mail, Globe, Search } from "lucide-react";

const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface EmpresaData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  telefone: string;
  email: string;
  website: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  logo_url: string;
  observacoes: string;
}

const emptyEmpresa: EmpresaData = {
  razao_social: "", nome_fantasia: "", cnpj: "", inscricao_estadual: "",
  inscricao_municipal: "", telefone: "", email: "", website: "",
  cep: "", endereco: "", numero: "", complemento: "", bairro: "",
  cidade: "", estado: "", logo_url: "", observacoes: "",
};

// Mapeia do banco (empresas) para o form
function fromDb(row: any): EmpresaData {
  return {
    razao_social: row.razao_social || "",
    nome_fantasia: row.nome_fantasia || "",
    cnpj: row.cnpj || "",
    inscricao_estadual: row.inscricao_estadual || "",
    inscricao_municipal: row.inscricao_municipal || "",
    telefone: row.telefone || "",
    email: row.email || "",
    website: row.website || "",
    cep: row.endereco_cep || "",
    endereco: row.endereco_logradouro || "",
    numero: row.endereco_numero || "",
    complemento: row.endereco_complemento || "",
    bairro: row.endereco_bairro || "",
    cidade: row.endereco_cidade || "",
    estado: row.endereco_uf || "",
    logo_url: row.logo_url || "",
    observacoes: row.observacoes || "",
  };
}

// Mapeia do form para o banco (empresas)
function toDb(data: EmpresaData): any {
  return {
    razao_social: data.razao_social || null,
    nome_fantasia: data.nome_fantasia || null,
    cnpj: data.cnpj.replace(/\D/g, ""),
    inscricao_estadual: data.inscricao_estadual || null,
    inscricao_municipal: data.inscricao_municipal || null,
    telefone: data.telefone || null,
    email: data.email || null,
    website: data.website || null,
    endereco_cep: data.cep || null,
    endereco_logradouro: data.endereco || null,
    endereco_numero: data.numero || null,
    endereco_complemento: data.complemento || null,
    endereco_bairro: data.bairro || null,
    endereco_cidade: data.cidade || null,
    endereco_uf: data.estado || null,
    logo_url: data.logo_url || null,
    observacoes: data.observacoes || null,
  };
}

export default function Empresa() {
  const { user } = useAuth();
  const { recarregarEmpresa } = useEmpresa();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<EmpresaData>(emptyEmpresa);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const pendingIdRef = useRef<string>(crypto.randomUUID());

  const { lookup: handleCnpjLookup, loading: cnpjLookupLoading } = useCnpjLookup(
    (updater) => setData(updater),
    {
      razaoSocial: "razao_social",
      nomeFantasia: "nome_fantasia",
      email: "email",
      telefone: "telefone",
      cep: "cep",
      endereco: "endereco",
      numero: "numero",
      complemento: "complemento",
      bairro: "bairro",
      cidade: "cidade",
      estado: "estado",
    }
  );

  const handleCepLookup = async () => {
    const clean = data.cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${clean}`);
      if (!res.ok) throw new Error("CEP não encontrado");
      const d = await res.json();
      setData(prev => ({
        ...prev,
        endereco: d.street || prev.endereco,
        bairro: d.neighborhood || prev.bairro,
        cidade: d.city || prev.cidade,
        estado: d.state || prev.estado,
      }));
      toast({ title: "Endereço preenchido automaticamente!" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível consultar o CEP.", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const loadEmpresa = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Busca a empresa vinculada ao usuário via usuario_empresas
    const { data: vinculos, error: vinculoError } = await supabase
      .from("usuario_empresas")
      .select("empresa_id, empresas(*)")
      .eq("user_id", user.id)
      .limit(1);

    setLoading(false);

    if (vinculoError) {
      toast({ title: "Erro ao carregar dados", description: vinculoError.message, variant: "destructive" });
      return;
    }

    const row = (vinculos && vinculos.length > 0) ? (vinculos[0] as any).empresas : null;

    if (row) {
      setExistingId(row.id);
      setData(fromDb(row));
    } else {
      setExistingId(null);
      setData(emptyEmpresa);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadEmpresa().then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChange = (field: keyof EmpresaData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const empresaId = existingId || pendingIdRef.current;
    if (!empresaId) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG, JPG, WebP ou SVG", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${empresaId}/logo_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Erro ao enviar logo", description: uploadError.message, variant: "destructive" });
        return;
      }

      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      setData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast({ title: "Logo enviado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar logo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setData(prev => ({ ...prev, logo_url: "" }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Usuário não autenticado", description: "Faça login para continuar.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = toDb(data);

    if (existingId) {
      const { error } = await (supabase.from("empresas") as any)
        .update(payload)
        .eq("id", existingId);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      // Usa o ID temporário (já usado para upload de logo) ou gera um novo
      const novoId = existingId || pendingIdRef.current;
      const payloadComId = { ...payload, id: novoId };

      // Cria a empresa (sem .select() pois o RLS de SELECT bloquearia até o vínculo existir)
      const { error } = await (supabase.from("empresas") as any)
        .insert(payloadComId);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      // Cria vínculo usuario_empresas com role admin
      const { error: vinculoError } = await supabase
        .from("usuario_empresas")
        .insert({ user_id: user.id, empresa_id: novoId, role: "admin" });

      if (vinculoError) {
        toast({ title: "Erro ao vincular empresa", description: vinculoError.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      setExistingId(novoId);
    }

    // Recarrega do banco para confirmar persistência
    await loadEmpresa();
    await recarregarEmpresa(); // Atualiza o contexto global (logo + nome no sidebar)
    setSaving(false);
    toast({ title: "Dados da empresa salvos com sucesso!" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Cadastro da Empresa</h1>
          <p className="text-sm text-muted-foreground">Informações da empresa que utiliza o sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Dados
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Logotipo
            </CardTitle>
            <CardDescription>Imagem da empresa (PNG, JPG, WebP ou SVG, até 2MB)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
              {data.logo_url ? (
                <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="h-16 w-16 text-muted-foreground/40" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUploadLogo}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {data.logo_url ? "Trocar" : "Enviar"}
              </Button>
              {data.logo_url && (
                <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados principais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input value={data.razao_social} onChange={e => handleChange("razao_social", e.target.value)} placeholder="Razão Social da empresa" />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input value={data.nome_fantasia} onChange={e => handleChange("nome_fantasia", e.target.value)} placeholder="Nome Fantasia" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <div className="flex gap-2">
                  <Input value={data.cnpj} onChange={e => handleChange("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                  <Button type="button" variant="outline" size="icon" onClick={() => handleCnpjLookup(data.cnpj)} disabled={cnpjLookupLoading || data.cnpj.replace(/\D/g, "").length !== 14} title="Buscar CNPJ na Receita Federal">
                    {cnpjLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Digite o CNPJ e clique na lupa para preencher automaticamente</p>
              </div>
              <div className="space-y-2">
                <Label>Inscrição Estadual</Label>
                <Input value={data.inscricao_estadual} onChange={e => handleChange("inscricao_estadual", e.target.value)} placeholder="Inscrição Estadual" />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Municipal</Label>
                <Input value={data.inscricao_municipal} onChange={e => handleChange("inscricao_municipal", e.target.value)} placeholder="Inscrição Municipal" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone</Label>
              <Input value={data.telefone} onChange={e => handleChange("telefone", e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</Label>
              <Input type="email" value={data.email} onChange={e => handleChange("email", e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
              <Input value={data.website} onChange={e => handleChange("website", e.target.value)} placeholder="www.empresa.com.br" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <div className="flex gap-2">
                <Input value={data.cep} onChange={e => handleChange("cep", e.target.value)} placeholder="00000-000" />
                <Button type="button" variant="outline" size="icon" onClick={handleCepLookup} disabled={cepLoading || data.cep.replace(/\D/g, "").length !== 8} title="Buscar CEP">
                  {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Digite o CEP e clique na lupa</p>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Endereço</Label>
              <Input value={data.endereco} onChange={e => handleChange("endereco", e.target.value)} placeholder="Rua, Avenida..." />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={data.numero} onChange={e => handleChange("numero", e.target.value)} placeholder="Nº" />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={data.complemento} onChange={e => handleChange("complemento", e.target.value)} placeholder="Sala, Andar..." />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={data.bairro} onChange={e => handleChange("bairro", e.target.value)} placeholder="Bairro" />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={data.cidade} onChange={e => handleChange("cidade", e.target.value)} placeholder="Cidade" />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={data.estado} onValueChange={v => handleChange("estado", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {estados.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.observacoes}
            onChange={e => handleChange("observacoes", e.target.value)}
            placeholder="Informações adicionais sobre a empresa..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
