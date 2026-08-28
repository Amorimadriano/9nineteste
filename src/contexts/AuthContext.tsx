import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const MAX_SESSION_AGE_MS = 2 * 60 * 60 * 1000;
const SESSION_STARTED_AT_KEY = "auth-session-started-at";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const logoutTimerRef = useRef<number | null>(null);
  const signingOutRef = useRef(false);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current !== null) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const clearStoredSessionStart = () => {
    localStorage.removeItem(SESSION_STARTED_AT_KEY);
  };

  const getStoredSessionStart = () => {
    const value = localStorage.getItem(SESSION_STARTED_AT_KEY);
    if (!value) return null;

    const timestamp = Number(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  };

  const getFallbackSessionStart = (authSession: Session) => {
    const lastSignInAt = authSession.user.last_sign_in_at
      ? Date.parse(authSession.user.last_sign_in_at)
      : NaN;

    return Number.isFinite(lastSignInAt) ? lastSignInAt : Date.now();
  };

  const persistSessionStart = (timestamp: number) => {
    localStorage.setItem(SESSION_STARTED_AT_KEY, String(timestamp));
  };

  const getSessionStart = (authSession: Session, isNewLogin: boolean) => {
    if (isNewLogin) {
      const startedAt = Date.now();
      persistSessionStart(startedAt);
      return startedAt;
    }

    const storedTimestamp = getStoredSessionStart();
    if (storedTimestamp !== null) {
      return storedTimestamp;
    }

    const fallbackTimestamp = getFallbackSessionStart(authSession);
    persistSessionStart(fallbackTimestamp);
    return fallbackTimestamp;
  };

  const resetAuthState = () => {
    clearLogoutTimer();
    clearStoredSessionStart();
    setSession(null);
    setUser(null);
  };

  const signOutDueToExpiration = async () => {
    if (signingOutRef.current) return;

    signingOutRef.current = true;
    resetAuthState();

    try {
      await supabase.auth.signOut();
    } finally {
      signingOutRef.current = false;
    }
  };

  const scheduleSessionExpiration = (startedAt: number) => {
    clearLogoutTimer();

    const remainingMs = MAX_SESSION_AGE_MS - (Date.now() - startedAt);

    if (remainingMs <= 0) {
      void signOutDueToExpiration();
      return;
    }

    logoutTimerRef.current = window.setTimeout(() => {
      void signOutDueToExpiration();
    }, remainingMs);
  };

  const applySession = async (authSession: Session | null, isNewLogin: boolean) => {
    if (!authSession) {
      resetAuthState();
      return;
    }

    const startedAt = getSessionStart(authSession, isNewLogin);

    if (Date.now() - startedAt >= MAX_SESSION_AGE_MS) {
      await signOutDueToExpiration();
      return;
    }

    scheduleSessionExpiration(startedAt);
    setSession(authSession);
    setUser(authSession.user);
  };

  useEffect(() => {
    // Verificar sessão inicial primeiro
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session, false);
      initializedRef.current = true;
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (initializedRef.current) {
          void applySession(session, event === "SIGNED_IN");
        }
        setLoading(false);
      }
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const startedAt = getStoredSessionStart();
      if (startedAt !== null && Date.now() - startedAt >= MAX_SESSION_AGE_MS) {
        void signOutDueToExpiration();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      clearLogoutTimer();
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    resetAuthState();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
