import { NextRequest, NextResponse } from "next/server";
import { createSiteLockToken, SITE_LOCK_COOKIE } from "./lib/siteLock";

const PUBLIC_PATHS = new Set([
  "/locked",
  "/api/unlock",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/_next/");
}

export async function middleware(request: NextRequest) {
  if (process.env.SITE_LOCK_ENABLED !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const password = process.env.SITE_LOCK_PASSWORD || "";
  const secret = process.env.SITE_LOCK_SECRET || "";

  if (!password || !secret) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Mutsu Studio is sealed and the site lock is not configured." },
        { status: 503 },
      );
    }

    const lockedUrl = request.nextUrl.clone();
    lockedUrl.pathname = "/locked";
    lockedUrl.search = "";
    return NextResponse.redirect(lockedUrl);
  }

  const expectedToken = await createSiteLockToken(password, secret);
  const cookieToken = request.cookies.get(SITE_LOCK_COOKIE)?.value;

  if (cookieToken === expectedToken) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Mutsu Studio is sealed." }, { status: 401 });
  }

  const lockedUrl = request.nextUrl.clone();
  lockedUrl.pathname = "/locked";
  lockedUrl.search = "";
  return NextResponse.redirect(lockedUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
