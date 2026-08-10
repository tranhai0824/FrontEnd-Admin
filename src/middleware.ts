import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // UX redirect only. This opaque cookie is not validated here. Every
  // protected operation must still be authenticated and authorized by the API.
  if (!request.cookies.get("topscholar_refresh")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
