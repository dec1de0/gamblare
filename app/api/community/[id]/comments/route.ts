import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../../../lib/local-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Войдите, чтобы комментировать" }, { status: 401 });
  const { id } = await context.params;
  const post = store.posts.find((item) => item.id === id);
  const text = String((await request.json().catch(() => ({}))).text ?? "").trim();
  if (!post) return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  if (!text) return NextResponse.json({ error: "Комментарий не может быть пустым" }, { status: 400 });
  const comment = { id: randomUUID(), authorName: user.name, text, createdAt: new Date().toISOString() };
  post.comments.push(comment);
  await writeStore(store);
  return NextResponse.json({ comment }, { status: 201 });
}
