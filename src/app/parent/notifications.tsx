import { Screen } from "@/components/Screen";
import { ParentHeader } from "@/components/ParentHeader";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { notifications } from "@/lib/parent-data";

export default function ParentNotificationsScreen() {
  return (
    <Screen>
      <ParentHeader />
      <NotificationsPanel items={notifications} />
    </Screen>
  );
}
