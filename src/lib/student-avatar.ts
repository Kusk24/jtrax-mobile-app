/**
 * A student's emoji avatar, chosen on Profile — the web's lib/student-avatar.ts
 * on AsyncStorage instead of localStorage. Kept on this phone only, as the web
 * keeps it in the browser: another device shows the knight until the pupil
 * picks one there too.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

/** The five offered by default; any other emoji from the keyboard works too. */
export const DEFAULT_AVATARS = ["🦁", "🐼", "🦊", "🐸", "🦉"] as const;

const key = (studentId: string) => `jtrax.avatar.${studentId}`;

/* One emoji as the eye sees it: a flag (two regional letters), or a pictograph
   with any skin tone, variation selector and zero-width-joined parts — so 👍🏽
   and 👨‍👩‍👧 stay whole. Used where Intl.Segmenter is missing, as on Hermes. */
const EMOJI = /^(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|‍\p{Extended_Pictographic})*)/u;

/** The first emoji in what was typed, or "" when there is none — so a word,
    a letter or three emojis pasted together all come out as one emoji or
    nothing. */
export function firstEmoji(input: string): string {
  const text = input.trim();
  if (!text) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const first = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)[Symbol.iterator]().next().value?.segment ?? "";
    return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first) ? first : "";
  }
  return EMOJI.exec(text)?.[0] ?? "";
}

export async function loadAvatar(studentId: string): Promise<string> {
  if (!studentId) return "";
  try {
    return firstEmoji((await AsyncStorage.getItem(key(studentId))) ?? "");
  } catch {
    return "";
  }
}

export async function saveAvatar(studentId: string, emoji: string): Promise<void> {
  if (!studentId) return;
  try {
    if (emoji) await AsyncStorage.setItem(key(studentId), emoji);
    else await AsyncStorage.removeItem(key(studentId));
  } catch {
    /* Storage unavailable: the avatar lasts until the app is closed. */
  }
}
