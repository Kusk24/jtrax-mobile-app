/**
 * Every plural message formats on an engine with no Intl.PluralRules — which
 * is the phone's: Hermes does not have it. Node does, so it is taken away
 * here before the polyfill is loaded, and the catalogues are formatted
 * through use-intl exactly as the app does.
 */
import { afterAll, describe, expect, it } from "vitest";
import en from "../messages/en.json";
import th from "../messages/th.json";

const native = Intl.PluralRules;
// As on Hermes.
delete (Intl as { PluralRules?: unknown }).PluralRules;
await import("./intl-polyfills");
const { createTranslator } = await import("use-intl");

afterAll(() => {
  (Intl as { PluralRules?: unknown }).PluralRules = native;
});

/** Every leaf, as a dotted path with its text. */
function leaves(node: unknown, prefix = ""): [string, string][] {
  if (typeof node === "string") return [[prefix, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

const plurals = leaves(en).filter(([, text]) => /\{\s*\w+\s*,\s*plural\s*,/.test(text));

describe("plural messages without a native Intl.PluralRules", () => {
  it("has the polyfill in place of the missing one", () => {
    expect(typeof Intl.PluralRules).toBe("function");
    expect(new Intl.PluralRules("en").select(1)).toBe("one");
    expect(new Intl.PluralRules("th").select(1)).toBe("other");
  });

  it("finds the plural messages it is meant to check", () => {
    expect(plurals.length).toBeGreaterThan(0);
  });

  it.each([
    ["en", en],
    ["th", th],
  ] as const)("formats every one of them in %s, for one and for many", (locale, messages) => {
    const errors: string[] = [];
    const t = createTranslator({ locale, messages, onError: (e) => errors.push(e.message) });
    for (const [key, text] of plurals) {
      const args = Object.fromEntries([...text.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => [m[1], 1]));
      for (const n of [1, 3]) {
        const values = Object.fromEntries(Object.keys(args).map((k) => [k, n]));
        const out = (t as unknown as (k: string, v: Record<string, number>) => string)(key, values);
        expect(out).not.toContain(key);
      }
    }
    expect(errors).toEqual([]);
  });
});
