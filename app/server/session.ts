import { createCookieSessionStorage } from "react-router";

type SessionData = {
  conversationId: string;
};

type SessionFlashData = Record<string, never>;

const sessionSecret =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-session-secret");

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required in production");
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__franco_session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { commitSession, destroySession, getSession };
