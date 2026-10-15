/**
 * The API address as configured, with a trailing slash or without.
 *
 * `https://api…/` built `//api/v1/…`; the server answers that with a redirect,
 * and iOS sends the redirected request without the Authorization header — so
 * a signed-in pupil's puzzles came back 401.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function urlFetchedWith(configured: string): Promise<string> {
  vi.stubEnv("EXPO_PUBLIC_API_URL", configured);
  const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  const { api } = await import("./api");
  await api.get("puzzles/list");
  return fetch.mock.calls[0][0] as string;
}

describe("the API address", () => {
  it("drops a trailing slash, so a path never starts with //", async () => {
    expect(await urlFetchedWith("https://api.example.test/")).toBe("https://api.example.test/api/v1/puzzles/list");
  });

  it("leaves an address without one as it is", async () => {
    expect(await urlFetchedWith("https://api.example.test")).toBe("https://api.example.test/api/v1/puzzles/list");
  });
});
