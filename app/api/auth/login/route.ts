import { NextResponse } from "next/server";
import { checkPassword } from "../../../../lib/password";
import { publicUser, readStore } from "../../../../lib/local-store";
import { setSupabaseSession, supabase, supabaseEnabled } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (supabaseEnabled) {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    const response = NextResponse.json({ user: { id: data.user.id, name: String(data.user.user_metadata?.name ?? email.split("@")[0]), email } });
    setSupabaseSession(response, data.session.access_token);
    return response;
  }
  const store = await readStore();
  const user = store.users.find((item) => item.email === email);
  if (!user || !checkPassword(password, user.salt, user.passwordHash)) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  const response = NextResponse.json({ user: publicUser(user) });
  response.cookies.set("ludoguard_session", user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
