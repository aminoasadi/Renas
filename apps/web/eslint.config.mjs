import { FlatCompat } from "@eslint/eslintrc";
import { base, ignores } from "../../eslint.config.base.mjs";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...base,
];
