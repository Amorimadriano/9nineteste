import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Interface para o status de trial/assinatura
 * @interface TrialStatus
 */
interface TrialStatus {
  /** Indica se está carregando o status */
  loading: boolean;
  /** Indica se o trial expirou */
  expired: boolean;
  /** Dias restantes do trial (999 para assinatura ativa ou admin) */
  daysLeft: number;
  /** Data de término do trial */
  trialEnd: Date | null;
  /** Indica se há assinatura ativa */
  hasActiveSubscription: boolean;
}

/**
 * Hook para verificação de trial e assinatura
 *
 * Verifica se o usuário tem acesso ao sistema baseado em:
 * 1. Role admin (bypass total)
 * 2. Assinatura ativa na tabela `assinaturas`
 * 3. Trial ativo na tabela `user_trials`
 *
 * @returns Objeto TrialStatus com informações de acesso
 *
 * @example
 * ```typescript
 * function ProtectedRoute() {
 *   const { loading, expired, daysLeft, hasActiveSubscription } = useTrialGuard();
 *
 *   if (loading) return <Spinner />;
 *   if (expired && !hasActiveSubscription) return <TrialExpired />;
 *
 *   return <App />;
 * }
 * ```
 *
 * @see {@link https://supabase.com/docs/reference/javascript/select}
 */
export function useTrialGuard(): TrialStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    loading: true,
    expired: false,
    daysLeft: 0,
    trialEnd: null,
    hasActiveSubscription: false,
  });

  useEffect(() => {
    if (!user) {
      setStatus({ loading: false, expired: false, daysLeft: 0, trialEnd: null, hasActiveSubscription: false });
      return;
    }

    const checkTrial = async () => {
      // Admins bypass trial
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        setStatus({ loading: false, expired: false, daysLeft: 999, trialEnd: null, hasActiveSubscription: true });
        return;
      }

      // Check for active subscription
      const { data: subscription } = await supabase
        .from("assinaturas" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ativa")
        .maybeSingle();

      if (subscription) {
        setStatus({ loading: false, expired: false, daysLeft: 999, trialEnd: null, hasActiveSubscription: true });
        return;
      }

      const { data: trial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!trial) {
        setStatus({ loading: false, expired: true, daysLeft: 0, trialEnd: null, hasActiveSubscription: false });
        return;
      }

      const now = new Date();
      const trialEnd = new Date(trial.trial_end);
      const diffMs = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      setStatus({
        loading: false,
        expired: daysLeft <= 0,
        daysLeft,
        trialEnd,
        hasActiveSubscription: false,
      });
    };

    checkTrial();
  }, [user]);

  return status;
}
