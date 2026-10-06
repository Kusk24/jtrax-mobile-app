/* One tournament on the parent home, for its whole life — the web's
   TournamentHomeCard: registration, the day itself, its results. The card
   stays; its corner tag, the registered line, the note and the one button
   follow the tournament (lib/tournament-card). */
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { CheckCircle2 } from "lucide-react-native";
import { TournamentBanner } from "@/components/parent/TournamentBanner";
import { usePalette } from "@/components/ThemeProvider";
import type { TournamentCardV2 } from "@/components/parent/ParentData";

const TAG_BASE = "absolute right-4 top-2.5 size-16 items-center justify-center rounded-full border-[2.5px] border-white px-1";

export function TournamentHomeCard({ card }: { card: TournamentCardV2 }) {
  const t = useTranslations("pv2");
  const { pp } = usePalette();
  const router = useRouter();
  const { tag, action, registered, notRegisteredNote } = card.state;

  const label =
    action === "register" ? t("registerNow") : action === "viewRegistration" ? t("viewRegistration") : t("viewResults");
  const open = () => {
    /* Results are the public results screen; anything else is the
       registration flow, where an entered child's place is shown. */
    if (action === "viewResults") router.push(`/tournament/${card.id}`);
    else router.push("/parent/tournament");
  };

  return (
    <View className="overflow-hidden rounded-2xl bg-pp-card shadow-clay-lg">
      <View>
        <TournamentBanner
          name={card.name}
          when={card.date}
          venue={card.venue}
          tournamentId={card.id}
          hasBanner={card.hasBanner}
          height={158}
        />
        {tag.kind === "closesIn" ? (
          <View className={`${TAG_BASE} bg-pp-danger`}>
            <Text className="text-center font-pp-bold text-[7.5px] uppercase leading-tight text-white">{t("registerCloses")}</Text>
            <Text className="font-pp-display-bold text-xl leading-none text-white">{tag.days}</Text>
            <Text className="font-pp-bold text-[8px] uppercase leading-none text-white">{t("days")}</Text>
          </View>
        ) : (
          <View
            className={`${TAG_BASE} ${
              tag.kind === "ongoing" ? "bg-pp-green" : tag.kind === "results" ? "bg-pp-blue" : tag.kind === "completed" ? "bg-pp-sub" : "bg-pp-danger"
            }`}
          >
            {/* A word to a line, each shrinking to the circle rather than
                breaking: "Registration" is wider than it at 9pt, and a
                Text left to wrap splits it mid-word. */}
            {t(
              tag.kind === "ongoing"
                ? "tagOngoing"
                : tag.kind === "results"
                  ? "tagResults"
                  : tag.kind === "completed"
                    ? "tagCompleted"
                    : "tagRegistrationClosed",
            )
              .split(/\s+/)
              .map((word, i) => (
                <Text
                  key={i}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  className="text-center font-pp-bold text-[9px] uppercase leading-tight text-white"
                >
                  {word}
                </Text>
              ))}
          </View>
        )}
      </View>
      <View className="gap-2 px-4 pb-4 pt-4">
        <Text className="font-pp-display-semibold text-lg leading-tight text-pp-ink">{card.name}</Text>
        {registered && (
          <View className="flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color={pp.green} />
            <Text className="flex-1 font-pp-semibold text-[13px] text-pp-green">
              {card.registeredNames.length > 0
                ? t("registeredNames", { names: card.registeredNames.join(", ") })
                : t("registeredShort")}
            </Text>
          </View>
        )}
        {notRegisteredNote && <Text className="font-pp text-[12.5px] text-pp-muted">{t("notRegisteredNote")}</Text>}
        {action && (
          <Pressable onPress={open} accessibilityRole="button" className="mt-1 rounded-xl bg-pp-navy py-3 active:opacity-90">
            <Text className="text-center font-pp-bold text-sm text-white">{label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
