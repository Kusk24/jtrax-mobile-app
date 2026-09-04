/* The three chess opponents on the phone.

   Two are models the academy trained (Beginner, Club player); the third is
   Stockfish (Master), already running in its own WebView. The trained pair run
   in a shared WebView because Hermes has no WebAssembly — see OnnxWebView.

   How they were trained and measured:
   jtrax-docs/features/training-our-own-chess-opponents.md */
import Constants from "expo-constants";

export type Opponent = "novice" | "strong" | "expert";
export const OPPONENTS: Opponent[] = ["novice", "strong", "expert"];

/** Where onnxruntime-web and the two .onnx files are fetched from — the same
    host the web app points NEXT_PUBLIC_MODEL_BASE_URL at. Configured per build;
    with none set the trained opponents show as unavailable and Stockfish still
    works, so the screen degrades rather than breaks. */
export const MODEL_BASE_URL: string | null =
  process.env.EXPO_PUBLIC_MODEL_BASE_URL?.replace(/\/$/, "") ??
  (Constants.expoConfig?.extra?.modelBaseUrl as string | undefined)?.replace(/\/$/, "") ??
  null;

export * as maia from "./maia-engine";
export * as novice from "./novice-engine";
export { promptFrom } from "./pgn-prompt";
