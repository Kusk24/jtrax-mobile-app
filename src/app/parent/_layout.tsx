import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ParentBottomNav } from "@/components/ParentNav";

export default function ParentLayout() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f7f4ee" },
        }}
      />
      <ParentBottomNav />
    </SafeAreaView>
  );
}
