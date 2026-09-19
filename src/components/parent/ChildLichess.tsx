/* A child's Lichess ratings on their parent's screen.
 *
 * Read-only by design. A parent linking or unlinking their child's account
 * happens on the child's own profile, where the consent screen belongs.
 *
 * Nothing linked renders nothing: an empty card asking a family to link an
 * account is an instruction aimed at somebody who is not reading it. */
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { ExternalLink } from "lucide-react-native";
import { api } from "@/lib/api";
import { PERF_ORDER, sortRatings, type LichessLink } from "@/lib/lichess";
import { PP } from "@/lib/colors";

export function ChildLichess({ studentId }: { studentId: string }) {
  const t = useTranslations("pv2");
  const [link, setLink] = useState<LichessLink | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LichessLink[]>(`lichess/links?studentId=${encodeURIComponent(studentId)}`)
      .then((rows) => {
        // The query is already scoped to this parent's children, so anything
        // that comes back is theirs to see; the id filter is a convenience.
        if (!cancelled) setLink(rows.find((r) => r.studentId === studentId) ?? null);
      })
      .catch(() => {
        /* An unreachable API reads as "nothing linked", which is the honest
           empty state rather than an error a parent can do anything about. */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!loaded || !link) return null;

  const ratings = sortRatings(link.ratings).filter((r) => PERF_ORDER.includes(r.perf));

  return (
    <View className="gap-3 rounded-card border-[1.5px] border-pp-line bg-pp-card p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
          {t("lichess.title")}
        </Text>
        <Pressable
          onPress={() => Linking.openURL(link.profileUrl)}
          accessibilityRole="link"
          className="flex-row items-center gap-1"
        >
          <Text className="font-sans-semibold text-[12px] text-pp-ink underline">
            {link.username}
          </Text>
          <ExternalLink size={12} color={PP.ink} />
        </Pressable>
      </View>

      {ratings.length === 0 ? (
        <Text className="font-sans text-[12.5px] text-pp-muted">{t("lichess.noGames")}</Text>
      ) : (
        <View>
          {ratings.map((r, i) => (
            <View
              key={r.perf}
              className={`flex-row items-center justify-between gap-3 py-1.5 ${
                i === 0 ? "" : "border-t border-pp-line"
              }`}
            >
              <Text className="font-sans text-[13px] text-pp-muted">
                {t(`lichess.perf.${r.perf}`)}
              </Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="font-sans-bold text-[13.5px] text-pp-ink">{r.rating}</Text>
                {/* A provisional rating swings wildly and is not an achievement
                    yet. Saying so is kinder than a number that drops tomorrow. */}
                {r.provisional && (
                  <Text className="font-sans text-[10.5px] text-pp-muted">
                    {t("lichess.provisional")}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <Text className="font-sans text-[11.5px] leading-snug text-pp-muted">
        {t("lichess.footnote")}
      </Text>
    </View>
  );
}
