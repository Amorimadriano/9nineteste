import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Wallet,
  BarChart3,
  Users,
  FileText,
  Settings,
  Receipt,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const featureCards = [
  {
    icon: Wallet,
    title: "Gestão de Contas",
    description: "Controle completo de contas a pagar e receber com emissão de boletos e importação CNAB 240.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "DRE e Relatórios",
    description: "Demonstração de Resultados e relatórios financeiros detalhados para tomada de decisão.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Receipt,
    title: "Conciliação Bancária",
    description: "Importe extratos OFX e PDFs de cartão para reconciliação automática de transações.",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Users,
    title: "Cadastros",
    description: "Gerencie clientes, fornecedores, categorias e bancos de forma organizada.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Planejamento",
    description: "Planejamento orçamentário e projeções financeiras para o crescimento da empresa.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: TrendingUp,
    title: "Análise ROI",
    description: "Calcule o retorno sobre investimento e ponto de equilíbrio financeiro.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

const quickSetupSteps = [
  { id: 1, label: "Configurar empresa", completed: false },
  { id: 2, label: "Cadastrar categorias", completed: false },
  { id: 3, label: "Adicionar bancos", completed: false },
  { id: 4, label: "Cadastrar clientes", completed: false },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [setupSteps, setSetupSteps] = useState(quickSetupSteps);
  const [hasStartedTour, setHasStartedTour] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      // Fetch user metadata
      const { data: userData } = await supabase.auth.getUser();
      const name = userData.user?.user_metadata?.nome || user.email?.split("@")[0] || "Usuário";
      setUserName(name);

      // Fetch empresa
      const { data: empresa } = await (supabase.from("empresa") as any)
        .select("nome_fantasia")
        .eq("user_id", user.id)
        .maybeSingle();

      if (empresa?.nome_fantasia) {
        setEmpresaNome(empresa.nome_fantasia);
        setSetupSteps((prev) => prev.map((step) =>
          step.id === 1 ? { ...step, completed: true } : step
        ));
      }

      // Check other setups
      const { data: categorias } = await (supabase.from("categorias") as any)
        .select("id")
        .eq("empresa_id", user.id)
        .limit(1);

      if (categorias && categorias.length > 0) {
        setSetupSteps((prev) => prev.map((step) =>
          step.id === 2 ? { ...step, completed: true } : step
        ));
      }

      const { data: bancos } = await (supabase.from("bancos_cartoes") as any)
        .select("id")
        .eq("empresa_id", user.id)
        .limit(1);

      if (bancos && bancos.length > 0) {
        setSetupSteps((prev) => prev.map((step) =>
          step.id === 3 ? { ...step, completed: true } : step
        ));
      }

      const { data: clientes } = await (supabase.from("clientes") as any)
        .select("id")
        .eq("empresa_id", user.id)
        .limit(1);

      if (clientes && clientes.length > 0) {
        setSetupSteps((prev) => prev.map((step) =>
          step.id === 4 ? { ...step, completed: true } : step
        ));
      }
    };

    fetchUserData();
  }, [user]);

  const completedStepsCount = setupSteps.filter((s) => s.completed).length;
  const progressPercentage = (completedStepsCount / setupSteps.length) * 100;

  const handleStartTour = () => {
    localStorage.setItem("onboarding-started", "true");
    setHasStartedTour(true);
    navigate("/", { state: { startTour: true } });
  };

  const handleSkipTour = () => {
    localStorage.setItem("onboarding-completed", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 pt-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-6 shadow-lg shadow-primary/25"
          >
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </motion.div>

          <h1 className="text-4xl font-bold mb-3">
            Bem-vindo,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {empresaNome
              ? `Sistema configurado para ${empresaNome}. Vamos começar?`
              : "Vamos configurar seu sistema financeiro e explorar as principais funcionalidades?"}
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-10"
        >
          <Card className="border-2 border-primary/10 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Configuração Inicial</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete estes passos para aproveitar ao máximo o sistema
                  </p>
                </div>
                <Badge variant={completedStepsCount === setupSteps.length ? "default" : "secondary"}>
                  {completedStepsCount}/{setupSteps.length} concluído
                </Badge>
              </div>

              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-primary to-primary/60"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {setupSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step.completed
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        step.completed ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Principais Funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="h-full group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8"
        >
          <Button
            size="lg"
            onClick={handleStartTour}
            className="gap-2 px-8 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/20 transition-shadow"
          >
            <Sparkles className="h-5 w-5" />
            Iniciar Tour Guiado
            <ArrowRight className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={handleSkipTour}
            className="text-muted-foreground"
          >
            <Clock className="h-4 w-4 mr-2" />
            Fazer depois
          </Button>
        </motion.div>

        {/* Footer tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center text-sm text-muted-foreground pb-8"
        >
          Dica: Você pode reiniciar o tour a qualquer momento através das Configurações
        </motion.p>
      </div>
    </div>
  );
}
