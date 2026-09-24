/**
 * Registering a phone for notifications. The native modules are stood in for:
 * what is tested is the order of the decisions — no project, no phone or no
 * permission means no registration and no error — and that the token goes to
 * the backend on sign-in and is taken back on sign-out.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  os: "ios",
  isDevice: true,
  projectId: "proj-123" as string | undefined,
  permission: "granted",
  askedFor: 0,
}));
const post = vi.hoisted(() => vi.fn(async () => ({ registered: true })));
const del = vi.hoisted(() => vi.fn(async () => ({})));

vi.mock("react-native", () => ({ Platform: { get OS() { return state.os; } } }));
vi.mock("expo-device", () => ({ get isDevice() { return state.isDevice; }, osVersion: "18.0" }));
vi.mock("expo-constants", () => ({
  default: { get expoConfig() { return { extra: { eas: { projectId: state.projectId } } }; }, easConfig: null },
}));
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(async () => null),
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: vi.fn(async () => ({ status: state.permission === "granted" ? "granted" : "undetermined" })),
  requestPermissionsAsync: vi.fn(async () => {
    state.askedFor++;
    return { status: state.permission };
  }),
  getExpoPushTokenAsync: vi.fn(async () => ({ data: "ExponentPushToken[phone-1]" })),
}));
vi.mock("./api", () => ({ api: { post, del } }));

const load = async () => {
  vi.resetModules();
  return import("./push");
};

beforeEach(() => {
  Object.assign(state, { os: "ios", isDevice: true, projectId: "proj-123", permission: "granted", askedFor: 0 });
  post.mockClear();
  del.mockClear();
});

describe("registering for push", () => {
  it("sends this phone's token to the backend", async () => {
    const { registerForPush } = await load();
    expect(await registerForPush()).toBe("registered");
    expect(post).toHaveBeenCalledWith("push-subscriptions", {
      channel: "mobile",
      endpoint: "ExponentPushToken[phone-1]",
      user_agent: "ios 18.0",
    });
  });

  it("does nothing, quietly, without an Expo project, a real phone, or on the web", async () => {
    for (const setup of [{ projectId: undefined }, { isDevice: false }, { os: "web" }]) {
      Object.assign(state, { os: "ios", isDevice: true, projectId: "proj-123" }, setup);
      const { registerForPush } = await load();
      expect(await registerForPush()).toBe("unsupported");
    }
    expect(post).not.toHaveBeenCalled();
  });

  it("asks once, and registers nothing when the parent says no", async () => {
    state.permission = "denied";
    const { registerForPush } = await load();
    expect(await registerForPush()).toBe("denied");
    expect(state.askedFor).toBe(1);
    expect(post).not.toHaveBeenCalled();
  });

  it("never throws when the backend cannot be reached", async () => {
    post.mockRejectedValueOnce(new Error("offline"));
    const { registerForPush } = await load();
    expect(await registerForPush()).toBe("failed");
  });

  it("takes this phone back on sign-out, and only if it was registered", async () => {
    const { registerForPush, unregisterPush } = await load();
    await unregisterPush();
    expect(del).not.toHaveBeenCalled();
    await registerForPush();
    await unregisterPush();
    expect(del).toHaveBeenCalledWith("push-subscriptions", { endpoint: "ExponentPushToken[phone-1]" });
  });
});

describe("where a tapped notification lands", () => {
  it("sends a parent to notifications, or announcements for an announcement, and a pupil home", async () => {
    const { routeForNotification } = await load();
    expect(routeForNotification("Parent", { type: "check_in" })).toBe("/parent/notifications");
    expect(routeForNotification("Parent", { type: "announcement" })).toBe("/parent/announcements");
    expect(routeForNotification("Student", { type: "announcement" })).toBe("/student");
    expect(routeForNotification(undefined, {})).toBeNull();
  });
});
