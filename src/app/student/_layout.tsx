import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentBottomNav } from "@/components/StudentNav";
import { C } from "@/lib/colors";
import { TAB_SCREEN_OPTIONS } from "@/lib/tab-navigation";

export default function StudentLayout() {
  return (
    <RequireRole role="Student">
      <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.paper },
          }}
        >
          {/* The five tabs cross-fade in place; a puzzle or a board opened
              from them slides in, and back out. */}
          <Stack.Screen name="index" options={TAB_SCREEN_OPTIONS} />
          <Stack.Screen name="puzzles/index" options={TAB_SCREEN_OPTIONS} />
          <Stack.Screen name="challenge" options={TAB_SCREEN_OPTIONS} />
          <Stack.Screen name="play/index" options={TAB_SCREEN_OPTIONS} />
          <Stack.Screen name="profile" options={TAB_SCREEN_OPTIONS} />
        </Stack>
        <StudentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
