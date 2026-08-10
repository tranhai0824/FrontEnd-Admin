import { NextRequest, NextResponse } from "next/server";
import { backendJson, forward, setRefreshCookie } from "../_shared";

export async function POST(request: NextRequest) {
  const response = await backendJson("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(await request.json()),
  });
  if (!response.ok) return forward(response);

  const result = await response.json() as { access_token: string; refresh_token: string; user: unknown };
  const outgoing = NextResponse.json({ access_token: result.access_token, user: result.user });
  setRefreshCookie(outgoing, result.refresh_token);
  return outgoing;
}
