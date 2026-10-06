/**
 * The parent portal shell.
 *
 * Mirrors the web layout: the data provider wraps the chrome as well as the
 * screens, because the bell on the home counts the parent's unread rows.
 */
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RequireRole } from "@/components/RequireRole";
import { ParentDataProvider } from "@/components/parent/ParentData";
import { ParentBottomNav2, ParentTopLabel } from "@/components/parent/ParentNav2";
import { usePalette } from "@/components/ThemeProvider";

export default function ParentLayout() {
  const { pp } = usePalette();
  return (
    <RequireRole role="Parent">
      <SafeAreaView className="flex-1 bg-pp-bg" edges={["top"]}>
        <ParentDataProvider>
          <ParentTopLabel />
          <View className="min-h-0 flex-1">
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: pp.bg },
              }}
            />
          </View>
          <ParentBottomNav2 />
        </ParentDataProvider>
      </SafeAreaView>
    </RequireRole>
  );
}
