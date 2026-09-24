/* The speaker in the corner of every board screen: sound on or off, for this
   phone. Says what pressing it will do, since the icon alone only says what is
   happening now. The web portal's SoundToggle, for React Native. */
import { Pressable } from "react-native";
import { useTranslations } from "use-intl";
import { Volume2, VolumeX } from "lucide-react-native";
import { setSoundOn, useSoundOn } from "@/lib/sound";
import { C } from "@/lib/colors";

export function SoundToggle() {
  const t = useTranslations("common");
  const on = useSoundOn();
  return (
    <Pressable
      onPress={() => setSoundOn(!on)}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={on ? t("soundOff") : t("soundOn")}
      hitSlop={10}
      className="size-9 items-center justify-center rounded-full border-2 border-line bg-card active:opacity-80"
    >
      {on ? <Volume2 size={18} color={C.muted} strokeWidth={2.4} /> : <VolumeX size={18} color={C.muted} strokeWidth={2.4} />}
    </Pressable>
  );
}
