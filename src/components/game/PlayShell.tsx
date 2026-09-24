import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { ArrowLeft } from "lucide-react-native";
import { C } from "@/lib/colors";
import { SoundToggle } from "./SoundToggle";

/** Header + scroll body the play screens share. Mirrors the web app's
    PlayShell, minus the phone frame — this *is* the phone. */
export function PlayShell({
  title,
  back,
  nav = false,
  sound = false,
  children,
}: {
  title: string;
  /** Where the arrow goes. Defaults to whatever pushed this screen, which is
      usually right; pass a route when a screen can be reached from more than
      one place and "wherever you came from" is not a useful answer. */
  back?: string;
  /** This screen *is* one of the portal's tabs. A tab is not somewhere you
      arrived from, so it gets no back arrow — the bar at the bottom is how you
      leave it. Anything pushed does the opposite: it takes the arrow and the
      bar goes away, because a board wants the whole phone. */
  nav?: boolean;
  /** A board screen: shows the sound switch at the right of the header. */
  sound?: boolean;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("common");
  return (
    <View className="flex-1 bg-paper">
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-3">
        {!nav && (
          <Pressable
            onPress={() => {
              if (back) router.replace(back as never);
              else if (router.canGoBack()) router.back();
              else router.replace("/student");
            }}
            accessibilityRole="button"
            accessibilityLabel={tCommon("back")}
            hitSlop={10}
            className="size-9 items-center justify-center rounded-full border-2 border-line bg-card"
          >
            <ArrowLeft size={18} color={C.ink} />
          </Pressable>
        )}
        <Text className="min-w-0 flex-1 font-display-semibold text-2xl text-navy">{title}</Text>
        {sound && <SoundToggle />}
      </View>
      <ScrollView
        className="flex-1"
        /* A tab keeps the bar, so it reserves room for it; a pushed screen has
           the bottom of the phone to itself. */
        contentContainerClassName={`px-4 pt-2 gap-3 ${nav ? "pb-32" : "pb-8"}`}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-card border-2 border-line bg-card p-4 shadow-clay ${className}`}>
      {children}
    </View>
  );
}
