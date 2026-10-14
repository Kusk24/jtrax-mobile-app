/**
 * Why an ID card scan failed, in words the parent can act on, with the exact
 * code they can pass on to the academy. The phone's version of jtrax-web-app's
 * lib/scan-error.ts: the server sends a reason code and the scan service's
 * status; a reply that never came from the server (nginx refusing a large
 * photo) is named by its HTTP status, and no answer at all by "offline".
 */
import { ApiError } from "./api";

/** The reason codes the server sends, each with a sentence under register.scanWhy. */
export const SCAN_REASONS = [
  "model_unavailable",
  "key_rejected",
  "quota",
  "provider_error",
  "unreachable",
  "no_answer",
  "no_date_of_birth",
  "not_an_image",
  "too_large",
  "no_image",
  "not_configured",
] as const;

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** What the form shows for a failed scan: the reason, then its code. */
export function scanErrorText(err: unknown, t: Translate): string {
  if (!(err instanceof ApiError) || err.status === 0) {
    // The photo never got an answer: no signal, or the app was left.
    return `${t("scanWhy.unsent")} (${t("scanErrorCode", { code: "offline" })})`;
  }
  const body = (err.body ?? {}) as { error?: string; reason?: string; status?: number };
  const reason = body.reason ?? "";
  const code = reason ? [reason, body.status || ""].join(" ").trim() : `http ${err.status}`;
  return `${scanSentence(err, reason, body.error, t)} (${t("scanErrorCode", { code })})`;
}

function scanSentence(err: ApiError, reason: string, sentence: string | undefined, t: Translate): string {
  if ((SCAN_REASONS as readonly string[]).includes(reason)) return t(`scanWhy.${reason}`);
  // No code: nginx or a proxy answered, not the scan.
  if (err.status === 413) return t("scanWhy.too_large");
  if (err.status === 429) return t("scanWhy.busy");
  // The server's own sentence, when it gave one without a code we know.
  return sentence || t("scanWhy.server");
}
