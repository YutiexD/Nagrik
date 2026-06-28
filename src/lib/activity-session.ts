import { cookies } from "next/headers";

export const ACTIVITY_SESSION_COOKIE = "nagrik_activity_session";

export async function getActivitySessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ACTIVITY_SESSION_COOKIE)?.value;

  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  cookieStore.set(ACTIVITY_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return sessionId;
}
