/**
 * Everything a parent can change: notifications, Appearance, the password,
 * the language, and how to reach the school.
 */
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { LogOut } from "lucide-react-native";
import { useParentData } from "@/components/parent/ParentData";
import { useSession } from "@/lib/session";
import { useLocaleSwitch } from "@/i18n";
import { usePalette } from "@/components/ThemeProvider";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { AppearancePicker } from "@/components/AppearancePicker";

/** The academy's front desk, as the portal's Contact row dials. */
const SCHOOL_PHONE = "+66123456789";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
      {children}
    </Text>
  );
}

export default function ParentSettings() {
  const { pp } = usePalette();
  const t = useTranslations("pv2");
  const { locale, setLocale } = useLocaleSwitch();
  const { signOut } = useSession();
  const { prefs, schoolAllows, savePref } = useParentData();
  /* A failed save belongs next to the switch that failed, not in an alert. */
  const [prefError, setPrefError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  /* The catalogue, one switch each, all on until the parent turns one off —
     but only the types the school sends. The school's switch (Admin →
     Settings → Notifications) is the master: a type it has off is not
     offered here at all, rather than shown as a switch that does nothing. */
  const allPrefDefs = [
    { k: "check_in" as const, label: t("prefCheckin") },
    { k: "credit_deducted" as const, label: t("prefDeducted") },
    { k: "low_credit" as const, label: t("prefLowCredit") },
    { k: "credit_expiry" as const, label: t("prefExpiry") },
    { k: "announcement" as const, label: t("prefNews") },
    { k: "payment_received" as const, label: t("prefPayment") },
    { k: "class_cancelled" as const, label: t("prefCancelled") },
  ];
  const prefDefs = allPrefDefs.filter((p) => schoolAllows[p.k]);

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-5 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-1">
        <Text className="font-pp-display-semibold text-2xl leading-tight text-pp-ink">
          {t("settingsTitle")}
        </Text>
        <Text className="font-pp text-[12.5px] text-pp-muted">{t("settingsSub")}</Text>
      </View>

      <View className="gap-3">
        <SectionLabel>{t("notifPrefs")}</SectionLabel>
        <View className="overflow-hidden rounded-card border-[1.5px] border-pp-line bg-pp-card">
          {prefDefs.length === 0 && (
            <Text className="px-4 py-3.5 font-pp text-[13px] text-pp-muted">{t("notifNoneFromSchool")}</Text>
          )}
          {prefDefs.map((p, i) => (
            <View
              key={p.k}
              className={`flex-row items-center justify-between gap-3 px-4 py-3.5 ${
                i < prefDefs.length - 1 ? "border-b border-pp-panel" : ""
              }`}
            >
              <Text className="min-w-0 flex-1 font-pp-bold text-sm text-pp-ink">{p.label}</Text>
              <Pressable
                onPress={() => {
                  setPrefError(false);
                  savePref(p.k, !prefs[p.k]).catch(() => setPrefError(true));
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: prefs[p.k] }}
                accessibilityLabel={p.label}
                style={{ backgroundColor: prefs[p.k] ? pp.greenDot : pp.faint }}
                className="h-7 w-[46px] rounded-full"
              >
                <View
                  style={{ left: prefs[p.k] ? 21 : 3, top: 3 }}
                  className="absolute size-[22px] rounded-full bg-pp-card"
                />
              </Pressable>
            </View>
          ))}
          {prefError && (
            <Text
              accessibilityRole="alert"
              className="px-4 py-2.5 font-pp-bold text-[12px] text-pp-danger"
            >
              {t("prefSaveFailed")}
            </Text>
          )}
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>{t("appearance")}</SectionLabel>
        <AppearancePicker />
      </View>

      <View className="gap-3">
        <SectionLabel>{t("security")}</SectionLabel>
        <ChangePasswordForm tone="parent" />
      </View>

      <View className="gap-3">
        <SectionLabel>{t("more")}</SectionLabel>
        <View className="overflow-hidden rounded-card border-[1.5px] border-pp-line bg-pp-card">
          <View className="flex-row items-center justify-between border-b border-pp-panel px-4 py-3.5">
            <Text className="font-pp-bold text-sm text-pp-ink">{t("language")}</Text>
            <View className="flex-row gap-1 rounded-full bg-pp-panel p-[3px]">
              {(
                [
                  ["en", "EN"],
                  ["th", "ไทย"],
                ] as const
              ).map(([code, lbl]) => (
                <Pressable
                  key={code}
                  onPress={() => setLocale(code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: locale === code }}
                  style={{ backgroundColor: locale === code ? pp.blue : "transparent" }}
                  className="rounded-full px-3.5 py-1"
                >
                  <Text
                    style={{ color: locale === code ? "#fbfff1" : pp.muted }}
                    className="font-pp-bold text-xs"
                  >
                    {lbl}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            onPress={() => Linking.openURL(`tel:${SCHOOL_PHONE}`)}
            accessibilityRole="button"
            className="flex-row items-center justify-between px-4 py-4"
          >
            <Text className="font-pp-bold text-sm text-pp-ink">{t("contactSchool")}</Text>
            <Text className="font-pp-bold text-[12.5px] text-pp-blue">✆ {t("call")}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        disabled={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
          /* `replace`, so the back gesture cannot return to a portal the
             session no longer opens. */
          router.replace("/");
        }}
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 rounded-card border-[1.5px] border-pp-danger-line bg-pp-card p-3.5"
        style={{ opacity: signingOut ? 0.6 : 1 }}
      >
        <LogOut size={16} color={pp.danger} />
        <Text className="font-pp-bold text-[13.5px] text-pp-danger">{t("logOut")}</Text>
      </Pressable>
    </ScrollView>
  );
}
