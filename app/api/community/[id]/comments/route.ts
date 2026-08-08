import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../../../lib/local-store";
import { getSupabaseUser, supabaseEnabled, supabaseForRequest } from "../../../../../lib/supabase";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    if (!user) return NextResponse.json({ error: "Войдите, чтобы комментировать" }, { status: 401 });
    const { id } = await context.params; const text = String((await request.json().catch(() => ({}))).text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Комментарий не может быть пустым" }, { status: 400 });
    const { client } = supabaseForRequest(request);
    const { data, error } = await client.from("community_comments").insert({ post_id: id, user_id: user.id, content: text }).select("id, content, created_at").single();
    if (error || !data) return NextResponse.json({ error: "Не удалось добавить комментарий" }, { status: 500 });
    return NextResponse.json({ comment: { id: data.id, authorName: user.name, text: data.content, createdAt: data.created_at } }, { status: 201 });
  }
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
