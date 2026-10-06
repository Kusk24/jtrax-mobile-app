/**
 * The parent portal's chrome: a slim label at the top, the bottom tabs, and
 * the bell that sits on the home greeting's row.
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
import { useTabPress } from "@/components/useTabPress";
import { useParentData } from "./ParentData";
import { usePalette } from "@/components/ThemeProvider";

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
    labelKey: "navAttendance",
    icon: ClipboardCheck,
    activeAliases: ["/parent/child"],
  },
  { href: "/parent/profile", labelKey: "navProfile", icon: UserRound },
  { href: "/parent/settings", labelKey: "navSettings", icon: Settings },
];

export function ParentBottomNav2() {
  const { pp } = usePalette();
  const pathname = usePathname();
  const t = useTranslations("pv2");
  const goToTab = useTabPress("/parent");
  return (
    <View className="flex-row border-t border-pp-line bg-pp-bg px-2 pb-6 pt-2">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.href}
            onPress={() => goToTab(tab.href)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`min-w-0 flex-1 items-center gap-0.5 rounded-[13px] py-1.5 ${
              active ? "bg-pp-soft" : ""
            }`}
          >
            <Icon size={22} color={active ? pp.blue : pp.faint} strokeWidth={1.8} />
            <Text
              numberOfLines={1}
              className={`text-[10px] font-pp-bold ${active ? "text-pp-blue" : "text-pp-faint"}`}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A slim label above every parent screen — the web's phone-width shell. The
    brand lives here; the account is a tab, so the chip that used to share
    this row is gone. */
export function ParentTopLabel() {
  const t = useTranslations("pv2");
  return (
    <View className="items-center bg-pp-bg px-4 pt-2.5">
      <Text className="text-[10px] font-pp-bold uppercase tracking-[1.2px] text-pp-blue">
        JTrax — {t("roleParent")}
      </Text>
    </View>
  );
}

/** The notification bell, on the home greeting's row. The red dot is any
    unread row in the inbox. */
export function ParentBell() {
  const { pp } = usePalette();
  const t = useTranslations("pv2");
  const { unreadNotifs } = useParentData();
  return (
    <Link href="/parent/notifications" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("notificationsTitle")}
        className="size-[38px] items-center justify-center rounded-full border-[1.5px] border-pp-line bg-pp-card active:bg-pp-soft"
      >
        <Bell size={18} color={pp.ink} strokeWidth={1.8} />
        {unreadNotifs > 0 && (
          <View className="absolute right-2 top-2 size-[9px] rounded-full border-2 border-pp-card bg-pp-red" />
        )}
      </Pressable>
    </Link>
  );
}
