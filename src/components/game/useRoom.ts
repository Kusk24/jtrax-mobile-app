import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getAuthToken } from "@/lib/api";
import { getRoom, postMove, resignRoom, type Move, type Room } from "@/lib/games";
import { openEventStream } from "@/lib/sse";

/**
 * Live state for one room — the mobile twin of the web app's `useRoom`.
 *
 * The only real difference is the transport: RN has no `EventSource`, so this
 * uses `openEventStream`, which also lets the bearer token ride on the request
 * (the browser's EventSource cannot send headers, which is why the web app
 * needs a same-origin proxy and this does not).
 */
export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [seat, setSeat] = useState<"White" | "Black" | "">("");
  const [connection, setConnection] = useState<"connecting" | "live" | "offline">("connecting");
  const [error, setError] = useState("");
  const plyRef = useRef(-1);

  const refetch = useCallback(async () => {
    try {
      const detail = await getRoom(roomId);
      plyRef.current = detail.moves.length;
      setRoom(detail.room);
      setMoves(detail.moves);
      setSeat(detail.seat);
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setError("notFound");
      else setError("unreachable");
    }
  }, [roomId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    const stream = openEventStream(`game-rooms/${roomId}/events`, token, {
      onOpen: () => setConnection("live"),
      onError: () => setConnection("offline"),
      onEvent: (name, data) => {
        if (name !== "room") return;
        setConnection("live");
        const snapshot = JSON.parse(data);
        setRoom((r) => (r ? { ...r, ...snapshot } : r));
        // The event carries the position but not the move list, so a change in
        // ply is what triggers the authorized read.
        if (snapshot.ply !== plyRef.current) {
          plyRef.current = snapshot.ply;
          void refetch();
        }
      },
    });
    return () => stream.close();
  }, [roomId, refetch]);

  /** The server is the referee, so a rejection is the truth and the board is
      resynced rather than argued with. */
  const play = useCallback(
    async (uci: string): Promise<string> => {
      try {
        await postMove(roomId, uci);
        await refetch();
        return "";
      } catch (e) {
        await refetch();
        if (e instanceof ApiError && e.status === 409) return "outOfTurn";
        if (e instanceof ApiError && e.status === 400) return "illegal";
        return "unreachable";
      }
    },
    [roomId, refetch],
  );

  const resign = useCallback(async () => {
    await resignRoom(roomId).catch(() => {});
    await refetch();
  }, [roomId, refetch]);

  return { room, moves, seat, connection, error, play, resign, refetch };
}
