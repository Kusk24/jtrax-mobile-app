/* One child's attendance, month by month. Tapping a day filters the list
   below it to that day; tapping it again clears the filter. */
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { CURRENT } from "@/lib/parent-v2-data";
import { useParentData } from "@/components/parent/ParentData";
import { BackHeader } from "@/components/parent/BackHeader";
import { PP } from "@/lib/colors";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export default function ChildHistory() {
  const t = useTranslations("pv2");
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children: kids, att: ATT, hist, months } = useParentData();
  const [month, setMonth] = useState(CURRENT);
  const [sel, setSel] = useState<{ m: number; d: number } | null>(null);
  const ch = kids.find((c) => c.key === childId);

  if (!ch) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-pp-bg px-5">
        <Text className="text-center font-sans text-[13px] text-pp-muted">{t("childGone")}</Text>
        <Pressable
          onPress={() => router.replace("/parent/attendance")}
          accessibilityRole="button"
          className="rounded-card bg-pp-navy px-6 py-2.5"
        >
          <Text className="font-sans-bold text-sm text-white">{t("navChildren")}</Text>
        </Pressable>
      </View>
    );
  }

  const M = months[month];
  const rec = ATT[ch.key]?.[month] ?? { present: [], absent: [] };
  const todayDate = new Date().getDate();

  const cells: { d: number | null; present: boolean; today: boolean; selected: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) {
    cells.push({ d: null, present: false, today: false, selected: false });
  }
  for (let d = 1; d <= M.days; d++) {
    cells.push({
      d,
      present: rec.present.includes(d),
      today: month === CURRENT && d === todayDate,
      selected: sel?.m === month && sel?.d === d,
    });
  }

  /* The month's real attendance rows, each with its session's own times. */
  const prefix = `${M.year}-${String(M.month + 1).padStart(2, "0")}`;
  const rows = hist.filter(
    (h) =>
      h.child === ch.key
      && h.iso.startsWith(prefix)
      && (!sel || Number(h.iso.slice(8, 10)) === sel.d),
  );

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-5 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title={t("attHistory")} subtitle={`${ch.name} · ${M.name}`} />

      <View className="gap-3.5">
        <View className="gap-2.5 rounded-[14px] bg-pp-card p-4 shadow-clay">
          <View className="flex-row items-center justify-between px-0.5">
            <Pressable
              onPress={() => {
                setMonth((m) => Math.max(0, m - 1));
                setSel(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={t("prevMonth")}
              disabled={month === 0}
              className="size-[30px] items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card"
            >
              <ChevronLeft size={16} color={month === 0 ? PP.line : PP.blue} />
            </Pressable>
            <Text className="font-display-semibold text-[17px] text-pp-ink">{M.name}</Text>
            <Pressable
              onPress={() => {
                setMonth((m) => Math.min(months.length - 1, m + 1));
                setSel(null);
              }}
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
                <Pressable
                  disabled={c.d === null}
                  accessibilityRole="button"
                  accessibilityState={{ selected: c.selected }}
                  onPress={() =>
                    setSel((p) => (p && p.m === month && p.d === c.d ? null : { m: month, d: c.d! }))
                  }
                  style={{
                    backgroundColor: c.selected
                      ? PP.blue
                      : c.present
                        ? PP.greenDot
                        : "transparent",
                    borderWidth: c.today && !c.selected && !c.present ? 1.5 : 0,
                    borderColor: "#b4c5e4",
                  }}
                  className="aspect-square items-center justify-center rounded-full"
                >
                  <Text
                    style={{ color: c.selected || c.present ? "#fbfff1" : PP.ink }}
                    className={`text-[12.5px] ${
                      c.selected || c.present ? "font-sans-bold" : "font-sans"
                    }`}
                  >
                    {c.d ?? ""}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View className="flex-row justify-center gap-3.5">
            <View className="flex-row items-center gap-1.5">
              <View className="size-[9px] rounded-full bg-pp-green-dot" />
              <Text className="font-sans text-[10.5px] text-pp-muted">{t("present")}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="size-[9px] rounded-full bg-pp-blue" />
              <Text className="font-sans text-[10.5px] text-pp-muted">{t("selected")}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-4 rounded-card border-[1.5px] border-pp-soft bg-pp-mist px-4 py-4">
          <View className="min-w-[64px]">
            <Text className="font-display-semibold text-[30px] leading-none text-pp-blue">
              {rec.present.length}
            </Text>
            <Text className="mt-1 font-sans-bold text-[10px] uppercase tracking-[0.8px] text-pp-blue">
              {t("classesThisMonth")}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="font-display-semibold text-xl text-pp-green">
              {rec.present.length}
            </Text>
            <Text className="font-sans text-[10.5px] text-pp-muted">{t("present")}</Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
          {t("history")}
        </Text>
        {rows.length === 0 && (
          <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-5">
            <Text className="text-center font-sans text-[12.5px] text-pp-muted">
              ♞ {t("noSessions")}
            </Text>
          </View>
        )}
        {rows.length > 0 && (
          <View className="overflow-hidden rounded-card bg-pp-card shadow-clay">
            {rows.map((h, i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between gap-2.5 px-4 py-3.5 ${
                  i < rows.length - 1 ? "border-b border-pp-panel" : ""
                }`}
              >
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="font-sans-bold text-[13px] text-pp-ink">{h.cls}</Text>
                  <Text className="font-sans text-[11.5px] text-pp-muted">
                    {h.date} · {h.time}
                  </Text>
                </View>
                <View
                  style={{ backgroundColor: h.status === "Present" ? PP.greenSoft : "#fdece0" }}
                  className="rounded-full px-2.5 py-1"
                >
                  <Text
                    style={{ color: h.status === "Present" ? PP.green : PP.danger }}
                    className="font-sans-bold text-[10.5px] uppercase"
                  >
                    {h.status === "Present" ? t("present") : t("absent")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
