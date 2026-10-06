/**
 * Puzzles: the practice list of twenty, as the web portal has it.
 *
 * Levels mixed, two in three from the pupil's own level. Level tags on top,
 * Today's Challenge as the first row (the day's three, on their own page),
 * then each puzzle with its board, name, level and rating — ticked once
 * solved today. Tomorrow the ticked ones are replaced and the rest stay.
 *
 * This replaced Free Play's three buttons, whose `puzzles/free` endpoint the
 * server no longer has.
 */
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { ChevronRight, Target } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { PlayShell } from "@/components/game/PlayShell";
import { PuzzleRow } from "@/components/student/PuzzleRow";
import {
  FREE_TIERS,
  getDailyPuzzles,
  getPuzzleList,
  solvedCount,
  type FreeTier,
  type PuzzleList,
} from "@/lib/puzzles";

export default function PuzzlesScreen() {
  const t = useTranslations("sv2");
  const t3 = useTranslations("sv3");
  const { pp } = usePalette();
  /* Null until loaded. */
  const [list, setList] = useState<PuzzleList | null>(null);
  const [failed, setFailed] = useState(false);
  /* "" for every level. */
  const [level, setLevel] = useState<FreeTier | "">("");
  const [daily, setDaily] = useState({ solved: 0, total: 3 });

  /* Re-read on every visit: the server swaps yesterday's solved puzzles for
     new ones, and coming back from a solve is the main way back here. */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getPuzzleList()
        .then((l) => {
          if (cancelled) return;
          setFailed(false);
          setList(l);
        })
        .catch(() => !cancelled && setFailed(true));
      getDailyPuzzles()
        .then((set) => {
          if (!cancelled) setDaily({ solved: solvedCount(set.puzzles), total: set.puzzles.length || 3 });
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const tags: [FreeTier | "", string][] = [["", t3("filterAll")], ...FREE_TIERS.map((k) => [k, t3(`level.${k}`)] as [FreeTier, string])];

  return (
    <PlayShell title={t("puzzles")} nav>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5" accessibilityRole="tablist">
        {tags.map(([k, label]) => {
          const on = level === k;
          return (
            <Pressable
              key={k || "all"}
              onPress={() => setLevel(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              className={`rounded-lg px-3.5 py-1.5 ${on ? "bg-pp-blue" : "bg-pp-line"}`}
            >
              <Text className={`font-pp-semibold text-[12.5px] ${on ? "text-white" : "text-pp-muted"}`}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Today's Challenge: the day's three, opening their own page. */}
      <Pressable
        onPress={() => router.push("/student/puzzles/daily")}
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-xl border-[1.5px] border-pp-soft bg-pp-soft p-2.5 active:opacity-80"
      >
        <View className="size-12 items-center justify-center rounded-lg bg-pp-amber-soft">
          <Target size={24} color={pp.amber} strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-pp-bold text-[14px] text-pp-ink">{t3("todaysChallenge")}</Text>
          <Text className="font-pp text-[12px] text-pp-muted">
            {t3("challengeCompleted", { n: daily.solved, total: daily.total })}
          </Text>
        </View>
        <ChevronRight size={20} color={pp.blue} strokeWidth={2.4} />
      </Pressable>

      {failed && !list ? (
        <Text className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-6 text-center font-pp text-[12.5px] text-pp-muted">
          {t("puzzlesUnavailable")}
        </Text>
      ) : !list ? (
        <View className="items-center gap-2 rounded-xl border-[1.5px] border-pp-line bg-pp-card py-6">
          <ActivityIndicator color={pp.muted} />
          <Text className="font-pp text-[12.5px] text-pp-muted">{t("puzzlesLoading")}</Text>
        </View>
      ) : list.puzzles.length === 0 ? (
        <Text className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-6 text-center font-pp text-[12.5px] text-pp-muted">
          {t("puzzlesExhausted")}
        </Text>
      ) : (
        <View className="gap-2">
          {list.puzzles.map((p) =>
            level && p.tier !== level ? null : (
              <PuzzleRow
                key={p.puzzleId}
                puzzle={p}
                tier={p.tier}
                onPress={() =>
                  router.push({
                    pathname: "/student/puzzles/[puzzleId]",
                    params: { puzzleId: p.puzzleId, set: "list", ...(level ? { level } : {}) },
                  })
                }
              />
            ),
          )}
        </View>
      )}
    </PlayShell>
  );
}
