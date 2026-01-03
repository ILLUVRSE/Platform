import nextConfig from "eslint-config-next";

const [baseConfig, typescriptConfig, ignoreConfig] = nextConfig;

const customizedBase =
  baseConfig && typeof baseConfig === "object"
    ? {
        ...baseConfig,
        rules: {
          ...(baseConfig.rules ?? {}),
          "react-hooks/exhaustive-deps": "warn",
          "react-hooks/set-state-in-effect": "warn",
          "react-hooks/refs": "warn",
          "react-hooks/purity": "warn",
          "react/no-unescaped-entities": "warn",
          "@next/next/no-img-element": "off"
        }
      }
    : baseConfig;

export default [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/public/**"]
  },
  customizedBase,
  typescriptConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react/no-unescaped-entities": "warn"
    }
  },
  ignoreConfig
].filter(Boolean);
