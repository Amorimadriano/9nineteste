/**
 * Modal de configuração de certificado digital A1 para NFS-e
 * Permite upload de arquivo PFX/P12 e gerenciamento do certificado
 */
import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileCheck,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
  Download,
} from "lucide-react";

interface CertificadoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
  certificadoAtual?: {
    id: string;
    nome: string;
    valido_ate: string;
    ativo: boolean;
    arquivo_path?: string;
  } | null;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function CertificadoConfigModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  certificadoAtual,
}: CertificadoConfigModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [certificadoInfo, setCertificadoInfo] = useState<{
    emitidoPara: string;
    cnpj: string;
    validoAte: string;
    emissor: string;
  } | null>(null);

  // Validações
  const validarArquivo = (file: File): string | null => {
    const extensao = file.name.split(".").pop()?.toLowerCase();
    if (!extensao || !["pfx", "p12"].includes(extensao)) {
      return "Formato inválido. Selecione um arquivo .pfx ou .p12";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "Arquivo muito grande. Tamanho máximo: 10MB";
    }
    return null;
  };

  // Handler de seleção de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErro(null);
    setCertificadoInfo(null);

    if (!file) return;

    const erroValidacao = validarArquivo(file);
    if (erroValidacao) {
      setErro(erroValidacao);
      setArquivoSelecionado(null);
      return;
    }

    setArquivoSelecionado(file);
  }, []);

  // Converter arquivo para Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Validar certificado via Edge Function
  const validarCertificado = async (base64: string, senhaCert: string) => {
    try {
      setIsValidating(true);
      const { data, error } = await supabase.functions.invoke("validar-certificado-nfse", {
        body: {
          certificadoBase64: base64,
          senha: senhaCert,
        },
      });

      if (error) throw error;

      if (!data.valido) {
        throw new Error(data.mensagem || "Certificado inválido");
      }

      setCertificadoInfo({
        emitidoPara: data.emitidoPara,
        cnpj: data.cnpj,
        validoAte: data.validoAte,
        emissor: data.emissor,
      });

      return true;
    } catch (error: any) {
      setErro(error.message || "Erro ao validar certificado");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Upload do certificado
  const handleUpload = async () => {
    if (!arquivoSelecionado || !senha) {
      setErro("Selecione um arquivo e informe a senha do certificado");
      return;
    }

    // Obter usuário autenticado do Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    // Debug logs
    console.log("[CertificadoConfig] Auth check:", {
      hasUser: !!authUser,
      userId: authUser?.id,
      authError: authError?.message,
      sessionUser: authUser?.email
    });

    if (!authUser?.id) {
      setErro("Usuário não autenticado. Faça login novamente.");
      return;
    }

    const userIdReal = authUser.id;

    try {
      setIsUploading(true);
      setErro(null);

      // Converter para Base64
      const base64 = await fileToBase64(arquivoSelecionado);

      // Validar certificado
      const valido = await validarCertificado(base64, senha);
      if (!valido) {
        setIsUploading(false);
        return;
      }

      // Upload para o Supabase Storage
      const fileName = `${userIdReal}/${Date.now()}_${arquivoSelecionado.name}`;
      console.log("[CertificadoConfig] Uploading to storage:", fileName);

      const { error: uploadError } = await supabase.storage
        .from("certificados-nfse")
        .upload(fileName, arquivoSelecionado, {
          upsert: true,
          contentType: "application/x-pkcs12",
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        if (uploadError.message?.includes("bucket")) {
          throw new Error("Bucket de storage não encontrado. Verifique se o bucket 'certificados-nfse' foi criado no Supabase.");
        }
        throw uploadError;
      }

      // Verificar se já existe certificado para este usuário
      console.log("[CertificadoConfig] Checking existing certificado for user:", userIdReal);
      const { data: existingCert } = await supabase
        .from("certificados_nfse")
        .select("id, user_id")
        .eq("user_id", userIdReal)
        .maybeSingle();

      console.log("[CertificadoConfig] Existing certificado:", existingCert);

      // Preparar dados
      const certificadoData = {
        user_id: userIdReal,
        nome: arquivoSelecionado.name,
        arquivo_path: fileName,
        valido_ate: certificadoInfo?.validoAte,
        cnpj: certificadoInfo?.cnpj,
        ativo: true,
        updated_at: new Date().toISOString(),
      };

      let dbError;

      if (existingCert) {
        // UPDATE - certificado já existe
        console.log("[CertificadoConfig] Updating existing certificado:", existingCert.id);
        const { error } = await supabase
          .from("certificados_nfse")
          .update(certificadoData)
          .eq("id", existingCert.id)
          .eq("user_id", userIdReal); // Garantia extra de segurança
        dbError = error;
      } else {
        // INSERT - novo certificado
        console.log("[CertificadoConfig] Inserting new certificado for user:", userIdReal);
        const { error } = await supabase
          .from("certificados_nfse")
          .insert(certificadoData);
        dbError = error;
      }

      if (dbError) {
        console.error("[CertificadoConfig] Erro ao salvar no banco:", dbError);

        // Tratamento específico de erros RLS
        if (dbError.message?.includes("row-level security")) {
          console.error("[CertificadoConfig] RLS Error Details:", {
            userId: userIdReal,
            code: dbError.code,
            hint: dbError.hint,
            details: dbError.details
          });
          throw new Error(
            "Erro de permissão (RLS). Verifique se você está logado ou contate o suporte. " +
            "Código: " + dbError.code
          );
        }

        if (dbError.message?.includes("relation") && dbError.message?.includes("certificados_nfse")) {
          throw new Error("Tabela 'certificados_nfse' não encontrada. Execute a migração SQL correspondente.");
        }

        throw dbError;
      }

      console.log("[CertificadoConfig] Certificado salvo com sucesso");

      toast({
        title: "Certificado configurado",
        description: "O certificado digital foi configurado com sucesso.",
      });

      onSuccess?.();
      handleClose();

    } catch (error: any) {
      console.error("[CertificadoConfig] Erro no upload:", error);
      setErro(error.message || "Erro ao fazer upload do certificado");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Remover certificado
  const handleRemove = async () => {
    if (!certificadoAtual?.id) return;

    try {
      setIsRemoving(true);

      // Remover do Storage se houver arquivo
      if (certificadoAtual.arquivo_path) {
        await supabase.storage
          .from("certificados-nfse")
          .remove([certificadoAtual.arquivo_path]);
      }

      // Desativar no banco (não remover completamente para histórico)
      const { error } = await supabase
        .from("certificados_nfse")
        .update({ ativo: false })
        .eq("id", certificadoAtual.id);

      if (error) throw error;

      toast({
        title: "Certificado removido",
        description: "O certificado foi removido com sucesso.",
      });

      onSuccess?.();
      handleClose();

    } catch (error: any) {
      setErro(error.message || "Erro ao remover certificado");
    } finally {
      setIsRemoving(false);
    }
  };

  // Fechar modal e limpar estados
  const handleClose = () => {
    setArquivoSelecionado(null);
    setSenha("");
    setErro(null);
    setCertificadoInfo(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  // Calcular dias para expirar
  const diasParaExpirar = certificadoAtual?.valido_ate
    ? Math.ceil(
        (new Date(certificadoAtual.valido_ate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isExpirado = diasParaExpirar !== null && diasParaExpirar <= 0;
  const isProximoExpirar = diasParaExpirar !== null && diasParaExpirar <= 30 && diasParaExpirar > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurar Certificado Digital
          </DialogTitle>
          <DialogDescription>
            Configure seu certificado digital A1 (.pfx ou .p12) para emitir notas fiscais de serviço eletrônica.
          </DialogDescription>
        </DialogHeader>

        {/* Certificado atual */}
        {certificadoAtual?.ativo && (
          <Card className={isExpirado ? "border-red-500" : isProximoExpirar ? "border-amber-500" : "border-green-500"}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isExpirado ? (
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileCheck className="h-5 w-5 text-green-500" />
                    )}
                    <span className="font-medium">{certificadoAtual.nome}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Válido até: {new Date(certificadoAtual.valido_ate).toLocaleDateString("pt-BR")}
                  </p>
                  {diasParaExpirar !== null && (
                    <p className={`text-sm ${isExpirado ? "text-red-600" : isProximoExpirar ? "text-amber-600" : "text-green-600"}`}>
                      {isExpirado
                        ? "Certificado expirado"
                        : isProximoExpirar
                        ? `Expira em ${diasParaExpirar} dias`
                        : `Válido por mais ${diasParaExpirar} dias`}
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de upload */}
        {(!certificadoAtual?.ativo || arquivoSelecionado) && (
          <div className="space-y-6">
            {/* Área de upload */}
            <div className="space-y-2">
              <Label>Arquivo do Certificado (.pfx ou .p12)</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  arquivoSelecionado
                    ? "border-green-500 bg-green-50"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {arquivoSelecionado ? (
                  <div className="space-y-2">
                    <FileCheck className="h-8 w-8 mx-auto text-green-500" />
                    <p className="font-medium">{arquivoSelecionado.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(arquivoSelecionado.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setArquivoSelecionado(null);
                        setCertificadoInfo(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste o arquivo aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: .pfx, .p12 (máx. 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Campo de senha */}
            {arquivoSelecionado && (
              <div className="space-y-2">
                <Label htmlFor="senha-certificado">Senha do Certificado</Label>
                <div className="relative">
                  <Input
                    id="senha-certificado"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha do certificado"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A senha é necessária para validar e usar o certificado.
                </p>
              </div>
            )}

            {/* Progresso de upload */}
            {uploadProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enviando...</span>
                  <span>{uploadProgress.percentage}%</span>
                </div>
                <Progress value={uploadProgress.percentage} />
              </div>
            )}

            {/* Informações do certificado validado */}
            {certificadoInfo && (
              <Alert className="border-green-500 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Certificado válido</AlertTitle>
                <AlertDescription className="text-green-700 space-y-1">
                  <p><strong>Emitido para:</strong> {certificadoInfo.emitidoPara}</p>
                  <p><strong>CNPJ:</strong> {certificadoInfo.cnpj}</p>
                  <p><strong>Válido até:</strong> {new Date(certificadoInfo.validoAte).toLocaleDateString("pt-BR")}</p>
                  <p><strong>Emissor:</strong> {certificadoInfo.emissor}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Erro */}
            {erro && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {(!certificadoAtual?.ativo || arquivoSelecionado) && (
            <Button
              onClick={handleUpload}
              disabled={!arquivoSelecionado || !senha || isUploading || isValidating}
            >
              {isUploading || isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isValidating ? "Validando..." : "Enviando..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Configurar Certificado
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
