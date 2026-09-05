import { type RefObject, useCallback, useState } from "react";
import { maia, novice, type Opponent } from "@/lib/engines";
import type { OnnxHandle } from "./OnnxWebView";
import type { StockfishHandle } from "./StockfishWebView";

/* The three computer opponents, behind one call — the mobile twin of the web
   app's useAiOpponent.

   They are three different models, not one engine turned down. Stockfish's
   calibrated floor is Elo 1320, still stronger than any pupil here, so below
   that it has to be crippled by capping search depth, which plays perfectly and
   then collapses at random and reads to a child as the computer being unfair.

     novice  25.7M character-level GPT, ours, ~520 Elo
     strong  Maia-2, fine-tuned by us, ~1300-1450, rating-conditioned
     expert  Stockfish 18

   The two trained models share one WebView (onnx); Stockfish has its own.
   This hook only routes — the engine views are mounted by the screen. */

/** Maia-2's rating dial. Not a cap — at a low value it plays like a beginner on
    purpose, which is what would make a fourth tier nearly free. */
const STRONG_ELO = 1500;
/** Stockfish depth for the Master tier — the top of the old 1-5 ladder. */
const EXPERT_DEPTH = 12;
const EXPERT_ELO = 2000;

/** A reply that lands instantly reads as "it wasn't listening". */
const MIN_THINK_MS = 450;

type Refs = {
  onnx: RefObject<OnnxHandle | null>;
  stockfish: RefObject<StockfishHandle | null>;
};

export function useAiOpponent(opponent: Opponent, refs: Refs) {
  // Readiness is owned by the screen (it mounts the engine views and hears
  // their onReady); this hook is told, so both can never disagree.
  const [failed, setFailed] = useState(false);

  // The ref *objects* are stable, so bestMove only rebuilds when the opponent
  // changes; the handles are read from `.current` at call time. Passing the
  // handles directly would make a new deps object every render and loop the
  // move effect that depends on this callback.
  const bestMove = useCallback(
    async (moves: string[], sanHistory: string[], fen: string): Promise<string> => {
      const onnx = refs.onnx.current;
      const stockfish = refs.stockfish.current;
      const started = Date.now();
      let uci = "";
      try {
        if (opponent === "expert") {
          uci = (await stockfish?.bestMove(moves, EXPERT_DEPTH, EXPERT_ELO)) ?? "";
        } else if (opponent === "strong") {
          if (!onnx) throw new Error("model engine not mounted");
          uci = await maia.bestMove(onnx, fen, STRONG_ELO);
        } else {
          if (!onnx) throw new Error("model engine not mounted");
          uci = await novice.bestMove(onnx, sanHistory);
        }
      } catch {
        setFailed(true);
        return "";
      }
      const elapsed = Date.now() - started;
      if (elapsed < MIN_THINK_MS) {
        await new Promise((r) => setTimeout(r, MIN_THINK_MS - elapsed));
      }
      return uci;
    },
    [opponent, refs.onnx, refs.stockfish],
  );

  return { failed, setFailed, bestMove };
}
