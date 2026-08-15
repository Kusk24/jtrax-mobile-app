/**
 * Game-room types and calls. The shapes match the web app's `useRoom` exactly,
 * because both talk to the same endpoints — see `jtrax-backend/docs/game-rooms.md`.
 */
import { api } from "./api";

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
};

export type Move = { ply: number; san: string; uci: string; fenAfter: string };

export type RoomDetail = { room: Room; moves: Move[]; seat: "White" | "Black" | ""; legalMoves: string[] };

export const joinRoom = (code: string) =>
  api.post<{ room: Room; seat: "White" | "Black" }>("game-rooms/join", { code });

export const getRoom = (id: string) => api.get<RoomDetail>(`game-rooms/${id}`);

export const postMove = (id: string, move: string) =>
  api.post<{ fen: string; turn: string; result?: string }>(`game-rooms/${id}/moves`, { move });

export const resignRoom = (id: string) => api.post<{ result: string }>(`game-rooms/${id}/resign`);
