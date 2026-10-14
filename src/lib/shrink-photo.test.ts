import { describe, expect, it, vi } from "vitest";

/* The manipulator is native; here it stands in, recording what was asked. */
const resize = vi.fn();
vi.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: () => ({
      resize: (size: unknown) => {
        resize(size);
        return { renderAsync: async () => ({ saveAsync: async () => ({ uri: "file:///small.jpg", width: 1600, height: 1200 }) }) };
      },
    }),
  },
}));

const { MAX_SIDE, fitWithin, shrinkPhoto } = await import("./shrink-photo");

describe("fitWithin", () => {
  it("scales a phone photo down to the longest side, keeping its shape", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: MAX_SIDE, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: MAX_SIDE });
  });
  it("never enlarges", () => {
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
  });
});

describe("shrinkPhoto", () => {
  it("sends a camera photo as a 1600 px JPEG", async () => {
    const out = await shrinkPhoto({ uri: "file:///big.heic", width: 4032, height: 3024, fileName: "IMG_1.HEIC" });
    expect(resize).toHaveBeenCalledWith({ width: 1600, height: 1200 });
    expect(out).toEqual({ uri: "file:///small.jpg", mimeType: "image/jpeg", fileName: "IMG_1.jpg" });
  });
  it("sends a photo that already fits as it is", async () => {
    const small = { uri: "file:///card.jpg", width: 1200, height: 800 };
    expect(await shrinkPhoto(small)).toBe(small);
  });
});
