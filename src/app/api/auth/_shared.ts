import { NextResponse } from "next/server";

export const REFRESH_COOKIE = "topscholar_refresh";
const PRODUCTION_ADMIN_API_URL = "https://backendforadmin.vercel.app";

export function backendUrl(path: string) {
  const baseUrl = process.env.ADMIN_API_URL
    ?? process.env.NEXT_PUBLIC_ADMIN_API_URL
    ?? (process.env.NODE_ENV === "production"
      ? PRODUCTION_ADMIN_API_URL
      : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function backendJson(path: string, init: RequestInit) {
  return fetch(backendUrl(path), {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

export async function forward(response: Response) {
  const body = await response.text();
  return new NextResponse(body || null, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

export function setRefreshCookie(response: NextResponse, token: string) {
  response.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
