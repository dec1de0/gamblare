import { NextResponse } from "next/server";
import { getSupabaseUser, supabaseEnabled, supabaseForRequest } from "../../../../lib/supabase";

export async function GET(request: Request) {
  if (!supabaseEnabled) return NextResponse.json({ messages: [] });
  const user = await getSupabaseUser(request);
  if (!user) return NextResponse.json({ messages: [] });
  const { client } = supabaseForRequest(request);
  const { data, error } = await client.from("chat_messages").select("role, content, created_at").order("created_at", { ascending: false }).limit(40);
  if (error) return NextResponse.json({ error: "Не удалось загрузить историю" }, { status: 500 });
  return NextResponse.json({ messages: (data ?? []).reverse().map((item) => ({ role: item.role, content: item.content })) });
}
