import { describe, expect, it } from "vitest";
import { ACADEMY_CONTACT, contactFrom, lineHref, telHref } from "./academy-contact";

describe("academy contact", () => {
  it("reads LINE however the office typed it", () => {
    expect(lineHref("https://lin.ee/7fhq3N1")).toBe("https://lin.ee/7fhq3N1");
    expect(lineHref("lin.ee/7fhq3N1")).toBe("https://lin.ee/7fhq3N1");
    expect(lineHref("@jcachess")).toBe("https://line.me/R/ti/p/@jcachess");
  });

  it("uses what was saved, and the website's details for anything empty", () => {
    expect(contactFrom({ phone: "02-111-2222 / 080-000-0000", lineId: "@jca" })).toEqual({
      phones: ["02-111-2222", "080-000-0000"], email: ACADEMY_CONTACT.email, line: "https://line.me/R/ti/p/@jca",
    });
    expect(contactFrom({})).toEqual(ACADEMY_CONTACT);
  });

  it("dials a number however it was written", () => {
    expect(telHref("02-853-9836")).toBe("tel:028539836");
    expect(telHref("099 0156 156")).toBe("tel:0990156156");
    expect(telHref("+66 (2) 853-9836")).toBe("tel:+6628539836");
    expect(telHref("  ")).toBe("");
    expect(telHref("ask at the desk")).toBe("");
  });
});
