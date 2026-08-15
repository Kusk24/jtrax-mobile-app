import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TeacherBottomNav } from "@/components/TeacherNav";

export default function TeacherLayout() {
  return (
    <RequireRole role="Teacher">
      <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#f7f4ee" },
          }}
        />
        <TeacherBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
