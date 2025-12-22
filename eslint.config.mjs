import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"), // Included if using TS, safe if JS
  {
    rules: {
      // Re-applying user's specific rules from .eslintrc.js
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "import/no-named-as-default-member": "off",
      "import/export": "off",
      "import/no-duplicates": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "react/display-name": "off",
      "react/no-children-prop": "off",
    },
  },
];

export default eslintConfig;
