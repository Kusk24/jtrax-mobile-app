/* "There is a tournament on right now" — the web's LiveTournamentCard, the
   parent home's pointer to the public results page. Renders nothing when
   there is nothing live, so the home carries no dead card between events.
   The list is the screen's, through `useLiveTournaments`, so the home can
   also leave out the whole section when this and its neighbours are empty. */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { ChevronRight, Trophy } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { fetchLiveTournaments, type LiveTournament } from "@/lib/tournaments";

/** The events on right now; empty until it loads, and on any failure. */
export function useLiveTournaments(): LiveTournament[] {
  const [live, setLive] = useState<LiveTournament[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchLiveTournaments().then((list) => {
      if (!cancelled) setLive(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return live;
}

export function LiveTournamentCard({ live }: { live: LiveTournament[] }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  if (live.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{t("liveTournaments")}</Text>
      {live.map((e) => (
        <Pressable
          key={e.tournamentId}
          onPress={() => router.push(`/tournament/${e.tournamentId}`)}
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center gap-3 rounded-2xl bg-pp-card px-4 py-3 shadow-clay active:bg-pp-mist"
        >
          <View className="size-9 items-center justify-center rounded-full bg-pp-green-soft">
            <Trophy size={18} color={pp.green} />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-pp-semibold text-sm text-pp-ink">{e.name}</Text>
            <Text className="font-pp text-[11.5px] text-pp-muted">
              {e.status === "Ongoing" ? t("liveFollow") : t("liveUpcoming")}
            </Text>
          </View>
          <ChevronRight size={16} color={pp.faint} />
        </Pressable>
      ))}
    </View>
  );
}
