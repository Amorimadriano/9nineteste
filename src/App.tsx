import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { useTrialGuard } from "@/hooks/useTrialGuard";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AppLayout } from "@/components/AppLayout";
import OnboardingTour from "@/components/OnboardingTour";
import { Suspense, lazy, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Importação estática de páginas críticas (primeiro carregamento)
import Auth from "./pages/Auth";
import TrialExpired from "./pages/TrialExpired";
import ResetPassword from "./pages/ResetPassword";
import Site from "./pages/Site";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import SimuladorIbsCbs from "./pages/SimuladorIbsCbs";

// Página de boas-vindas com onboarding
// const Welcome = lazy(() => import("./pages/Welcome"));

// Lazy loading de páginas pesadas - Code Splitting por rotas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ContasReceber = lazy(() => import("./pages/ContasReceber"));
const ContasPagar = lazy(() => import("./pages/ContasPagar"));
const FluxoCaixa = lazy(() => import("./pages/FluxoCaixa"));
const DRE = lazy(() => import("./pages/DRE"));
const PlanejamentoOrcamentario = lazy(() => import("./pages/PlanejamentoOrcamentario"));
const FechamentoMes = lazy(() => import("./pages/FechamentoMes"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Empresa = lazy(() => import("./pages/Empresa"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const BancosCartoes = lazy(() => import("./pages/BancosCartoes"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const ConciliacaoBancaria = lazy(() => import("./pages/ConciliacaoBancaria"));
const ConciliacaoCartao = lazy(() => import("./pages/ConciliacaoCartao"));
const TransferenciasContas = lazy(() => import("./pages/TransferenciasContas"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const AuditoriaRecebiveis = lazy(() => import("./pages/AuditoriaRecebiveis"));
const Leads = lazy(() => import("./pages/Leads"));
const LicencasSoftware = lazy(() => import("./pages/LicencasSoftware"));
const Planos = lazy(() => import("./pages/Planos"));
const ReguaCobranca = lazy(() => import("./pages/ReguaCobranca"));
const OpenBankingConfig = lazy(() => import("./pages/OpenBankingConfig"));
const Cnab240 = lazy(() => import("./pages/Cnab240"));
const Contador = lazy(() => import("./pages/Contador"));
const ROI = lazy(() => import("./pages/ROI"));
const PontoEquilibrio = lazy(() => import("./pages/PontoEquilibrio"));
const NFSeEmissao = lazy(() => import("./pages/NFSeEmissao"));
const NFSeHistorico = lazy(() => import("./pages/NFSeHistorico"));
const ContabilidadeIntegracao = lazy(() => import("./pages/ContabilidadeIntegracao"));
const PlanoContas = lazy(() => import("./pages/PlanoContas"));
const ConsultaCnpjCpf = lazy(() => import("./pages/ConsultaCnpjCpf"));
const ConsultaScoreSerasa = lazy(() => import("./pages/ConsultaScoreSerasa"));
const EmailMarketing = lazy(() => import("./pages/EmailMarketing"));
const CardAudit = lazy(() => import("./pages/CardAudit"));

// Componente de loading para Suspense
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-4xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

// QueryClient otimizado com configurações de cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados ficam frescos por 1 minuto
      staleTime: 1000 * 60 * 1,
      // Cache é mantido por 5 minutos após a última uso
      gcTime: 1000 * 60 * 5,
      // Não refetch automaticamente ao focar a janela (performance)
      refetchOnWindowFocus: false,
      // Retry com backoff exponencial
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry para mutações
      retry: 1,
    },
  },
});

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const trial = useTrialGuard();
  const { hasCompletedOnboarding, hasStartedOnboarding, showTour, startTour, closeTour, completeOnboarding } = useOnboarding();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // Aguardar completamente o carregamento da sessão
  useEffect(() => {
    // Dar um tempo adicional para o Supabase estabilizar a sessão
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check if should start tour from navigation state
  useEffect(() => {
    if (location.state?.startTour) {
      startTour();
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location, startTour]);

  // Mostrar loading enquanto inicializa ou carrega dados
  if (loading || trial.loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Só redirecionar se estiver pronto e não houver usuário
  if (!user) return <Navigate to="/login" replace />;

  if (trial.expired && !trial.hasActiveSubscription) {
    return <TrialExpired />;
  }

  // Redirect to welcome page if onboarding not started
  if (!hasStartedOnboarding && !hasCompletedOnboarding && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      <AppLayout />
      <OnboardingTour
        isOpen={showTour}
        onClose={closeTour}
        onComplete={completeOnboarding}
      />
    </>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <EmpresaProvider>
          <AuthProvider>
            <Routes>
              <Route path="/site" element={<Site />} />
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/" element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="/contas-receber" element={
                <Suspense fallback={<PageLoader />}>
                  <ContasReceber />
                </Suspense>
              } />
              <Route path="/contas-pagar" element={
                <Suspense fallback={<PageLoader />}>
                  <ContasPagar />
                </Suspense>
              } />
              <Route path="/transferencias-contas" element={
                <Suspense fallback={<PageLoader />}>
                  <TransferenciasContas />
                </Suspense>
              } />
              <Route path="/conciliacao-bancaria" element={
                <Suspense fallback={<PageLoader />}>
                  <ConciliacaoBancaria />
                </Suspense>
              } />
              <Route path="/conciliacao-cartao" element={
                <Suspense fallback={<PageLoader />}>
                  <ConciliacaoCartao />
                </Suspense>
              } />
              <Route path="/fluxo-caixa" element={
                <Suspense fallback={<PageLoader />}>
                  <FluxoCaixa />
                </Suspense>
              } />
              <Route path="/dre" element={
                <Suspense fallback={<PageLoader />}>
                  <DRE />
                </Suspense>
              } />
              <Route path="/planejamento-orcamentario" element={
                <Suspense fallback={<PageLoader />}>
                  <PlanejamentoOrcamentario />
                </Suspense>
              } />
              <Route path="/fechamento-mes" element={
                <Suspense fallback={<PageLoader />}>
                  <FechamentoMes />
                </Suspense>
              } />
              <Route path="/empresa" element={
                <Suspense fallback={<PageLoader />}>
                  <Empresa />
                </Suspense>
              } />
              <Route path="/licencas-software" element={
                <Suspense fallback={<PageLoader />}>
                  <LicencasSoftware />
                </Suspense>
              } />
              <Route path="/categorias" element={
                <Suspense fallback={<PageLoader />}>
                  <Categorias />
                </Suspense>
              } />
              <Route path="/plano-contas" element={
                <Suspense fallback={<PageLoader />}>
                  <PlanoContas />
                </Suspense>
              } />
              <Route path="/clientes" element={
                <Suspense fallback={<PageLoader />}>
                  <Clientes />
                </Suspense>
              } />
              <Route path="/fornecedores" element={
                <Suspense fallback={<PageLoader />}>
                  <Fornecedores />
                </Suspense>
              } />
              <Route path="/bancos-cartoes" element={
                <Suspense fallback={<PageLoader />}>
                  <BancosCartoes />
                </Suspense>
              } />
              <Route path="/configuracoes" element={
                <Suspense fallback={<PageLoader />}>
                  <Configuracoes />
                </Suspense>
              } />
              <Route path="/usuarios" element={
                <Suspense fallback={<PageLoader />}>
                  <Usuarios />
                </Suspense>
              } />
              <Route path="/relatorios" element={
                <Suspense fallback={<PageLoader />}>
                  <Relatorios />
                </Suspense>
              } />
              <Route path="/auditoria" element={
                <Suspense fallback={<PageLoader />}>
                  <Auditoria />
                </Suspense>
              } />
              <Route path="/auditoria-recebiveis" element={
                <Suspense fallback={<PageLoader />}>
                  <AuditoriaRecebiveis />
                </Suspense>
              } />
              <Route path="/leads" element={
                <Suspense fallback={<PageLoader />}>
                  <Leads />
                </Suspense>
              } />
              <Route path="/roi" element={
                <Suspense fallback={<PageLoader />}>
                  <ROI />
                </Suspense>
              } />
              <Route path="/regua-cobranca" element={
                <Suspense fallback={<PageLoader />}>
                  <ReguaCobranca />
                </Suspense>
              } />
              <Route path="/cnab240" element={
                <Suspense fallback={<PageLoader />}>
                  <Cnab240 />
                </Suspense>
              } />
              <Route path="/contador" element={
                <Suspense fallback={<PageLoader />}>
                  <Contador />
                </Suspense>
              } />
              <Route path="/ponto-equilibrio" element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <PontoEquilibrio />
                  </Suspense>
                </ErrorBoundary>
              } />
              <Route path="/planos" element={
                <Suspense fallback={<PageLoader />}>
                  <Planos />
                </Suspense>
              } />
              <Route path="/open-banking" element={
                <Suspense fallback={<PageLoader />}>
                  <OpenBankingConfig />
                </Suspense>
              } />
              <Route path="/nfse" element={
                <Suspense fallback={<PageLoader />}>
                  <NFSeEmissao />
                </Suspense>
              } />
              <Route path="/nfse-historico" element={
                <Suspense fallback={<PageLoader />}>
                  <NFSeHistorico />
                </Suspense>
              } />
              <Route path="/integracao-contabil" element={
                <Suspense fallback={<PageLoader />}>
                  <ContabilidadeIntegracao />
                </Suspense>
              } />
              <Route path="/consulta-cnpj-cpf" element={
                <Suspense fallback={<PageLoader />}>
                  <ConsultaCnpjCpf />
                </Suspense>
              } />
              <Route path="/consulta-score-serasa" element={
                <Suspense fallback={<PageLoader />}>
                  <ConsultaScoreSerasa />
                </Suspense>
              } />
              <Route path="/simulador-ibs-cbs" element={
                <Suspense fallback={<PageLoader />}>
                  <SimuladorIbsCbs />
                </Suspense>
              } />
              <Route path="/email-marketing" element={
                <Suspense fallback={<PageLoader />}>
                  <EmailMarketing />
                </Suspense>
              } />
              <Route path="/card-audit" element={
                <Suspense fallback={<PageLoader />}>
                  <CardAudit />
                </Suspense>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </EmpresaProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
