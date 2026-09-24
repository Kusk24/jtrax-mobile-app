/* The board's sound effects: which sound a move makes, playing it, and the
   switch that turns them off. The same sounds and rules as the web portal's
   lib/sound; the files are copied from its public/sounds. */
export { ALL_SOUNDS, lastMoveOf, moveBetween, moveFrom, soundForMove, type SoundName } from "./kind";
export { playSound, preloadSounds } from "./player";
export { isSoundOn, loadSoundSetting, setSoundOn, useSoundOn } from "./setting";
