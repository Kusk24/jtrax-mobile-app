/**
 * The rule that keeps a parent signed in through a tunnel.
 *
 * Before this, restoring a session cleared the stored token on *any* thrown
 * error. On a phone the commonest error by far is "no signal", so the app
 * silently signed people out and showed them the login screen — which reads
 * as an expired session, and retyping a password does not mend a network.
 */
import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { clearsSession } from "./session-recovery";

describe("a failed session check", () => {
  it("keeps the token when the server could not be reached", () => {
    // status 0 is what the client raises when fetch itself throws.
    expect(clearsSession(new ApiError(0, "offline"))).toBe(false);
  });

  it("clears it when the server rejected the token", () => {
    expect(clearsSession(new ApiError(401, "invalid session"))).toBe(true);
    expect(clearsSession(new ApiError(403, "forbidden"))).toBe(true);
  });

  it("clears it when the server answered with a fault", () => {
    // A token this app cannot verify is not one to keep on the device.
    expect(clearsSession(new ApiError(500, "boom"))).toBe(true);
  });

  it("clears it for anything that is not an ApiError at all", () => {
    expect(clearsSession(new TypeError("unexpected"))).toBe(true);
    expect(clearsSession("something odd")).toBe(true);
  });
});
