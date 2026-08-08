import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createPassword } from "../../../../lib/password";
import { publicUser, readStore, writeStore } from "../../../../lib/local-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!name || !email || password.length < 4) return NextResponse.json({ error: "Введите имя, email и пароль от 4 символов" }, { status: 400 });
  const store = await readStore();
  if (store.users.some((user) => user.email === email)) return NextResponse.json({ error: "Такой email уже зарегистрирован" }, { status: 409 });
  const user = { id: randomUUID(), name, email, ...createPassword(password), createdAt: new Date().toISOString() };
  store.users.push(user);
  await writeStore(store);
  const response = NextResponse.json({ user: publicUser(user) });
  response.cookies.set("ludoguard_session", user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
