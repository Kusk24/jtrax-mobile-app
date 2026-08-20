/** The public tournament surface: which events are on right now, and one
    event's mirrored standings and rounds. Both endpoints are public — no
    session, same data the QR-code page serves — so these calls work before
    sign-in resolves and never fail on an expired token. */
import { api } from "./api";

export type LiveTournament = { tournamentId: string; name: string; status: string };

export type PublicStanding = {
  rank: number;
  name: string;
  points: number;
  federation?: string;
  rating?: number;
  club?: string;
  category?: string;
  wins?: number;
  draws?: number;
  losses?: number;
};

export type PublicBoard = {
  board: number;
  white: string;
  whiteRating?: number;
  black?: string;
  blackRating?: number;
  result: string;
};

export type PublicRound = { round: number; date?: string; status: string; pairings: PublicBoard[] };

export type PublicResults = {
  tournament: { name: string; status: string };
  standings: PublicStanding[];
  rounds: PublicRound[];
  source?: string;
  sourceUrl?: string;
  stage?: string;
  fetchedAt?: string;
};

export async function fetchLiveTournaments(): Promise<LiveTournament[]> {
  try {
    return await api.get<LiveTournament[]>("public/live-tournaments");
  } catch {
    // A cold backend hides the banner rather than breaking the home screen.
    return [];
  }
}

export const fetchPublicResults = (id: string) =>
  api.get<PublicResults>(`public/tournaments/${id}/results`);
