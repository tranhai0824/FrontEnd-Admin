import { NextResponse } from "next/server";
import { REFRESH_COOKIE } from "../_shared";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
