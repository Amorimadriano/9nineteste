import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TipoERP, CredenciaisERP } from "@/types/contabilidade";

interface TesteConexaoButtonProps {
  erpTipo: TipoERP;
  credenciais: CredenciaisERP;
  disabled?: boolean;
}

type StatusTeste = "idle" | "testing" | "success" | "error";

export function TesteConexaoButton({
  erpTipo,
  credenciais,
  disabled,
}: TesteConexaoButtonProps) {
  const [status, setStatus] = useState<StatusTeste>("idle");
  const [mensagem, setMensagem] = useState("")
  const [tempoResposta, setTempoResposta] = useState<number | null>(null);

  const testarConexao = async () => {
    setStatus("testing");
    setMensagem("");
    setTempoResposta(null);

    const inicio = Date.now();

    try {
      // Simulação de teste de conexão - substituir por chamada real à API
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulação: 80% de chance de sucesso
          if (Math.random() > 0.2) {
            resolve(true);
          } else {
            reject(new Error("Não foi possível conectar ao servidor. Verifique a URL e credenciais."));
          }
        }, 1500);
      });

      const tempo = Date.now() - inicio;
      setTempoResposta(tempo);
      setStatus("success");
      setMensagem(`Conexão estabelecida com sucesso em ${tempo}ms`);
    } catch (error) {
      setStatus("error");
      setMensagem(error instanceof Error ? error.message : "Erro desconhecido ao testar conexão");
    }
  };

  const getButtonConfig = () => {
    switch (status) {
      case "testing":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: "Testando...",
          variant: "outline" as const,
        };
      case "success":
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          text: "Conectado",
          variant: "default" as const,
        };
      case "error":
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: "Falha na conexão",
          variant: "destructive" as const,
        };
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: "Testar Conexão",
          variant: "outline" as const,
        };
    }
  };

  const config = getButtonConfig();

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={config.variant}
        onClick={testarConexao}
        disabled={disabled || status === "testing"}
        className="gap-2"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {config.icon}
            {config.text}
          </motion.div>
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {(status === "success" || status === "error") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              variant={status === "success" ? "default" : "destructive"}
              className={
                status === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 border-red-500/30"
              }
            >
              <div className="flex items-center gap-2">
                {status === "success" ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <AlertDescription>{mensagem}</AlertDescription>
              </div>
              {tempoResposta && status === "success" && (
                <p className="text-xs mt-1 ml-6 text-muted-foreground">
                  Latência: {tempoResposta}ms
                </p>
              )}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
