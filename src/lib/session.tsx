/**
 * Who is signed in, for the whole app.
 *
 * Where the token is kept is `token-store.ts` — the Keychain / Keystore on a
 * device, because it is a bearer credential: anything holding it is the user
 * until it expires.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, login as apiLogin, logout as apiLogout, me, setAuthToken, type Identity } from "./api";
import { clearToken, readToken, writeToken } from "./token-store";

type SessionState = {
  user: Identity | null;
  /** True until the stored token has been checked, so guards do not bounce a
      signed-in user to the login screen on every cold start. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  signIn: async () => "",
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore on launch. A stored token can be expired or revoked, so it is only
     trusted after the server confirms it. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await readToken();
        if (token) {
          setAuthToken(token);
          const identity = await me();
          if (!cancelled) setUser(identity);
        }
      } catch {
        setAuthToken(null);
        await clearToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: identity } = await apiLogin(email.trim().toLowerCase(), password);
      await writeToken(token);
      setAuthToken(token);
      setUser(identity);
      return "";
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) return "offline";
      if (e instanceof ApiError && e.status === 401) return "badCredentials";
      if (e instanceof ApiError && e.status === 429) return "tooMany";
      return "failed";
    }
  }, []);

  const signOut = useCallback(async () => {
    // Tell the server first so the session is actually revoked; drop the local
    // copy either way, or a failed call would leave the user stuck signed in.
    await apiLogout().catch(() => {});
    await clearToken();
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** Where each role lands after signing in. Staff use the separate admin
    console, so this app has nowhere to send them. */
export function homeFor(role: Identity["role"]): "/parent" | "/student" | "/teacher" | null {
  if (role === "Parent") return "/parent";
  if (role === "Student") return "/student";
  if (role === "Teacher") return "/teacher";
  return null;
}
