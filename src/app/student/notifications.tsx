import { Screen } from "@/components/Screen";
import { StudentHeader } from "@/components/StudentHeader";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { notifications } from "@/lib/student-data";

export default function StudentNotificationsScreen() {
  return (
    <Screen>
      <StudentHeader />
      <NotificationsPanel items={notifications} />
    </Screen>
  );
}
