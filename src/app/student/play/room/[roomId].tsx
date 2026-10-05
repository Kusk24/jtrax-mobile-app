import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLocale, useTranslations } from "use-intl";
import { Pause, Wifi, WifiOff } from "lucide-react-native";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { ResultDialog } from "@/components/game/ResultDialog";
import { ChessBoard } from "@/components/game/ChessBoard";
import { CapturedTray } from "@/components/game/CapturedTray";
import { useRoom } from "@/components/game/useRoom";
import { capturedIn, gameFrom, pairedMoves } from "@/lib/chess-core";
import { clockAt, fmtClock, reasonKey, timeControlLabel } from "@/lib/live-games";
import { usePalette } from "@/components/ThemeProvider";
import { outcomeOf } from "@/lib/progress";

/** A live game against another student — the mobile twin of the web app's
    LiveGame. The board is drawn from the moves the server confirmed, never
    from local optimism, so a rejected move never has to be taken back. */
export default function RoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  /* Every way to a board — a class game, a code, a friend's challenge — now
     starts on the Games tab, so every way out leads back there. */
  const home = "/student/play";
  const t = useTranslations("play");
  const ts = useTranslations("st");
  const locale = useLocale();
  const { pp, st } = usePalette();
  const { room, moves, seat, connection, error, play, resign, draw, enter } = useRoom(roomId);
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

  /* A rated game's clock ticks here between Lichess's reports, so the side to
     move sees their time going down rather than jumping once per move. */
  const ticking = Boolean(room?.clock) && room?.status === "Active";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  if (error) {
    return (
      <PlayShell title={t("classGame")} back={home} sound>
        <Panel><Text className="font-pp-bold text-sm text-pp-ink">{t(`error.${error}`)}</Text></Panel>
      </PlayShell>
    );
  }
  if (!room || !game) {
    return (
      <PlayShell title={t("classGame")} back={home} sound>
        <Panel className="flex-row items-center justify-center gap-2">
          <ActivityIndicator color={pp.muted} />
          <Text className="font-pp-bold text-sm text-pp-ink">{t("loading")}</Text>
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
  const clock = clockAt(room.clock, room.turn, room.status === "Active", now);
  /* How it ended, in words — "" when it is not an ending we can name. */
  const reasonKeyed = reasonKey(room.resultReason);
  const reason = reasonKeyed && t.has(`reason.${reasonKeyed}`) ? t(`reason.${reasonKeyed}`) : "";
  const opponentColour = seat === "White" ? "Black" : seat === "Black" ? "White" : "";
  const iEntered = seat === "White" ? room.whiteEntered : seat === "Black" ? room.blackEntered : false;
  const tc = timeControlLabel(room.timeControl);

  /* A name, what that player has taken and — on a rated game — their clock. */
  const playerLine = (side: "w" | "b") => {
    const ms = clock ? (side === "w" ? clock.white : clock.black) : null;
    const running = room.status === "Active" && room.turn === (side === "w" ? "White" : "Black");
    return (
      <View className="flex-row items-center justify-between gap-2 px-1">
        <Text numberOfLines={1} className="min-w-0 flex-1 font-pp-bold text-xs text-pp-ink">
          {nameOf(side)}
        </Text>
        <CapturedTray
          side={side}
          pieces={side === "w" ? captured.byWhite : captured.byBlack}
          advantage={captured.advantage}
        />
        {ms !== null && (
          <View
            accessibilityLabel={t("clock", { name: nameOf(side) })}
            style={{ backgroundColor: ms < 10_000 ? pp.red : running ? pp.navy : pp.line }}
            className="rounded-lg px-2 py-0.5"
          >
            <Text style={{ color: ms < 10_000 || running ? "#ffffff" : pp.ink }} className="font-pp-bold text-[13px]">
              {fmtClock(ms)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  async function onMove(uci: string) {
    setMoveError("");
    const failure = await play(uci);
    if (failure) setMoveError(failure);
  }

  return (
    <PlayShell title={t("classGame")} back={home} sound>
      <Panel className="flex-row items-center justify-between p-3">
        <View>
          <Text className="font-pp-bold text-sm text-pp-ink">
            {opponent ? opponent.displayName : t("waitingForOpponent")}
          </Text>
          <Text className="font-pp text-xs text-pp-muted">
            {t(`seat.${seat || "watching"}`)}
            {tc ? ` · ${t("timeControl", { tc })}` : ""}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          {connection === "live" ? <Wifi size={14} color={pp.green} /> : <WifiOff size={14} color={pp.muted} />}
          <Text className="font-pp-bold text-xs text-pp-muted">{t(`connection.${connection}`)}</Text>
        </View>
      </Panel>

      {/* A game the office set up: both seats are taken and it waits for the
          two players to sit down. One with an empty seat still needs its code
          handed to whoever takes it. */}
      {/* Paused by the teacher. The board can be looked at, not played. */}
      {room.stopped && (
        <Panel className="items-center border-st-gold-soft bg-st-gold-soft">
          <View className="flex-row items-center gap-1.5">
            <Pause size={16} color={st.gold} />
            <Text className="font-pp-bold text-base text-pp-ink">{t("room.onHoldTitle")}</Text>
          </View>
          <Text className="mt-1 text-center font-pp text-xs leading-5 text-pp-muted">{t("room.onHoldBody")}</Text>
        </Panel>
      )}
      {room.status === "Open" && !room.stopped && seat !== "" && opponent && !iEntered && (
        <Panel className="items-center">
          <Text className="text-center font-pp-bold text-base text-pp-ink">
            {t(moves.length > 0 ? "room.continueTitle" : "room.enterTitle", { name: opponent.displayName })}
          </Text>
          <Text className="mt-1 text-center font-pp text-xs text-pp-muted">
            {t(`seat.${seat}`)}
            {tc ? ` · ${t("timeControl", { tc })}` : ""}
          </Text>
          <Text className="mt-1 text-center font-pp text-xs text-pp-muted">
            {t(moves.length > 0 ? "room.continueBody" : "room.enterBody")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void enter()}
            className="mt-3 min-h-11 w-full items-center justify-center rounded-full bg-pp-blue active:bg-pp-deep"
          >
            <Text className="font-pp-bold text-sm text-white">{t("room.enter")}</Text>
          </Pressable>
        </Panel>
      )}
      {room.status === "Open" && !room.stopped && seat !== "" && opponent && iEntered && (
        <Panel className="flex-row items-center justify-center gap-2">
          <ActivityIndicator color={pp.muted} />
          <Text accessibilityLiveRegion="polite" className="font-pp-bold text-sm text-pp-ink">
            {t("room.waitingFor", { name: opponent.displayName })}
          </Text>
        </Panel>
      )}
      {room.status === "Open" && !opponent && (
        <Panel className="items-center">
          <Text className="font-pp-bold text-sm text-pp-ink">{t("shareCode")}</Text>
          <Text className="mt-1.5 font-pp-bold text-3xl tracking-[6px] text-pp-ink">{room.code}</Text>
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
            : seat && room.result
              ? ts(`resultTitle.${outcomeOf(room.result, seat === "White" ? "white" : "black")!}`)
              : t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`)
        }
        detail={room.status === "Finished" && reason ? t("byReason", { reason }) : undefined}
        /* For a player, their own result and what the game was; a watcher
           sees only who won. */
        outcome={room.status === "Finished" && seat ? outcomeOf(room.result, seat === "White" ? "white" : "black") : null}
        facts={
          seat
            ? [
                { label: ts("opponent"), value: opponent?.displayName ?? "—" },
                { label: ts("youPlayed"), value: ts(seat === "White" ? "side.white" : "side.black") },
                { label: ts("timeControl"), value: tc || ts("untimed") },
                { label: ts("when"), value: new Date().toLocaleDateString(locale, { month: "short", day: "numeric" }) },
              ]
            : undefined
        }
        /* Nothing to restart here, so the way on is back to the Games tab the
           board was opened from — as the web's does from its Games tab. Named
           for where it goes: two buttons both reading "Back" is a dialog with
           two doors and one name. */
        primaryLabel={t("backToPlay")}
        onPrimary={() => router.replace(home)}
        onClose={() => setShowResult(false)}
      />

      <Panel className="py-2.5">
        <Text className="text-center font-pp-bold text-sm text-pp-ink">
          {room.status === "Finished"
            ? t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`) +
              (reason ? ` — ${reason}` : "")
            : room.status === "Cancelled"
              ? t("cancelled")
              : room.stopped
                ? t("onHold")
                : myTurn
                  ? t("yourMove")
                  : room.status === "Open"
                    ? t("waitingForOpponent")
                    : t("theirMove")}
        </Text>
        {moveError !== "" && (
          <Text className="mt-1 text-center font-pp-bold text-xs text-pp-red">{t(`error.${moveError}`)}</Text>
        )}
      </Panel>

      {moves.length > 0 && (
        <Panel className="py-2.5">
          {pairedMoves(moves.map((m) => m.san)).map((pair) => (
            <View key={pair.no} className="flex-row">
              <Text className="w-8 font-pp text-xs text-pp-muted">{pair.no}.</Text>
              <Text className="w-16 font-pp text-xs text-pp-ink">{pair.white}</Text>
              <Text className="w-16 font-pp text-xs text-pp-ink">{pair.black ?? ""}</Text>
            </View>
          ))}
        </Panel>
      )}

      {/* A draw offer standing: the other player answers it here, and the one
          who offered is told they are waiting rather than left wondering. */}
      {room.status === "Active" && seat !== "" && room.drawOffer === opponentColour && (
        <Panel className="items-center p-3">
          <Text className="text-center font-pp-bold text-sm text-pp-ink">
            {t("draw.incoming", { name: opponent?.displayName ?? "" })}
          </Text>
          <View className="mt-2.5 w-full flex-row gap-2">
            <Pressable
              onPress={() => void draw("accept")}
              accessibilityRole="button"
              className="min-h-11 flex-1 items-center justify-center rounded-full bg-pp-blue active:bg-pp-deep"
            >
              <Text className="font-pp-bold text-sm text-white">{t("draw.accept")}</Text>
            </Pressable>
            <Pressable
              onPress={() => void draw("decline")}
              accessibilityRole="button"
              className="min-h-11 flex-1 items-center justify-center rounded-full border border-pp-line bg-pp-card active:bg-pp-soft"
            >
              <Text className="font-pp-bold text-sm text-pp-ink">{t("draw.decline")}</Text>
            </Pressable>
          </View>
        </Panel>
      )}
      {room.status === "Active" && seat !== "" && room.drawOffer === seat && (
        <Text accessibilityLiveRegion="polite" className="text-center font-pp-bold text-xs text-pp-muted">
          {t("draw.offered", { name: opponent?.displayName ?? "" })}
        </Text>
      )}

      {room.status === "Active" && seat !== "" && (
        confirmResign ? (
          <View className="flex-row gap-2">
            <Pressable onPress={resign} accessibilityRole="button" className="min-h-12 flex-1 items-center justify-center rounded-full bg-pp-red active:opacity-80">
              <Text className="font-pp-bold text-sm text-white">{t("resignConfirm")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmResign(false)}
              className="min-h-12 flex-1 items-center justify-center rounded-full border border-pp-line bg-pp-card active:bg-pp-soft"
            >
              <Text className="font-pp-bold text-sm text-pp-ink">{t("keepPlaying")}</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row gap-2">
            {!room.drawOffer && (
              <Pressable
                onPress={() => void draw("offer")}
                accessibilityRole="button"
                className="min-h-12 flex-1 items-center justify-center rounded-full border border-pp-line bg-pp-card active:bg-pp-soft"
              >
                <Text className="font-pp-bold text-sm text-pp-ink">{t("draw.offer")}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setConfirmResign(true)}
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-full border border-pp-line bg-pp-card active:bg-pp-soft"
            >
              <Text className="font-pp-bold text-sm text-pp-muted">{t("resign")}</Text>
            </Pressable>
          </View>
        )
      )}
    </PlayShell>
  );
}
