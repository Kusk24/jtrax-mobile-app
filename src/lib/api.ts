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
  if (body instanceof FormData) return upload<T>(method, path, body);
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

/* A multipart upload — a photo of an ID card. Through XMLHttpRequest, not
   fetch: the fetch Expo installs refuses React Native's file parts
   ({ uri, name, type }), which are the only way to send a photo by its URI.
   No Content-Type of ours either: the request writes the boundary into it. */
function upload<T>(method: string, path: string, form: FormData): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}/api/v1/${path}`);
    if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    xhr.onload = () => {
      let data: unknown = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON: the status says what happened */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(xhr.status, (data as { error?: string }).error ?? `request failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new ApiError(0, "offline"));
    xhr.send(form);
  });
}

export const api = {
  get: <T,>(path: string) => request<T>("GET", path),
  post: <T,>(path: string, body?: unknown) => request<T>("POST", path, body),
  /** A multipart upload — a photo, as the ID card scan takes it. */
  postForm: <T,>(path: string, form: FormData) => request<T>("POST", path, form),
  put: <T,>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T,>(path: string, body: unknown) => request<T>("PATCH", path, body),
  /** A body is rare on a delete, but unregistering a push token names the
      token in one — it is not something to put in a URL. */
  del: <T,>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};

export const login = (email: string, password: string) =>
  api.post<{ token: string; user: Identity }>("auth/login", { email, password });

export const me = () => api.get<Identity>("auth/me");

export const logout = () => api.post<{ status: string }>("auth/logout");

export const forgotPassword = (email: string) =>
  api.post<{ status: string }>("auth/forgot-password", { email });

/** Replaces the signed-in person's password; other devices are signed out. */
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post<{ status: string }>("auth/change-password", { currentPassword, newPassword });
