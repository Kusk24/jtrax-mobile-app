/**
 * The attendance screens' course filter, apart from the screens — the web
 * keeps these two beside its CourseFilter component; here they are pure, so
 * they can be tested on their own.
 */

/** The courses that appear in a set of attendance rows, A–Z. A row whose
    class is unknown ("—") is left out: it is not a course to pick. */
export function coursesOf(rows: { cls: string }[]): string[] {
  return [...new Set(rows.map((r) => r.cls).filter((c) => c && c !== "—"))].sort((a, b) => a.localeCompare(b));
}

/** Credits used by a set of attendance rows, rounded to cents. */
export function usedCredits(rows: { credits: number }[]): number {
  return Math.round(rows.reduce((sum, r) => sum + r.credits, 0) * 100) / 100 || 0;
}
