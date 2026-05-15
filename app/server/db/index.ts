import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db: NeonHttpDatabase<typeof schema> | null = process.env
  .DATABASE_URL
  ? drizzle(process.env.DATABASE_URL, { schema })
  : null;

export async function pingDb() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  return db.execute("select 1");
}
