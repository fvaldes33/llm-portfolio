import { resetConversationMessages } from "~/server/chat/persistence";
import { checkRateLimit, getRequestIp } from "~/server/chat/rate-limit";
import { getSession } from "~/server/session";
import type { Route } from "./+types/api.chat.reset";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ip = getRequestIp(request);
  const userAgent = request.headers.get("user-agent");
  if (!(await checkRateLimit({ ip, route: "/api/chat/reset", userAgent }))) {
    return new Response("Slow down a bit.", { status: 429 });
  }

  const session = await getSession(request.headers.get("Cookie"));
  await resetConversationMessages(session.get("conversationId"));

  return Response.json({ ok: true });
}
