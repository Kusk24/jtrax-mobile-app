/**
 * A puzzle's position as one small drawing, for the Puzzles list — each row
 * shows the puzzle's own board, as the web's MiniBoard does, rather than a
 * stock picture.
 *
 * One SVG per thumbnail, not a view per square: twenty rows of sixty-four
 * views and their piece drawings is a list that stutters on a cheap phone.
 * Plain TypeScript, so what it draws can be tested.
 */
import { toGrid } from "./chess-core";
import { pieceArt } from "./piece-art";
import { gameAt } from "./puzzles";

/** The board's own blues (ChessBoard's LIGHT and DARK), so the thumbnail
    looks like the board it opens. */
const LIGHT = "#eef3fa";
const DARK = "#a3b6d2";
/** The piece artwork's canvas — one square of the drawing. */
const SQ = 45;

/** A piece drawing without its own <svg> wrapper, to sit in one square. */
function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

/** The position as SVG, turned round for a pupil playing Black — or null
    when the FEN cannot be read, and the row shows an empty tile instead. */
export function miniBoardSvg(fen: string, flipped = false): string | null {
  const game = gameAt(fen);
  if (!game) return null;
  const grid = toGrid(game);
  const squares: string[] = [];
  const pieces: string[] = [];
  for (let vr = 0; vr < 8; vr++) {
    for (let vc = 0; vc < 8; vc++) {
      const x = vc * SQ;
      const y = vr * SQ;
      squares.push(`<rect x="${x}" y="${y}" width="${SQ}" height="${SQ}" fill="${(vr + vc) % 2 ? DARK : LIGHT}"/>`);
      const piece = flipped ? grid[7 - vr][7 - vc] : grid[vr][vc];
      if (piece) pieces.push(`<g transform="translate(${x} ${y})">${inner(pieceArt(piece.color, piece.type))}</g>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SQ * 8} ${SQ * 8}">${squares.join("")}${pieces.join("")}</svg>`;
}
