/**
 * The student screens' building blocks, from the web's components/student/kit.
 *
 * The same system as the parent portal: 16px cards on a 1.5px line, pill
 * buttons, Poppins for headings, the pp-* palette — so a family switching
 * between the two accounts finds them drawn the same way. Every colour is a
 * themed token, so Appearance turns these too.
 */
import { Pressable, Text, View, type PressableProps } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-[18px] ${className}`}>{children}</View>;
}

/** A page opened from another: a back arrow, the title, and a line under it. */
export function SubPageHeader({
  onBack,
  backLabel,
  title,
  sub,
  right,
}: {
  onBack: () => void;
  backLabel: string;
  title: string;
  sub?: string;
  /** Something at the far end of the row — the sound switch on a board. */
  right?: React.ReactNode;
}) {
  const { pp } = usePalette();
  return (
    <View className="flex-row items-center gap-2.5">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        className="size-[38px] items-center justify-center rounded-xl border-[1.5px] border-pp-line bg-pp-card active:bg-pp-soft"
      >
        <ArrowLeft size={16} color={pp.ink} strokeWidth={2.2} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-pp-display-semibold text-2xl leading-tight text-pp-ink">
          {title}
        </Text>
        {sub ? (
          <Text numberOfLines={2} className="font-pp text-[11.5px] text-pp-muted">
            {sub}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

type PillProps = Omit<PressableProps, "children" | "className"> & {
  label: string;
  icon?: React.ReactNode;
  className?: string;
};

/** The main action on a screen: a blue pill. */
export function PrimaryPill({ label, icon, className = "", disabled, ...rest }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      className={`min-h-11 flex-row items-center justify-center gap-[7px] rounded-full px-5 active:bg-pp-deep ${
        disabled ? "bg-pp-faint" : "bg-pp-blue"
      } ${className}`}
    >
      {icon}
      <Text className="font-pp-semibold text-[14px] text-white">{label}</Text>
    </Pressable>
  );
}

/** Everything else: a bordered pill on the card colour. */
export function SecondaryPill({ label, icon, className = "", disabled, ...rest }: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      className={`min-h-11 flex-row items-center justify-center gap-[7px] rounded-full border border-pp-line bg-pp-card px-5 active:bg-pp-soft ${className}`}
    >
      {icon}
      <Text className={`font-pp-semibold text-[14px] ${disabled ? "text-pp-faint" : "text-pp-ink"}`}>{label}</Text>
    </Pressable>
  );
}
