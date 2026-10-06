/* "There is a tournament on right now" — every role's pointer to the public
   results screen. Renders nothing between events, and nothing on a cold
   backend, so the home screens never carry a dead card. */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { Trophy, ChevronRight } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { fetchLiveTournaments, type LiveTournament } from "@/lib/tournaments";

export function LiveTournamentBanner() {
  const t = useTranslations("tournament");
  const { pp } = usePalette();
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
          /* The portals' card, as the web's live-tournament row draws it. */
          className="flex-row items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-2.5 active:bg-pp-mist"
        >
          <View className="size-8 items-center justify-center rounded-lg bg-pp-green-soft">
            <Trophy size={16} color={pp.green} strokeWidth={2} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-pp-bold text-[10px] uppercase tracking-[1.2px] text-pp-green">
              {e.status === "Ongoing" ? t("liveNow") : t("startingSoon")}
            </Text>
            <Text className="font-pp-bold text-[13.5px] text-pp-ink" numberOfLines={1}>
              {e.name}
            </Text>
          </View>
          <ChevronRight size={16} color={pp.green} />
        </Pressable>
      ))}
    </View>
  );
}
