/**
 * Who the parent is: their children and their contact details.
 *
 * Everything they can *change* — alerts, language — is on the Settings tab,
 * as in the portal.
 */
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { BadgeCheck, ChevronRight, Mail, Pencil, Phone } from "lucide-react-native";
import { ChildFace } from "@/components/parent/ChildFace";
import { useParentData } from "@/components/parent/ParentData";
import { PP } from "@/lib/colors";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-sans-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function ParentProfile() {
  const t = useTranslations("pv2");
  const { children: childList, parent, parentId } = useParentData();
  const initial = (parent.name.trim()[0] ?? "?").toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-5 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-1">
        <Text className="font-display-semibold text-2xl leading-tight text-pp-ink">
          {t("myProfile")}
        </Text>
        <Text className="font-sans text-[12.5px] text-pp-muted">{t("profileSub")}</Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-card border-[1.5px] border-pp-line bg-pp-card p-3.5 shadow-clay">
        <View className="size-[58px] items-center justify-center rounded-[15px] border-[3px] border-pp-soft bg-pp-deep">
          <Text className="font-display-semibold text-2xl text-white">{initial}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="shrink font-display-semibold text-[18px] text-pp-ink">
              {parent.name}
            </Text>
            <View className="rounded-full bg-pp-soft px-2 py-0.5">
              <Text className="font-sans-bold text-[9px] uppercase text-pp-blue">
                {t("roleParent")}
              </Text>
            </View>
          </View>
          <Text numberOfLines={1} className="mt-1 font-sans text-[10.5px] text-pp-faint">
            {t("idLabel", { id: parentId })}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <BadgeCheck size={12} color={PP.green} />
            <Text className="font-sans-semibold text-[10px] text-pp-green">
              {t("verifiedAccount")}
            </Text>
          </View>
        </View>
        <Link href="/parent/settings" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("navSettings")}
            className="size-9 items-center justify-center rounded-card border border-pp-line"
          >
            <Pencil size={16} color={PP.muted} />
          </Pressable>
        </Link>
      </View>

      <View className="gap-3">
        <SectionLabel>{t("myChildren", { count: childList.length })}</SectionLabel>
        <View className="overflow-hidden rounded-card border-[1.5px] border-pp-line bg-pp-card">
          {childList.map((c, i) => (
            <Link key={c.key} href={`/parent/child/${c.key}` as never} asChild>
              <Pressable
                className={`flex-row items-center gap-3 px-4 py-4 ${
                  i < childList.length - 1 ? "border-b border-pp-panel" : ""
                }`}
              >
                <ChildFace name={c.name} tint={c.avBg} size={42} />
                <View className="flex-1 gap-0.5">
                  <Text className="font-sans-bold text-sm text-pp-ink">{c.name}</Text>
                  <Text className="font-sans text-[11px] text-pp-faint">
                    {t("idLabel", { id: c.id })}
                  </Text>
                </View>
                <ChevronRight size={16} color={PP.line} />
              </Pressable>
            </Link>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>{t("contactInfo")}</SectionLabel>
        <View className="overflow-hidden rounded-card border-[1.5px] border-pp-line bg-pp-card">
          <View className="flex-row items-center gap-3 border-b border-pp-panel px-4 py-3.5">
            <View className="size-8 items-center justify-center rounded-card bg-pp-soft">
              <Phone size={16} color={PP.blue} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-[10px] text-pp-muted">{t("phone")}</Text>
              <Text numberOfLines={1} className="font-sans-bold text-[13px] text-pp-ink">
                {parent.phone || "—"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="size-8 items-center justify-center rounded-card bg-pp-soft">
              <Mail size={16} color={PP.blue} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-[10px] text-pp-muted">{t("email")}</Text>
              <Text numberOfLines={1} className="font-sans-bold text-[13px] text-pp-ink">
                {parent.email || "—"}
              </Text>
            </View>
            <View className="rounded-full bg-pp-green-soft px-2 py-0.5">
              <Text className="font-sans-bold text-[9px] text-pp-green">{t("verified")}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
