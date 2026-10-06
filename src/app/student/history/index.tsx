/**
 * History: Games | Challenges — the web's HistoryScreen.
 *
 * Two lists of meaningful chess, not a feed of every tap. A game says who,
 * when and how it ended, and opens to its replay; a daily challenge says the
 * day, whether it was finished, and opens to its three puzzles. History
 * belongs to the Games tab: back always goes there.
 */
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { CalendarCheck, ChessKnight } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { Card, PrimaryPill, SubPageHeader } from "@/components/student/kit";
import { ChallengeRow, GameRow } from "@/components/student/HistoryRows";
import { ResultFilter, type ResultChoice } from "@/components/student/ResultFilter";
import { useSession } from "@/lib/session";
import {
  academyToday,
  getHistory,
  getProgress,
  isFinishedGame,
  outcomeOf,
  type HistoryEntry,
  type Progress,
} from "@/lib/progress";

type Tab = "games" | "challenges";

export default function HistoryScreen() {
  const t = useTranslations("st");
  const tc = useTranslations("common");
  const { pp } = usePalette();
  const { user } = useSession();
  const studentId = user?.studentId ?? "";
  const [tab, setTab] = useState<Tab>("games");
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [filter, setFilter] = useState<ResultChoice>("all");
  const today = academyToday();

  useFocusEffect(
    useCallback(() => {
      if (!studentId) return;
      let alive = true;
      getHistory(studentId)
        .then((h) => alive && setHistory(h))
        .catch(() => alive && setHistory([]));
      getProgress()
        .then((p) => alive && setProgress(p))
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, [studentId]),
  );

  const games = useMemo(
    () => (history ?? []).filter(isFinishedGame).map((g) => ({ g, outcome: outcomeOf(g.result, g.side) })),
    [history],
  );
  const shown = filter === "all" ? games : games.filter((x) => x.outcome === filter);
  const dailyByDay = useMemo(() => {
    const m = new Map<string, HistoryEntry[]>();
    for (const e of history ?? []) {
      if (e.kind === "puzzle" && e.source === "daily") m.set(e.day, [...(m.get(e.day) ?? []), e]);
    }
    return m;
  }, [history]);

  const empty = (icon: React.ReactNode, title: string, body: string, action: React.ReactNode) => (
    <View className="items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-pp-line bg-pp-bg px-5 py-8">
      <View className="size-12 items-center justify-center rounded-2xl bg-pp-soft">{icon}</View>
      <Text className="text-center font-pp-display-semibold text-[15px] text-pp-ink">{title}</Text>
      <Text className="max-w-[340px] text-center font-pp text-[13px] leading-5 text-pp-muted">{body}</Text>
      <View className="mt-2">{action}</View>
    </View>
  );

  const loading = (
    <View className="items-center py-8">
      <ActivityIndicator color={pp.muted} />
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-5 px-4 pb-10 pt-3" showsVerticalScrollIndicator={false}>
      <SubPageHeader
        onBack={() => router.navigate("/student/play")}
        backLabel={tc("back")}
        title={t("history")}
        sub={t("historySub")}
      />

      {/* The tabs, and on Games the result filter beside them. */}
      <View className="flex-row items-center gap-2">
        <View accessibilityRole="tablist" className="flex-1 flex-row gap-1.5 rounded-full bg-pp-soft p-1">
          {(["games", "challenges"] as const).map((k) => {
            const on = tab === k;
            const Icon = k === "games" ? ChessKnight : CalendarCheck;
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                className={`h-10 flex-1 flex-row items-center justify-center gap-2 rounded-full ${on ? "bg-pp-card" : ""}`}
              >
                <Icon size={16} color={on ? pp.blue : pp.muted} />
                <Text className={`font-pp-semibold text-[14px] ${on ? "text-pp-blue" : "text-pp-muted"}`}>
                  {t(k === "games" ? "tabGames" : "tabChallenges")}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {tab === "games" && (
          <ResultFilter
            value={filter}
            onChange={setFilter}
            label={t("filterResults")}
            labels={{ all: t("all"), win: t("outcome.win"), loss: t("outcome.loss"), draw: t("outcome.draw") }}
          />
        )}
      </View>

      {tab === "games" ? (
        history === null ? (
          loading
        ) : shown.length === 0 ? (
          empty(
            <ChessKnight size={24} color={pp.blue} strokeWidth={1.8} />,
            t("noGames"),
            t("noGamesBody"),
            <PrimaryPill label={t("goPlay")} onPress={() => router.navigate("/student/play")} />,
          )
        ) : (
          <Card className="py-1.5">
            {shown.map(({ g, outcome }, i) => (
              <View key={`${g.kind}-${g.id}`} className={i > 0 ? "border-t border-pp-line" : ""}>
                <GameRow game={g} outcome={outcome} />
              </View>
            ))}
          </Card>
        )
      ) : progress === null ? (
        loading
      ) : progress.challenges.length === 0 ? (
        empty(
          <CalendarCheck size={24} color={pp.blue} strokeWidth={1.8} />,
          t("noChallenges"),
          t("noChallengesBody"),
          <PrimaryPill label={t("startChallenge")} onPress={() => router.push("/student/puzzles/daily")} />,
        )
      ) : (
        <Card className="py-1.5">
          {progress.challenges.map((c, i) => (
            <View key={c.date} className={i > 0 ? "border-t border-pp-line" : ""}>
              <ChallengeRow day={c} puzzles={dailyByDay.get(c.date)} today={today} />
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
