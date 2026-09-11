/**
 * A tab is not somewhere you came from.
 *
 * The phone drew the back arrow on every play screen and the bar on all of
 * them too, so Play — which is a tab, sitting on the bar, one tap from
 * anywhere — also offered to "return" to a place the child had not been. The
 * two rules are the same rule seen from either end: the bar is how you leave a
 * tab, the arrow is how you leave everything else.
 */
import { describe, expect, it } from "vitest";
import { isActive, isRoot, type TabPath } from "./portal-tabs";

/** The student portal's bar, paths only. */
const tabs: TabPath[] = [
  { href: "/student", exact: true, activeAliases: ["/student/notifications"] },
  { href: "/student/schedule", activeAliases: ["/student/checkin"] },
  { href: "/student/attendance" },
  { href: "/student/play" },
  { href: "/student/profile" },
];

describe("isRoot — does this screen keep the bar", () => {
  it.each(["/student", "/student/schedule", "/student/attendance", "/student/play", "/student/profile"])(
    "%s is a tab, so it keeps the bar and takes no arrow",
    (path) => {
      expect(isRoot(path, tabs)).toBe(true);
    },
  );

  it.each([
    "/student/play/ai",
    "/student/play/friend",
    "/student/play/room/grm_abc123",
  ])("%s was pushed, so the bar goes and the arrow comes", (path) => {
    expect(isRoot(path, tabs)).toBe(false);
  });

  it("counts an alias as a tab, because it is the same part of the app", () => {
    // Reached from a card on the tab itself, not descended into.
    expect(isRoot("/student/checkin", tabs)).toBe(true);
    expect(isRoot("/student/notifications", tabs)).toBe(true);
  });

  it("does not treat a prefix as a tab — which is the bug this replaced", () => {
    // `/student/play/ai`.startsWith(`/student/play`) is true, and that is
    // exactly why highlighting cannot be asked this question.
    expect(isActive("/student/play/ai", tabs[3])).toBe(true);
    expect(isRoot("/student/play/ai", tabs)).toBe(false);
  });

  it("keeps the home tab exact, so every student screen is not 'home'", () => {
    expect(isActive("/student/schedule", tabs[0])).toBe(false);
    expect(isRoot("/student/schedule/anything", tabs)).toBe(false);
  });
});

describe("isActive — which tab lights up", () => {
  it("lights the tab a pushed screen belongs to", () => {
    expect(isActive("/student/play/room/grm_abc123", tabs[3])).toBe(true);
  });

  it("lights Schedule while a pupil is checking in", () => {
    expect(isActive("/student/checkin", tabs[1])).toBe(true);
  });
});
