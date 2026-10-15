import { describe, expect, it } from "vitest";
import { pickParam, readDraft, stepBefore, writeDraft } from "./url-state";

describe("pickParam", () => {
  const steps = ["detail", "register", "payment"] as const;
  it("keeps a known value", () => expect(pickParam("payment", steps, "detail")).toBe("payment"));
  it("takes the first of a repeated key", () => expect(pickParam(["register", "payment"], steps, "detail")).toBe("register"));
  it("falls back on a missing or forged value", () => {
    expect(pickParam(undefined, steps, "detail")).toBe("detail");
    expect(pickParam("admin", steps, "detail")).toBe("detail");
  });
});

describe("stepBefore", () => {
  const order = ["detail", "register", "payment"] as const;
  it("steps back through the flow", () => {
    expect(stepBefore("payment", order)).toBe("register");
    expect(stepBefore("register", order)).toBe("detail");
  });
  it("leaves from the first step", () => expect(stepBefore("detail", order)).toBeNull());
});

describe("drafts", () => {
  it("are kept until cleared", () => {
    writeDraft("t1", { nickname: "Pen" });
    expect(readDraft("t1")).toEqual({ nickname: "Pen" });
    writeDraft("t1", undefined);
    expect(readDraft("t1")).toBeUndefined();
  });
});
