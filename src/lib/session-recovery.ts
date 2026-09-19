/**
 * What a failed session check means.
 *
 * Two failures look the same from the call site and are not the same thing: a
 * server that *rejected* the token, and a server that never answered. Clearing
 * the token on both signs a parent out every time the train goes into a
 * tunnel — and their password does not fix it, because nothing was wrong with
 * it.
 *
 * Kept out of `session.tsx` so it can be tested: anything importing
 * `expo-secure-store` or `react-native` drags in native modules the test
 * runner cannot load. Same reason `portal-tabs.ts` lives apart from
 * `PortalNav.tsx`.
 */
import { ApiError } from "./api";

/**
 * Whether a failure while checking a stored token should throw that token
 * away.
 *
 * `false` for an unreachable server — the token is untested, not refused, and
 * the app says so and offers to try again. `true` for anything the server
 * answered, which includes 401 (revoked or expired) and 403, and for a reply
 * this app could not parse: a token it cannot verify is not one to keep.
 */
export function clearsSession(e: unknown): boolean {
  return !(e instanceof ApiError && e.status === 0);
}
