import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "hamrah_session";
const PUBLIC_PATHS = ["/login", "/track", "/api/auth/login", "/api/health"];
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/icons", "/images", "/fonts"];

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET || "hamrah-repair-default-secret-change-me";
  return new TextEncoder().encode(raw);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.includes(".") ||
    (pathname.startsWith("/api/devices/") && pathname.endsWith("/status"));

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, secret());
      ok = true;
    } catch {
      ok = false;
    }
  }

  if (!ok) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
