/**
 * The Children tab: who they are, what they did today, and the record of
 * every session the academy has written.
 *
 * The portal lays this out in two columns at ≥lg; a phone has one, so the
 * same blocks stack in the same order.
 */
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslations } from "use-intl";
import { CheckSquare, ChevronLeft, ChevronRight } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { CURRENT, type ChildKey, type HistRow } from "@/lib/parent-v2-data";
import { ChildBanner, ChildFace } from "@/components/parent/ChildFace";
import { useParentData } from "@/components/parent/ParentData";
import { PP } from "@/lib/colors";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const FISH = require("../../../assets/images/shared/fish.png");

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function ParentChildren() {
  const t = useTranslations("pv2");
  const { children: childList, att: ATT, hist, months, todayActivity } = useParentData();
  const [filter, setFilter] = useState<"all" | ChildKey>("all");
  const [month, setMonth] = useState(CURRENT);

  const M = months[month];
  const todayDate = new Date().getDate();
  const cells: { label: string; present: boolean; today: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) cells.push({ label: "", present: false, today: false });
  for (let d = 1; d <= M.days; d++) {
    const keys: ChildKey[] = filter === "all" ? childList.map((c) => c.key) : [filter];
    const present = keys.some((k) => (ATT[k]?.[month] ?? { present: [] }).present.includes(d));
    cells.push({ label: String(d), present, today: month === CURRENT && d === todayDate });
  }

  const groups: { date: string; items: HistRow[] }[] = [];
  hist
    .filter((h) => filter === "all" || h.child === filter)
    .forEach((h) => {
      let g = groups.find((x) => x.date === h.date);
      if (!g) {
        g = { date: h.date, items: [] };
        groups.push(g);
      }
      g.items.push(h);
    });

  const chips: { k: "all" | ChildKey; label: string }[] = [
    { k: "all", label: t("all") },
    ...childList.map((c) => ({ k: c.key, label: c.name })),
  ];

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-5 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-1">
        <Text className="font-display-semibold text-2xl leading-tight text-pp-ink">
          {t("navChildren")}
        </Text>
        <Text className="font-sans text-[12.5px] text-pp-muted">{t("childrenSub")}</Text>
      </View>

      {/* The children */}
      <View className="gap-4">
        <SectionLabel>{t("myChildren", { count: childList.length })}</SectionLabel>
        <View className="flex-row flex-wrap gap-4">
          {childList.map((c) => {
            const low = c.credits <= 2;
            const isBeg = c.level === "Beginner";
            const pct = c.creditsBought > 0
              ? Math.min(100, Math.round((c.credits / c.creditsBought) * 100))
              : 0;
            return (
              <Link key={c.key} href={`/parent/child/${c.key}` as never} asChild>
                <Pressable
                  style={{ backgroundColor: isBeg ? PP.greenSoft : PP.card }}
                  /* Two to a row, with the 16px gap taken out of the width. */
                  className="min-w-0 flex-1 basis-[45%] overflow-hidden rounded-card border-[1.5px] border-pp-line"
                >
                  <ChildBanner name={c.name} tint={c.avBg} />
                  <View className="gap-2 px-3.5 pb-3.5 pt-3">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Text className="font-sans-bold text-[15px] text-pp-ink">{c.name}</Text>
                      {!!c.level && (
                        <View
                          style={{ backgroundColor: isBeg ? PP.greenSoft : PP.amberSoft }}
                          className="rounded-full px-2 py-0.5"
                        >
                          <Text
                            style={{ color: isBeg ? PP.green : PP.amber }}
                            className="font-sans-bold text-[9.5px]"
                          >
                            {c.level}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2 pt-0.5">
                      <CheckSquare size={16} color={PP.muted} strokeWidth={1.8} />
                      <Text className="font-sans-semibold text-xs text-pp-ink">
                        {t("completedClasses", { count: c.attended })}
                      </Text>
                    </View>
                    <View className="gap-1 pt-0.5">
                      <View className="h-1.5 overflow-hidden rounded-full bg-pp-bar-track">
                        <View
                          style={{
                            width: `${pct}%`,
                            backgroundColor: low ? PP.amber : PP.blue,
                          }}
                          className="h-full rounded-full"
                        />
                      </View>
                      <Text className="font-sans text-[10.5px] text-pp-muted">
                        {t("creditsLeftLabel", { count: c.credits })}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </View>

      {/* Today's activity */}
      <View className="gap-3.5">
        <View className="flex-row items-center gap-2">
          <Image source={FISH} style={{ width: 16, height: 16 }} />
          <SectionLabel>{t("todaysActivity")}</SectionLabel>
        </View>
        <View>
          <View className="flex-row items-center gap-2.5 px-0.5 pb-2">
            <View className="flex-1" />
            <Text className="w-[68px] text-right font-sans-bold text-[10px] uppercase text-pp-faint">
              {t("practice")}
            </Text>
            <Text className="w-[68px] text-right font-sans-bold text-[10px] uppercase text-pp-faint">
              {t("challenge")}
            </Text>
          </View>
          {todayActivity.length === 0 && (
            <Text className="px-0.5 py-3 font-sans text-[12.5px] text-pp-muted">
              {t("noPracticeToday")}
            </Text>
          )}
          {todayActivity.map((r, i) => {
            const pct = Math.max(4, Math.min(100, Math.round((r.mins / 30) * 100)));
            const circ = 2 * Math.PI * 8.5;
            return (
              <View
                key={r.child}
                className={`flex-row items-center gap-5 px-0.5 py-3.5 ${
                  i < todayActivity.length - 1 ? "border-b border-pp-neutral" : ""
                }`}
              >
                <View className="size-5 items-center justify-center">
                  {r.done ? (
                    <View className="size-5 items-center justify-center rounded-full bg-pp-green">
                      <Text className="font-sans-bold text-[11px] text-white">✓</Text>
                    </View>
                  ) : (
                    <>
                      <View style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
                        <Svg width={20} height={20} viewBox="0 0 20 20">
                          <Circle cx="10" cy="10" r="8.5" fill="none" stroke="#f3e6d8" strokeWidth="3" />
                          <Circle
                            cx="10"
                            cy="10"
                            r="8.5"
                            fill="none"
                            stroke={PP.amber}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${((circ * pct) / 100).toFixed(1)} ${circ.toFixed(1)}`}
                          />
                        </Svg>
                      </View>
                      <Image source={FISH} style={{ width: 9, height: 9 }} />
                    </>
                  )}
                </View>
                <Text className="flex-1 font-sans text-[13.5px] text-pp-ink">{r.child}</Text>
                <Text className="w-[68px] text-right font-sans-semibold text-[13px] text-pp-muted">
                  {t("minShort", { count: r.mins })}
                </Text>
                <View className="w-[68px] flex-row items-center justify-end gap-1">
                  <Text className="font-sans-bold text-[13px] text-pp-blue">
                    +{Math.max(1, Math.round(r.mins / 10))}
                  </Text>
                  <Image source={FISH} style={{ width: 15, height: 15 }} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <SectionLabel>{t("attHistory")}</SectionLabel>

      {/* Calendar */}
      <View className="gap-3 rounded-card border-[1.5px] border-pp-line bg-pp-card p-4 shadow-clay">
        <View className="flex-row items-center justify-between px-0.5">
          <Pressable
            onPress={() => setMonth((m) => Math.max(0, m - 1))}
            accessibilityRole="button"
            accessibilityLabel={t("prevMonth")}
            disabled={month === 0}
            className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
          >
            <ChevronLeft size={16} color={month === 0 ? PP.line : PP.blue} />
          </Pressable>
          <Text className="font-display-semibold text-[17px] text-pp-ink">{M.name}</Text>
          <Pressable
            onPress={() => setMonth((m) => Math.min(months.length - 1, m + 1))}
            accessibilityRole="button"
            accessibilityLabel={t("nextMonth")}
            disabled={month === months.length - 1}
            className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
          >
            <ChevronRight size={16} color={month === months.length - 1 ? PP.line : PP.blue} />
          </Pressable>
        </View>
        <View className="flex-row flex-wrap">
          {WD_KEYS.map((d) => (
            <View key={d} className="w-[14.28%] py-1">
              <Text className="text-center font-sans-bold text-[10px] text-pp-faint">{d}</Text>
            </View>
          ))}
          {cells.map((c, i) => (
            <View key={i} className="w-[14.28%] p-0.5">
              <View
                style={{
                  backgroundColor: c.present ? PP.greenDot : "transparent",
                  borderWidth: c.today && !c.present ? 1.5 : 0,
                  borderColor: PP.blue,
                }}
                className="aspect-square items-center justify-center rounded-full"
              >
                <Text
                  style={{ color: c.present ? "#fbfff1" : PP.ink }}
                  className={`text-[12.5px] ${
                    c.present || c.today ? "font-sans-bold" : "font-sans"
                  }`}
                >
                  {c.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row justify-center gap-3.5 pt-0.5">
          <View className="flex-row items-center gap-1.5">
            <View className="size-[9px] rounded-full bg-pp-green-dot" />
            <Text className="font-sans text-[10.5px] text-pp-muted">{t("present")}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="size-[9px] rounded-full border-[1.5px] border-pp-blue" />
            <Text className="font-sans text-[10.5px] text-pp-muted">{t("today")}</Text>
          </View>
        </View>
      </View>

      {/* Filter + history */}
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {chips.map((f) => (
            <Pressable
              key={f.k}
              onPress={() => setFilter(f.k)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f.k }}
              style={{
                backgroundColor: filter === f.k ? PP.deep : PP.card,
                borderColor: filter === f.k ? PP.deep : PP.line,
              }}
              className="rounded-full border-[1.5px] px-4 py-2"
            >
              <Text
                style={{ color: filter === f.k ? "#fbfff1" : PP.muted }}
                className="font-sans-bold text-xs"
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {groups.length === 0 && (
          <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-6">
            <Text className="text-center font-sans text-[12.5px] text-pp-muted">
              {t("noAttendanceYet")}
            </Text>
          </View>
        )}

        {groups.map((g) => (
          <View key={g.date} className="gap-2.5">
            <SectionLabel>{g.date}</SectionLabel>
            {g.items.map((h, i) => {
              const c = childList.find((x) => x.key === h.child);
              if (!c) return null;
              return (
                <Link key={`${g.date}-${i}`} href={`/parent/child/${c.key}` as never} asChild>
                  <Pressable className="flex-row items-center gap-3 rounded-card border-[1.5px] border-pp-line bg-pp-card p-4">
                    <ChildFace name={c.name} tint={c.avBg} size={42} />
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text className="font-sans-bold text-[13.5px] text-pp-ink">
                        {c.name} · ♟ {h.cls}
                      </Text>
                      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                        <Text className="font-sans text-[11.5px] text-pp-muted">◷ {h.time}</Text>
                        {/* This slot used to show a branch name the backend
                            does not record; whether the child was there is
                            what the row actually knows. */}
                        <View
                          style={{
                            backgroundColor:
                              h.status === "Present" ? PP.greenSoft : "#fdece0",
                          }}
                          className="rounded-full px-2 py-0.5"
                        >
                          <Text
                            style={{ color: h.status === "Present" ? PP.green : PP.danger }}
                            className="font-sans-bold text-[10px] uppercase"
                          >
                            {h.status === "Present" ? t("present") : t("absent")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
