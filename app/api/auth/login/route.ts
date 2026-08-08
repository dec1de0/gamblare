import { NextResponse } from "next/server";
import { checkPassword } from "../../../../lib/password";
import { publicUser, readStore } from "../../../../lib/local-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const store = await readStore();
  const user = store.users.find((item) => item.email === email);
  if (!user || !checkPassword(password, user.salt, user.passwordHash)) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  const response = NextResponse.json({ user: publicUser(user) });
  response.cookies.set("ludoguard_session", user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
