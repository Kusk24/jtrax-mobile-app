/**
 * Which tab a path belongs to, and whether that path *is* a tab.
 *
 * Two questions that look like one and are not. Highlighting wants "does this
 * screen live under that tab", which is a prefix match, so a board three
 * screens deep still lights Play up — correct, and what a pupil expects. The
 * bar wants "is this screen a tab", which prefix-matching always answers yes
 * to, and that is how a board ended up wearing a nav bar and a back arrow at
 * the same time.
 *
 * Kept out of `PortalNav.tsx` so it can be tested: anything importing
 * `react-native` or `lucide-react-native` drags in Flow source the test runner
 * cannot parse. The shape here is structural for the same reason — an icon is
 * not part of either question.
 */

export type TabPath = {
  href: string;
  /** Match this tab only on an exact path (used for the portal home tab). */
  exact?: boolean;
  /** Extra path prefixes that should also highlight this tab. */
  activeAliases?: string[];
};

export function isActive(pathname: string, tab: TabPath): boolean {
  if (tab.activeAliases?.some((alias) => pathname.startsWith(alias))) {
    return true;
  }
  return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
}

/** A tab root, or an alias standing in for one — never a screen pushed from
    either. Aliases count because a screen reached from a tab's own card is
    still that part of the app, not a place you descended into. */
export function isRoot(pathname: string, tabs: TabPath[]): boolean {
  return tabs.some(
    (tab) => pathname === tab.href || tab.activeAliases?.some((alias) => pathname === alias),
  );
}
