/**
 * A failed ID card scan says why, with the code it came with — the phone's
 * copy of the web portal's check.
 */
import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl";
import en from "../messages/en.json";
import th from "../messages/th.json";
import { ApiError } from "./api";
import { SCAN_REASONS, scanErrorText } from "./scan-error";

const t = createTranslator({ locale: "en", messages: en, namespace: "register" }) as unknown as (
  key: string, values?: Record<string, string | number>,
) => string;

describe("scanErrorText", () => {
  it("says the reason and shows the code with the scan service's status", () => {
    const err = new ApiError(502, "could not read the card: …", { reason: "quota", status: 429 });
    const text = scanErrorText(err, t);
    expect(text).toContain("limit is used up");
    expect(text).toContain("(error: quota 429)");
  });

  it("names a photo nginx refused by its HTTP status", () => {
    const text = scanErrorText(new ApiError(413, "request failed (413)", {}), t);
    expect(text).toContain("too large");
    expect(text).toContain("(error: http 413)");
  });

  it("falls back to the server's own sentence for a code it does not know", () => {
    const err = new ApiError(404, "no such child", { error: "no such child" });
    expect(scanErrorText(err, t)).toBe("no such child (error: http 404)");
  });

  it("says the photo was not sent when the phone had no signal", () => {
    const text = scanErrorText(new ApiError(0, "offline"), t);
    expect(text).toContain("could not be sent");
    expect(text).toContain("(error: offline)");
  });

  it("has a sentence for every reason, in English and Thai", () => {
    for (const messages of [en, th]) {
      const why = (messages.register as unknown as { scanWhy: Record<string, string> }).scanWhy;
      for (const reason of [...SCAN_REASONS, "busy", "server", "unsent"]) expect(why[reason], reason).toBeTruthy();
    }
  });
});
