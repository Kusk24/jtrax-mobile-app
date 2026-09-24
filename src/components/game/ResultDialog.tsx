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
import { useEffect } from "react";
import { Modal, Pressable, Text } from "react-native";
import { useTranslations } from "use-intl";
import { playSound } from "@/lib/sound";

export function ResultDialog({
  visible,
  title,
  detail,
  primaryLabel,
  onPrimary,
  onClose,
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
}) {
  const t = useTranslations("play");
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
        className="flex-1 items-center justify-center bg-navy/60 px-8"
      >
        {/* Swallows the tap so touching the card does not close it. */}
        <Pressable
          onPress={() => {}}
          accessibilityViewIsModal
          accessibilityRole="alert"
          className="w-full max-w-[320px] items-center rounded-card bg-card p-5 shadow-clay-lg"
        >
          <Text className="text-center font-display-semibold text-2xl text-navy">{title}</Text>
          {detail ? (
            <Text className="mt-1.5 text-center font-sans text-xs text-muted">{detail}</Text>
          ) : null}

          <Pressable
            onPress={onPrimary}
            className="mt-5 min-h-12 w-full items-center justify-center rounded-xl bg-navy active:opacity-80"
          >
            <Text className="font-sans-bold text-sm text-white">{primaryLabel}</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="mt-2 min-h-11 w-full items-center justify-center"
          >
            <Text className="font-sans-bold text-xs text-muted">{t("viewBoard")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
