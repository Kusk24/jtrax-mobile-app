/* "There is a tournament on right now" — every role's pointer to the public
   results screen. Renders nothing between events, and nothing on a cold
   backend, so the home screens never carry a dead card. */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { Trophy, ChevronRight } from "lucide-react-native";
import { C } from "@/lib/colors";
import { fetchLiveTournaments, type LiveTournament } from "@/lib/tournaments";

export function LiveTournamentBanner() {
  const t = useTranslations("tournament");
  const [live, setLive] = useState<LiveTournament[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchLiveTournaments().then((list) => {
      if (!cancelled) setLive(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (live.length === 0) return null;
  return (
    <View className="gap-3">
      {live.map((e) => (
        <Pressable
          key={e.tournamentId}
          onPress={() => router.push(`/tournament/${e.tournamentId}`)}
          accessibilityLabel={t("openLive", { name: e.name })}
          className="flex-row items-center gap-3 rounded-card bg-olive-soft px-4 py-3 active:opacity-90"
        >
          <View className="size-9 items-center justify-center rounded-full bg-card">
            <Trophy size={18} color={C.olive} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-bold text-[11px] uppercase tracking-wide text-olive">
              {e.status === "Ongoing" ? t("liveNow") : t("startingSoon")}
            </Text>
            <Text className="font-sans-bold text-sm text-ink" numberOfLines={1}>
              {e.name}
            </Text>
          </View>
          <ChevronRight size={16} color={C.olive} />
        </Pressable>
      ))}
    </View>
  );
}
