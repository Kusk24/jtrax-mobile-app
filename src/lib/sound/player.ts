/* Playing the board's sounds, through expo-audio.
 *
 * One player per sound, made the first time that sound is wanted and kept for
 * the life of the app: seven short clips, about 360 KB in all, bundled with the
 * app rather than fetched. Different sounds overlap — a capture right after the
 * opponent's move does not wait for it — and the same sound restarts from the
 * top.
 *
 * The audio mode is set once: mix with whatever else is playing rather than
 * stopping a parent's music, and stay quiet when the phone is on silent, as a
 * game's sound effects should. */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import type { SoundName } from "./kind";
import { soundAllowed } from "./setting";

/* Below full scale: these sit under the game, not over it. */
const VOLUME = 0.7;

const FILES: Record<SoundName, number> = {
  move: require("../../../assets/sounds/move.wav"),
  capture: require("../../../assets/sounds/capture.wav"),
  castle: require("../../../assets/sounds/castle.wav"),
  check: require("../../../assets/sounds/check.wav"),
  promote: require("../../../assets/sounds/promote.wav"),
  "game-end": require("../../../assets/sounds/game-end.wav"),
  wrong: require("../../../assets/sounds/wrong.wav"),
};

const players = new Map<SoundName, AudioPlayer>();
let modeSet = false;

function playerFor(name: SoundName): AudioPlayer | null {
  let player = players.get(name);
  if (player) return player;
  try {
    if (!modeSet) {
      modeSet = true;
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});
    }
    player = createAudioPlayer(FILES[name]);
    player.volume = VOLUME;
    players.set(name, player);
    return player;
  } catch {
    return null;
  }
}

/** Makes the players ahead of time, so the first move is not the one that
    waits for a clip to load. */
export function preloadSounds(names: readonly SoundName[] = Object.keys(FILES) as SoundName[]) {
  for (const name of names) playerFor(name);
}

/** Plays one sound, if sound is on. Never throws and never waits: a board that
    cannot make a noise still has to move. */
export function playSound(name: SoundName) {
  if (!soundAllowed()) return;
  const player = playerFor(name);
  if (!player) return;
  try {
    void Promise.resolve(player.seekTo(0))
      .catch(() => {})
      .then(() => player.play());
  } catch {
    // A sound that could not start is not worth interrupting the game for.
  }
}
