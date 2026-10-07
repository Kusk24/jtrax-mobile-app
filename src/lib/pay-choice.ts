/* The tournament payment step's choices, and what the screen says for each.
   Only a card is charged in the app; every other choice holds the place and
   the fee is taken later — at the front desk, or by card on the event screen. */

export type PayChoice = "card" | "promptpay" | "bank" | "later";

/** The button: "Opening payment…" while the card checkout loads, "Register
    Now" when nothing is being paid yet, "Pay Now" otherwise. */
export function payCtaKey(pay: PayChoice, submitting: boolean): "openingPayment" | "registerNow" | "payNow" {
  if (submitting && pay === "card") return "openingPayment";
  return pay === "later" ? "registerNow" : "payNow";
}

/** The place-held screen: Pay later says the fee can still be paid here. */
export function heldBodyKey(pay: PayChoice): "placeHeldLaterBody" | "placeHeldBody" {
  return pay === "later" ? "placeHeldLaterBody" : "placeHeldBody";
}
