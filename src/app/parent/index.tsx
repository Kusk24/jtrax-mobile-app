/**
 * The parent home, matching the portal's.
 *
 * Every name and number here belongs to the signed-in family. Top to bottom:
 * the greeting with the bell, recent announcements, a tournament on now and
 * the next one to enter, the children — two to a row, each course with its
 * own balance — and what each of them did today.
 */
import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useLocale, useTranslations } from "use-intl";
import { AnnouncementCard } from "@/components/parent/AnnouncementCard";
import { AnnouncementModal } from "@/components/parent/AnnouncementModal";
import { ChildHomeCard } from "@/components/parent/ChildHomeCard";
import { LiveTournamentCard, useLiveTournaments } from "@/components/parent/LiveTournamentCard";
import { ParentBell } from "@/components/parent/ParentNav2";
import { TapTip } from "@/components/parent/TapTip";
import { TournamentHomeCard } from "@/components/parent/TournamentHomeCard";
import { useParentData } from "@/components/parent/ParentData";
import { usePalette } from "@/components/ThemeProvider";
import { homeAnnouncements } from "@/lib/home-announcements";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";
import { DAILY_PUZZLES } from "@/lib/today-activity";

/** The screen's side padding, which the paged announcements fill between. */
const GUTTER = 16;

/** Section heading — the portal's uppercase tracked label. */
function SectionLabel({ children }: { children: string }) {
  return <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{children}</Text>;
}

export default function ParentHome() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const { width } = useWindowDimensions();
  const {
    announcements, tournamentCards, parent, isAnnRead, markAnnRead,
    children: childList, todayActivity, lowCreditAt,
  } = useParentData();
  const [modalId, setModalId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const live = useLiveTournaments();
  const upcoming = tournamentCards.filter((c) => c.status === "Upcoming");

  const modal = announcements.find((a) => a.id === modalId);
  /* Recent only — the rest stay under View all. */
  const recent = homeAnnouncements(announcements, new Date());
  const open = (a: AnnouncementV2) => {
    markAnnRead(a.id);
    setModalId(a.id);
  };
  const cardWidth = width - GUTTER * 2;

  /* The actual today. th-TH gives the Buddhist year Thai readers use. */
  const todayLabel = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  /* Two children to a row, even on a phone: a family with two sees both. */
  const rows: (typeof childList)[] = [];
  for (let i = 0; i < childList.length; i += 2) rows.push(childList.slice(i, i + 2));

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-8 px-4 pb-10 pt-2.5" showsVerticalScrollIndicator={false}>
      {/* The greeting reads like the console's dashboard header — left
          aligned, no colour band, with the bell on the same row. */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-pp-display-bold text-[23px] leading-tight text-pp-ink">
            {t("hi", { name: parent.name.split(/\s+/)[0] || parent.name })}
          </Text>
          <Text className="font-pp text-sm text-pp-muted">{todayLabel}</Text>
        </View>
        <ParentBell />
      </View>

      {/* Announcements and tournaments are occasional. With none of either the
          section is left out, rather than leaving a gap under the greeting. */}
      {(recent.length > 0 || live.length > 0 || upcoming.length > 0) && (
      <View className="gap-3.5">
        {/* Only while there is something recent; the full list is on the
            Announcements page. */}
        {recent.length > 0 && (
          <>
            <View className="flex-row items-center justify-between">
              <SectionLabel>{t("announcements")}</SectionLabel>
              <Link href="/parent/announcements" asChild>
                <Pressable hitSlop={8}>
                  <Text className="font-pp-bold text-xs text-pp-blue">{t("viewAll")} →</Text>
                </Pressable>
              </Link>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + 12}
              decelerationRate="fast"
              contentContainerStyle={{ gap: 12 }}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)))}
            >
              {recent.map((a) => (
                <AnnouncementCard key={a.id} a={a} unread={!isAnnRead(a.id)} onOpen={() => open(a)} style={{ width: cardWidth }} />
              ))}
            </ScrollView>
            {recent.length > 1 && (
              <View className="flex-row justify-center gap-1.5">
                {recent.map((a, i) => (
                  <View key={a.id} className={`h-1.5 rounded-full ${i === page ? "w-[18px] bg-pp-blue" : "w-1.5 bg-pp-soft"}`} />
                ))}
              </View>
            )}
          </>
        )}

        {/* What is on now, with its results — the same card the student
            portal shows. */}
        <LiveTournamentCard live={live} />

        {/* Only while one is coming up: registration, then the registered
            child's entry (lib/tournament-card). Gone once it starts, when the
            card above takes over. */}
        {upcoming.length > 0 && (
          <>
            <View className="mt-2">
              <SectionLabel>{t("upcomingTournament")}</SectionLabel>
            </View>
            {upcoming.map((card) => (
              <TournamentHomeCard key={card.id} card={card} />
            ))}
          </>
        )}
      </View>
      )}

      {/* The children, and what they did today. */}
      <View className="gap-3.5">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("myChildren", { count: childList.length })}</SectionLabel>
          <Link href="/parent/profile" asChild>
            <Pressable hitSlop={8}>
              <Text className="font-pp-bold text-xs text-pp-blue">{t("viewAll")} →</Text>
            </Pressable>
          </Link>
        </View>
        <View className="gap-2.5">
          {rows.map((row) => (
            <View key={row.map((c) => c.key).join()} className="flex-row gap-2.5">
              {row.map((c) => (
                <ChildHomeCard key={c.key} child={c} lowCreditAt={lowCreditAt} />
              ))}
              {/* An odd child out keeps its half width rather than stretching. */}
              {row.length === 1 && <View className="flex-1" />}
            </View>
          ))}
        </View>

        <View className="mt-2">
          <SectionLabel>{t("todaysActivity")}</SectionLabel>
        </View>
        <View className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-4">
          {todayActivity.length === 0 && (
            <Text className="py-3.5 font-pp text-[12.5px] text-pp-muted">{t("noPracticeToday")}</Text>
          )}
          {todayActivity.map((r, i) => (
            <View
              key={r.child}
              className={`flex-row items-center gap-3 py-3.5 ${i < todayActivity.length - 1 ? "border-b border-pp-panel" : ""}`}
            >
              <TapTip tip={t("dailyPuzzlesDone", { count: r.daily })}>
                <PuzzleRing solved={r.daily} done={r.done} />
              </TapTip>
              <Text className="flex-1 font-pp text-[13.5px] text-pp-ink">{r.child}</Text>
              <TapTip tip={t("practiceTimeTip")}>
                <Text className="font-pp-semibold text-[13px] text-pp-muted">{t("minShort", { count: r.mins })}</Text>
              </TapTip>
            </View>
          ))}
        </View>
      </View>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </ScrollView>
  );
}

/** A tiny donut of today's daily puzzles: a third per puzzle solved, full
    green once the whole set is done. */
function PuzzleRing({ solved, done }: { solved: number; done: boolean }) {
  const { pp } = usePalette();
  const r = 8;
  const c = 2 * Math.PI * r;
  const share = solved / DAILY_PUZZLES;
  return (
    <View style={{ transform: [{ rotate: "-90deg" }] }}>
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle cx="10" cy="10" r={r} fill="none" strokeWidth="3.5" stroke={pp.panel} />
        {solved > 0 && (
          <Circle
            cx="10"
            cy="10"
            r={r}
            fill="none"
            strokeWidth="3.5"
            stroke={pp.green}
            strokeDasharray={`${c * share} ${c}`}
            strokeLinecap={done ? "butt" : "round"}
          />
        )}
      </Svg>
    </View>
  );
}
