import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../lib/local-store";

export async function GET(request: Request) {
  const store = await readStore();
  const user = getSessionUser(request, store);
  return NextResponse.json({ posts: store.posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), user: user ? { id: user.id, name: user.name } : null });
}

export async function POST(request: Request) {
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Войдите, чтобы публиковать" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Пост не может быть пустым" }, { status: 400 });
  const post = { id: randomUUID(), authorId: user.id, authorName: user.name, text, likes: 0, likedBy: [], comments: [], createdAt: new Date().toISOString() };
  store.posts.push(post);
  await writeStore(store);
  return NextResponse.json({ post }, { status: 201 });
}
