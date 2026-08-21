/* What a screen shows when the thing it was opened for does not exist —
   a stale link, a deleted record, a refresh after the id changed.
   The screens that needed this used to `return null`, which renders a blank
   white page with no header and no way back: the app looks broken and the only
   escape is the OS gesture. */
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { ArrowLeft } from "lucide-react-native";
import { C } from "@/lib/colors";
import { Screen } from "./Screen";

export function NotHere() {
  const t = useTranslations("common");
  return (
    <Screen>
      <View className="items-center gap-4 py-20">
        <Text className="text-center font-sans-bold text-base text-ink">{t("notFound")}</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={t("goBack")}
          className="min-h-[44px] flex-row items-center gap-2 rounded-card border-2 border-line bg-card px-5 shadow-clay active:opacity-90"
        >
          <ArrowLeft size={16} color={C.navy} />
          <Text className="font-sans-bold text-sm text-navy">{t("goBack")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
