/**
 * History's result filter as a single icon — the web's ResultFilter: tap the
 * funnel, pick All, Win, Loss or Draw from a small menu. The icon turns blue
 * with a dot while anything but All is chosen, so a filtered list never looks
 * complete.
 */
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Check, Filter } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

export type ResultChoice = "all" | "win" | "loss" | "draw";

const CHOICES: ResultChoice[] = ["all", "win", "loss", "draw"];

export function ResultFilter({
  value,
  onChange,
  labels,
  label,
}: {
  value: ResultChoice;
  onChange: (v: ResultChoice) => void;
  labels: Record<ResultChoice, string>;
  /** What the button is, for screen readers. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const { pp } = usePalette();
  const narrowed = value !== "all";
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${labels[value]}`}
        hitSlop={6}
        className={`size-8 items-center justify-center rounded-full ${narrowed ? "bg-pp-soft" : ""}`}
      >
        <Filter size={16} color={narrowed ? pp.blue : pp.muted} strokeWidth={2.2} />
        {narrowed && <View className="absolute right-1 top-1 size-2 rounded-full border-2 border-pp-card bg-pp-blue" />}
      </Pressable>
      {/* A small sheet rather than a popover: on a phone a menu anchored to a
          32pt icon is a menu half under a thumb. */}
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 justify-end bg-[rgba(20,33,58,0.35)] p-4 pb-10">
          <View accessibilityRole="menu" className="rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-1">
            <Text className="px-3 pb-1 pt-2.5 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">{label}</Text>
            {CHOICES.map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  onChange(k);
                  setOpen(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: value === k }}
                className="flex-row items-center gap-2 rounded-xl px-3 py-3 active:bg-pp-mist"
              >
                <Text className="flex-1 font-pp-semibold text-[14px] text-pp-ink">{labels[k]}</Text>
                {value === k && <Check size={16} color={pp.blue} strokeWidth={2.6} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
