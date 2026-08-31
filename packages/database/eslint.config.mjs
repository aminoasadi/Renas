import { base } from "../../eslint.config.base.mjs";

export default [
  ...base,
  { ignores: ["prisma/seed.js", "prisma/seed.d.ts"] },
];
