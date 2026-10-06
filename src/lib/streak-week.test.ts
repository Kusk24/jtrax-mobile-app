import { describe, expect, it } from "vitest";
import { thisWeek } from "./streak-week";

describe("the streak calendar's week", () => {
  it("runs Monday to Sunday around a midweek day, with the rest of the week still to come", () => {
    // 2026-10-07 is a Wednesday.
    const week = thisWeek("2026-10-07");
    expect(week.map((d) => d.key)).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
    ]);
    expect(week.map((d) => d.future)).toEqual([false, false, false, true, true, true, true]);
  });

  it("starts on the day itself when that day is a Monday", () => {
    expect(thisWeek("2026-10-05")[0]).toEqual({ key: "2026-10-05", day: 5, future: false });
  });

  it("puts a Sunday last, in the week that began six days before", () => {
    const week = thisWeek("2026-10-11");
    expect(week[0].key).toBe("2026-10-05");
    expect(week[6]).toEqual({ key: "2026-10-11", day: 11, future: false });
  });

  it("crosses a month end without losing a day", () => {
    // 2026-11-01 is a Sunday.
    expect(thisWeek("2026-11-01").map((d) => d.day)).toEqual([26, 27, 28, 29, 30, 31, 1]);
  });
});
