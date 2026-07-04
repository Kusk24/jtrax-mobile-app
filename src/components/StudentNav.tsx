import { CalendarDays, History, Home, User } from "lucide-react-native";
import { PortalBottomNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  {
    href: "/student",
    labelKey: "home",
    icon: Home,
    exact: true,
    activeAliases: ["/student/notifications"],
  },
  {
    href: "/student/schedule",
    labelKey: "schedule",
    icon: CalendarDays,
    activeAliases: ["/student/checkin"],
  },
  { href: "/student/attendance", labelKey: "attendances", icon: History },
  { href: "/student/profile", labelKey: "profile", icon: User },
];

export function StudentBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}
