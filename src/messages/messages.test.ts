/**
 * The two catalogues say the same things.
 *
 * The house rule is that a string is localised when it is added, not in a
 * later pass — but nothing enforced it, so the way this breaks is silent: a
 * new namespace lands in `en.json`, Thai falls back to the key, and a child
 * reading Thai sees `sv2.startChallenge` on a button.
 */
import { describe, expect, it } from "vitest";
import en from "./en.json";
import th from "./th.json";

/** Every leaf, as a dotted path — "sv2.weekday.0" rather than "sv2". */
function paths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k));
}

const enPaths = paths(en);
const thPaths = paths(th);

describe("the message catalogues", () => {
  it("has no English string without a Thai one", () => {
    expect(thPaths.filter((p) => !enPaths.includes(p))).toEqual([]);
    expect(enPaths.filter((p) => !thPaths.includes(p))).toEqual([]);
  });

  it("keeps the placeholders identical, so neither language loses a name or a count", () => {
    const at = (o: unknown, p: string) =>
      p.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], o);

    const mismatched = enPaths.filter((p) => args(at(en, p)).join() !== args(at(th, p)).join());
    expect(mismatched).toEqual([]);
  });
});

/**
 * The ICU argument names a string takes — `["count"]` for
 * `"{count, plural, one {one class} other {# classes}}"`.
 *
 * Depth matters, which is why this walks the braces rather than running a
 * regex over them: `one` and `other` are branch *names* at depth 2, and a
 * pattern that cannot tell them from arguments reports Thai as broken for
 * having no `one` branch — which is not a bug but the language, since Thai
 * does not inflect for number.
 */
function args(s: unknown): string[] {
  if (typeof s !== "string") return [];
  const found: string[] = [];
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "}") depth--;
    else if (s[i] === "{") {
      if (depth === 0) {
        const name = /^\s*(\w+)\s*[,}]/.exec(s.slice(i + 1));
        if (name) found.push(name[1]);
      }
      depth++;
    }
  }
  return found.sort();
}
