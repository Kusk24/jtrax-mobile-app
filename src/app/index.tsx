import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  ArrowRight,
  GraduationCap,
  Presentation,
  Users,
} from "lucide-react-native";
import { LanguageToggle } from "@/components/LanguageToggle";

const roles = [
  {
    href: "/student" as const,
    labelKey: "studentLabel",
    descKey: "studentDesc",
    icon: GraduationCap,
    chip: "bg-olive-soft",
    color: "#8fa653",
  },
  {
    href: "/parent" as const,
    labelKey: "parentLabel",
    descKey: "parentDesc",
    icon: Users,
    chip: "bg-navy-soft",
    color: "#2b4380",
  },
  {
    href: "/teacher" as const,
    labelKey: "teacherLabel",
    descKey: "teacherDesc",
    icon: Presentation,
    chip: "bg-brick-soft",
    color: "#c0392b",
  },
] as const;

export default function RoleSelectScreen() {
  const t = useTranslations("landing");
  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="min-h-full items-center justify-center px-6 py-12"
    >
      <View className="absolute right-4 top-4">
        <LanguageToggle />
      </View>
      <Text className="font-display-semibold text-4xl text-navy">JTrax</Text>
      <Text className="mt-2 text-center font-sans text-sm text-muted">
        {t("tagline")}
      </Text>
      <View className="mt-10 w-full max-w-md gap-4">
        {roles.map(({ href, labelKey, descKey, icon: Icon, chip, color }) => (
          <Link key={href} href={href} asChild>
            <Pressable className="flex-row items-center gap-4 rounded-card border-2 border-line bg-card p-5 shadow-clay active:opacity-80">
              <View
                className={`size-12 items-center justify-center rounded-xl ${chip}`}
              >
                <Icon size={24} color={color} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-sans-bold text-base text-ink">
                    {t(labelKey)}
                  </Text>
                  <ArrowRight size={16} color="#8a8a86" />
                </View>
                <Text className="mt-1 font-sans text-xs leading-5 text-muted">
                  {t(descKey)}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
      <Text className="mt-8 text-center font-sans text-xs text-muted">
        {t("tempNote")}
      </Text>
    </ScrollView>
  );
}
