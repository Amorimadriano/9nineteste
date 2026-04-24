import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TesteConexaoButton } from "./TesteConexaoButton";
import type { TipoERP, CredenciaisERP } from "@/types/contabilidade";

interface CredenciaisFormProps {
  erpTipo: TipoERP;
  credenciais: CredenciaisERP;
  onChange: (credenciais: CredenciaisERP) => void;
  disabled?: boolean;
}

interface FieldConfig {
  name: keyof CredenciaisERP;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}

const camposPorERP: Record<TipoERP, FieldConfig[]> = {
  totvs_protheus: [
    { name: "url_api", label: "URL da API", type: "url", required: true, placeholder: "https://api.protheus.com.br" },
    { name: "usuario", label: "Usuário", type: "text", required: true, placeholder: "usuario_protheus" },
    { name: "senha", label: "Senha", type: "password", required: true, placeholder: "••••••••" },
    { name: "codigo_empresa", label: "Código da Empresa", type: "text", required: true, placeholder: "01" },
    { name: "codigo_filial", label: "Código da Filial", type: "text", required: false, placeholder: "01" },
  ],
  sankhya_omegasoft: [
    { name: "url_api", label: "URL da API", type: "url", required: true, placeholder: "https://api.sankhya.com.br" },
    { name: "api_key", label: "API Key", type: "text", required: true, placeholder: "sua-api-key" },
    { name: "api_secret", label: "API Secret", type: "password", required: true, placeholder: "sua-api-secret" },
    { name: "codigo_empresa", label: "Código da Empresa", type: "text", required: true, placeholder: "001" },
  ],
  dominio_sistemas: [
    { name: "url_api", label: "URL do Servidor", type: "url", required: true, placeholder: "https://dominio.servidor.com" },
    { name: "usuario", label: "Usuário", type: "text", required: true, placeholder: "usuario" },
    { name: "senha", label: "Senha", type: "password", required: true, placeholder: "••••••••" },
    { name: "codigo_empresa", label: "Código da Empresa", type: "text", required: true, placeholder: "1" },
  ],
  alterdata: [
    { name: "url_api", label: "URL da API", type: "url", required: true, placeholder: "https://api.alterdata.com.br" },
    { name: "usuario", label: "Usuário", type: "text", required: true, placeholder: "usuario" },
    { name: "senha", label: "Senha", type: "password", required: true, placeholder: "••••••••" },
    { name: "codigo_empresa", label: "Código da Empresa", type: "text", required: true, placeholder: "001" },
    { name: "codigo_filial", label: "Código da Filial", type: "text", required: false, placeholder: "0001" },
  ],
  outro: [
    { name: "url_api", label: "URL da API", type: "url", required: true, placeholder: "https://api.seuerp.com" },
    { name: "api_key", label: "API Key", type: "text", required: false, placeholder: "sua-api-key (opcional)" },
    { name: "usuario", label: "Usuário", type: "text", required: false, placeholder: "usuario (opcional)" },
    { name: "senha", label: "Senha", type: "password", required: false, placeholder: "•••••••• (opcional)" },
    { name: "codigo_empresa", label: "Código da Empresa", type: "text", required: true, placeholder: "código da empresa" },
  ],
};

export function CredenciaisForm({ erpTipo, credenciais, onChange, disabled }: CredenciaisFormProps) {
  const campos = camposPorERP[erpTipo] || camposPorERP.outro;
  const [showSecrets, setShowSecrets] = useState(false);

  const handleChange = (field: keyof CredenciaisERP, value: string) => {
    onChange({ ...credenciais, [field]: value });
  };

  const camposPreenchidos = campos.filter((campo) => {
    if (!campo.required) return true;
    const valor = credenciais[campo.name];
    return valor && valor.toString().trim() !== "";
  }).length;

  const progresso = Math.round((camposPreenchidos / campos.filter((c) => c.required).length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Credenciais de Acesso</CardTitle>
              <CardDescription>
                Configure as credenciais para conectar com o ERP
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{progresso}%</span>
              <p className="text-xs text-muted-foreground">Preenchido</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default" className="bg-muted/50">
            <AlertDescription>
              As credenciais são criptografadas e armazenadas com segurança. Nunca compartilhe suas credenciais.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campos.map((campo, index) => (
              <motion.div
                key={campo.name}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Label htmlFor={campo.name} className="flex items-center gap-1"
                >
                  {campo.label}
                  {campo.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Input
                  id={campo.name}
                  type={campo.type === "password" && showSecrets ? "text" : campo.type}
                  value={credenciais[campo.name] || ""}
                  onChange={(e) => handleChange(campo.name, e.target.value)}
                  placeholder={campo.placeholder}
                  disabled={disabled}
                  className={campo.type === "password" ? "font-mono" : ""}
                />
                {campo.type === "password" && credenciais[campo.name] && (
                  <p className="text-xs text-muted-foreground">
                    {showSecrets ? credenciais[campo.name] : "•".repeat(8)}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? "Ocultar" : "Mostrar"} credenciais
              </Button>
            </div>
            <TesteConexaoButton
              erpTipo={erpTipo}
              credenciais={credenciais}
              disabled={progresso < 100 || disabled}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
