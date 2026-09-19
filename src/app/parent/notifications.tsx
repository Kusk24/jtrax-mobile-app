/* The inbox the backend wrote for this account — not a list re-derived from
   attendance stamps, which could only ever imitate the sender. */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useLocale, useTranslations } from "use-intl";
import {
  AlertTriangle, Check, Clock3, DoorOpen, Megaphone, Receipt, type LucideIcon,
} from "lucide-react-native";
import { useParentData } from "@/components/parent/ParentData";
import { BackHeader } from "@/components/parent/BackHeader";
import { PP } from "@/lib/colors";

/* One face per notification type in the backend's catalogue. A type this map
   has never heard of gets the announcement look rather than a crash — the
   server's catalogue is allowed to grow first. */
const TYPE_STYLE: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  check_in: { icon: Check, color: PP.green, bg: PP.greenSoft },
  credit_deducted: { icon: DoorOpen, color: PP.blue, bg: PP.soft },
  low_credit: { icon: AlertTriangle, color: PP.amber, bg: PP.amberSoft },
  credit_expiry: { icon: Clock3, color: PP.amber, bg: PP.amberSoft },
  payment_received: { icon: Receipt, color: PP.green, bg: PP.greenSoft },
  announcement: { icon: Megaphone, color: PP.blue, bg: PP.soft },
};
const FALLBACK_STYLE = TYPE_STYLE.announcement;

export default function ParentNotifications() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const router = useRouter();
  const { notifs, unreadNotifs, isNotifRead, markNotifRead, markAllNotifsRead } = useParentData();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const shown = notifs.filter((n) => tab === "all" || !isNotifRead(n.id));

  /* The backend stamps created_at in UTC without a zone marker; saying so
     keeps the label honest instead of shifted by the device's guess. */
  const whenLabel = (iso: string) => {
    const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(d);
  };

  return (
    <ScrollView
      className="flex-1 bg-pp-bg"
      contentContainerClassName="gap-4 px-4 pb-10 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <BackHeader
        title={t("notificationsTitle")}
        subtitle={unreadNotifs > 0 ? t("unreadCount", { count: unreadNotifs }) : t("allCaughtUp")}
        right={
          <Pressable onPress={markAllNotifsRead} accessibilityRole="button">
            <Text className="font-sans-bold text-xs text-pp-blue">{t("markAllRead")}</Text>
          </Pressable>
        }
      />

      <View className="flex-row gap-1 self-start rounded-full bg-pp-panel p-[3px]">
        {(["all", "unread"] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === k }}
            className={`rounded-full px-4 py-1.5 ${tab === k ? "bg-pp-deep" : ""}`}
          >
            <Text
              className={`font-sans-bold text-xs ${tab === k ? "text-[#fbfff1]" : "text-pp-muted"}`}
            >
              {k === "all" ? t("tabAll") : t("tabUnread")}
              {k === "unread" && unreadNotifs > 0 ? ` (${unreadNotifs})` : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {shown.length === 0 && (
        <View className="rounded-card border-[1.5px] border-dashed border-pp-dash p-6">
          <Text className="text-center font-sans text-[12.5px] text-pp-muted">
            ♞ {t("caughtUpBody")}
          </Text>
        </View>
      )}

      <View className="gap-3">
        {shown.map((n) => {
          const isUnread = !isNotifRead(n.id);
          const ks = TYPE_STYLE[n.type] ?? FALLBACK_STYLE;
          const Icon = ks.icon;
          /* Title and body come off the row itself, already in this account's
             language — the sender chose when it wrote the inbox. */
          return (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              onPress={() => {
                markNotifRead(n.id);
                router.push(n.href as never);
              }}
              style={{
                backgroundColor: isUnread ? PP.mist : PP.card,
                borderColor: isUnread ? PP.soft : PP.line,
              }}
              className="flex-row items-start gap-3 rounded-card border-[1.5px] p-4"
            >
              <View
                style={{ backgroundColor: ks.bg }}
                className="size-10 items-center justify-center rounded-[13px]"
              >
                <Icon size={18} color={ks.color} strokeWidth={2.2} />
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-sans-bold text-[13.5px] text-pp-ink">{n.title}</Text>
                  {isUnread && <View className="size-[7px] rounded-full bg-pp-blue" />}
                </View>
                <Text className="font-sans text-[12.5px] leading-relaxed text-pp-muted">
                  {n.body}
                </Text>
                <Text className="font-sans text-[10.5px] text-pp-faint">{whenLabel(n.at)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
