import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../../../lib/local-store";
import { getSupabaseUser, supabaseEnabled, supabaseForRequest } from "../../../../../lib/supabase";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    if (!user) return NextResponse.json({ error: "Войдите, чтобы поставить лайк" }, { status: 401 });
    const { id } = await context.params; const { client } = supabaseForRequest(request);
    const existing = await client.from("community_likes").select("post_id").eq("post_id", id).maybeSingle();
    const change = existing.data ? await client.from("community_likes").delete().eq("post_id", id) : await client.from("community_likes").insert({ post_id: id, user_id: user.id });
    if (change.error) return NextResponse.json({ error: "Не удалось обновить лайк" }, { status: 500 });
    const post = await client.from("community_posts").select("likes_count").eq("id", id).single();
    return NextResponse.json({ likes: post.data?.likes_count ?? 0, liked: !existing.data });
  }
  const store = await readStore();
  const user = getSessionUser(request, store);
  if (!user) return NextResponse.json({ error: "Войдите, чтобы поставить лайк" }, { status: 401 });
  const { id } = await context.params;
  const post = store.posts.find((item) => item.id === id);
  if (!post) return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  const index = post.likedBy.indexOf(user.id);
  if (index >= 0) { post.likedBy.splice(index, 1); post.likes -= 1; } else { post.likedBy.push(user.id); post.likes += 1; }
  await writeStore(store);
  return NextResponse.json({ likes: post.likes, liked: index < 0 });
}
