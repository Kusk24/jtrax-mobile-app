/**
 * The student home, matching the portal's.
 *
 * Every number here is one the pupil actually has. The screen this replaces
 * greeted a hard-coded "Penny" and counted her classes; the streak is now the
 * server's, the puzzle count is today's real set, and the rating is a synced
 * Lichess one — *absent* rather than zero when there is no linked account,
 * because a rating of 0 is a claim about how well a child plays and an empty
 * corner is not.
 */
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";
import { BarChart3, Bot, ChevronRight, Flame, GraduationCap, Puzzle, Swords, Trophy } from "lucide-react-native";
import { LiveTournamentBanner } from "@/components/LiveTournamentBanner";
import { HomeAction, StatTile } from "@/components/student/HomeTiles";
import { useSession } from "@/lib/session";
import { getDailyPuzzles, getPracticeSummary, solvedCount } from "@/lib/puzzles";
import { getMyLichess } from "@/lib/lichess";
import { api } from "@/lib/api";
import { classesAttended } from "@/lib/classes-attended";
import { C } from "@/lib/colors";

/** Today's set is three. Kept as a name so the progress bar and the "0/3" do
    not disagree when the set is still loading. */
const DAILY_TARGET = 3;

/** One rating, chosen the way a coach would introduce a child: rapid is the
    format the academy actually plays, so it leads, and the others stand in
    only when there is no rapid game yet. Puzzle is deliberately last — it is
    not a measure of playing strength. */
const PERF_PREFERENCE = ["rapid", "blitz", "classical", "bullet", "puzzle"];

export default function StudentHome() {
  const t = useTranslations("sv2");
  const tp = useTranslations("play");
  const tl = useTranslations("lichess");
  const { user } = useSession();

  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [total, setTotal] = useState(DAILY_TARGET);
  const [rating, setRating] = useState<{ perf: string; value: number } | null>(null);
  /* Classes checked in to, as on the Profile. Null until it loads. */
  const [classes, setClasses] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getPracticeSummary()
        .then((p) => !cancelled && setStreak(p.streak))
        .catch(() => {});
      getDailyPuzzles()
        .then((set) => {
          if (cancelled) return;
          setSolved(solvedCount(set.puzzles));
          if (set.puzzles.length > 0) setTotal(set.puzzles.length);
        })
        .catch(() => {});
      getMyLichess()
        .then((mine) => {
          if (cancelled || !mine.linked) return;
          const best = [...mine.link.ratings]
            .filter((r) => r.rating > 0)
            .sort(
              (a, b) => PERF_PREFERENCE.indexOf(a.perf) - PERF_PREFERENCE.indexOf(b.perf),
            )[0];
          if (best) setRating({ perf: best.perf, value: best.rating });
        })
        .catch(() => {
          /* No link, or a cold API. The tile simply says "not rated yet". */
        });
      // `attendance` is scoped to the pupil's own rows; the sessions are what
      // the count checks each row against.
      Promise.all([
        api.get<{ session_id: string; check_in_time?: string }[]>("attendance"),
        api.get<{ session_id: string }[]>("class-sessions"),
      ])
        .then(([attendance, sessions]) => {
          if (!cancelled) setClasses(classesAttended(attendance, new Set(sessions.map((x) => x.session_id))));
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const name = user?.displayName?.trim() ?? "";
  const firstName = name.split(/\s+/)[0] || name;
  const initial = name.charAt(0).toUpperCase() || "S";
  const done = solved >= total && total > 0;

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerClassName="px-4 pb-32 pt-3 gap-3"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-display-semibold text-2xl text-navy">
            {t("greeting", { name: firstName })}
          </Text>
          <Text className="mt-1 font-sans text-xs text-muted">{t("greetingSub")}</Text>
        </View>
        <Link href="/student/profile" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("profile")}
            className="size-11 shrink-0 items-center justify-center rounded-full border-2 border-card bg-highlight shadow-clay"
          >
            <Text className="font-display-semibold text-base text-navy">{initial}</Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-row gap-2.5">
        <StatTile
          label={t("streakLabel")}
          value={String(streak)}
          icon={<Flame size={18} color={C.brick} strokeWidth={2.4} />}
        />
        <StatTile
          label={t("dailyChallenge")}
          value={`${solved}/${total}`}
          icon={<Puzzle size={18} color={C.highlightInk} strokeWidth={2.2} />}
        />
      </View>

      {/* Today's challenge. */}
      <View className="overflow-hidden rounded-card border-2 border-highlight bg-highlight p-4 shadow-clay">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-sm text-ink">
              {done ? t("missionComplete") : t("todaysChallenge")}
            </Text>
            <Text className="mt-1 font-sans text-[10.5px] leading-4 text-muted">
              {done ? t("keepStreak") : t("challengeHint")}
            </Text>
          </View>
          <View className="size-12 shrink-0 items-center justify-center rounded-full bg-card">
            <Trophy size={24} color={C.gold} strokeWidth={2.2} />
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[10px] text-muted">
            {t("puzzlesCount", { n: solved })}
          </Text>
          <Text className="font-sans-semibold text-[10px] text-muted">
            {Math.round((solved / total) * 100)}%
          </Text>
        </View>
        <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-card">
          <View
            className="h-full rounded-full bg-navy"
            style={{ width: `${(solved / total) * 100}%` }}
          />
        </View>

        <Link href="/student/puzzles" asChild>
          <Pressable className="mt-3 min-h-10 flex-row items-center justify-center gap-2 rounded-xl bg-navy active:opacity-80">
            <Text className="font-sans-bold text-xs text-white">
              {done ? t("freePlay") : t("startChallenge")}
            </Text>
            <ChevronRight size={16} color={C.white} strokeWidth={2.4} />
          </Pressable>
        </Link>
      </View>

      {/* The two things a pupil comes here to do. */}
      <View className="flex-row gap-2.5">
        <HomeAction
          href="/student/play"
          label={tp("title")}
          body={t("practiceComputer")}
          tone="mint"
          icon={<Bot size={20} color={C.olive} strokeWidth={2.2} />}
        />
        <HomeAction
          href="/student/challenge"
          label={t("playFriend")}
          body={t("playTogether")}
          tone="lilac"
          icon={<Swords size={20} color={C.highlightInk} strokeWidth={2.2} />}
        />
      </View>

      <View>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-sans-bold text-xs text-ink">{t("myProgress")}</Text>
          <Link href="/student/profile" asChild>
            <Pressable>
              <Text className="font-sans-bold text-[10px] text-navy">{t("viewAll")}</Text>
            </Pressable>
          </Link>
        </View>
        <View className="flex-row gap-2.5">
          {/* With no linked account this is an em dash labelled "not rated
              yet", not a 0 — and the label carries which format the number is,
              because "1450" on its own does not say rapid from bullet. */}
          <StatTile
            label={rating ? tl(`perf.${rating.perf}`) : t("unrated")}
            value={rating ? String(rating.value) : "—"}
            icon={<BarChart3 size={18} color={C.highlightInk} strokeWidth={2.2} />}
          />
          {/* Classes, not a second "Daily Challenge": the same count already
              sits at the top of the screen and fills the card below it. */}
          <StatTile
            label={t("classesLabel")}
            value={classes === null ? "—" : String(classes)}
            icon={<GraduationCap size={18} color={C.olive} strokeWidth={2.2} />}
          />
        </View>
      </View>

      <LiveTournamentBanner />
    </ScrollView>
  );
}
