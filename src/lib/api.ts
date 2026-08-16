/**
 * Backend client.
 *
 * Unlike the two web apps there is no same-origin proxy to hide the token
 * behind — a native app has no origin. The token is therefore held by the app
 * and attached here, which is why it lives in expo-secure-store (Keychain /
 * Keystore) rather than AsyncStorage, where any other process could read it.
 */
import Constants from "expo-constants";

/** Configured per build. The Expo Go default points at a dev machine, which is
    useless on a phone — a device cannot reach the laptop's localhost — so a
    LAN address or the deployed API has to be supplied. */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:8790";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type Identity = {
  userAccountId: string;
  email: string;
  role: "Admin" | "Receptionist" | "Teacher" | "Parent" | "Student";
  displayName: string;
  languagePreference: "EN" | "TH";
  themePreference: string;
  parentId?: string;
  teacherId?: string;
  studentId?: string;
};

/** Set by the session provider so every call carries the current token without
    each caller threading it through. */
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** The event-stream reader needs the raw token: it builds its own XHR and
    cannot go through `request`. */
export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // A phone loses signal constantly; this is an expected state, not a crash.
    throw new ApiError(0, "offline");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? `request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T,>(path: string) => request<T>("GET", path),
  post: <T,>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T,>(path: string, body: unknown) => request<T>("PATCH", path, body),
  del: <T,>(path: string) => request<T>("DELETE", path),
};

export const login = (email: string, password: string) =>
  api.post<{ token: string; user: Identity }>("auth/login", { email, password });

export const me = () => api.get<Identity>("auth/me");

export const logout = () => api.post<{ status: string }>("auth/logout");

export const forgotPassword = (email: string) =>
  api.post<{ status: string }>("auth/forgot-password", { email });
