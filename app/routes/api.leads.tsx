import { z } from "zod";
import { db } from "~/server/db";
import { chatLeads } from "~/server/db/schema";
import { checkRateLimit, getRequestIp, hashIp } from "~/server/chat/rate-limit";
import { getSession } from "~/server/session";
import type { Route } from "./+types/api.leads";

const leadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.enum(["soft_prompt", "hard_cap"]),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ip = getRequestIp(request);
  const userAgent = request.headers.get("user-agent");
  if (!(await checkRateLimit({ ip, route: "/api/leads", userAgent }))) {
    return new Response("Slow down a bit.", { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!db) {
    return Response.json({ ok: true });
  }

  const session = await getSession(request.headers.get("Cookie"));
  const conversationId = session.get("conversationId") ?? null;

  await db.insert(chatLeads).values({
    email: parsed.data.email,
    source: parsed.data.source,
    ip,
    ipHash: hashIp(ip),
    userAgent,
    conversationId,
  });

  return Response.json({ ok: true });
}
