/**
 * Today's puzzles, and Free Play under them.
 *
 * The set comes from the academy's bank, matched to this pupil's rating, and
 * is never repeated — so an empty list means something and is explained rather
 * than left blank. Free Play is a puzzle at a time at a chosen difficulty, for
 * a pupil who wants to keep going; it opens on the same board screen.
 */
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { Check, Puzzle as PuzzleIcon, Star } from "lucide-react-native";
import { PlayShell, Panel } from "@/components/game/PlayShell";
import { FREE_TIERS, getDailyPuzzles, solvedCount, type DailyPuzzle } from "@/lib/puzzles";
import { C } from "@/lib/colors";

/** One per puzzle in a set of three, so a child can tell them apart at a
    glance before they have opened any of them. */
const TOKENS = ["♟", "♞", "♜"];
const TINTS = ["bg-highlight", "bg-olive-soft", "bg-brick-soft"];

/** Free Play's three levels, with how many stars each shows. */
const TIER_TITLE = {
  beginner: "beginnerPuzzles",
  intermediate: "intermediatePuzzles",
  advanced: "advancedPuzzles",
} as const;

export default function PuzzlesScreen() {
  const t = useTranslations("sv2");
  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Re-read on every visit rather than on mount: coming back from a solved
     puzzle is the main way this screen is reached a second time, and a tick
     that only appears after a restart is not a tick. */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
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

  const done = solvedCount(puzzles);
  const total = puzzles.length || 3;

  return (
    <PlayShell title={t("puzzles")} nav>
      <Text className="-mt-1 mb-1 font-sans text-xs text-muted">{t("puzzlesSub")}</Text>

      <Panel>
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text className="font-sans-bold text-sm text-ink">{t("dailyChallenge")}</Text>
            <Text className="mt-0.5 font-sans text-[10px] text-muted">
              {t("puzzlesCount", { n: done })}
            </Text>
          </View>
          <View className="size-8 items-center justify-center rounded-xl bg-highlight">
            <PuzzleIcon size={16} color={C.highlightInk} strokeWidth={2.2} />
          </View>
        </View>

        <View className="mb-4 h-2 overflow-hidden rounded-full bg-highlight">
          <View
            className="h-full rounded-full bg-navy"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </View>

        {loading ? (
          <View className="items-center gap-2 py-6">
            <ActivityIndicator color={C.navy} />
            <Text className="font-sans text-[11px] text-muted">{t("puzzlesLoading")}</Text>
          </View>
        ) : puzzles.length === 0 ? (
          <Text className="px-3 py-6 text-center font-sans text-[11px] leading-5 text-muted">
            {exhausted ? t("puzzlesExhausted") : t("puzzlesUnavailable")}
          </Text>
        ) : (
          <View className="gap-2.5">
            {puzzles.map((p, i) => (
              <Link key={p.puzzleId} href={`/student/puzzles/${p.puzzleId}`} asChild>
                <Pressable className="flex-row items-center gap-3 rounded-2xl border-2 border-line bg-card px-3 py-2.5 active:opacity-80">
                  <View
                    className={`size-10 items-center justify-center rounded-xl ${TINTS[i % TINTS.length]}`}
                  >
                    <Text className="text-[22px] leading-7 text-ink">{TOKENS[i % TOKENS.length]}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-bold text-[13px] text-ink">
                      {t("puzzleN", { n: i + 1 })}
                    </Text>
                    <Text className="font-sans text-[10px] text-muted">
                      {p.solved ? t("solvedLabel") : t("ratingLabel", { rating: p.rating })}
                    </Text>
                  </View>
                  {p.solved ? (
                    <View className="size-7 items-center justify-center rounded-full bg-olive-soft">
                      <Check size={16} color={C.olive} strokeWidth={3} />
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1 rounded-full bg-highlight px-2 py-1">
                      <Text className="font-sans-bold text-[10px] text-highlight-ink">+1</Text>
                      <Star size={12} color={C.highlightInk} fill={C.highlightInk} />
                    </View>
                  )}
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </Panel>

      <Panel>
        <View className="mb-3">
          <Text className="font-sans-bold text-sm text-ink">{t("freePlay")}</Text>
          <Text className="mt-0.5 font-sans text-[10px] text-muted">{t("freePlayHint")}</Text>
        </View>
        <View className="gap-2.5">
          {FREE_TIERS.map((tier, i) => (
            <Link key={tier} href={`/student/puzzles/free?tier=${tier}`} asChild>
              <Pressable className="flex-row items-center gap-3 rounded-2xl border-2 border-line bg-card px-3 py-2.5 active:opacity-80">
                <View className="size-10 items-center justify-center rounded-xl bg-highlight">
                  <Text className="text-[22px] leading-7 text-ink">♞</Text>
                </View>
                <Text className="min-w-0 flex-1 font-sans-bold text-[13px] text-ink">
                  {t(TIER_TITLE[tier])}
                </Text>
                <View className="flex-row gap-0.5">
                  {Array.from({ length: i + 1 }, (_, n) => (
                    <Star key={n} size={16} color={C.highlightInk} fill={C.highlightInk} />
                  ))}
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </Panel>
    </PlayShell>
  );
}
