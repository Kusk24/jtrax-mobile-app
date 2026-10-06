/**
 * Entering a child in a tournament — the parts of the web's lib/registration.ts
 * the parent's entry step uses: the category age rule (the backend is the
 * authority; this only greys out what it would refuse), the ID card scan, and
 * an age from a date of birth. The pure functions are the web's, verbatim.
 */
import { api } from "./api";

export type PublicCategory = { id: string; name: string };

/** The age a category name implies — "U8 Boys", "U08" and "Under 8" are
    under 8. Mirrors the
    backend's rule, which is the one that actually decides; this exists so the
    form can grey out what it would refuse rather than take an entry and then
    reject it. */
export function categoryAgeLimit(name: string): number {
  const m = /\bU(?:nder)?[\s-]?(\d{1,2})\b/i.exec(name);
  return m ? Number(m[1]) : 0;
}

/** Completed years on a date. The tournament's start day is the day the age
    matters, so that is what a category is checked against. */
export function ageOn(dateOfBirth: string, on: string): number | null {
  const dob = new Date(dateOfBirth);
  const day = new Date(on);
  if (isNaN(dob.getTime()) || isNaN(day.getTime())) return null;
  let years = day.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    day.getMonth() < dob.getMonth() ||
    (day.getMonth() === dob.getMonth() && day.getDate() < dob.getDate());
  if (beforeBirthday) years--;
  return years;
}

/** The first birth year an under-`limit` category takes at an event held in
    `year` — chess groups go by birth year, so U10 in 2026 is anybody born in
    2016 or later. */
export function earliestBirthYear(limit: number, year: number): number {
  return year - limit;
}

/** Whether a player of this date of birth may enter this category at an event
    starting on `startDate`. By birth year, as the backend decides it. A
    category with no age in its name is open to everyone; one that has an age
    needs a date of birth before it can be judged. `bornFrom` is the earliest
    birth year it takes, for the "born on or after" line. */
export function categoryAllows(
  categoryName: string,
  dateOfBirth: string,
  startDate: string,
): { allowed: boolean; limit: number; needsDob: boolean; bornFrom: number } {
  const limit = categoryAgeLimit(categoryName);
  const start = new Date(startDate || new Date().toISOString().slice(0, 10));
  const year = Number.isNaN(start.getTime()) ? new Date().getFullYear() : start.getFullYear();
  if (limit === 0) return { allowed: true, limit: 0, needsDob: false, bornFrom: 0 };
  const bornFrom = earliestBirthYear(limit, year);
  if (!dateOfBirth) return { allowed: false, limit, needsDob: true, bornFrom };
  const dob = new Date(dateOfBirth);
  return { allowed: !Number.isNaN(dob.getTime()) && dob.getFullYear() >= bornFrom, limit, needsDob: false, bornFrom };
}

/** One value read off a document, with how sure the model was of it. */
export type ScannedField = { value: string; confidence: number };

export type ScannedIDCard = {
  firstName: ScannedField;
  lastName: ScannedField;
  /** YYYY-MM-DD, already converted out of the Buddhist era by the server. */
  dateOfBirth: ScannedField;
  /** The whole name in Thai script, off a Thai ID card. */
  thaiName?: ScannedField;
  /** "thai-id", "passport", or "" when the server would not classify it. */
  documentType: string;
};

/** What a scan answers: what the card said, and the check an entry names. */
export type IDCardScan = { fields: ScannedIDCard; checkId: string };

/** A photo picked on the phone, as the scan takes it. */
export type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

/** The parent portal's scan, for one of the parent's children. The server
    keeps what it read, not the photo, and the entry names the check. */
export function scanChildIDCard(tournamentId: string, studentId: string, image: PickedImage): Promise<IDCardScan> {
  const body = new FormData();
  /* React Native's FormData takes a file as { uri, name, type }. */
  body.append("image", {
    uri: image.uri,
    name: image.fileName || "id-card.jpg",
    type: image.mimeType || "image/jpeg",
  } as unknown as Blob);
  return api.postForm<IDCardScan>(
    `tournaments/${encodeURIComponent(tournamentId)}/scan-id?student_id=${encodeURIComponent(studentId)}`,
    body,
  );
}

/** Whole years old on `on`, from a YYYY-MM-DD date of birth. 0 when unknown. */
export function ageFromDOB(dob: string, on = new Date()): number {
  if (!dob) return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  let age = on.getFullYear() - d.getFullYear();
  const before =
    on.getMonth() < d.getMonth() ||
    (on.getMonth() === d.getMonth() && on.getDate() < d.getDate());
  if (before) age--;
  return Math.max(0, age);
}
