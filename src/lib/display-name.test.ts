import { describe, expect, it } from "vitest";
import { cleanDisplayName, DISPLAY_NAME_MAX } from "./display-name";

describe("a display name before it is saved", () => {
  it("loses the spaces around it and between words", () => {
    expect(cleanDisplayName("  Penny   Jones ")).toBe("Penny Jones");
    expect(cleanDisplayName("เพนนี\n  โจนส์")).toBe("เพนนี โจนส์");
  });

  it("is nothing when there was only space", () => {
    expect(cleanDisplayName("   ")).toBe("");
  });

  it("stops at the field's length, without a dangling space", () => {
    const long = "a".repeat(39) + " " + "b".repeat(10);
    const clean = cleanDisplayName(long);
    expect(clean.length).toBeLessThanOrEqual(DISPLAY_NAME_MAX);
    expect(clean).toBe("a".repeat(39));
  });
});
