/**
 * The student portal's tab bar — the web's StudentBottomNav, which is the
 * parent portal's bar class for class: Home, Puzzles, Games, Profile.
 *
 * Games holds every way to play — the robot, a friend, a room code — so
 * Challenge and Play are no longer tabs of their own. The bar shows only on
 * the four tabs themselves: a pushed screen (a board, a replay) takes the back
 * arrow and the whole phone, because a board with a bar across the bottom is
 * eight ranks in seven ranks' worth of space.
 */
import { Link, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Gamepad2, Home, Puzzle, UserRound, type LucideIcon } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { isActive, isRoot, type TabPath } from "@/lib/portal-tabs";

type Tab = TabPath & { labelKey: "home" | "puzzles" | "games" | "profile"; icon: LucideIcon };

const tabs: Tab[] = [
  { href: "/student", labelKey: "home", icon: Home, exact: true },
  { href: "/student/puzzles", labelKey: "puzzles", icon: Puzzle },
  { href: "/student/play", labelKey: "games", icon: Gamepad2 },
  { href: "/student/profile", labelKey: "profile", icon: UserRound },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("sv2");
  const { pp } = usePalette();
  if (!isRoot(pathname, tabs)) return null;
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
              className={`min-w-0 flex-1 items-center gap-0.5 rounded-[13px] py-1.5 ${active ? "bg-pp-soft" : ""}`}
            >
              <Icon size={22} color={active ? pp.blue : pp.faint} strokeWidth={1.8} />
              <Text numberOfLines={1} className={`font-pp-bold text-[10px] ${active ? "text-pp-blue" : "text-pp-faint"}`}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}
