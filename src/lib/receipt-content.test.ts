import { describe, expect, it } from "vitest";
import type { PaymentRecord } from "./payment-history";
import { fmtCredits, receiptContent, type ReceiptWords } from "./receipt-content";

const words: ReceiptWords = {
  date: "Date",
  receivedFrom: "Received from",
  child: "Student",
  method: "Method",
  reference: "Reference",
  methodName: (m) => ({ BankTransfer: "Bank transfer", Cash: "Cash" })[m] ?? "",
  tournament: "Tournament entry",
  course: "Course",
  credits: (n) => `${n} credits`,
  subtotal: "Subtotal",
  discount: "Discount",
  day: (iso) => `day ${iso}`,
  money: (v) => `THB ${v}`,
};

const payment = (over: Partial<PaymentRecord> = {}): PaymentRecord => ({
  id: "pay_1",
  date: "2026-09-01",
  childName: "Penny",
  forWhat: "Beginner Chess",
  kind: "course",
  paid: 3000,
  gross: 3000,
  discount: 0,
  credits: 20,
  method: "BankTransfer",
  status: "Paid",
  reference: "",
  ...over,
});

describe("what a receipt says", () => {
  it("names the payer, the child and the method, and what the course bought", () => {
    const r = receiptContent(payment(), "Sandy Jones", words);
    expect(r.details).toEqual([
      { label: "Date", value: "day 2026-09-01" },
      { label: "Received from", value: "Sandy Jones" },
      { label: "Student", value: "Penny" },
      { label: "Method", value: "Bank transfer" },
    ]);
    expect(r.itemSub).toBe("Course · 20 credits");
    expect(r.adjustments).toEqual([]);
    expect(r.total).toBe("THB 3000");
    expect(r.statusTone).toBe("paid");
  });

  it("shows the subtotal and discount only when there was one", () => {
    const r = receiptContent(payment({ gross: 3000, discount: 300, paid: 2700 }), "Sandy", words);
    expect(r.itemAmount).toBe("THB 3000");
    expect(r.adjustments).toEqual([
      { label: "Subtotal", value: "THB 3000" },
      { label: "Discount", value: "− THB 300" },
    ]);
    expect(r.total).toBe("THB 2700");
  });

  it("calls a tournament fee an entry, with no credits", () => {
    expect(receiptContent(payment({ kind: "tournament", credits: 0 }), "Sandy", words).itemSub).toBe("Tournament entry");
  });

  it("adds the reference when the office wrote one, and prints an unknown method as written", () => {
    const r = receiptContent(payment({ reference: "TX-889", method: "Cheque" }), "Sandy", words);
    expect(r.details.at(-1)).toEqual({ label: "Reference", value: "TX-889" });
    expect(r.details[3]).toEqual({ label: "Method", value: "Cheque" });
  });

  it("stamps a pending or cancelled payment as such", () => {
    expect(receiptContent(payment({ status: "Pending" }), "", words).statusTone).toBe("pending");
    expect(receiptContent(payment({ status: "Cancelled" }), "", words).statusTone).toBe("cancelled");
    expect(receiptContent(payment(), "", words).details[1].value).toBe("—");
  });

  it("writes credits without trailing zeros", () => {
    expect(fmtCredits(20)).toBe("20");
    expect(fmtCredits(1.5)).toBe("1.5");
    expect(fmtCredits(2.25)).toBe("2.25");
  });
});
