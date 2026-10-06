/**
 * A child on the parent's home — the web's ChildHomeCard: who they are, and
 * every course they are in with its own balance. A child in two courses has
 * two, and one total hid which one was running out. Compact, so two sit side
 * by side on a phone.
 */
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Flame, GraduationCap } from "lucide-react-native";
import { ChildFace } from "@/components/parent/ChildFace";
import { usePalette } from "@/components/ThemeProvider";
import { creditShare, creditTone } from "@/lib/credit-tone";
import type { ChildV2 } from "@/lib/parent-v2-data";

const BAR = { low: "bg-pp-danger", near: "bg-pp-amber", ok: "bg-pp-blue" };

/* One tone per level, for the child's own level only — the top band and the
   level badge. The courses below keep their own colours. Unset or
   unrecognised levels keep the blue the card always used, rather than
   picking a tone for a level the office never assigned. */
const LEVEL_TONE: Record<string, { band: string; text: string }> = {
  Beginner: { band: "bg-pp-green-soft", text: "text-pp-green" },
  Intermediate: { band: "bg-pp-soft", text: "text-pp-blue" },
  Advanced: { band: "bg-pp-purple-soft", text: "text-pp-purple" },
};
const DEFAULT_TONE = LEVEL_TONE.Intermediate;

export function ChildHomeCard({ child, lowCreditAt }: { child: ChildV2; lowCreditAt: number }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const levelTone = LEVEL_TONE[child.level] ?? DEFAULT_TONE;
  /* One course or none: the band and the course section split the card in
     two equal rows, so neither looks taller. More courses grow the bottom. */
  const even = child.courses.length <= 1;

  return (
    <Link href={`/parent/child/${child.key}` as never} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={child.name}
        className="min-w-0 flex-1 overflow-hidden rounded-2xl border-[1.5px] border-pp-line bg-pp-card shadow-clay active:opacity-90"
      >
        {/* Who: a flat band in the child's level colour, the face beside the
            name, the level and how many classes they have joined below it,
            and the streak on its own row under that. */}
        <View className={`flex-row items-center gap-2.5 border-b border-pp-line px-3.5 py-3.5 ${levelTone.band} ${even ? "flex-1" : ""}`}>
          <View className="rounded-full border-[2.5px] border-pp-card">
            <ChildFace name={child.name} tint={child.avBg} size={40} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text numberOfLines={1} className="font-pp-bold text-[14px] leading-tight text-pp-ink">
              {child.name}
            </Text>
            <View className="min-w-0 flex-row items-center gap-1.5">
              {child.level ? (
                <View className="rounded-full bg-pp-card px-1.5 py-px">
                  <Text className={`font-pp-bold text-[9px] ${levelTone.text}`}>{child.level}</Text>
                </View>
              ) : null}
              {/* Classes attended so far — lib/classes-attended.ts. An icon
                  and the number, so it fits a phone's narrow card. */}
              <View
                accessible
                accessibilityLabel={t("classesJoined", { count: child.attended })}
                className="flex-row items-center gap-0.5"
              >
                <GraduationCap size={14} color={pp.sub} strokeWidth={2} />
                <Text className="font-pp-semibold text-[10.5px] text-pp-sub">{child.attended}</Text>
              </View>
            </View>
            {child.streak > 0 && (
              <View
                accessible
                accessibilityLabel={t("dayStreak", { count: child.streak })}
                className="flex-row items-center gap-0.5 self-start rounded-full bg-pp-amber-soft px-1.5 py-0.5"
              >
                <Flame size={12} color={pp.amber} strokeWidth={2.2} />
                <Text className="font-pp-bold text-[10px] text-pp-amber">{child.streak}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Each course's own balance: blue while healthy, amber when nearly
            low, red when low. */}
        <View className={`gap-4 bg-pp-card px-3.5 py-3.5 ${even ? "flex-1 justify-center" : ""}`}>
          {child.courses.length === 0 ? (
            <Text className="text-center font-pp text-[11px] text-pp-muted">{t("noActiveCourse")}</Text>
          ) : (
            child.courses.map((course) => {
              const tone = creditTone(course.credits, lowCreditAt);
              return (
                <View key={course.enrollmentId} className="min-w-0 gap-1.5">
                  <View className="min-w-0 flex-row items-baseline gap-1.5">
                    <Text numberOfLines={1} className="min-w-0 flex-1 font-pp-semibold text-[11.5px] text-pp-ink">
                      {course.name}
                    </Text>
                    <Text className="font-pp text-[11px] text-pp-muted">
                      <Text className={`font-pp-bold ${tone === "low" ? "text-pp-danger" : "text-pp-ink"}`}>
                        {course.credits}
                      </Text>
                      {course.creditsOf !== null ? `/${course.creditsOf}` : ""}
                    </Text>
                  </View>
                  <View className="h-1.5 overflow-hidden rounded-full bg-pp-soft">
                    <View
                      className={`h-full rounded-full ${BAR[tone]}`}
                      style={{ width: `${creditShare(course.credits, course.creditsOf)}%` }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Pressable>
    </Link>
  );
}
