/**
 * Who is signed in, for the whole app.
 *
 * Where the token is kept is `token-store.ts` — the Keychain / Keystore on a
 * device, because it is a bearer credential: anything holding it is the user
 * until it expires.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, login as apiLogin, logout as apiLogout, me, setAuthToken, type Identity } from "./api";
import { clearsSession } from "./session-recovery";
import { clearToken, readToken, writeToken } from "./token-store";

type SessionState = {
  user: Identity | null;
  /** True until the stored token has been checked, so guards do not bounce a
      signed-in user to the login screen on every cold start. */
  loading: boolean;
  /** A stored token that the server could not be asked about. */
  offline: boolean;
  /** Ask again — the guard's "Try again" button. */
  retry: () => void;
  signIn: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  offline: false,
  retry: () => {},
  signIn: async () => "",
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  /* The token is good but the server did not answer — not the same as being
     signed out, and the guard says so rather than bouncing to sign-in. */
  const [offline, setOffline] = useState(false);

  /* Restore on launch. A stored token can be expired or revoked, so it is only
     trusted after the server confirms it.

     What the server could not *answer* is a different thing from what it
     refused. This used to clear the token on any failure at all, so a tunnel
     or a dropped Wi-Fi signed a parent out and asked for their password
     again — and the portal behind it looked like a session that had expired
     rather than a network that had gone. Only a rejection clears it now. */
  const restore = useCallback(async () => {
    try {
      const token = await readToken();
      if (!token) return;
      setAuthToken(token);
      const identity = await me();
      setUser(identity);
      setOffline(false);
    } catch (e) {
      if (clearsSession(e)) {
        setAuthToken(null);
        await clearToken();
      } else {
        setOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  const retry = useCallback(() => {
    setLoading(true);
    void restore();
  }, [restore]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: identity } = await apiLogin(email.trim().toLowerCase(), password);
      await writeToken(token);
      setAuthToken(token);
      setUser(identity);
      setOffline(false);
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
    setOffline(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, offline, retry, signIn, signOut }),
    [user, loading, offline, retry, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** Where each role lands after signing in. Staff use the separate admin
    console, so this app has nowhere to send them — and neither does Teacher:
    the academy has no teacher workflow, so no teacher accounts are issued. */
export function homeFor(role: Identity["role"]): "/parent" | "/student" | null {
  if (role === "Parent") return "/parent";
  if (role === "Student") return "/student";
  return null;
}
