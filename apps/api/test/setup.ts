import { config as loadEnv } from "dotenv";
import path from "path";

// Tests reuse the same local Postgres as development (see docs/deployment.md's
// note that a dedicated test database is a reasonable follow-up improvement,
// not implemented here to keep local test setup to zero extra configuration).
loadEnv({ path: path.resolve(__dirname, "../../../.env") });
