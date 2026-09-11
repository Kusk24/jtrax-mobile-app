/**
 * `expo-constants` under the test runner.
 *
 * The real module reaches into `react-native`, whose source is still Flow —
 * unparseable by anything but Metro, so importing it fails the whole file
 * rather than the one line that wanted it. `src/lib/api.ts` uses exactly one
 * field of it, to find the API base when no `EXPO_PUBLIC_API_URL` is set, and
 * a test that hits a real host is a test that fails on a train.
 */
export default { expoConfig: { extra: {} } };
