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
import { TAB_SCREEN_OPTIONS } from "@/lib/tab-navigation";

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
          >
            {/* The four tabs cross-fade in place; a puzzle, a board or a
                replay opened from them slides in, and back out. */}
            <Stack.Screen name="index" options={TAB_SCREEN_OPTIONS} />
            <Stack.Screen name="puzzles/index" options={TAB_SCREEN_OPTIONS} />
            <Stack.Screen name="play/index" options={TAB_SCREEN_OPTIONS} />
            <Stack.Screen name="profile" options={TAB_SCREEN_OPTIONS} />
          </Stack>
        </View>
        <StudentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
