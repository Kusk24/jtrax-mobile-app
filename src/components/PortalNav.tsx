import { Link, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { LucideIcon } from "lucide-react-native";
import { C } from "@/lib/colors";

export type PortalTab = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Match this tab only on an exact path (used for the portal home tab). */
  exact?: boolean;
  /** Extra path prefixes that should also highlight this tab. */
  activeAliases?: string[];
};

function isActive(pathname: string, tab: PortalTab) {
  if (tab.activeAliases?.some((alias) => pathname.startsWith(alias))) {
    return true;
  }
  return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
}

export function PortalBottomNav({ tabs }: { tabs: PortalTab[] }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <View className="absolute bottom-3 left-3 right-3 z-20 rounded-3xl border-2 border-line bg-card px-2 py-1.5 shadow-clay-lg">
      <View className="flex-row items-stretch justify-around">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href as never} asChild>
              <Pressable
                className={`items-center gap-0.5 rounded-2xl px-4 py-1.5 ${
                  active ? "bg-navy-soft/50" : ""
                }`}
              >
                <Icon
                  size={20}
                  color={active ? C.navy : C.muted}
                  strokeWidth={active ? 2.4 : 2}
                />
                <Text
                  className={`text-[10px] ${
                    active ? "font-sans-bold text-navy" : "font-sans text-muted"
                  }`}
                >
                  {t(tab.labelKey)}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
