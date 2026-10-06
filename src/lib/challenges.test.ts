import { describe, expect, it } from "vitest";
import { incomingInvitations, type Challenge } from "./challenges";

const challenge = (over: Partial<Challenge>): Challenge => ({
  challengeId: "c1",
  direction: "in",
  opponentName: "Uri",
  status: "Pending",
  rated: false,
  clockLimit: 600,
  clockIncrement: 5,
  createdAt: "2026-10-06T09:00:00Z",
  bothCanPlayRated: false,
  ...over,
});

describe("the invitations a pupil has to answer", () => {
  it("are the pending ones sent to them", () => {
    const list = [
      challenge({ challengeId: "a" }),
      challenge({ challengeId: "b", direction: "out" }),
      challenge({ challengeId: "c", status: "Accepted", gameRoomId: "room1" }),
      challenge({ challengeId: "d", status: "Declined" }),
      challenge({ challengeId: "e", status: "Cancelled" }),
      challenge({ challengeId: "f" }),
    ];
    expect(incomingInvitations(list).map((c) => c.challengeId)).toEqual(["a", "f"]);
  });

  it("are none when nobody has asked", () => {
    expect(incomingInvitations([])).toEqual([]);
    expect(incomingInvitations([challenge({ direction: "out" })])).toEqual([]);
  });
});
