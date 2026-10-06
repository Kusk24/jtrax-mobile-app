/**
 * A finished game, replayed — the web's GameReplay.
 *
 * Read-only: the board steps through the moves that were played, from the
 * start or from any move in the list. A class or challenge game comes from
 * its room; a game against the computer from the record the app saved.
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Chess } from "chess.js";
import { usePalette } from "@/components/ThemeProvider";
import { ChessBoard } from "@/components/game/ChessBoard";
import { Card, SecondaryPill, SubPageHeader } from "@/components/student/kit";
import { OutcomeChip, useWhen } from "@/components/student/HistoryRows";
import { gameFrom, pairedMoves } from "@/lib/chess-core";
import { getRoom } from "@/lib/games";
import { reasonKey } from "@/lib/live-games";
import { getSoloGame, outcomeOf, stampDate } from "@/lib/progress";

type Replay = {
  opponent: string;
  side: "white" | "black";
  ucis: string[];
  result: string;
  reason: string;
  at: string;
  timeControl?: string;
};

export default function GameReplay() {
  const t = useTranslations("st");
  const t3 = useTranslations("sv3");
  const when = useWhen();
  const { pp } = usePalette();
  const { kind, id } = useLocalSearchParams<{ kind?: string; id?: string }>();
  const [replay, setReplay] = useState<Replay | null>(null);
  const [failed, setFailed] = useState(false);
  const [ply, setPly] = useState(0);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const done = (r: Replay) => {
      if (!alive) return;
      setReplay(r);
      setPly(r.ucis.length);
    };
    const load =
      kind === "solo"
        ? getSoloGame(id).then((g) =>
            done({
              opponent: t3(`robotName.${g.opponent as "novice" | "strong" | "expert"}`),
              side: g.side,
              ucis: g.moves,
              result: g.result,
              reason: g.reason,
              at: g.at,
            }),
          )
        : getRoom(id).then((data) => {
            const side = data.seat === "Black" ? "black" : "white";
            const other = side === "white" ? data.room.black : data.room.white;
            const clock = data.room.timeControl;
            done({
              opponent: other?.displayName ?? "—",
              side,
              ucis: data.moves.map((m) => m.uci),
              result: data.room.result ?? "",
              reason: data.room.resultReason ?? "",
              at: data.room.createdAt ?? "",
              timeControl: clock?.limit ? `${Math.round(clock.limit / 60)}+${clock.increment ?? 0}` : undefined,
            });
          });
    load.catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [kind, id, t3]);

  const game = useMemo(() => (replay ? (gameFrom(replay.ucis.slice(0, ply)) ?? new Chess()) : new Chess()), [replay, ply]);
  const sans = useMemo(() => (replay ? (gameFrom(replay.ucis)?.history() ?? []) : []), [replay]);

  /* History, wherever the replay was opened from — the label says so, and
     the web's link goes there too. `navigate` returns to History when it is
     already behind this screen rather than stacking a second one. */
  const back = () => router.navigate("/student/history");
  const header = (
    <SubPageHeader
      onBack={back}
      backLabel={t("backToHistory")}
      title={replay ? t("vs", { them: replay.opponent }) : failed ? t("viewGame") : t("loading")}
      sub={replay?.at ? `${when.date(stampDate(replay.at))} · ${when.time(stampDate(replay.at))}` : undefined}
    />
  );

  if (failed) {
    return (
      <View className="flex-1 gap-4 bg-pp-bg px-4 pt-3">
        {header}
        <Card>
          <Text className="font-pp text-[14px] text-pp-muted">{t("gameNotFound")}</Text>
        </Card>
      </View>
    );
  }

  const outcome = replay ? outcomeOf(replay.result, replay.side) : null;
  const rk = reasonKey(replay?.reason);
  const reasonText = rk && t.has(`reasonLabel.${rk}`) ? t(`reasonLabel.${rk}`) : "—";
  const total = replay?.ucis.length ?? 0;

  const control = (label: string, Icon: typeof ChevronLeft, to: number, disabled: boolean) => (
    <Pressable
      onPress={() => setPly(to)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="size-11 items-center justify-center rounded-full border border-pp-line bg-pp-card active:bg-pp-soft"
    >
      <Icon size={20} color={disabled ? pp.faint : pp.ink} />
    </Pressable>
  );

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-5 px-4 pb-10 pt-3" showsVerticalScrollIndicator={false}>
      {header}

      <View className="items-center gap-3">
        <ChessBoard
          game={game}
          orientation={replay?.side === "black" ? "b" : "w"}
          canMove={false}
          onMove={() => {}}
          lastMove={ply > 0 ? replay?.ucis[ply - 1]?.slice(0, 4) : undefined}
        />
        <View accessibilityLabel={t("replayControls")} className="flex-row items-center gap-2">
          {control(t("firstMove"), ChevronFirst, 0, ply === 0)}
          {control(t("prevMove"), ChevronLeft, Math.max(0, ply - 1), ply === 0)}
          <Text className="min-w-[72px] text-center font-pp-semibold text-[13px] text-pp-muted">
            {ply}/{total}
          </Text>
          {control(t("nextMove"), ChevronRight, Math.min(total, ply + 1), ply === total)}
          {control(t("lastMove"), ChevronLast, total, ply === total)}
        </View>
      </View>

      <Card>
        <View className="flex-row flex-wrap gap-y-3">
          <View className="w-1/2">
            <Text className="font-pp text-[12px] text-pp-muted">{t("result")}</Text>
            <View className="mt-1 flex-row">{outcome ? <OutcomeChip outcome={outcome} /> : <Text className="font-pp-semibold text-pp-ink">—</Text>}</View>
          </View>
          <View className="w-1/2">
            <Text className="font-pp text-[12px] text-pp-muted">{t("youPlayed")}</Text>
            <Text className="mt-1 font-pp-semibold text-[13.5px] text-pp-ink">{replay ? t(`side.${replay.side}`) : "—"}</Text>
          </View>
          <View className="w-1/2">
            <Text className="font-pp text-[12px] text-pp-muted">{t("reason")}</Text>
            <Text className="mt-1 font-pp-semibold text-[13.5px] text-pp-ink">{reasonText}</Text>
          </View>
          <View className="w-1/2">
            <Text className="font-pp text-[12px] text-pp-muted">{t("timeControl")}</Text>
            <Text className="mt-1 font-pp-semibold text-[13.5px] text-pp-ink">{replay?.timeControl ?? t("untimed")}</Text>
          </View>
        </View>
      </Card>

      <Card className="p-3">
        {pairedMoves(sans).map((row) => (
          <View key={row.no} className="flex-row items-center">
            <Text className="w-9 py-1 font-pp text-[13.5px] text-pp-faint">{row.no}.</Text>
            {([row.white, row.black] as const).map((san, j) => {
              const at = (row.no - 1) * 2 + j + 1;
              return san ? (
                <Pressable
                  key={j}
                  onPress={() => setPly(at)}
                  accessibilityRole="button"
                  className={`flex-1 rounded-md px-2 py-1 ${ply === at ? "bg-pp-blue" : ""}`}
                >
                  <Text className={`font-pp-semibold text-[13.5px] ${ply === at ? "text-white" : "text-pp-ink"}`}>{san}</Text>
                </Pressable>
              ) : (
                <View key={j} className="flex-1" />
              );
            })}
          </View>
        ))}
        {total === 0 && replay && <Text className="p-2 font-pp text-[13px] text-pp-muted">{t("noMoves")}</Text>}
      </Card>

      <SecondaryPill label={t("backToHistory")} onPress={back} />
    </ScrollView>
  );
}
