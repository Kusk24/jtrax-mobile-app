/**
 * Appearance — Auto, Light or Dark — as the web's parent Settings and student
 * Profile both draw it: one pill, three choices, Auto first because following
 * the phone is the default nobody has to think about. Saved to the account,
 * so it follows the person to another device; the screen changes at once.
 */
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { usePalette, useTheme } from "@/components/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const CHOICES: { k: ThemePreference; label: "themeSystem" | "themeLight" | "themeDark" }[] = [
  { k: "System", label: "themeSystem" },
  { k: "Light", label: "themeLight" },
  { k: "Dark", label: "themeDark" },
];

export function AppearancePicker() {
  const t = useTranslations("pv2");
  const { preference, setPreference } = useTheme();
  const { pp } = usePalette();
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-card border-[1.5px] border-pp-line bg-pp-card px-4 py-3">
      <Text className="font-pp-semibold text-sm text-pp-ink">{t("theme")}</Text>
      <View className="flex-row gap-1 rounded-full bg-pp-panel p-[3px]">
        {CHOICES.map((c) => {
          const on = preference === c.k;
          return (
            <Pressable
              key={c.k}
              onPress={() => setPreference(c.k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ backgroundColor: on ? pp.blue : "transparent" }}
              className="rounded-full px-3 py-1"
            >
              <Text style={{ color: on ? "#fbfff1" : pp.muted }} className="font-pp-bold text-[11.5px]">
                {t(c.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
