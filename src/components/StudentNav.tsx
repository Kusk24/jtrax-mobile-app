import { Gamepad2, Home, Puzzle, Swords, User } from "lucide-react-native";
import { PortalBottomNav, type PortalTab } from "./PortalNav";

/**
 * The five tabs, matching the portal exactly.
 *
 * Schedule, Attendances and Check-in are gone: the front desk takes attendance
 * at the console, so a pupil has no check-in to do and no register to read.
 * See `0008-the-academy-has-no-teacher-role` for the same reasoning applied to
 * the teacher portal.
 */
const tabs: PortalTab[] = [
  { href: "/student", labelKey: "home", icon: Home, exact: true },
  { href: "/student/puzzles", labelKey: "puzzles", icon: Puzzle },
  { href: "/student/challenge", labelKey: "challenge", icon: Swords },
  { href: "/student/play", labelKey: "play", icon: Gamepad2 },
  { href: "/student/profile", labelKey: "profile", icon: User },
];

export function StudentBottomNav() {
  return <PortalBottomNav tabs={tabs} rootsOnly />;
}
