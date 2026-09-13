import { NextResponse } from "next/server";
import {
  constantTimeEqual,
  createSiteLockToken,
  SITE_LOCK_COOKIE,
} from "../../../lib/siteLock";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.SITE_LOCK_ENABLED !== "true") {
    return NextResponse.json({ ok: true, lockDisabled: true });
  }

  const configuredPassword = process.env.SITE_LOCK_PASSWORD || "";
  const secret = process.env.SITE_LOCK_SECRET || "";

  if (!configuredPassword || !secret) {
    return NextResponse.json(
      { error: "Site lock environment variables are incomplete." },
      { status: 503 },
    );
  }

  let submittedPassword = "";
  try {
    const body = await request.json();
    submittedPassword =
      typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!submittedPassword) {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }

  const [submittedToken, expectedToken] = await Promise.all([
    createSiteLockToken(submittedPassword, secret),
    createSiteLockToken(configuredPassword, secret),
  ]);

  if (!constantTimeEqual(submittedToken, expectedToken)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SITE_LOCK_COOKIE,
    value: expectedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
