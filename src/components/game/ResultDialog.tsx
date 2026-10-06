/**
 * What happened, said once, in front of the board rather than under it.
 *
 * The result used to be a line in the same panel that says "Your move" and
 * "Thinking…" the rest of the game — a place a child has learned to ignore. A
 * finished game is an event, not a status.
 *
 * Two ways out and no more: play again, or go back and look at the position.
 * Deliberately not a review or a share; neither exists here, and a dialog full
 * of buttons that do nothing is worse than the line it replaced.
 */
import { useEffect, type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Check, Minus, X } from "lucide-react-native";
import { usePalette } from "@/components/ThemeProvider";
import { playSound } from "@/lib/sound";

export function ResultDialog({
  visible,
  title,
  detail,
  primaryLabel,
  onPrimary,
  onClose,
  outcome,
  facts,
}: {
  visible: boolean;
  title: string;
  /** How it ended — "by checkmate". Absent when a game was stopped rather than
      played out. */
  detail?: string;
  /** What "play again" means here. Against the computer it starts a new game;
      in a class game there is nothing to restart — a teacher opens those — so
      it goes back instead. */
  primaryLabel: string;
  onPrimary: () => void;
  onClose: () => void;
  /** The pupil's result, for the mark above the title. */
  outcome?: "win" | "loss" | "draw" | null;
  /** What the game was: opponent, side, time control, when. */
  facts?: { label: string; value: ReactNode }[];
}) {
  const t = useTranslations("play");
  const { pp } = usePalette();
  const mark =
    outcome === "win"
      ? { bg: "bg-pp-green-soft", Icon: Check, ink: pp.green }
      : outcome === "loss"
        ? { bg: "bg-pp-red-soft", Icon: X, ink: pp.red }
        : outcome === "draw"
          ? { bg: "bg-pp-neutral", Icon: Minus, ink: pp.muted }
          : null;
  /* The game-over chime, once, when the result appears. A beat after the
     final move's own sound rather than on top of it, which is the order a
     player expects: the move lands, then the game ends. */
  useEffect(() => {
    if (!visible) return;
    const later = setTimeout(() => playSound("game-end"), 250);
    return () => clearTimeout(later);
  }, [visible]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      /* Android's back gesture should dismiss it, like tapping away does. */
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-[rgba(20,33,58,0.45)] px-8"
      >
        {/* Swallows the tap so touching the card does not close it. */}
        <Pressable
          onPress={() => {}}
          accessibilityViewIsModal
          accessibilityRole="alert"
          className="w-full max-w-[360px] items-center rounded-2xl bg-pp-card p-[18px]"
        >
          {mark && (
            <View className={`mb-3 size-14 items-center justify-center rounded-full ${mark.bg}`}>
              <mark.Icon size={28} color={mark.ink} strokeWidth={2.6} />
            </View>
          )}
          <Text className="text-center font-pp-display-bold text-[23px] text-pp-ink">{title}</Text>
          {detail ? (
            <Text className="mt-1.5 text-center font-pp text-[13px] text-pp-muted">{detail}</Text>
          ) : null}

          {facts && facts.length > 0 && (
            <View className="mt-4 w-full flex-row flex-wrap gap-y-2.5 rounded-xl bg-pp-bg p-3">
              {facts.map((f) => (
                <View key={f.label} className="w-1/2 min-w-0 pr-2">
                  <Text className="font-pp text-[11.5px] text-pp-muted">{f.label}</Text>
                  <Text numberOfLines={1} className="font-pp-semibold text-[13.5px] text-pp-ink">
                    {f.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={onPrimary}
            accessibilityRole="button"
            className="mt-5 min-h-12 w-full items-center justify-center rounded-full bg-pp-blue active:bg-pp-deep"
          >
            <Text className="font-pp-semibold text-sm text-white">{primaryLabel}</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            className="mt-2 min-h-11 w-full items-center justify-center rounded-full border border-pp-line bg-pp-card active:bg-pp-soft"
          >
            <Text className="font-pp-semibold text-[14px] text-pp-ink">{t("viewBoard")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
