/**
 * Regenerates src/assets/stockfish/engine-glue.ts from the upstream loader.
 *
 * Run after replacing stockfish-18-lite-single.js with a newer build:
 *   pnpm exec node scripts/build-stockfish-glue.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "src/assets/stockfish/stockfish-18-lite-single.js";
const OUT = "src/assets/stockfish/engine-glue.ts";

const glue = readFileSync(SRC, "utf8");
if (glue.includes("</script")) {
  throw new Error(`${SRC} contains "</script" and cannot be inlined verbatim`);
}
writeFileSync(
  OUT,
  `/* GENERATED — do not edit. See scripts/build-stockfish-glue.mjs. */\nexport const STOCKFISH_GLUE = ${JSON.stringify(glue)};\n`,
);
console.log(`wrote ${OUT} (${(glue.length / 1024).toFixed(0)}KB)`);
