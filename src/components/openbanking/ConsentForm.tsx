import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Eye,
  Wallet,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";

export interface ConsentPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
  checked?: boolean;
}

export interface ConsentData {
  permissions: ConsentPermission[];
  expirationDays: number;
  acceptanceDate: Date;
}

interface ConsentFormProps {
  bankName: string;
  onSubmit: (consent: ConsentData) => void;
  onCancel?: () => void;
}

const defaultPermissions: ConsentPermission[] = [
  {
    id: "1",
    code: "ACCOUNTS_READ",
    name: "Consultar contas",
    description: "Acesso às informações de suas contas bancárias (saldo, tipo de conta, agência)",
    icon: <Wallet className="h-5 w-5" />,
    required: true,
    checked: true,
  },
  {
    id: "2",
    code: "TRANSACTIONS_READ",
    name: "Extrato e transações",
    description: "Acesso ao histórico de transações e extratos das suas contas",
    icon: <Receipt className="h-5 w-5" />,
    required: true,
    checked: true,
  },
  {
    id: "3",
    code: "BALANCES_READ",
    name: "Saldos em tempo real",
    description: "Consulta de saldos atualizados em tempo real",
    icon: <Eye className="h-5 w-5" />,
    required: false,
    checked: true,
  },
  {
    id: "4",
    code: "STATEMENTS_READ",
    name: "Informações adicionais",
    description: "Acesso a dados complementares sobre produtos e serviços",
    icon: <FileText className="h-5 w-5" />,
    required: false,
    checked: false,
  },
];

export function ConsentForm({ bankName, onSubmit, onCancel }: ConsentFormProps) {
  const [permissions, setPermissions] = useState<ConsentPermission[]>(defaultPermissions);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [expirationDays, setExpirationDays] = useState(90);

  const handlePermissionChange = (id: string, checked: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, checked } : p))
    );
  };

  const allRequiredChecked = permissions
    .filter((p) => p.required)
    .every((p) => p.checked);

  const canSubmit = allRequiredChecked && acceptTerms && acceptPrivacy;

  const handleSubmit = () => {
    onSubmit({
      permissions: permissions.filter((p) => p.checked),
      expirationDays,
      acceptanceDate: new Date(),
    });
  };

  const selectedCount = permissions.filter((p) => p.checked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Permissões de Acesso</h2>
        <p className="text-sm text-muted-foreground">
          O <strong>{bankName}</strong> solicita acesso aos seguintes dados:
        </p>
      </div>

      {/* Alerta de segurança */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Segurança garantida</AlertTitle>
        <AlertDescription className="text-blue-700 text-sm">
          Seus dados são protegidos pela LGPD e regulamentação do Banco Central.
          Você pode revogar o acesso a qualquer momento.
        </AlertDescription>
      </Alert>

      {/* Lista de permissões */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Permissões solicitadas</Label>
          <span className="text-xs text-muted-foreground">
            {selectedCount} de {permissions.length} selecionadas
          </span>
        </div>

        <div className="space-y-2">
          {permissions.map((permission) => (
            <motion.div
              key={permission.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`
                flex items-start gap-3 p-3 rounded-lg border transition-colors
                ${permission.checked ? "bg-primary/5 border-primary/20" : "bg-card border-border"}
              `}
            >
              <Checkbox
                id={permission.id}
                checked={permission.checked}
                onCheckedChange={(checked) =>
                  handlePermissionChange(permission.id, checked as boolean)
                }
                disabled={permission.required}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={permission.checked ? "text-primary" : "text-muted-foreground"}>
                    {permission.icon}
                  </span>
                  <Label
                    htmlFor={permission.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {permission.name}
                  </Label>
                  {permission.required && (
                    <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                      Obrigatório
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 pl-7">
                  {permission.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expiração do consentimento */}
      <div className="p-3 bg-muted rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Validade do consentimento</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Este acesso será válido por <strong>{expirationDays} dias</strong> e poderá ser
          renovado ou cancelado a qualquer momento.
        </p>
      </div>

      {/* Termos e privacidade */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
          />
          <div className="flex-1">
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              Li e aceito os{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Serviço do Open Banking
              </a>
            </Label>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="privacy"
            checked={acceptPrivacy}
            onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
          />
          <div className="flex-1">
            <Label htmlFor="privacy" className="text-sm cursor-pointer">
              Concordo com o uso dos meus dados conforme a{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </Label>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Voltar
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 gap-2"
        >
          <span>Continuar</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {!canSubmit && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-destructive text-center"
        >
          {!allRequiredChecked
            ? "Aceite todas as permissões obrigatórias para continuar"
            : "Aceite os termos e política de privacidade para continuar"}
        </motion.p>
      )}
    </div>
  );
}

export default ConsentForm;
