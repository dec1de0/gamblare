import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../lib/local-store";
import { getSupabaseUser, supabaseEnabled, supabaseForRequest } from "../../../lib/supabase";

export async function GET(request: Request) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    const { client } = supabaseForRequest(request);
    const { data, error } = await client.from("emergency_contacts").select("id, name, phone, created_at").order("created_at");
    if (error) return NextResponse.json({ error: "Не удалось загрузить контакты" }, { status: 500 });
    return NextResponse.json({ contacts: (data ?? []).map((item) => ({ id: item.id, name: item.name, phone: item.phone, createdAt: item.created_at })) });
  }
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  const contacts = (store.emergencyContacts ?? []).filter((contact) => contact.userId === user.id).map((contact) => ({ id: contact.id, name: contact.name, phone: contact.phone, createdAt: contact.createdAt }));
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    const body = await request.json().catch(() => ({})); const name = String(body.name ?? "").trim(); const phone = String(body.phone ?? "").trim();
    if (!name || !phone) return NextResponse.json({ error: "Укажи имя и номер телефона" }, { status: 400 });
    const { client } = supabaseForRequest(request);
    const { count } = await client.from("emergency_contacts").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= 3) return NextResponse.json({ error: "Можно добавить максимум 3 контакта" }, { status: 400 });
    const { data, error } = await client.from("emergency_contacts").insert({ user_id: user.id, name, phone }).select("id, name, phone, created_at").single();
    if (error || !data) return NextResponse.json({ error: "Не удалось сохранить контакт" }, { status: 500 });
    return NextResponse.json({ contact: { id: data.id, name: data.name, phone: data.phone, createdAt: data.created_at } }, { status: 201 });
  }
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
  return NextResponse.json({ contact: { id: contact.id, name: contact.name, phone: contact.phone, createdAt: contact.createdAt } }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    const id = String((await request.json().catch(() => ({}))).id ?? "");
    const { client } = supabaseForRequest(request);
    const { error } = await client.from("emergency_contacts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Не удалось удалить контакт" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
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
