import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/utils/env";

import * as schema from "./schema";

const sql = neon(env.databaseUrl);
const db = drizzle({ client: sql, schema });

export default db;
