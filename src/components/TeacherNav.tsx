import { CalendarDays, History, Home, User } from "lucide-react-native";
import { PortalBottomNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  { href: "/teacher", labelKey: "home", icon: Home, exact: true },
  {
    href: "/teacher/schedule",
    labelKey: "teacherSchedule",
    icon: CalendarDays,
    activeAliases: ["/teacher/checkin"],
  },
  {
    href: "/teacher/attendance",
    labelKey: "teacherAttendances",
    icon: History,
    activeAliases: ["/teacher/students"],
  },
  { href: "/teacher/profile", labelKey: "profile", icon: User },
];

export function TeacherBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}
