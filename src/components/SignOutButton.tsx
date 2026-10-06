import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { LogOut } from "lucide-react-native";
import { useSession } from "@/lib/session";
import { usePalette } from "@/components/ThemeProvider";

/** Sign out, then back to the sign-in screen. `replace` rather than `push` so
    the back gesture cannot return to a portal the session no longer opens.
    Drawn as the web student Profile's full-width secondary pill. */
export function SignOutButton() {
  const t = useTranslations("common");
  const { signOut } = useSession();
  const { pp } = usePalette();

  return (
    <Pressable
      onPress={async () => {
        await signOut();
        router.replace("/");
      }}
      accessibilityRole="button"
      className="min-h-11 flex-row items-center justify-center gap-[7px] rounded-full border border-pp-line bg-pp-card px-5 active:bg-pp-soft"
    >
      <LogOut size={16} color={pp.ink} />
      <Text className="font-pp-semibold text-[14px] text-pp-ink">{t("signOut")}</Text>
    </Pressable>
  );
}
