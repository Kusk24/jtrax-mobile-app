/* A tab press for a portal's bar — see lib/tab-navigation.ts for what it does
   to the stack and why. The bar is drawn by the portal's layout, beside the
   stack rather than inside it, so the navigation here is the layout's own
   route in the app's root stack; the portal's stack is that route's state,
   and the action is aimed at it by key. */
import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";
import { tabAction, type StackState } from "@/lib/tab-navigation";

export function useTabPress(base: string): (href: string) => void {
  const navigation = useNavigation();
  const router = useRouter();
  return useCallback(
    (href: string) => {
      const root = navigation.getState();
      const portal = root?.routes[root.index ?? 0]?.state as StackState | undefined;
      /* No stack state yet — the portal has not finished mounting. A replace
         still lands on the tab, just without the reset. */
      if (!portal?.key) {
        router.replace(href as never);
        return;
      }
      const action = tabAction(portal, base, href);
      if (action) navigation.dispatch(action);
    },
    [navigation, router, base],
  );
}
