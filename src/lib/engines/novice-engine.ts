/* The novice opponent: a 25.7M character-level GPT the academy trained from
   random weights on a million games between 800-1200 rated players.

   It does not know the rules. It reads the game as literal text —
   ";1.e4 e5 2.Nf3" — and predicts the next character, which is legal about 94%
   of the time. The other 6% are retried here, because a model that proposes an
   illegal move is not resigning. It plays around 520 Elo, which is the point:
   it is the beginner's opponent, and a stronger one would be a worse one.

   The forward pass runs in the WebView (Hermes has no WASM); everything else —
   tokenising, sampling, refereeing with chess.js — runs here. There is no KV
   cache in the graph, so each sampled character re-runs the sequence. */

import { Chess } from "chess.js";
import type { OnnxHandle } from "@/components/game/OnnxWebView";
import vocab from "./data/novice-vocab.json";
import { promptFrom } from "./pgn-prompt";

/** Low, so we get its best guess rather than creative writing. Matches the
    temperature jtrax-ai/step3_probe.py measures the legal-move rate at, so the
    figure quoted for this model is the one it actually plays at. */
const TEMPERATURE = 0.5;
/** No legal SAN move is longer than this, including "exd8=Q#". */
const MAX_MOVE_CHARS = 8;
/** Retries before giving up. Six in a row is vanishingly rare at 0.97 first-try
    legality. */
const MAX_RETRIES = 6;

const ITOS: string[] = vocab.itos;
const BLOCK_SIZE: number = vocab.block_size;
const STOI = new Map(ITOS.map((c, i) => [c, i]));

function sample(logits: number[], temperature: number): number {
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  // Subtract the max before exponentiating, or a large logit overflows to
  // Infinity and every probability becomes NaN.
  const weights = logits.map((v) => Math.exp((v - max) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** Samples characters until the move ends, and returns it as SAN. */
async function nextMoveSan(onnx: OnnxHandle, prompt: string): Promise<string> {
  // Characters outside the 32-symbol vocabulary cannot be represented, so they
  // are dropped rather than mapped to something arbitrary.
  let tokens = [...prompt]
    .map((c) => STOI.get(c))
    .filter((i): i is number => i !== undefined);

  let san = "";
  for (let i = 0; i < MAX_MOVE_CHARS; i += 1) {
    const window = tokens.slice(-BLOCK_SIZE);
    const out = await onnx.run("novice", {
      tokens: { data: window, dims: [1, window.length], type: "int64" },
    });
    const logits = out.logits?.data;
    if (!logits) throw new Error("novice model returned no logits");
    const next = sample(logits, TEMPERATURE);
    const ch = ITOS[next];
    if (ch === " ") break;
    san += ch;
    tokens = [...tokens, next];
  }
  return san;
}

/** The move the novice plays, as UCI, or "" if it could not find a legal one
    after several tries — scored as a loss, the honest outcome. */
export async function bestMove(
  onnx: OnnxHandle,
  sanHistory: string[],
): Promise<string> {
  const prompt = promptFrom(sanHistory);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const san = await nextMoveSan(onnx, prompt);
    if (!san) continue;
    // chess.js is the referee, not the model: it decides whether the proposed
    // text is a move that exists in this position.
    const board = new Chess();
    for (const past of sanHistory) board.move(past);
    try {
      const move = board.move(san);
      return move.from + move.to + (move.promotion ?? "");
    } catch {
      continue; // illegal or unparseable; ask again
    }
  }
  return "";
}
