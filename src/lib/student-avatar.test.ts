import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));

const { firstEmoji, loadAvatar, saveAvatar } = await import("./student-avatar");

describe("the emoji a pupil types", () => {
  it("keeps the first emoji and nothing else", () => {
    expect(firstEmoji("🦊")).toBe("🦊");
    expect(firstEmoji("  🐸🦉🦁 ")).toBe("🐸");
    expect(firstEmoji("cat")).toBe("");
    expect(firstEmoji("a🦊")).toBe("");
    expect(firstEmoji("")).toBe("");
  });

  describe("on an engine without Intl.Segmenter, as on the phone", () => {
    const native = Intl.Segmenter;
    beforeEach(() => {
      delete (Intl as { Segmenter?: unknown }).Segmenter;
    });
    afterEach(() => {
      (Intl as { Segmenter?: unknown }).Segmenter = native;
    });

    it("keeps an emoji with a skin tone, a family and a flag whole", () => {
      expect(firstEmoji("👍🏽 nice")).toBe("👍🏽");
      expect(firstEmoji("👨‍👩‍👧")).toBe("👨‍👩‍👧");
      expect(firstEmoji("🇹🇭🇬🇧")).toBe("🇹🇭");
      expect(firstEmoji("❤️")).toBe("❤️");
    });

    it("still refuses what is not an emoji", () => {
      expect(firstEmoji("Penny")).toBe("");
    });
  });
});

describe("the avatar kept on the phone", () => {
  beforeEach(() => store.clear());

  it("comes back as it was saved, one per student", async () => {
    await saveAvatar("stu_penny", "🦉");
    expect(await loadAvatar("stu_penny")).toBe("🦉");
    expect(await loadAvatar("stu_uri")).toBe("");
  });

  it("is removed when the pupil goes back to the knight", async () => {
    await saveAvatar("stu_penny", "🦉");
    await saveAvatar("stu_penny", "");
    expect(await loadAvatar("stu_penny")).toBe("");
  });

  it("is nothing without a student ID, and never stored under an empty key", async () => {
    await saveAvatar("", "🦊");
    expect(store.size).toBe(0);
    expect(await loadAvatar("")).toBe("");
  });
});
