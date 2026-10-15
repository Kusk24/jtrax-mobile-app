/**
 * The privacy notice (PDPA s.23), the web's /privacy in the app: the same text
 * and version, so a parent reads it without leaving for a browser.
 */
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useTranslations } from "use-intl";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";
import { ACADEMY_CONTACT, getAcademyContact, telHref } from "@/lib/academy-contact";

const SECTIONS = ["what", "why", "children", "sharing", "keep", "rights", "security"] as const;

export default function PrivacyScreen() {
  const t = useTranslations("privacy");
  /* The office's own details, as Settings' Contact School reads them. */
  const [contact, setContact] = useState(ACADEMY_CONTACT);
  useEffect(() => {
    let alive = true;
    getAcademyContact().then((c) => alive && setContact(c));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <ScrollView className="flex-1 bg-pp-bg" contentContainerClassName="gap-4 p-4 pb-12">
      <Stack.Screen options={{ title: t("title") }} />
      <View className="gap-1">
        <Text className="font-pp-display text-[22px] font-semibold text-pp-ink">{t("title")}</Text>
        <Text className="font-pp text-[12px] text-pp-muted">{t("version", { version: PRIVACY_NOTICE_VERSION })}</Text>
      </View>
      <Text accessibilityRole="text" className="rounded-xl bg-pp-amber-soft px-4 py-3 font-pp-bold text-[13px] text-pp-ink">
        {t("draft")}
      </Text>
      <Text className="font-pp text-[14px] leading-6 text-pp-ink">{t("intro")}</Text>
      {SECTIONS.map((key) => (
        <View key={key} className="gap-2 rounded-card border-[1.5px] border-pp-line bg-pp-card p-4">
          <Text className="font-pp-bold text-[16px] text-pp-ink">{t(`${key}Title`)}</Text>
          <Text className="font-pp text-[14px] leading-6 text-pp-ink">{t(key)}</Text>
        </View>
      ))}
      <View className="gap-2 rounded-card border-[1.5px] border-pp-line bg-pp-card p-4">
        <Text className="font-pp-bold text-[16px] text-pp-ink">{t("contactTitle")}</Text>
        <Text className="font-pp text-[14px] leading-6 text-pp-ink">{t("contact")}</Text>
        {contact.email ? (
          <Pressable onPress={() => Linking.openURL(`mailto:${contact.email}`)} accessibilityRole="link">
            <Text className="font-pp-bold text-[14px] text-pp-blue">{contact.email}</Text>
          </Pressable>
        ) : null}
        {contact.phones.map((p) => (
          <Pressable key={p} onPress={() => Linking.openURL(telHref(p))} accessibilityRole="link">
            <Text className="font-pp-bold text-[14px] text-pp-blue">{p}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
