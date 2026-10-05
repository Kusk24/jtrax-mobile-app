import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentBottomNav } from "@/components/StudentNav";
import { usePalette } from "@/components/ThemeProvider";

export default function StudentLayout() {
  const { pp } = usePalette();
  return (
    <RequireRole role="Student">
      <SafeAreaView className="flex-1 bg-pp-bg" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: pp.bg },
          }}
        />
        <StudentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
