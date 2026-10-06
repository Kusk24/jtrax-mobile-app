/**
 * The Attendance tab — the web's: a month of the classes the children came
 * to, two filters (which child, which course) with the credits the rows they
 * leave cost, and every session the academy wrote, by date, each with what
 * it cost. The children themselves and today's practice are on the home.
 */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslations } from "use-intl";
import { ChevronLeft, ChevronRight, Users } from "lucide-react-native";
import { CURRENT, type ChildKey, type HistRow } from "@/lib/parent-v2-data";
import { coursesOf, usedCredits } from "@/lib/course-filter";
import { CreditLine } from "@/components/parent/AttendanceRow";
import { ChildFace } from "@/components/parent/ChildFace";
import { CourseFilter, CreditsUsed } from "@/components/parent/CourseFilter";
import { FilterPicker } from "@/components/parent/FilterPicker";
import { useParentData } from "@/components/parent/ParentData";
import { usePalette } from "@/components/ThemeProvider";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export default function ParentAttendance() {
  const { pp } = usePalette();
  const t = useTranslations("pv2");
  const { children: childList, att: ATT, hist, months } = useParentData();
  const [filter, setFilter] = useState<"all" | ChildKey>("all");
  const [month, setMonth] = useState(CURRENT);
  const [course, setCourse] = useState("");

  const M = months[month];
  /* The rows the child filter allows, then the course: the picker offers only
     courses these children have been to, and the total is theirs, all time. */
  const byChild = hist.filter((h) => filter === "all" || h.child === filter);
  const courseList = coursesOf(byChild);
  const activeCourse = courseList.includes(course) ? course : "";
  const shown = byChild.filter((h) => !activeCourse || h.cls === activeCourse);
  const prefix = `${M.year}-${String(M.month + 1).padStart(2, "0")}`;
  const courseDays = new Set(
    shown.filter((h) => h.status === "Present" && h.iso.startsWith(prefix)).map((h) => Number(h.iso.slice(8, 10))),
  );
  const todayDate = new Date().getDate();
  const cells: { label: string; present: boolean; today: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) cells.push({ label: "", present: false, today: false });
  for (let d = 1; d <= M.days; d++) {
    const keys: ChildKey[] = filter === "all" ? childList.map((c) => c.key) : [filter];
    const present = activeCourse
      ? courseDays.has(d)
      : keys.some((k) => (ATT[k]?.[month] ?? { present: [] }).present.includes(d));
    cells.push({ label: String(d), present, today: month === CURRENT && d === todayDate });
  }

  const groups: { date: string; items: HistRow[] }[] = [];
  shown.forEach((h) => {
    let g = groups.find((x) => x.date === h.date);
    if (!g) {
      g = { date: h.date, items: [] };
      groups.push(g);
    }
    g.items.push(h);
  });

  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-5 px-4 pb-10 pt-4" showsVerticalScrollIndicator={false}>
      <View>
        <Text accessibilityRole="header" className="font-pp-display-bold text-[23px] leading-tight text-pp-ink">
          {t("navAttendance")}
        </Text>
        <Text className="mt-1 font-pp text-sm text-pp-muted">{t("attendanceSub")}</Text>
      </View>

      {/* Calendar */}
      <View className="gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4 shadow-clay">
        <View className="flex-row items-center justify-between px-0.5">
          <Pressable
            onPress={() => setMonth((m) => Math.max(0, m - 1))}
            accessibilityRole="button"
            accessibilityLabel={t("prevMonth")}
            disabled={month === 0}
            className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
          >
            <ChevronLeft size={16} color={month === 0 ? pp.line : pp.blue} />
          </Pressable>
          <Text className="font-pp-display-semibold text-[17px] text-pp-ink">{M.name}</Text>
          <Pressable
            onPress={() => setMonth((m) => Math.min(months.length - 1, m + 1))}
            accessibilityRole="button"
            accessibilityLabel={t("nextMonth")}
            disabled={month === months.length - 1}
            className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
          >
            <ChevronRight size={16} color={month === months.length - 1 ? pp.line : pp.blue} />
          </Pressable>
        </View>
        <View className="flex-row flex-wrap">
          {WD_KEYS.map((d) => (
            <View key={d} className="w-[14.28%] py-1">
              <Text className="text-center font-pp-bold text-[10px] text-pp-faint">{d}</Text>
            </View>
          ))}
          {cells.map((c, i) => (
            <View key={i} className="w-[14.28%] p-0.5">
              <View
                style={{
                  backgroundColor: c.present ? pp.greenDot : "transparent",
                  borderWidth: c.today && !c.present ? 1.5 : 0,
                  borderColor: pp.blue,
                }}
                className="aspect-square items-center justify-center rounded-full"
              >
                <Text
                  style={{ color: c.present ? "#fbfff1" : pp.ink }}
                  className={`text-[12.5px] ${c.present || c.today ? "font-pp-bold" : "font-pp"}`}
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
            <Text className="font-pp text-[10.5px] text-pp-muted">{t("present")}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="size-[9px] rounded-full border-[1.5px] border-pp-blue" />
            <Text className="font-pp text-[10.5px] text-pp-muted">{t("today")}</Text>
          </View>
        </View>
      </View>

      <View className="gap-4">
        {/* Two filters and the credits they add up to, on one row: long names
            shorten with "…" rather than wrap. */}
        <View className="min-w-0 flex-row items-center gap-1.5">
          <FilterPicker
            icon={Users}
            label={t("filterChild")}
            options={[{ k: "all", label: t("allChildren") }, ...childList.map((c) => ({ k: c.key, label: c.name }))]}
            value={filter}
            onChange={(k) => setFilter(k as "all" | ChildKey)}
          />
          <CourseFilter courses={courseList} value={activeCourse} onChange={setCourse} />
          <View className="ml-auto shrink-0 pl-1">
            <CreditsUsed used={usedCredits(shown)} />
          </View>
        </View>

        {groups.length === 0 && (
          <View className="rounded-xl border-[1.5px] border-dashed border-pp-dash p-6">
            <Text className="text-center font-pp text-[12.5px] text-pp-muted">{t("noAttendanceYet")}</Text>
          </View>
        )}

        {groups.map((g) => (
          <View key={g.date} className="gap-2.5">
            <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{g.date}</Text>
            {g.items.map((h, i) => {
              const c = childList.find((x) => x.key === h.child);
              if (!c) return null;
              return (
                <Link key={`${g.date}-${i}`} href={`/parent/child/${c.key}` as never} asChild>
                  <Pressable className="flex-row items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4 active:bg-pp-mist">
                    <ChildFace name={c.name} tint={c.avBg} size={42} />
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text numberOfLines={1} className="font-pp-semibold text-[13.5px] text-pp-ink">
                        {c.name} · ♟ {h.cls}
                      </Text>
                      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                        <Text className="font-pp text-[11.5px] text-pp-muted">◷ {h.time}</Text>
                        {/* Only an absence is tagged: being there is what a
                            record means. */}
                        {h.status === "Absent" && (
                          <View className="rounded-full bg-pp-danger-soft px-2 py-0.5">
                            <Text className="font-pp-bold text-[10px] uppercase tracking-[0.6px] text-pp-danger">
                              {t("absent")}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {/* What it cost, on the right and centred. */}
                    <CreditLine credits={h.credits} />
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
