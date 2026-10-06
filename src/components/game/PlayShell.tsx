import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { ArrowLeft } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { SoundToggle } from "./SoundToggle";

/** Header + scroll body the play screens share. Mirrors the web app's
    PlayShell — the portal's title row and the content under it — minus the
    page around it: this *is* the phone. */
export function PlayShell({
  title,
  sub,
  back,
  nav = false,
  sound = false,
  children,
}: {
  title: string;
  /** A line under the title — a puzzle's rating. */
  sub?: string;
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
  const { pp } = usePalette();
  return (
    <View className="flex-1 bg-pp-bg">
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
            hitSlop={8}
            className="size-[38px] items-center justify-center rounded-xl border-[1.5px] border-pp-line bg-pp-card active:bg-pp-soft"
          >
            <ArrowLeft size={18} color={pp.ink} strokeWidth={2.2} />
          </Pressable>
        )}
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-pp-display-bold text-[23px] leading-tight text-pp-ink">
            {title}
          </Text>
          {sub ? <Text className="font-pp text-[13px] text-pp-muted">{sub}</Text> : null}
        </View>
        {sound && <SoundToggle />}
      </View>
      <ScrollView
        className="flex-1"
        /* The tab bar sits under the screen rather than over it, so a tab
           needs no room kept for it. */
        contentContainerClassName="gap-4 px-4 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* A card, as the parent portal draws one — used for status, results and forms. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-[18px] ${className}`}>
      {children}
    </View>
  );
}
