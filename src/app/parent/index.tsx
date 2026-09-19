/**
 * The parent home, matching the portal's.
 *
 * Every name and number here belongs to the signed-in family. The screen this
 * replaced greeted "Sandy Jones" and listed her two invented children to
 * whoever signed in — a parent authenticated for real and then looked at
 * somebody else's family.
 */
import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocale, useTranslations } from "use-intl";
import { AnnouncementModal, SENDER_STYLE } from "@/components/parent/AnnouncementModal";
import { ChildFace } from "@/components/parent/ChildFace";
import { TournamentBanner } from "@/components/parent/TournamentBanner";
import { LiveTournamentBanner } from "@/components/LiveTournamentBanner";
import { useParentData } from "@/components/parent/ParentData";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";

/** Section heading — the portal's uppercase tracked label. */
function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function ParentHome() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const router = useRouter();
  const {
    announcements, tournament, parent, isAnnRead, markAnnRead,
    children: childList, todayActivity,
  } = useParentData();
  const [modalId, setModalId] = useState<string | null>(null);

  const modal = announcements.find((a) => a.id === modalId);
  const open = (a: AnnouncementV2) => {
    markAnnRead(a.id);
    setModalId(a.id);
  };

  /* The actual today. th-TH gives the Buddhist year Thai readers use. */
  const todayLabel = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-8 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-display-semibold text-[23px] leading-tight text-pp-ink">
            {t("hi", { name: parent.name.split(/\s+/)[0] || parent.name })}
          </Text>
          <View className="rounded-full border-[1.5px] border-pp-blue px-2 py-0.5">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.2px] text-pp-blue">
              {t("roleParent")}
            </Text>
          </View>
        </View>
        <Text className="font-sans text-sm text-pp-muted">{todayLabel}</Text>
      </View>

      {/* Announcements */}
      <View className="gap-3.5">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("announcements")}</SectionLabel>
          <Link href="/parent/announcements" asChild>
            <Pressable>
              <Text className="font-sans-bold text-xs text-pp-blue">{t("viewAll")} →</Text>
            </Pressable>
          </Link>
        </View>
        {announcements.length === 0 && (
          <Text className="font-sans text-[12.5px] text-pp-muted">{t("noAnnouncements")}</Text>
        )}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3"
        >
          {announcements.map((a) => {
            const ss = SENDER_STYLE[a.sender];
            return (
              <Pressable
                key={a.id}
                onPress={() => open(a)}
                accessibilityRole="button"
                style={{ backgroundColor: ss.bg }}
                className="w-[300px] gap-1.5 rounded-card p-4"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="min-w-0 flex-1 font-sans-bold text-sm leading-snug text-pp-ink">
                    {a.title}
                  </Text>
                  {!isAnnRead(a.id) && (
                    <View className="rounded-full bg-pp-blue px-2 py-0.5">
                      <Text className="font-sans-bold text-[9px] uppercase text-white">
                        {t("new")}
                      </Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={2} className="font-sans text-xs leading-relaxed text-pp-sub">
                  {a.msg}
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <Text style={{ color: ss.c }} className="font-sans-semibold text-[11px]">
                    {a.senderName}
                  </Text>
                  <Text className="font-sans text-[10.5px] text-pp-muted">{a.time}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <LiveTournamentBanner />

        {/* Only when an event is actually open — the card that used to sit
            here advertised the same tournament forever. */}
        {tournament && (
          <>
            <SectionLabel>{t("upcomingTournament")}</SectionLabel>
            <View className="overflow-hidden rounded-card bg-pp-card shadow-clay-lg">
              <View>
                <TournamentBanner height={158} />
                <View className="absolute right-4 top-2.5 size-16 items-center justify-center rounded-full border-[2.5px] border-white bg-pp-danger">
                  <Text className="text-center font-sans-bold text-[7.5px] uppercase leading-tight text-white">
                    {t("registerCloses")}
                  </Text>
                  <Text className="font-display-semibold text-xl leading-none text-white">
                    {tournament.closesInDays}
                  </Text>
                  <Text className="font-sans-bold text-[8px] uppercase leading-none text-white">
                    {t("days")}
                  </Text>
                </View>
              </View>
              <View className="gap-2 px-4 pb-4 pt-4">
                <Text className="font-display-semibold text-lg leading-tight text-pp-ink">
                  {tournament.name}
                </Text>
                <Pressable
                  onPress={() => router.push("/parent/tournament")}
                  accessibilityRole="button"
                  className="mt-1 rounded-card bg-pp-navy py-3"
                >
                  <Text className="text-center font-sans-bold text-sm text-white">
                    {t("registerNow")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>

      {/* The children, and what they did today */}
      <View className="gap-3.5">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t("myChildren", { count: childList.length })}</SectionLabel>
          <Link href="/parent/attendance" asChild>
            <Pressable>
              <Text className="font-sans-bold text-xs text-pp-blue">{t("viewAll")} →</Text>
            </Pressable>
          </Link>
        </View>
        <View className="overflow-hidden rounded-card border-[1.5px] border-pp-line bg-pp-card">
          {childList.map((c, i) => (
            <Link key={c.key} href={`/parent/child/${c.key}` as never} asChild>
              <Pressable
                className={`flex-row items-center gap-3 px-4 py-3.5 ${
                  i < childList.length - 1 ? "border-b border-pp-panel" : ""
                }`}
              >
                <ChildFace name={c.name} tint={c.avBg} size={42} />
                <View className="min-w-0 flex-1 gap-0.5">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-sans-bold text-sm text-pp-ink">{c.name}</Text>
                    {!!c.level && (
                      <View className="rounded-full bg-pp-soft px-2 py-0.5">
                        <Text className="font-sans-bold text-[9.5px] text-pp-blue">{c.level}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-sans text-[11.5px] text-pp-muted">{c.clsTitle}</Text>
                </View>
                <Text className="font-sans-bold text-[12.5px] text-pp-ink">
                  {t("creditsShort", { count: c.credits })}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <SectionLabel>{t("todaysActivity")}</SectionLabel>
        <View className="rounded-card border-[1.5px] border-pp-line bg-pp-card px-4">
          {todayActivity.length === 0 && (
            <Text className="py-3.5 font-sans text-[12.5px] text-pp-muted">
              {t("noPracticeToday")}
            </Text>
          )}
          {todayActivity.map((r, i) => (
            <View
              key={r.child}
              className={`flex-row items-center gap-3 py-3.5 ${
                i < todayActivity.length - 1 ? "border-b border-pp-panel" : ""
              }`}
            >
              <View
                className={`size-5 items-center justify-center rounded-full ${
                  r.done ? "bg-pp-green" : "bg-pp-panel"
                }`}
              >
                <Text
                  className={`font-sans-bold text-[11px] ${r.done ? "text-white" : "text-pp-muted"}`}
                >
                  {r.done ? "✓" : "·"}
                </Text>
              </View>
              <Text className="flex-1 font-sans text-[13.5px] text-pp-ink">{r.child}</Text>
              <Text className="font-sans-semibold text-[13px] text-pp-muted">
                {t("minShort", { count: r.mins })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </ScrollView>
  );
}
