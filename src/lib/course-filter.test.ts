import { describe, expect, it } from "vitest";
import { coursesOf, usedCredits } from "./course-filter";

describe("the attendance course filter", () => {
  it("offers each course once, A–Z, and never the unknown class", () => {
    const rows = [{ cls: "JCA Juniors" }, { cls: "Beginner Chess" }, { cls: "JCA Juniors" }, { cls: "—" }, { cls: "" }];
    expect(coursesOf(rows)).toEqual(["Beginner Chess", "JCA Juniors"]);
  });

  it("adds up what the rows cost, without floating-point dust", () => {
    expect(usedCredits([{ credits: 0.1 }, { credits: 0.2 }])).toBe(0.3);
    expect(usedCredits([{ credits: 1.5 }, { credits: 0 }, { credits: 1 }])).toBe(2.5);
  });

  it("is a plain zero for no rows or no charges", () => {
    expect(usedCredits([])).toBe(0);
    expect(Object.is(usedCredits([{ credits: 0 }]), 0)).toBe(true);
  });
});
