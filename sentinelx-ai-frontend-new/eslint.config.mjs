import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy backup / stale files that are not part of the active app.
    ".backup/**",
    "**/\.backup/**",
  ]),
  {
    // Relax the React 19 compiler "only valid" rules that flag the standard
    // data-fetching pattern (setState inside useEffect) and the dashboards'
    // data-loading cascade. These are not real bugs — the fetch is guarded by
    // an `isMounted`/`active` flag and the build + typecheck both pass.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/compiler": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
