/**
 * One way to play on the Games tab — the web's GameModeCard: a compact row
 * with a small tinted icon tile, the title and a round arrow. Tapping it
 * opens what it holds (the robots, the challenge panel, the code form), so
 * nothing moved to another screen. Home's tiles open a card on arrival with
 * `/student/play?open=<id>`.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

/* Flat colours, one per way to play: a tinted icon tile on the card. */
const TONE = {
  ai: { tile: "bg-pp-soft", arrow: "bg-pp-soft", ink: "blue" },
  friend: { tile: "bg-st-orange-soft", arrow: "bg-st-orange-soft", ink: "orange" },
  room: { tile: "bg-pp-green-soft", arrow: "bg-pp-green-soft", ink: "green" },
} as const;

export function GameModeCard({
  tone,
  art,
  title,
  open: openFromRoute = false,
  children,
}: {
  tone: keyof typeof TONE;
  art: React.ReactNode;
  title: string;
  /** Opened by the link that brought the pupil here. */
  open?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(openFromRoute);
  const { pp, st } = usePalette();
  const c = TONE[tone];
  const arrowInk = c.ink === "orange" ? st.orange : pp[c.ink];

  /* The tab stays mounted, so a second arrival with a different card named
     has to open it here rather than on mount. */
  useEffect(() => {
    if (openFromRoute) setOpen(true);
  }, [openFromRoute]);

  return (
    <View className="overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3 px-3 py-2.5 active:bg-pp-mist"
      >
        <View className={`size-11 items-center justify-center rounded-lg ${c.tile}`}>{art}</View>
        <Text numberOfLines={1} className="min-w-0 flex-1 font-pp-bold text-[15px] leading-tight text-pp-ink">
          {title}
        </Text>
        <View className={`size-7 items-center justify-center rounded-full ${c.arrow}`}>
          <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
            <ChevronRight size={16} color={arrowInk} strokeWidth={2.5} />
          </View>
        </View>
      </Pressable>
      {open && <View className="border-t border-pp-line p-3">{children}</View>}
    </View>
  );
}
