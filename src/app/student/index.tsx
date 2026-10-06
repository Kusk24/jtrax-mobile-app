/**
 * Home: the pupil's own chess dashboard, as the web's HomeScreen draws it.
 *
 * Top to bottom: who is here and their streak, today's puzzles (the one blue
 * card in the portal), a robot game left unfinished, any game waiting on
 * them, a tournament on now, the three ways to play, and practice puzzles.
 * The summary numbers live on Profile.
 *
 * Every number here is one the pupil actually has, read from the server — a
 * streak or a count a child sees on their own screen is a claim about them.
 */
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useLocale, useTranslations } from "use-intl";
import { Bot, ChevronRight, DoorOpen, Flame } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { LiveTournamentBanner } from "@/components/LiveTournamentBanner";
import { MyGames } from "@/components/game/MyGames";
import { DailyProgressCard } from "@/components/student/DailyProgressCard";
import { FriendPawns } from "@/components/student/FriendPawns";
import { ModeTile } from "@/components/student/ModeTile";
import { ResumeGameCard } from "@/components/student/ResumeGameCard";
import { useSession } from "@/lib/session";
import { dailyStep, getDailyPuzzles, solvedCount } from "@/lib/puzzles";
import { getProgress } from "@/lib/progress";

function SectionTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="px-0.5 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function StudentHome() {
  const ts = useTranslations("st");
  const t3 = useTranslations("sv3");
  const tp = useTranslations("pv2");
  const locale = useLocale();
  const { pp, st } = usePalette();
  const { user } = useSession();

  const [daily, setDaily] = useState({
    solved: 0,
    total: 3,
    loading: true,
    ...dailyStep([]),
  });
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getDailyPuzzles()
        .then((set) => {
          if (cancelled) return;
          setDaily({
            solved: solvedCount(set.puzzles),
            total: set.puzzles.length || 3,
            loading: false,
            ...dailyStep(set.puzzles),
          });
        })
        .catch(() => !cancelled && setDaily((d) => ({ ...d, loading: false })));
      getProgress()
        .then((p) => !cancelled && setStreak(p.streak.current))
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const name = user?.displayName?.trim() ?? "";
  const firstName = name.split(/\s+/)[0] || name || "—";
  /* The actual today, as the parent home writes it; th-TH gives the Buddhist year. */
  const todayLabel = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  /* "Start" goes straight to the next puzzle to solve rather than to a list
     the pupil then has to choose from; once the day is done, to practice. */
  const startChallenge = () => {
    if (daily.label === "keepPractising") router.push("/student/puzzles");
    else if (daily.next) router.push({ pathname: "/student/puzzles/[puzzleId]", params: { puzzleId: daily.next, set: "daily" } });
    else router.push("/student/puzzles/daily");
  };

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-5 px-4 pb-8 pt-3" showsVerticalScrollIndicator={false}>
      {/* The parent home's greeting: "Hi, Penny!" and the date, the streak on the right. */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text numberOfLines={1} className="font-pp-display-bold text-[23px] leading-tight text-pp-ink">
            {tp("hi", { name: firstName })}
          </Text>
          <Text className="font-pp text-sm text-pp-muted">{todayLabel}</Text>
        </View>
        <View
          accessibilityLabel={t3("dayStreak", { n: streak })}
          className="flex-row items-center gap-1 rounded-full bg-st-orange-soft px-3 py-1.5"
        >
          <Flame size={16} color={st.orange} fill={st.orange} strokeWidth={2.2} />
          <Text className="font-pp-bold text-[14px] text-st-orange">{streak}</Text>
        </View>
      </View>

      <DailyProgressCard
        solved={daily.solved}
        total={daily.total}
        loading={daily.loading}
        onOpen={() => router.push("/student/puzzles/daily")}
        action={{ label: ts(daily.label), onPress: startChallenge }}
      />

      {/* A robot game left unfinished — draws nothing when there is none. */}
      <ResumeGameCard />

      {/* Games somebody is waiting on — draws nothing when there are none. */}
      {user?.userAccountId && <MyGames myAccountId={user.userAccountId} />}

      <LiveTournamentBanner />

      <View className="gap-3">
        <SectionTitle>{t3("games")}</SectionTitle>
        <View className="flex-row gap-3">
          <ModeTile
            tone="blue"
            title={t3("vsAi")}
            sub={t3("vsAiSub")}
            icon={<Bot size={24} color={st.indigo} strokeWidth={2} />}
            onPress={() => router.navigate({ pathname: "/student/play", params: { open: "computer" } })}
          />
          <ModeTile
            tone="orange"
            title={t3("withFriend")}
            sub={t3("withFriendSub")}
            icon={<FriendPawns size={24} />}
            onPress={() => router.navigate({ pathname: "/student/play", params: { open: "challenge" } })}
          />
          <ModeTile
            tone="emerald"
            title={t3("gameRoom")}
            sub={t3("gameRoomSub")}
            icon={<DoorOpen size={24} color={st.emerald} strokeWidth={2} />}
            onPress={() => router.navigate({ pathname: "/student/play", params: { open: "room" } })}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionTitle>{t3("practice")}</SectionTitle>
        <Pressable
          onPress={() => router.navigate("/student/puzzles")}
          accessibilityRole="button"
          className="flex-row items-center justify-between rounded-2xl border border-pp-line bg-pp-card p-3.5 active:bg-pp-mist"
        >
          <View className="min-w-0 flex-row items-center gap-3.5">
            {/* A solid jigsaw piece — the tab bar's Puzzles icon is an
                outline, so the two do not read as the same button. */}
            <View className="size-11 items-center justify-center rounded-xl border border-st-brand-line bg-st-brand-soft">
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  fill={st.brand}
                  d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"
                />
              </Svg>
            </View>
            <View className="min-w-0">
              <Text className="font-pp-bold text-[14px] text-pp-ink">{t3("puzzlesCard")}</Text>
              <Text numberOfLines={1} className="mt-0.5 font-pp-medium text-[12px] text-pp-muted">
                {t3("puzzlesCardSub")}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={pp.faint} strokeWidth={2.5} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
