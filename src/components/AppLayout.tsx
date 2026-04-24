import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useGlobalFinancialRealtime } from "@/hooks/useGlobalFinancialRealtime";
import { useSeedCategories } from "@/hooks/useSeedCategories";
import { Outlet, useNavigate } from "react-router-dom";
import { Moon, Sun, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTrialGuard } from "@/hooks/useTrialGuard";
import { AdminNotifications } from "@/components/AdminNotifications";
import { AssistenteVirtual } from "@/components/AssistenteVirtual";

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
    }
  }, []);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(d => !d)} title={dark ? "Modo claro" : "Modo escuro"}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function AppLayout() {
  useGlobalFinancialRealtime();
  useSeedCategories();
  const trial = useTrialGuard();
  const navigate = useNavigate();

  const showTrialBanner = !trial.loading && !trial.hasActiveSubscription && trial.daysLeft > 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {showTrialBanner && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-amber-700 dark:text-amber-400">
                ⏳ Teste grátis: <strong>{trial.daysLeft} dia(s) restante(s)</strong>
              </span>
              <Button size="sm" onClick={() => navigate("/planos")} className="gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Assinar — R$ 199,90/mês
              </Button>
            </div>
          )}
          <header className="h-12 flex items-center justify-between border-b border-border bg-card px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-1">
              <AdminNotifications />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>

          {/* Assistente Virtual - disponível em todas as páginas */}
          <AssistenteVirtual />
        </div>
      </div>
    </SidebarProvider>
  );
}
