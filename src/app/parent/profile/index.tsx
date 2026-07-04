import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  ChevronRight,
  ContactRound,
  Info,
  Languages,
  Mail,
  Phone,
  Settings,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { children, parent } from "@/lib/parent-data";
import { C } from "@/lib/colors";

const card = "rounded-card border-2 border-line bg-card p-4 shadow-clay";

export default function ParentProfileScreen() {
  const t = useTranslations();
  return (
    <Screen gapClass="gap-5">
      <Text className="text-center font-sans-extrabold text-2xl text-navy">
        {t("profile.myProfile")}
      </Text>

      <View className={`${card} flex-row items-center gap-4`}>
        <Avatar
          name={parent.name}
          colorClass={parent.avatarColor}
          sizeClass="size-14"
        />
        <View>
          <Text className="font-sans-bold text-base text-ink">
            {parent.name}
          </Text>
          <Text className="font-sans text-xs text-muted">
            {t("common.idLabel", { id: parent.parentId })}
          </Text>
          <Text className="font-sans text-xs text-muted">
            {t("common.parentBadge")}
          </Text>
        </View>
      </View>

      <View>
        <Text className="font-sans-extrabold text-lg text-ink">
          {t("home.myChildren")} ({children.length})
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-6">
          {children.map((child) => (
            <Link key={child.id} href={`/parent/profile/${child.id}` as never} asChild>
              <Pressable className="items-center gap-1">
                <Avatar
                  name={child.name}
                  colorClass={child.avatarColor}
                  sizeClass="size-14"
                />
                <Text className="font-sans-bold text-sm text-ink">
                  {child.name}
                </Text>
                <Text className="font-sans text-[10px] text-muted">
                  {t("common.idLabel", { id: child.studentId })}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <ContactRound size={20} color={C.navy} />
          <Text className="font-sans-extrabold text-base text-ink">
            {t("profile.contactInfo")}
          </Text>
        </View>
        <View className="mt-4 gap-4">
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-lg bg-olive-soft">
              <Phone size={16} color={C.olive} />
            </View>
            <View>
              <Text className="font-sans text-[11px] text-muted">
                {t("profile.phone")}
              </Text>
              <Text className="font-sans text-sm text-ink">{parent.phone}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-lg bg-navy-soft">
              <Mail size={16} color={C.navy} />
            </View>
            <View>
              <Text className="font-sans text-[11px] text-muted">
                {t("profile.email")}
              </Text>
              <Text className="font-sans text-sm text-ink">{parent.email}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={card}>
        <View className="flex-row items-center gap-2">
          <Info size={20} color={C.navy} />
          <Text className="font-sans-extrabold text-base text-ink">
            {t("profile.more")}
          </Text>
        </View>
        <View className="mt-2">
          <View className="flex-row items-center gap-3 px-1 py-2.5">
            <Languages size={16} color={C.navy} />
            <Text className="font-sans text-sm text-ink">
              {t("common.language")}
            </Text>
            <View className="ml-auto">
              <LanguageToggle />
            </View>
          </View>
          <Pressable className="flex-row items-center gap-3 rounded-lg px-1 py-2.5 active:bg-cream">
            <Phone size={16} color={C.navy} />
            <Text className="font-sans text-sm text-ink">
              {t("profile.contactSchool")}
            </Text>
            <ChevronRight
              size={16}
              color={C.muted}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
          <Pressable className="flex-row items-center gap-3 rounded-lg px-1 py-2.5 active:bg-cream">
            <Settings size={16} color={C.navy} />
            <Text className="font-sans text-sm text-ink">
              {t("profile.settings")}
            </Text>
            <ChevronRight
              size={16}
              color={C.muted}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
