import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { ArrowLeft } from "lucide-react-native";
import { C } from "@/lib/colors";

export function CheckinHeader({
  titleKey = "checkin.attendance",
  subtitle,
  backHref = "/teacher/schedule",
}: {
  titleKey?: string;
  subtitle: string;
  backHref?: string;
}) {
  const t = useTranslations();
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => {
          /* Pop rather than push: pushing meant tapping back grew the stack,
             and the OS gesture then retraced forward through screens the
             person had just left. `backHref` remains the fallback for a
             screen opened directly from a link, where there is nothing to
             pop to. */
          if (router.canGoBack()) router.back();
          else router.replace(backHref as never);
        }}
        className="rounded-full p-1.5"
      >
        <ArrowLeft size={20} color={C.navy} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-extrabold text-xl text-navy">
          {t(titleKey)}
        </Text>
        <Text className="font-sans text-xs text-muted">{subtitle}</Text>
      </View>
    </View>
  );
}
