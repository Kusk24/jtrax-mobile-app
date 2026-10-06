/**
 * Language — EN or ไทย — as a row in the same style as Appearance, for the
 * student Profile. The web puts the switch in its top bar, which the phone
 * does not have; the sign-in screen keeps its own LanguageToggle.
 */
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { usePalette } from "@/components/ThemeProvider";
import { useLocaleSwitch } from "@/i18n";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "th", label: "ไทย" },
] as const;

export function LanguagePicker() {
  const t = useTranslations("common");
  const { locale, setLocale } = useLocaleSwitch();
  const { pp } = usePalette();
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-card border-[1.5px] border-pp-line bg-pp-card px-4 py-3">
      <Text className="font-pp-semibold text-sm text-pp-ink">{t("language")}</Text>
      <View className="flex-row gap-1 rounded-full bg-pp-panel p-[3px]">
        {LOCALES.map(({ code, label }) => {
          const on = locale === code;
          return (
            <Pressable
              key={code}
              onPress={() => setLocale(code)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ backgroundColor: on ? pp.blue : "transparent" }}
              className="rounded-full px-3.5 py-1"
            >
              <Text style={{ color: on ? "#fbfff1" : pp.muted }} className="font-pp-bold text-[11.5px]">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
