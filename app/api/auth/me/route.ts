import { NextResponse } from "next/server";
import { getSessionUser, publicUser, readStore } from "../../../../lib/local-store";
import { getSupabaseUser, supabaseEnabled } from "../../../../lib/supabase";

export async function GET(request: Request) {
  if (supabaseEnabled) return NextResponse.json({ user: await getSupabaseUser(request) });
  const user = getSessionUser(request, await readStore());
  return NextResponse.json({ user: user ? publicUser(user) : null });
}
