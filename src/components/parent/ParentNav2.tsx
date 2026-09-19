/**
 * The parent portal's chrome: the top account bar and the bottom tabs.
 *
 * Same four tabs as the portal, in the same order, so a parent who uses both
 * is not learning two apps. The sidebar the portal grows at ≥lg has no phone
 * equivalent — the bar is the whole navigation here.
 */
import { Link, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Bell, ClipboardCheck, Home, Settings, UserRound, type LucideIcon } from "lucide-react-native";
import { isActive, type TabPath } from "@/lib/portal-tabs";
import { useParentData } from "./ParentData";
import { PP } from "@/lib/colors";

type Tab = TabPath & { labelKey: string; icon: LucideIcon };

const tabs: Tab[] = [
  {
    href: "/parent",
    labelKey: "navHome",
    icon: Home,
    exact: true,
    activeAliases: ["/parent/notifications", "/parent/announcements", "/parent/tournament"],
  },
  {
    href: "/parent/attendance",
    labelKey: "navChildren",
    icon: ClipboardCheck,
    activeAliases: ["/parent/child"],
  },
  { href: "/parent/profile", labelKey: "navProfile", icon: UserRound },
  { href: "/parent/settings", labelKey: "navSettings", icon: Settings },
];

export function ParentBottomNav2() {
  const pathname = usePathname();
  const t = useTranslations("pv2");
  return (
    <View className="flex-row border-t border-pp-line bg-pp-bg px-2 pb-6 pt-2">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href as never} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`min-w-0 flex-1 items-center gap-0.5 rounded-[13px] py-1.5 ${
                active ? "bg-pp-soft" : ""
              }`}
            >
              <Icon size={22} color={active ? PP.blue : PP.faint} strokeWidth={1.8} />
              <Text
                numberOfLines={1}
                className={`text-[10px] font-sans-bold ${active ? "text-pp-blue" : "text-pp-faint"}`}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

/** The signed-in parent, top right — where the console and the portal both
    put the account. The bell carries the unread dot. */
export function ParentAccountChip() {
  const t = useTranslations("pv2");
  const { parent, parentId, unreadNotifs } = useParentData();
  const initial = (parent.name.trim()[0] ?? "?").toUpperCase();
  return (
    <View className="flex-row items-center justify-between gap-2 bg-pp-bg px-4 pt-3">
      <Text className="text-[10px] font-sans-bold uppercase tracking-[1.2px] text-pp-blue">
        JTrax — {t("roleParent")}
      </Text>
      <View className="flex-row items-center gap-2">
        <Link href="/parent/notifications" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("notificationsTitle")}
            className="size-[38px] items-center justify-center rounded-full border-[1.5px] border-pp-line bg-pp-card"
          >
            <Bell size={18} color={PP.ink} strokeWidth={1.8} />
            {unreadNotifs > 0 && (
              <View className="absolute right-2 top-2 size-[9px] rounded-full border-2 border-pp-card bg-pp-red" />
            )}
          </Pressable>
        </Link>
        <Link href="/parent/profile" asChild>
          <Pressable className="max-w-[190px] flex-row items-center gap-2.5 rounded-full border-[1.5px] border-pp-line bg-pp-card py-1.5 pl-1.5 pr-3.5">
            <View className="size-8 items-center justify-center rounded-full bg-pp-deep">
              <Text className="font-sans-extrabold text-sm text-white">{initial}</Text>
            </View>
            <View className="min-w-0 shrink">
              <Text numberOfLines={1} className="font-sans-bold text-[12.5px] text-pp-ink">
                {parent.name}
              </Text>
              <Text numberOfLines={1} className="font-sans text-[10px] text-pp-muted">
                {t("roleParent")} · {parentId}
              </Text>
            </View>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
