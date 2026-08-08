import { NextResponse } from "next/server";
import { clearSupabaseSession, supabaseEnabled } from "../../../../lib/supabase";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  if (supabaseEnabled) { clearSupabaseSession(response); return response; }
  response.cookies.set("ludoguard_session", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
