import { describe, expect, it } from "vitest";
import { miniBoardSvg } from "./mini-board";
import { pieceArt } from "./piece-art";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/* The white king's drawing, as it sits inside a square. */
const whiteKing = pieceArt("w", "k").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

describe("a puzzle's thumbnail", () => {
  it("draws all sixty-four squares and every piece, in one drawing", () => {
    const svg = miniBoardSvg(START)!;
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.match(/<rect /g)).toHaveLength(64);
    expect(svg.match(/<g transform=/g)).toHaveLength(32);
    // No nested <svg>: each piece's own wrapper is taken off.
    expect(svg.match(/<svg/g)).toHaveLength(1);
  });

  it("puts White's king on e1, bottom of the board, for a pupil playing White", () => {
    expect(miniBoardSvg(START)).toContain(`<g transform="translate(180 315)">${whiteKing}</g>`);
  });

  it("turns the board round for a pupil playing Black", () => {
    expect(miniBoardSvg(START, true)).toContain(`<g transform="translate(135 0)">${whiteKing}</g>`);
  });

  it("is null for a position it cannot read, so the row shows an empty tile", () => {
    expect(miniBoardSvg("not a fen")).toBeNull();
  });
});
