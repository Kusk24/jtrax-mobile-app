/**
 * The sound switch: on until turned off, remembered on the phone, and never
 * able to break the board when storage is missing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const storage = {
  getItem: vi.fn(async (k: string) => store.get(k) ?? null),
  setItem: vi.fn(async (k: string, v: string) => void store.set(k, v)),
};
vi.mock("@react-native-async-storage/async-storage", () => ({ default: storage }));

describe("the sound switch", () => {
  beforeEach(() => {
    vi.resetModules();
    store.clear();
    storage.getItem.mockClear();
    storage.setItem.mockClear();
  });

  it("is on until turned off, and remembers being turned off", async () => {
    const { isSoundOn, loadSoundSetting, setSoundOn } = await import("./setting");
    await loadSoundSetting();
    expect(isSoundOn()).toBe(true);
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
    expect(storage.setItem).toHaveBeenLastCalledWith("jtrax.sound", "off");
  });

  it("reads a switch saved in an earlier session", async () => {
    store.set("jtrax.sound", "off");
    const { isSoundOn, loadSoundSetting } = await import("./setting");
    await loadSoundSetting();
    expect(isSoundOn()).toBe(false);
  });

  it("stays on, and keeps working, when storage cannot be read or written", async () => {
    storage.getItem.mockRejectedValueOnce(new Error("no storage"));
    storage.setItem.mockRejectedValueOnce(new Error("no storage"));
    const { isSoundOn, loadSoundSetting, setSoundOn } = await import("./setting");
    await loadSoundSetting();
    expect(isSoundOn()).toBe(true);
    expect(() => setSoundOn(false)).not.toThrow();
    expect(isSoundOn()).toBe(false);
  });
});
