import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentBottomNav } from "@/components/StudentNav";

export default function StudentLayout() {
  return (
    <RequireRole role="Student">
      <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#f7f4ee" },
          }}
        />
        <StudentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
