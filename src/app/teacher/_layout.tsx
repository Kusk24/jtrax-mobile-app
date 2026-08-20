import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TeacherBottomNav } from "@/components/TeacherNav";
import { C } from "@/lib/colors";

export default function TeacherLayout() {
  return (
    <RequireRole role="Teacher">
      <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.paper },
          }}
        />
        <TeacherBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
