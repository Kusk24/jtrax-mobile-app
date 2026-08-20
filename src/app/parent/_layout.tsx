import { RequireRole } from "@/components/RequireRole";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ParentBottomNav } from "@/components/ParentNav";
import { C } from "@/lib/colors";

export default function ParentLayout() {
  return (
    <RequireRole role="Parent">
      <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.paper },
          }}
        />
        <ParentBottomNav />
      </SafeAreaView>
    </RequireRole>
  );
}
