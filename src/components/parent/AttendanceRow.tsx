/**
 * One attendance record, laid out to scan — the web's AttendanceRow: the date
 * first and boldest, then the course, then what it cost — with Absent on the
 * right when the child was not there.
 *
 *   28 Sep 2026
 *   ♟ Beginner                                     −1.5 credits
 *   ◷ 16:00 – 17:30
 */
import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { HistRow } from "@/lib/parent-v2-data";

export const fmtCredits = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

export function CreditLine({ credits }: { credits: number }) {
  const t = useTranslations("pv2");
  return credits > 0 ? (
    <View className="rounded-full bg-pp-amber-soft px-2 py-0.5">
      <Text className="font-pp-bold text-[10.5px] text-pp-amber">
        {t("creditsDeducted", { count: fmtCredits(credits), n: credits })}
      </Text>
    </View>
  ) : (
    <Text className="font-pp text-[11px] text-pp-faint">{t("noCreditDeducted")}</Text>
  );
}

/** Only an absence is tagged: being there is what a record means. */
export function StatusPill({ status }: { status: HistRow["status"] }) {
  const t = useTranslations("pv2");
  if (status === "Present") return null;
  return (
    <View className="rounded-full bg-pp-danger-soft px-2.5 py-1">
      <Text className="font-pp-bold text-[10.5px] uppercase tracking-[0.8px] text-pp-danger">{t("absent")}</Text>
    </View>
  );
}

export function AttendanceRow({ h, last = false }: { h: HistRow; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between gap-3 px-4 py-3.5 ${last ? "" : "border-b border-pp-panel"}`}>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-pp-bold text-[13.5px] text-pp-ink">{h.date}</Text>
        <Text numberOfLines={1} className="font-pp-semibold text-[12.5px] text-pp-sub">♟ {h.cls}</Text>
        <Text className="font-pp text-[11px] text-pp-faint">◷ {h.time}</Text>
      </View>
      {/* What it cost, on the right and centred, beside Absent. */}
      <View className="flex-row items-center gap-2">
        <CreditLine credits={h.credits} />
        <StatusPill status={h.status} />
      </View>
    </View>
  );
}
