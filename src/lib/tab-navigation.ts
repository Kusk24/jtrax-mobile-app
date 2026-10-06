/**
 * What a tab press does to a portal's stack.
 *
 * Each portal is one stack with a bar drawn over it, so a tab pressed as a
 * link was a push: the tab slid in like a page opened from a card, and the
 * back swipe returned to the previous tab — a place the pupil or parent had
 * not come from (see the vault's `a-tab-is-not-somewhere-you-came-from`).
 * A tab press now resets the stack to that tab's own screen, which the layout
 * cross-fades in; screens opened from inside a tab still slide. Pressing the
 * tab a stack already rests on pops back to it instead, keeping its scroll
 * and filters, as an iOS tab bar does.
 *
 * Kept apart from the bar components so it can be tested without React
 * Native — see `portal-tabs.ts` for why that matters here.
 */

/** The part of a stack's navigation state this needs. */
export type StackState = {
  key: string;
  routeNames: string[];
  routes: { name: string }[];
  index: number;
};

export type TabAction =
  | {
      type: "RESET";
      payload: { index: 0; routes: { name: string }[] };
      /** The portal's stack, so the action cannot reach the app's root stack. */
      target: string;
    }
  | { type: "POP_TO_TOP"; target: string };

/** The stack's route name for a tab: "/parent/profile" under "/parent" is
    "profile" or "profile/index", whichever the folder made it. */
export function tabRouteName(href: string, base: string, routeNames: string[]): string | undefined {
  if (href !== base && !href.startsWith(`${base}/`)) return undefined;
  const rest = href.slice(base.length).replace(/^\/|\/$/g, "");
  const candidates = rest === "" ? ["index"] : [rest, `${rest}/index`];
  return candidates.find((name) => routeNames.includes(name));
}

/** What leaves `href`'s tab alone on the stack: a pop back to it when it is
    already the stack's first screen, otherwise a reset to it. Null when that
    is already where things stand (a second tap on the open tab does nothing)
    or the tab is not one of this stack's screens. */
export function tabAction(stack: StackState, base: string, href: string): TabAction | null {
  const name = tabRouteName(href, base, stack.routeNames);
  if (!name) return null;
  if (stack.routes[0]?.name === name) {
    return stack.routes.length > 1 ? { type: "POP_TO_TOP", target: stack.key } : null;
  }
  return { type: "RESET", payload: { index: 0, routes: [{ name }] }, target: stack.key };
}

/** How a tab's own screen arrives: a short cross-fade in place, not a slide,
    and nothing to swipe back to. Screens pushed from a tab keep the default. */
export const TAB_SCREEN_OPTIONS = {
  animation: "fade",
  animationDuration: 200,
  animationTypeForReplace: "push",
  gestureEnabled: false,
} as const;
