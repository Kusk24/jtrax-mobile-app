/**
 * URL state, the rules — where a person is on a screen (a tab, a step, a
 * filter) is kept in the route's params, so the web build's refresh and a
 * deep link land on the same screen, and Android's Back steps back through a
 * flow instead of leaving it.
 *
 * Kept apart from the hooks in `use-url-state.ts` so it can be tested: the
 * hooks import expo-router, which the test runner cannot load.
 */

/** `raw` if it is one of `allowed`, otherwise `fallback`. Route params can be
    an array when a key repeats; the first one counts. */
export function pickParam<T extends string>(
  raw: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const one = Array.isArray(raw) ? raw[0] : raw;
  return one !== undefined && (allowed as readonly string[]).includes(one) ? (one as T) : fallback;
}

/** The step Back returns to from `step`, or null when Back should leave. */
export function stepBefore<T extends string>(step: T, order: readonly T[]): T | null {
  const i = order.indexOf(step);
  return i > 0 ? order[i - 1] : null;
}

/* Form drafts, kept in memory for the life of the app: leaving the screen and
   coming back finds them filled in, but nothing typed — a child's name and
   date of birth — is ever written to the phone's storage. */
const drafts = new Map<string, unknown>();

export function readDraft<T>(key: string): T | undefined {
  return drafts.get(key) as T | undefined;
}

export function writeDraft<T>(key: string, value: T | undefined) {
  if (value === undefined) drafts.delete(key);
  else drafts.set(key, value);
}
