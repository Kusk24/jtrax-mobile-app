/**
 * A compact filter — the web's FilterPicker: a pill showing the current
 * choice, tinted while anything other than the first option is chosen.
 *
 * The web drops a list down under the pill. Here the list rises in a sheet
 * from the bottom: a dropdown positioned inside a scrolling screen is clipped
 * or hidden behind later rows on a phone, and a sheet is where iOS puts a
 * short list of choices anyway.
 */
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronDown, type LucideIcon } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

export type PickerOption = { k: string; label: string };

export function FilterPicker({
  icon: Icon,
  options,
  value,
  onChange,
  label,
}: {
  icon: LucideIcon;
  /** The first option is "everything" — the resting state. */
  options: PickerOption[];
  value: string;
  onChange: (k: string) => void;
  /** What this picker filters by: the sheet's title, and for screen readers. */
  label: string;
}) {
  const { pp } = usePalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.k === value) ?? options[0];
  const narrowed = current !== options[0];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current.label}`}
        className={`min-w-0 max-w-[200px] shrink flex-row items-center gap-1 rounded-full border-[1.5px] px-2.5 py-1.5 ${
          narrowed ? "border-pp-blue bg-pp-soft" : "border-pp-line bg-pp-card active:bg-pp-mist"
        }`}
      >
        <Icon size={14} color={narrowed ? pp.blue : pp.ink} strokeWidth={2.2} />
        <Text numberOfLines={1} className={`shrink font-pp-bold text-[12px] ${narrowed ? "text-pp-blue" : "text-pp-ink"}`}>
          {current.label}
        </Text>
        <ChevronDown size={14} color={narrowed ? pp.blue : pp.ink} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 justify-end bg-[rgba(20,33,58,0.45)]">
          {/* A press on the sheet itself must not close it. */}
          <Pressable
            onPress={() => {}}
            accessibilityViewIsModal
            style={{ paddingBottom: insets.bottom + 12 }}
            className="max-h-[70%] rounded-t-2xl bg-pp-card px-3 pt-3"
          >
            <View className="mb-2 h-1 w-10 self-center rounded-full bg-pp-line" />
            <Text accessibilityRole="header" className="px-2.5 pb-2 font-pp-bold text-[11.5px] uppercase tracking-[1.6px] text-pp-sub">
              {label}
            </Text>
            <ScrollView>
              {options.map((o) => {
                const on = value === o.k;
                return (
                  <Pressable
                    key={o.k || "all"}
                    onPress={() => {
                      onChange(o.k);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    className="min-h-12 flex-row items-center gap-2 rounded-lg px-2.5 py-3 active:bg-pp-mist"
                  >
                    <Text numberOfLines={1} className={`min-w-0 flex-1 text-[14px] ${on ? "font-pp-bold text-pp-blue" : "font-pp-semibold text-pp-ink"}`}>
                      {o.label}
                    </Text>
                    {on && <Check size={16} color={pp.blue} strokeWidth={2.4} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
