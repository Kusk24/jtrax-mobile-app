/* Challenge used to be its own tab. It now lives inside Games, with every
   other way of playing someone — this address stays so older links and
   notifications still land in the right place. */
import { Redirect } from "expo-router";

export default function ChallengeScreen() {
  return <Redirect href="/student/play?open=challenge" />;
}
