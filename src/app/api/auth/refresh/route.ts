import { NextRequest, NextResponse } from "next/server";
import { backendJson, forward, REFRESH_COOKIE, setRefreshCookie } from "../_shared";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn." }, { status: 401 });

  const response = await backendJson("/api/v1/auth/token/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    const outgoing = await forward(response);
    outgoing.cookies.delete(REFRESH_COOKIE);
    return outgoing;
  }

  const result = await response.json() as { access_token: string; refresh_token: string; user: unknown };
  const outgoing = NextResponse.json({ access_token: result.access_token, user: result.user });
  setRefreshCookie(outgoing, result.refresh_token);
  return outgoing;
}
