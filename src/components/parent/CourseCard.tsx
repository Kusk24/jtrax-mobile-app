/**
 * One enrolled course on the child's page — the web's CourseCard: an icon, its
 * name, a bar of what is left out of the last top-up, and under it when those
 * credits expire and when the child joined. A child in two courses gets two.
 */
import { Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { CalendarCheck, CalendarDays, Crown, Infinity as InfinityIcon, Trophy } from "lucide-react-native";
import type { CourseCredit } from "@/lib/course-credits";
import { creditShare, creditTone } from "@/lib/credit-tone";
import { PawnIcon } from "@/components/PawnIcon";
import { useParentData } from "@/components/parent/ParentData";
import { usePalette } from "@/components/ThemeProvider";
import type { PPKey } from "@/lib/theme";

function fmtDay(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/* Courses cycle through three tiles so neighbouring rows tell apart at a glance. */
const TILES: { icon: "pawn" | "crown" | "trophy"; tile: string; ink: PPKey }[] = [
  { icon: "pawn", tile: "bg-pp-soft", ink: "blue" },
  { icon: "crown", tile: "bg-pp-plum-soft", ink: "deep" },
  { icon: "trophy", tile: "bg-pp-amber-soft", ink: "amber" },
];

export function CourseCard({ course, index = 0 }: { course: CourseCredit; index?: number }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const hasExpiry = course.expiry !== "";
  /* Three states: a date already passed is expired, not "expires soon". */
  const expired = hasExpiry && course.daysLeft < 0;
  const expSoon = hasExpiry && !expired && course.daysLeft <= 14;
  const date = fmtDay(course.expiry);
  const { icon, tile, ink } = TILES[index % TILES.length];
  /* Low is the academy's own line from Settings; twice that is a heads-up. */
  const { lowCreditAt } = useParentData();
  const tone = creditTone(course.credits, lowCreditAt);
  const low = tone === "low";
  const barColor = low ? "bg-pp-danger" : tone === "near" ? "bg-pp-amber" : "bg-pp-blue";
  const pct = creditShare(course.credits, course.creditsOf);

  return (
    <View className="gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-3.5">
      <View className="flex-row items-center gap-3.5">
        <View className={`size-14 items-center justify-center rounded-xl ${tile}`}>
          {icon === "pawn" ? (
            <PawnIcon size={24} color={pp[ink]} />
          ) : icon === "crown" ? (
            <Crown size={24} color={pp[ink]} strokeWidth={2} />
          ) : (
            <Trophy size={24} color={pp[ink]} strokeWidth={2} />
          )}
        </View>
        <View className="min-w-0 flex-1 gap-2">
          <Text numberOfLines={1} className="font-pp-bold text-[15px] text-pp-ink">{course.name}</Text>
          <View className="h-2 overflow-hidden rounded-full bg-pp-soft">
            <View className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </View>
          <Text className="font-pp text-[12.5px] text-pp-muted">
            <Text className={`font-pp-semibold ${low ? "text-pp-danger" : "text-pp-ink"}`}>{course.credits}</Text>
            {course.creditsOf !== null ? ` / ${course.creditsOf}` : ""} {t("creditsUnit")}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 border-t border-pp-panel pt-3">
        {hasExpiry ? (
          <Detail
            icon={<CalendarCheck size={16} strokeWidth={1.8} color={expired || expSoon ? pp.danger : pp.muted} />}
            label={expired ? t("expiredLabel") : t("validUntil")}
            value={expSoon ? t("daysLeftShort", { date, count: course.daysLeft }) : date}
            danger={expired || expSoon}
          />
        ) : (
          <Detail icon={<InfinityIcon size={16} strokeWidth={1.8} color={pp.muted} />} value={t("noExpiry")} />
        )}
        <Detail
          icon={<CalendarDays size={16} strokeWidth={1.8} color={pp.muted} />}
          label={t("enrolledSince")}
          value={course.enrolledOn ? fmtDay(course.enrolledOn) : "—"}
        />
      </View>
    </View>
  );
}

function Detail({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  label?: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-start gap-2.5">
      <View className="mt-0.5">{icon}</View>
      <View className="min-w-0 flex-1">
        {label ? <Text className="font-pp text-[11px] text-pp-muted">{label}</Text> : null}
        <Text className={`font-pp-semibold text-[12.5px] ${danger ? "text-pp-danger" : "text-pp-ink"}`}>{value}</Text>
      </View>
    </View>
  );
}
