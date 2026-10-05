/**
 * The student portal shell: the screens, and under them the tab bar — in the
 * page, not floating over it, as the parent portal's is.
 */
import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentBottomNav } from "@/components/StudentNav";
import { usePalette } from "@/components/ThemeProvider";

export default function StudentLayout() {
  const { pp } = usePalette();
  return (
    <RequireRole role="Student">
      <SafeAreaView className="flex-1 bg-pp-bg" edges={["top"]}>
        <View className="min-h-0 flex-1">
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: pp.bg },
            }}
          />
        </View>
        <StudentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
