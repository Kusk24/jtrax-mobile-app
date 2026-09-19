/**
 * The parent portal shell.
 *
 * Mirrors the web layout: the data provider wraps the chrome as well as the
 * screens, because the account chip greets the signed-in parent by name and
 * the bell counts their unread rows — both need the data too.
 */
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RequireRole } from "@/components/RequireRole";
import { ParentDataProvider } from "@/components/parent/ParentData";
import { ParentAccountChip, ParentBottomNav2 } from "@/components/parent/ParentNav2";
import { PP } from "@/lib/colors";

export default function ParentLayout() {
  return (
    <RequireRole role="Parent">
      <SafeAreaView className="flex-1 bg-pp-bg" edges={["top"]}>
        <ParentDataProvider>
          <ParentAccountChip />
          <View className="min-h-0 flex-1">
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: PP.bg },
              }}
            />
          </View>
          <ParentBottomNav2 />
        </ParentDataProvider>
      </SafeAreaView>
    </RequireRole>
  );
}
