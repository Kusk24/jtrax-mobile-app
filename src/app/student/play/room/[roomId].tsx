import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { Wifi, WifiOff } from "lucide-react-native";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ResultDialog } from "@/components/game/ResultDialog";
import { ChessBoard } from "@/components/game/ChessBoard";
import { CapturedTray } from "@/components/game/CapturedTray";
import { useRoom } from "@/components/game/useRoom";
import { capturedIn, gameFrom, pairedMoves } from "@/lib/chess-core";
import { C } from "@/lib/colors";

/** A live game against another student — the mobile twin of the web app's
    LiveGame. The board is drawn from the moves the server confirmed, never
    from local optimism, so a rejected move never has to be taken back. */
export default function RoomScreen() {
  const { roomId, from } = useLocalSearchParams<{ roomId: string; from?: string }>();
  /* A board is reached from Play (a class game, by code) or from Challenge (a
     game with a friend), and both ways out lead back to where the pupil came
     from. The Challenge screen says so in the link. */
  const home = from === "challenge" ? "/student/challenge" : "/student/play";
  const t = useTranslations("play");
  const { room, moves, seat, connection, error, play, resign } = useRoom(roomId);
  const [moveError, setMoveError] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  /* Raised once when the room ends, and dismissible — a class game is often
     looked back over with a teacher standing there. Declared with the other
     hooks because there are early returns below, and a hook cannot sit after
     one. `over` covers both ways a room ends: played out, or stopped from the
     console. */
  const over = room?.status === "Finished" || room?.status === "Cancelled";
  const [showResult, setShowResult] = useState(false);
  const announced = useRef(false);
  useEffect(() => {
    if (over && !announced.current) {
      announced.current = true;
      setShowResult(true);
    }
  }, [over]);

  const game = useMemo(() => gameFrom(moves.map((m) => m.uci)), [moves]);

  if (error) {
    return (
      <PlayShell title={t("classGame")} back={home} sound>
        <Panel><Text className="font-sans-bold text-sm text-ink">{t(`error.${error}`)}</Text></Panel>
      </PlayShell>
    );
  }
  if (!room || !game) {
    return (
      <PlayShell title={t("classGame")} back={home} sound>
        <Panel className="flex-row items-center justify-center gap-2">
          <ActivityIndicator color={C.navy} />
          <Text className="font-sans-bold text-sm text-ink">{t("loading")}</Text>
        </Panel>
      </PlayShell>
    );
  }

  const orientation = seat === "Black" ? "b" : "w";
  const myTurn = room.status === "Active" && seat !== "" && room.turn === seat;
  const opponent = seat === "White" ? room.black : room.white;
  // The whole move: the board highlights both its squares and slides the
  // arriving piece in from the first.
  const lastMove = moves.length ? moves[moves.length - 1].uci : undefined;

  const captured = capturedIn(game);
  /* The board is drawn from the viewer's side, so whoever is at the top of it
     is the other player — and their tray belongs above the board, next to
     their name, the way it sits on any board they have seen before. */
  const topSide = orientation === "w" ? "b" : "w";
  const nameOf = (side: "w" | "b") =>
    (side === "w" ? room.white : room.black)?.displayName ?? t("emptySeat");
  const playerLine = (side: "w" | "b") => (
    <View className="flex-row items-center justify-between gap-2 px-1">
      <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-bold text-xs text-ink">
        {nameOf(side)}
      </Text>
      <CapturedTray
        side={side}
        pieces={side === "w" ? captured.byWhite : captured.byBlack}
        advantage={captured.advantage}
      />
    </View>
  );

  async function onMove(uci: string) {
    setMoveError("");
    const failure = await play(uci);
    if (failure) setMoveError(failure);
  }

  return (
    <PlayShell title={t("classGame")} back={home} sound>
      <Panel className="!flex-row !items-center !justify-between !p-3">
        <View>
          <Text className="font-sans-bold text-sm text-ink">
            {opponent ? opponent.displayName : t("waitingForOpponent")}
          </Text>
          <Text className="font-sans text-xs text-muted">{t(`seat.${seat || "watching"}`)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          {connection === "live" ? <Wifi size={14} color={C.olive} /> : <WifiOff size={14} color={C.muted} />}
          <Text className="font-sans-bold text-xs text-muted">{t(`connection.${connection}`)}</Text>
        </View>
      </Panel>

      {room.status === "Open" && (
        <Panel className="items-center">
          <Text className="font-sans-bold text-sm text-ink">{t("shareCode")}</Text>
          <Text className="mt-1.5 font-sans-bold text-3xl tracking-[6px] text-navy">{room.code}</Text>
        </Panel>
      )}

      <View className="gap-1.5">
        {playerLine(topSide)}
        <ChessBoard game={game} orientation={orientation} canMove={myTurn} onMove={onMove} lastMove={lastMove} />
        {playerLine(orientation)}
      </View>

      <ResultDialog
        visible={over && showResult}
        title={
          room.status === "Cancelled"
            ? t("cancelled")
            : t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`)
        }
        detail={
          room.status === "Finished" && room.resultReason
            ? t("byReason", { reason: t(`reason.${room.resultReason}`) })
            : undefined
        }
        /* Nothing to restart here, so the way on is back to the screen the
           board was opened from: Play for a class game, Challenge for a game
           with a friend, where the next invitation is. Named for where it
           goes: two buttons both reading "Back" is a dialog with two doors and
           one name. */
        primaryLabel={t(from === "challenge" ? "backToChallenge" : "backToPlay")}
        onPrimary={() => router.replace(home)}
        onClose={() => setShowResult(false)}
      />

      <Panel className="!py-2.5">
        <Text className="text-center font-sans-bold text-sm text-ink">
          {room.status === "Finished"
            ? t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`) +
              (room.resultReason ? ` — ${t(`reason.${room.resultReason}`)}` : "")
            : room.status === "Cancelled"
              ? t("cancelled")
              : myTurn
                ? t("yourMove")
                : room.status === "Open"
                  ? t("waitingForOpponent")
                  : t("theirMove")}
        </Text>
        {moveError !== "" && (
          <Text className="mt-1 text-center font-sans-bold text-xs text-brick">{t(`error.${moveError}`)}</Text>
        )}
      </Panel>

      {moves.length > 0 && (
        <Panel className="!py-2.5">
          {pairedMoves(moves.map((m) => m.san)).map((pair) => (
            <View key={pair.no} className="flex-row">
              <Text className="w-8 font-sans text-xs text-muted">{pair.no}.</Text>
              <Text className="w-16 font-sans text-xs text-ink">{pair.white}</Text>
              <Text className="w-16 font-sans text-xs text-ink">{pair.black ?? ""}</Text>
            </View>
          ))}
        </Panel>
      )}

      {room.status === "Active" && seat !== "" && (
        confirmResign ? (
          <View className="flex-row gap-2">
            <Pressable onPress={resign} className="flex-1 items-center rounded-xl bg-brick py-3 active:opacity-80">
              <Text className="font-sans-bold text-sm text-white">{t("resignConfirm")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmResign(false)}
              className="flex-1 items-center rounded-xl border-2 border-line bg-card py-3 active:opacity-80"
            >
              <Text className="font-sans-bold text-sm text-ink">{t("keepPlaying")}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setConfirmResign(true)}
            className="items-center rounded-xl border-2 border-line bg-card py-3 active:opacity-80"
          >
            <Text className="font-sans-bold text-sm text-muted">{t("resign")}</Text>
          </Pressable>
        )
      )}
    </PlayShell>
  );
}
