/**
 * A student's own Lichess link.
 *
 * The academy sees everything played here and nothing played at home, so this
 * is the half of a pupil's chess the school is otherwise blind to.
 *
 * Only reads and the student's own link — a pupil can link their own account
 * and nobody else's, and the server enforces that rather than trusting this.
 */
import { api } from "./api";

export type LichessRating = {
  perf: string;
  rating: number;
  games: number;
  provisional: boolean;
};

export type LichessLink = {
  studentId: string;
  username: string;
  lichessId: string;
  verified: boolean;
  addedByStaff: boolean;
  linkedAt: string;
  syncedAt?: string;
  ratings: LichessRating[];
  /** Present only while a link is unverified, and only for its owner. */
  verifyCode?: string;
  profileUrl: string;
};

export type MyLichess = { linked: false } | { linked: true; link: LichessLink };

/**
 * Whether this student can play a game that actually counts on Lichess.
 *
 * Separate from `verified` on purpose. Pasting a code into a bio proves an
 * account is yours; it does not let the academy move your pieces. Only an OAuth
 * grant does that, and a pupil who only wants their rating on the wall should
 * not have to give one.
 */
export type LichessPlayStatus = {
  canPlay: boolean;
  username?: string;
  expiresAt?: string;
  /** Lichess tokens last a year and cannot be refreshed — only re-granted. */
  expiringSoon: boolean;
  /** True when a parent or teacher holds the account, as under-13s require. */
  managed: boolean;
};

export const getMyLichess = () => api.get<MyLichess>("lichess/me");

export const linkLichess = (username: string) =>
  api.post<{ username: string; verifyCode?: string }>("lichess/link", { username });

export const verifyLichess = () =>
  api.post<{ verified: boolean; reason?: string }>("lichess/verify");

export const unlinkLichess = () => api.del<{ linked: boolean }>("lichess/link");

export const getLichessPlayStatus = () => api.get<LichessPlayStatus>("lichess/play-status");

/**
 * Begins the OAuth grant and hands back where to send the browser.
 *
 * The server returns a URL rather than redirecting, because the caller here is
 * a fetch: a 302 would be followed by the fetch instead of by the person, and
 * they would never see Lichess's consent screen. On a phone that URL goes to
 * `WebBrowser.openAuthSessionAsync`, so the grant happens in a real browser
 * with the pupil's own Lichess session rather than inside a WebView.
 */
export async function startLichessOAuth(returnTo: string): Promise<string> {
  const { authorizeUrl } = await api.post<{ authorizeUrl: string }>("lichess/oauth/start", {
    returnTo,
  });
  return authorizeUrl;
}

/** The game types worth showing a child, in the order a coach would read them. */
export const PERF_ORDER = ["bullet", "blitz", "rapid", "classical", "puzzle"];

export function sortRatings(ratings: LichessRating[]): LichessRating[] {
  return [...ratings].sort((a, b) => PERF_ORDER.indexOf(a.perf) - PERF_ORDER.indexOf(b.perf));
}
