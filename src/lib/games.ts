/**
 * Game-room types and calls. The shapes match the web app's `useRoom` exactly,
 * because both talk to the same endpoints — see `jtrax-backend/docs/game-rooms.md`.
 */
import { api } from "./api";
import type { GameClock } from "./live-games";

export type Seat = { userAccountId: string; displayName: string; studentId?: string };

export type Room = {
  gameRoomId: string;
  code?: string;
  label?: string;
  status: "Open" | "Active" | "Finished" | "Cancelled";
  fen: string;
  turn?: "White" | "Black";
  result?: string;
  resultReason?: string;
  white: Seat | null;
  black: Seat | null;
  moveCount: number;
  lichessRated?: boolean;
  /** The time control the office chose, if any. Only a rated game's clock
      runs — Lichess keeps it — and `clock` is where it stands. */
  timeControl?: { limit: number; increment: number };
  clock?: GameClock;
  /** The colour offering a draw, while the offer stands. */
  drawOffer?: "White" | "Black";
  createdAt?: string;
  /** Whether each player has pressed Enter; a game the office set up starts
      once both have. */
  whiteEntered?: boolean;
  blackEntered?: boolean;
  /** Paused by the office mid-game: nobody can move until it resumes it. */
  stopped?: boolean;
};

export type Move = { ply: number; san: string; uci: string; fenAfter: string };

export type RoomDetail = { room: Room; moves: Move[]; seat: "White" | "Black" | ""; legalMoves: string[] };

export const joinRoom = (code: string) =>
  api.post<{ room: Room; seat: "White" | "Black" }>("game-rooms/join", { code });

export const getRoom = (id: string) => api.get<RoomDetail>(`game-rooms/${id}`);

export const postMove = (id: string, move: string) =>
  api.post<{ fen: string; turn: string; result?: string }>(`game-rooms/${id}/moves`, { move });

export const resignRoom = (id: string) => api.post<{ result: string }>(`game-rooms/${id}/resign`);

/** The caller's own games — the server lists only rooms they are seated in. */
export const listMyRooms = () => api.get<Room[]>("game-rooms");

/** Sit down at a game the office set up. It starts once both have. */
export const enterRoom = (id: string) => api.post<{ room: Room }>(`game-rooms/${id}/enter`);

/** Offer a draw, or answer the opponent's. */
export const drawRoom = (id: string, action: "offer" | "accept" | "decline") =>
  api.post<{ status: string }>(`game-rooms/${id}/draw/${action}`);
