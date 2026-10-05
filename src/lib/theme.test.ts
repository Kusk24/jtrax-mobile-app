import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
  COLOURS,
  PP_DARK,
  PP_LIGHT,
  ST_DARK,
  ST_LIGHT,
  channels,
  cssVariables,
  kebab,
  preferenceOf,
  schemeOf,
} from "./theme";

const require = createRequire(import.meta.url);

describe("which scheme an account's Appearance means", () => {
  it("keeps Light and Dark, and reads anything else as Auto", () => {
    expect(preferenceOf("Light")).toBe("Light");
    expect(preferenceOf("Dark")).toBe("Dark");
    expect(preferenceOf("System")).toBe("System");
    expect(preferenceOf(undefined)).toBe("System");
    expect(preferenceOf("dark")).toBe("System");
  });

  it("lets a fixed choice win over the phone, and Auto follow it", () => {
    expect(schemeOf("Light", "dark")).toBe("light");
    expect(schemeOf("Dark", "light")).toBe("dark");
    expect(schemeOf("System", "dark")).toBe("dark");
    expect(schemeOf("System", "light")).toBe("light");
    expect(schemeOf("System", null)).toBe("light");
  });
});

describe("the palettes", () => {
  const hex = /^#[0-9a-f]{6}$/;

  it("gives every token a light and a dark value, as hex", () => {
    for (const [light, dark] of [
      [PP_LIGHT, PP_DARK],
      [ST_LIGHT, ST_DARK],
    ] as const) {
      expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
      for (const v of [...Object.values(light), ...Object.values(dark)]) expect(v).toMatch(hex);
    }
  });

  it("matches the web's dark text and surface", () => {
    expect(PP_DARK.ink).toBe("#e7edfa");
    expect(PP_DARK.bg).toBe("#0f1729");
    expect(PP_DARK.card).toBe("#182238");
  });

  it("writes a variable per token, as the channels rgb() needs", () => {
    expect(channels("#2e5cb8")).toBe("46 92 184");
    const dark = cssVariables("dark");
    expect(dark["--pp-ink"]).toBe(channels(PP_DARK.ink));
    expect(dark["--pp-green-soft"]).toBe(channels(PP_DARK.greenSoft));
    expect(dark["--st-brand-deep"]).toBe(channels(ST_DARK.brandDeep));
    expect(Object.keys(dark)).toHaveLength(
      Object.keys(COLOURS.dark.pp).length + Object.keys(COLOURS.dark.st).length,
    );
  });
});

describe("tailwind.config.js", () => {
  const colors = require("../../tailwind.config.js").theme.extend.colors as Record<string, string>;

  /* A class with no variable behind it draws nothing, and a variable with no
     class is a colour no screen can use — both lists have to agree. */
  it("has a class for every themed token and no other", () => {
    const fromConfig = Object.keys(colors).filter((k) => k.startsWith("pp-") || k.startsWith("st-")).sort();
    const fromTheme = [
      ...Object.keys(PP_LIGHT).map((k) => `pp-${kebab(k)}`),
      ...Object.keys(ST_LIGHT).map((k) => `st-${kebab(k)}`),
    ].sort();
    expect(fromConfig).toEqual(fromTheme);
  });

  it("reads each from its variable, keeping opacity modifiers", () => {
    expect(colors["pp-blue"]).toBe("rgb(var(--pp-blue) / <alpha-value>)");
    expect(colors["st-orange-soft"]).toBe("rgb(var(--st-orange-soft) / <alpha-value>)");
  });
});
