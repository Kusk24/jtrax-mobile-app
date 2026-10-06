/**
 * A small tooltip that opens on a tap — the web's TapTip, which also opens on
 * hover. A phone has no hover, so a number that only explained itself under a
 * mouse explained nothing here. A second tap closes it; so does a few
 * seconds passing, since there is no "tap elsewhere" to listen for.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const OPEN_MS = 2500;

export function TapTip({ tip, children }: { tip: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setOpen(false), OPEN_MS);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={tip}
        hitSlop={8}
        className="flex-row items-center"
      >
        {children}
      </Pressable>
      {open && (
        <View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={{ position: "absolute", bottom: "100%", marginBottom: 6, alignSelf: "center", zIndex: 30 }}
          className="rounded-lg bg-pp-ink px-2.5 py-1.5"
        >
          <Text numberOfLines={1} className="font-pp-semibold text-[11.5px] text-pp-card">
            {tip}
          </Text>
        </View>
      )}
    </View>
  );
}
