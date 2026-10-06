/**
 * Intl.PluralRules for the phone.
 *
 * Hermes — the JavaScript engine the app runs on, on iPhone and Android — has
 * no Intl.PluralRules, and use-intl needs it for every `{n, plural, …}`
 * message. Without it such a string fails to format and the screen shows
 * nothing useful. The web build never showed this: browsers have it.
 *
 * `polyfill` installs it only where it is missing, with the rules for the two
 * languages the app speaks. Imported first by `i18n.tsx`, before anything is
 * formatted.
 */
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/th.js";
