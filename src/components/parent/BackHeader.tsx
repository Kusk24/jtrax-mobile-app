/* The portal's back row: a bordered arrow button and the screen's title.
   Its own component because six screens carry it and they drifted apart on
   the web before this existed. */
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { ArrowLeft } from "lucide-react-native";
import { PP } from "@/lib/colors";

export function BackHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Overrides the default "go back" — the tournament flow steps backwards
      through its own stages rather than leaving the screen. */
  onBack?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("pv2");
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel={t("back")}
        className="size-[38px] items-center justify-center rounded-card border-[1.5px] border-pp-line bg-pp-card"
      >
        <ArrowLeft size={18} color={PP.ink} strokeWidth={2} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="font-display-semibold text-2xl leading-tight text-pp-ink">{title}</Text>
        {!!subtitle && (
          <Text className="font-sans text-[12.5px] text-pp-muted">{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}
