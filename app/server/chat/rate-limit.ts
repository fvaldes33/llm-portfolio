import { and, count, gte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "~/server/db";
import { ipRateLimitHits } from "~/server/db/schema";

const WINDOW_MS = 60_000;
const MAX_HITS = 12;

const fallbackBuckets = new Map<
  string,
  { tokens: number; updatedAt: number }
>();
const FALLBACK_RATE_LIMIT = { capacity: 12, refillPerSec: 0.1 };

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex");
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkRateLimit({
  ip,
  route,
  userAgent,
}: {
  ip: string;
  route: string;
  userAgent?: string | null;
}) {
  const ipHash = hashIp(ip);

  if (!db) {
    return fallbackRateLimit(ipHash);
  }
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const [{ value }] = await db
    .select({ value: count() })
    .from(ipRateLimitHits)
    .where(
      and(
        sql`${ipRateLimitHits.ipHash} = ${ipHash}`,
        sql`${ipRateLimitHits.route} = ${route}`,
        gte(ipRateLimitHits.createdAt, since),
      ),
    );

  if (value >= MAX_HITS) {
    return false;
  }

  await db.insert(ipRateLimitHits).values({ ipHash, route, userAgent });
  return true;
}

function fallbackRateLimit(ipHash: string) {
  const now = Date.now();
  const bucket = fallbackBuckets.get(ipHash) ?? {
    tokens: FALLBACK_RATE_LIMIT.capacity,
    updatedAt: now,
  };
  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(
    FALLBACK_RATE_LIMIT.capacity,
    bucket.tokens + elapsed * FALLBACK_RATE_LIMIT.refillPerSec,
  );
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    fallbackBuckets.set(ipHash, bucket);
    return false;
  }
  bucket.tokens -= 1;
  fallbackBuckets.set(ipHash, bucket);
  return true;
}
