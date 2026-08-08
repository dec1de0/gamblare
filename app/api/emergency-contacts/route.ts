import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../lib/local-store";

export async function GET(request: Request) {
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const contacts = (store.emergencyContacts ?? []).filter((contact) => contact.userId === user.id).map(({ userId, ...contact }) => contact);
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const current = (store.emergencyContacts ?? []).filter((contact) => contact.userId === user.id);
  if (!name || !phone) return NextResponse.json({ error: "Укажи имя и номер телефона" }, { status: 400 });
  if (current.length >= 3) return NextResponse.json({ error: "Можно добавить максимум 3 контакта" }, { status: 400 });
  const contact = { id: `contact-${Date.now()}`, userId: user.id, name, phone, createdAt: new Date().toISOString() };
  store.emergencyContacts = [...(store.emergencyContacts ?? []), contact];
  await writeStore(store);
  const { userId, ...publicContact } = contact;
  return NextResponse.json({ contact: publicContact }, { status: 201 });
}

export async function DELETE(request: Request) {
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const before = store.emergencyContacts ?? [];
  store.emergencyContacts = before.filter((contact) => !(contact.id === id && contact.userId === user.id));
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
