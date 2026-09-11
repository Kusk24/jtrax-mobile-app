/**
 * Challenging another pupil to a game.
 *
 * Search returns a name, an id and whether that player can play rated —
 * nothing else. The server decides that, not this file; the shape is narrow
 * here because it is narrow there.
 */
import { api } from "./api";

export type PlayerResult = {
  studentId: string;
  name: string;
  /** Whether they have granted Lichess play access. Both sides need it for a
      rated game, so it is shown before the choice is made rather than after. */
  canPlayRated: boolean;
};

export type Challenge = {
  challengeId: string;
  /** "in" when they are waiting on you, "out" when you are waiting on them. */
  direction: "in" | "out";
  opponentName: string;
  opponentStudentId?: string;
  status: "Pending" | "Accepted" | "Declined" | "Cancelled";
  rated: boolean;
  clockLimit: number;
  clockIncrement: number;
  gameRoomId?: string;
  createdAt: string;
  bothCanPlayRated: boolean;
};

export const searchPlayers = (q: string) =>
  api
    .get<{ players: PlayerResult[] }>(`players/search?q=${encodeURIComponent(q)}`)
    .then((r) => r.players);

export const listChallenges = () =>
  api.get<{ challenges: Challenge[] }>("challenges").then((r) => r.challenges);

export const sendChallenge = (
  studentId: string,
  rated: boolean,
  clockLimit: number,
  clockIncrement: number,
) =>
  api.post<{ challengeId: string }>("challenges", {
    studentId,
    rated,
    clockLimit,
    clockIncrement,
  });

export const acceptChallenge = (id: string) =>
  api.post<{ gameRoomId: string }>(`challenges/${id}/accept`, {});

export const declineChallenge = (id: string) =>
  api.post<{ status: string }>(`challenges/${id}/decline`, {});

export const cancelChallenge = (id: string) => api.del<{ status: string }>(`challenges/${id}`);

/** The clocks the backend accepts, matching the console's rated-room options. */
export const CLOCKS = [
  { limit: 300, increment: 0, label: "5+0" },
  { limit: 600, increment: 5, label: "10+5" },
  { limit: 900, increment: 10, label: "15+10" },
  { limit: 1800, increment: 20, label: "30+20" },
] as const;
