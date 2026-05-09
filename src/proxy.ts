import { NextResponse, type NextRequest } from "next/server";

// Cheap presence check only. The (protected) layout calls Better Auth's
// getSession() to verify the cookie is valid. The proxy just bounces
// obviously-anonymous requests so we don't pay a DDB hit.

const SESSION_COOKIE_PREFIXES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

const hasSessionCookie = (request: NextRequest): boolean => {
  for (const cookie of request.cookies.getAll()) {
    for (const prefix of SESSION_COOKIE_PREFIXES) {
      if (cookie.name === prefix || cookie.name.startsWith(`${prefix}.`)) {
        return true;
      }
    }
  }
  return false;
};

export function proxy(request: NextRequest) {
  if (!hasSessionCookie(request)) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
