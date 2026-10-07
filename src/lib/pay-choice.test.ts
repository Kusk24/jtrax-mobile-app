import { describe, expect, it } from "vitest";
import { heldBodyKey, payCtaKey } from "./pay-choice";

describe("payCtaKey", () => {
  it("asks to register, not pay, when the fee is left for later", () => {
    expect(payCtaKey("later", false)).toBe("registerNow");
    expect(payCtaKey("later", true)).toBe("registerNow");
  });

  it("says the checkout is opening only for a card", () => {
    expect(payCtaKey("card", true)).toBe("openingPayment");
    expect(payCtaKey("promptpay", true)).toBe("payNow");
  });

  it("says Pay Now for the methods paid now", () => {
    expect(payCtaKey("card", false)).toBe("payNow");
    expect(payCtaKey("bank", false)).toBe("payNow");
  });
});

describe("heldBodyKey", () => {
  it("tells a Pay later family the fee can still be paid in the app", () => {
    expect(heldBodyKey("later")).toBe("placeHeldLaterBody");
  });

  it("keeps the front-desk wording for PromptPay, bank transfer and an unfinished card", () => {
    expect(heldBodyKey("promptpay")).toBe("placeHeldBody");
    expect(heldBodyKey("bank")).toBe("placeHeldBody");
    expect(heldBodyKey("card")).toBe("placeHeldBody");
  });
});
