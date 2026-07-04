import { Pressable, Text, View } from "react-native";
import { Globe } from "lucide-react-native";
import { useLocaleSwitch } from "@/i18n";

const locales = [
  { code: "en", label: "EN" },
  { code: "th", label: "ไทย" },
] as const;

/** EN ⇄ ไทย pill, persisted via AsyncStorage. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocaleSwitch();
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full border-2 border-line bg-card p-1 shadow-clay ${className}`}
    >
      <Globe size={16} color="#8a8a86" style={{ marginLeft: 6 }} />
      {locales.map(({ code, label }) => (
        <Pressable
          key={code}
          onPress={() => setLocale(code)}
          className={`rounded-full px-3 py-1 ${locale === code ? "bg-navy" : ""}`}
        >
          <Text
            className={`font-sans-bold text-xs ${
              locale === code ? "text-white" : "text-muted"
            }`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
