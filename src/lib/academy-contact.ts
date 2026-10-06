/* How a family reaches the school. The office keeps these in the console's
   Settings → Academy Contact (academy_* on the backend, served at
   /public/academy); ACADEMY_CONTACT is the website's set, used for any field
   left empty or when the backend cannot be reached.

   The web's lib/academy-contact.ts, with `telHref` and `getAcademyContact`
   added for the phone, which dials and fetches for itself. */
import { api } from "./api";
export type AcademyContact = {
  phones: string[];
  email: string;
  /** A link LINE opens. */
  line: string;
};

export const ACADEMY_CONTACT: AcademyContact = {
  phones: ["02-853-9836", "099-0156-156"],
  email: "jcachess@gmail.com",
  line: "https://lin.ee/7fhq3N1",
};

/** "02-853-9836 / 099-0156-156" is two numbers. */
export function splitPhones(raw: string): string[] {
  return raw.split(/\s*[/,\n]\s*/).map((p) => p.trim()).filter(Boolean);
}

/** What the office typed for LINE, as a link: a link as is, "lin.ee/…" with
    its scheme, an "@id" as LINE's add-friend link. Mirrors the backend. */
export function lineHref(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes("/")) return `https://${v}`;
  return `https://line.me/R/ti/p/@${encodeURIComponent(v.replace(/^@/, ""))}`;
}

/** The public endpoint's fields as the registration form uses them. */
export function contactFrom(c: { phone?: string; email?: string; lineId?: string }): AcademyContact {
  const phones = splitPhones(c.phone ?? "");
  return {
    phones: phones.length ? phones : ACADEMY_CONTACT.phones,
    email: c.email?.trim() || ACADEMY_CONTACT.email,
    line: lineHref(c.lineId ?? "") || ACADEMY_CONTACT.line,
  };
}

/** A number as the dialler takes it: "02-853-9836" is `tel:028539836`. A
    leading + survives; spaces, dashes and brackets do not. "" for nothing. */
export function telHref(phone: string): string {
  const digits = phone.trim().replace(/(?!^\+)[^\d]/g, "");
  return /\d/.test(digits) ? `tel:${digits}` : "";
}

/** The academy's contact, from the server, or the website's when it cannot be
    reached — a family must always have a number to call. */
export async function getAcademyContact(): Promise<AcademyContact> {
  try {
    return contactFrom(await api.get<{ phone?: string; email?: string; lineId?: string }>("public/academy"));
  } catch {
    return contactFrom({});
  }
}
