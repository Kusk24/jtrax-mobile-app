/**
 * The week the Profile's streak calendar draws — the web's StreakCalendar
 * (components/student/kit.tsx), with the date arithmetic pulled out so it can
 * be tested apart from the screen.
 */

export type WeekDay = { key: string; day: number; future: boolean };

/** This week, Monday to Sunday, around `today` (the academy's "YYYY-MM-DD").
    Days still to come are marked, so the pupil can see how much of the week
    is left to keep the streak. */
export function thisWeek(today: string): WeekDay[] {
  const end = new Date(today + "T00:00:00");
  const start = new Date(end);
  // getDay() counts from Sunday; the academy's week starts on Monday.
  start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, day: d.getDate(), future: d > end };
  });
}
