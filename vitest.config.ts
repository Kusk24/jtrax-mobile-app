/// <reference types="vitest" />
/**
 * A runner for the parts of the phone app that are plain TypeScript.
 *
 * Deliberately narrow: `src/lib` and the message catalogues, no React Native
 * transform. Rendering a NativeWind screen under jsdom needs a preset, a mock
 * for every native module and a react-test-renderer — a stack worth adding
 * when there is a component worth testing, not before. What is here is what
 * can be checked without any of it, which includes every rule the portal and
 * the phone have to agree on.
 */
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "expo-constants": path.resolve(__dirname, "test/stubs/expo-constants.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
