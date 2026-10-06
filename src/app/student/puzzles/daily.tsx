/**
 * Daily Challenge: the day's three, drawn like the Puzzles list — board,
 * name, level and rating, a tick once solved. Reached from Home's card and
 * from the first row of Puzzles.
 *
 * The set is chosen on the server from the pupil's level and never repeats a
 * puzzle, so an empty list means something and is explained, not left blank.
 */
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { usePalette } from "@/components/ThemeProvider";
import { SubPageHeader } from "@/components/student/kit";
import { PuzzleRow } from "@/components/student/PuzzleRow";
import { getDailyPuzzles, solvedCount, tierOfRating, type DailyPuzzle } from "@/lib/puzzles";

export default function DailyChallenge() {
  const t = useTranslations("sv2");
  const ts = useTranslations("st");
  const t3 = useTranslations("sv3");
  const { pp } = usePalette();
  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Re-read on every visit, so a tick earned on the board is here on return. */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getDailyPuzzles()
        .then((set) => {
          if (cancelled) return;
          setPuzzles(set.puzzles);
          setExhausted(set.exhausted);
        })
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const solved = solvedCount(puzzles);
  const total = puzzles.length || 3;
  const done = puzzles.length > 0 && solved >= puzzles.length;

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-5 px-4 pb-10 pt-3" showsVerticalScrollIndicator={false}>
      <SubPageHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/student"))}
        backLabel={t("back")}
        title={t("dailyChallenge")}
        sub={`${ts("puzzlesOf", { n: solved, total })} · ${done ? t3("dailyDoneBody") : t3("dailyBody", { n: total })}`}
      />
      {loading ? (
        <View className="items-center gap-2 rounded-xl border-[1.5px] border-pp-line bg-pp-card py-6">
          <ActivityIndicator color={pp.muted} />
          <Text className="font-pp text-[12.5px] text-pp-muted">{t("puzzlesLoading")}</Text>
        </View>
      ) : puzzles.length === 0 ? (
        <Text className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-6 text-center font-pp text-[12.5px] leading-5 text-pp-muted">
          {exhausted ? t("puzzlesExhausted") : t("puzzlesUnavailable")}
        </Text>
      ) : (
        <View className="gap-2">
          {puzzles.map((p) => (
            <PuzzleRow
              key={p.puzzleId}
              puzzle={p}
              tier={tierOfRating(p.rating)}
              onPress={() =>
                router.push({ pathname: "/student/puzzles/[puzzleId]", params: { puzzleId: p.puzzleId, set: "daily" } })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
