import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentBottomNav } from "@/components/StudentNav";
import { C } from "@/lib/colors";

export default function StudentLayout() {
  return (
    <RequireRole role="Student">
      <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.paper },
          }}
        />
        <StudentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
