import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useTranslations } from "use-intl";
import { LogOut } from "lucide-react-native";
import { useSession } from "@/lib/session";
import { C } from "@/lib/colors";

/** Sign out, then back to the sign-in screen. `replace` rather than `push` so
    the back gesture cannot return to a portal the session no longer opens. */
export function SignOutButton() {
  const t = useTranslations("common");
  const { signOut } = useSession();

  return (
    <Pressable
      onPress={async () => {
        await signOut();
        router.replace("/");
      }}
      className="flex-row items-center gap-3 rounded-lg px-1 py-2.5 active:bg-paper"
    >
      <LogOut size={16} color={C.brick} />
      <Text className="font-sans-bold text-sm text-brick">{t("signOut")}</Text>
    </Pressable>
  );
}
