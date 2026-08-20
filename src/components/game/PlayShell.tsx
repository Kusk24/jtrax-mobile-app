import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { C } from "@/lib/colors";

/** Header + scroll body the play screens share. Mirrors the web app's
    PlayShell, minus the phone frame — this *is* the phone. */
export function PlayShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-paper">
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-3">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/student"))}
          accessibilityLabel="Back"
          hitSlop={10}
          className="size-9 items-center justify-center rounded-full border-2 border-line bg-card"
        >
          <ArrowLeft size={18} color={C.ink} />
        </Pressable>
        <Text className="font-display-semibold text-2xl text-navy">{title}</Text>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-32 pt-2 gap-3"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-card border-2 border-line bg-card p-4 shadow-clay ${className}`}>
      {children}
    </View>
  );
}
