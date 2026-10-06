/**
 * What a payment's receipt says — the lines the web's PaymentHistory hands to
 * its canvas (lib/receipt-image.ts), worked out apart from any drawing so the
 * phone's voucher view and a test can both read them.
 */
import type { PaymentRecord } from "./payment-history";

export type ReceiptLine = { label: string; value: string };

export type ReceiptContent = {
  /** Two-up details under the header: date, received from, student, method… */
  details: ReceiptLine[];
  item: string;
  itemSub: string;
  itemAmount: string;
  /** Subtotal and discount — only when there was a discount. */
  adjustments: ReceiptLine[];
  total: string;
  status: PaymentRecord["status"];
  statusTone: "paid" | "pending" | "cancelled";
};

/** The labels and formatting a receipt needs, in the reader's language. */
export type ReceiptWords = {
  date: string;
  receivedFrom: string;
  child: string;
  method: string;
  reference: string;
  /** A method's own name, or "" when the catalogue has none for it. */
  methodName: (method: string) => string;
  tournament: string;
  course: string;
  credits: (count: string) => string;
  subtotal: string;
  discount: string;
  day: (iso: string) => string;
  money: (amount: number) => string;
};

/** 1.5, not 1.50; 2, not 2.00. */
export const fmtCredits = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

export function receiptContent(p: PaymentRecord, parentName: string, w: ReceiptWords): ReceiptContent {
  /* A method the catalogue does not name is printed as the office wrote it. */
  const method = p.method ? w.methodName(p.method) || p.method : "—";
  const details: ReceiptLine[] = [
    { label: w.date, value: w.day(p.date) },
    { label: w.receivedFrom, value: parentName || "—" },
    { label: w.child, value: p.childName },
    { label: w.method, value: method },
  ];
  if (p.reference) details.push({ label: w.reference, value: p.reference });
  return {
    details,
    item: p.forWhat,
    itemSub: p.kind === "tournament" ? w.tournament : `${w.course}${p.credits > 0 ? ` · ${w.credits(fmtCredits(p.credits))}` : ""}`,
    /* The price before any discount; a record with no gross shows what was paid. */
    itemAmount: w.money(p.gross || p.paid),
    adjustments:
      p.discount > 0
        ? [
            { label: w.subtotal, value: w.money(p.gross) },
            { label: w.discount, value: `− ${w.money(p.discount)}` },
          ]
        : [],
    total: w.money(p.paid),
    status: p.status,
    statusTone: p.status === "Paid" ? "paid" : p.status === "Cancelled" ? "cancelled" : "pending",
  };
}
