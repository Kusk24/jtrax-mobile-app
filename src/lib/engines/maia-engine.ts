/* The strong opponent: Maia-2, fine-tuned by the academy on 2000-2800 games.

   Rating-conditioned — the same weights play at any level via elos_self — so
   one download covers every difficulty. Searchless: one forward pass ranks
   every legal move and the best is played, which is why it feels like a person
   and answers in milliseconds.

   The board encoding is shared verbatim with the web app (maia-encode.ts,
   tested there). Only the forward pass differs: on the phone it runs in the
   WebView, so this takes an OnnxHandle instead of a local session. */

import type { OnnxHandle } from "@/components/game/OnnxWebView";
import moves from "./data/maia-moves.json";
import { eloBucket, mirrorUci, prepare } from "./maia-encode";

const POLICY_SIZE = 1880;
const moveIndex = new Map((moves as string[]).map((m, i) => [m, i]));

/** The move Maia plays in this position, as UCI on the real board, or "" if
    there are none. `elo` is the strength to imitate, not a cap. */
export async function bestMove(
  onnx: OnnxHandle,
  fen: string,
  elo: number,
): Promise<string> {
  const { board, legalIndices, mirrored } = prepare(fen, moveIndex);
  if (legalIndices.length === 0) return "";

  const bucket = eloBucket(elo);
  const out = await onnx.run("strong", {
    boards: { data: Array.from(board), dims: [1, 18, 8, 8], type: "float32" },
    elos_self: { data: [bucket], dims: [1], type: "int64" },
    elos_oppo: { data: [bucket], dims: [1], type: "int64" },
  });

  const logits = out.logits_maia?.data;
  if (!logits || logits.length !== POLICY_SIZE) {
    throw new Error(`policy head is ${logits?.length}, expected ${POLICY_SIZE}`);
  }

  // Rank only legal moves, exactly as inference does in Python. Scoring all
  // 1880 and hoping the top one is legal is how you ship illegal moves.
  let best = legalIndices[0];
  for (const i of legalIndices) if (logits[i] > logits[best]) best = i;

  const uci = (moves as string[])[best];
  // The board was mirrored for the model when Black was to move, so the answer
  // comes back in that frame and has to be turned around again.
  return mirrored ? mirrorUci(uci) : uci;
}
