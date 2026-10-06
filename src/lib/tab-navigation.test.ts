import { describe, expect, it } from "vitest";
import { tabAction, tabRouteName, type StackState } from "./tab-navigation";

const PARENT_ROUTES = [
  "index", "attendance", "announcements", "notifications", "tournament", "settings",
  "profile/index", "child/[childId]/index", "child/[childId]/history",
];

const stack = (names: string[]): StackState => ({
  key: "stack-parent",
  routeNames: PARENT_ROUTES,
  routes: names.map((name) => ({ name })),
  index: names.length - 1,
});

describe("a tab's route in the stack", () => {
  it("finds the screen a tab's address names, folder or file", () => {
    expect(tabRouteName("/parent", "/parent", PARENT_ROUTES)).toBe("index");
    expect(tabRouteName("/parent/attendance", "/parent", PARENT_ROUTES)).toBe("attendance");
    expect(tabRouteName("/parent/profile", "/parent", PARENT_ROUTES)).toBe("profile/index");
  });

  it("knows nothing of another portal's addresses", () => {
    expect(tabRouteName("/student/puzzles", "/parent", PARENT_ROUTES)).toBeUndefined();
    expect(tabRouteName("/parentx", "/parent", PARENT_ROUTES)).toBeUndefined();
  });
});

describe("pressing a tab", () => {
  it("leaves only that tab on the stack, so there is no tab to swipe back to", () => {
    expect(tabAction(stack(["index"]), "/parent", "/parent/attendance")).toEqual({
      type: "RESET",
      payload: { index: 0, routes: [{ name: "attendance" }] },
      target: "stack-parent",
    });
  });

  it("closes whatever was opened inside a tab on the way", () => {
    expect(tabAction(stack(["attendance", "child/[childId]/index", "child/[childId]/history"]), "/parent", "/parent")).toEqual({
      type: "RESET",
      payload: { index: 0, routes: [{ name: "index" }] },
      target: "stack-parent",
    });
  });

  it("pops back to the tab a stack rests on, keeping that screen as it was", () => {
    expect(tabAction(stack(["attendance", "child/[childId]/index"]), "/parent", "/parent/attendance")).toEqual({
      type: "POP_TO_TOP",
      target: "stack-parent",
    });
  });

  it("does nothing when that tab is already open on its own", () => {
    expect(tabAction(stack(["attendance"]), "/parent", "/parent/attendance")).toBeNull();
  });

  it("aims at the portal's stack, never the app's root", () => {
    expect(tabAction(stack(["index"]), "/parent", "/parent/settings")?.target).toBe("stack-parent");
  });

  it("refuses a tab that is not one of the stack's screens, rather than resetting to nothing", () => {
    expect(tabAction(stack(["index"]), "/parent", "/parent/gone")).toBeNull();
  });
});
