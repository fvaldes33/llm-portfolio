import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  dbInstance ??= drizzle(process.env.DATABASE_URL, { schema });
  return dbInstance;
}

export async function pingDb() {
  return getDb().execute("select 1");
}
