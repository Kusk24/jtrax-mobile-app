/**
 * The name a pupil chooses for the student screens, tidied the way the web's
 * useStudentData does before it is saved: trimmed, runs of spaces made one,
 * and no longer than the 40 characters the field allows.
 */
export const DISPLAY_NAME_MAX = 40;

/** "" when nothing is left — the caller does not save an empty name. */
export function cleanDisplayName(input: string): string {
  return input.trim().replace(/\s+/g, " ").slice(0, DISPLAY_NAME_MAX).trim();
}
