/**
 * A phone photo of an ID card, made small enough to upload before it is read.
 * The phone's version of jtrax-web-app's lib/shrink-image.ts.
 *
 * A camera's photo is around 4000 px across and several megabytes, larger
 * than the web server in front of the API accepts by default (nginx: 1 MB),
 * so the scan failed before it reached the reader. Scaled to 1600 px on its
 * longest side and saved as a JPEG it is a few hundred kilobytes and still
 * sharp enough to read. Anything that goes wrong hands back the original.
 */
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { PickedImage } from "./registration";

/** The longest side a photo is sent at. */
export const MAX_SIDE = 1600;

/** The size that fits within max on its longest side, keeping the shape.
    Never enlarges. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** The photo as a JPEG no larger than MAX_SIDE, or the original when it
    already fits or cannot be redrawn. */
export async function shrinkPhoto(photo: PickedImage & { width?: number; height?: number }): Promise<PickedImage> {
  const { width = 0, height = 0 } = photo;
  if (!width || !height || Math.max(width, height) <= MAX_SIDE) return photo;
  try {
    const size = fitWithin(width, height);
    const rendered = await ImageManipulator.manipulate(photo.uri).resize(size).renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
    return {
      uri: saved.uri,
      mimeType: "image/jpeg",
      fileName: (photo.fileName || "id-card").replace(/\.[^.]*$/, "") + ".jpg",
    };
  } catch {
    return photo;
  }
}
