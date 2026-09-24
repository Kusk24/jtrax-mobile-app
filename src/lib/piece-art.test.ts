/**
 * Every piece has to scale to the box it is drawn in: the board draws them at
 * a square's size and the captured tray at 17px, and neither is the artwork's
 * own 45×45.
 */
import { describe, expect, it } from "vitest";
import { pieceArt } from "./piece-art";

describe("piece artwork", () => {
  it("gives every piece a viewBox, so it scales instead of cropping", () => {
    for (const colour of ["w", "b"]) {
      for (const type of ["k", "q", "r", "b", "n", "p"]) {
        const svg = pieceArt(colour, type);
        expect(svg, `${colour}${type}`).toMatch(/<svg viewBox="0 0 45 45"/);
        expect(svg.match(/viewBox/g)?.length, `${colour}${type}`).toBe(1);
      }
    }
  });
});
