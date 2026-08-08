import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../lib/local-store";
import { getSupabaseUser, supabaseEnabled, supabaseForRequest } from "../../../lib/supabase";

type CommunityCommentRow = { id: string; content: string; created_at: string; profiles: { name: string } | null };
type CommunityPostRow = { id: string; user_id: string; content: string; likes_count: number; created_at: string; profiles: { name: string } | null; community_comments: CommunityCommentRow[] | null };

export async function GET(request: Request) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    const { client } = supabaseForRequest(request);
    const { data, error } = await client.from("community_posts").select("id, content, likes_count, created_at, user_id, profiles(name), community_comments(id, content, created_at, profiles(name))").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Не удалось загрузить сообщество" }, { status: 500 });
    let liked = new Set<string>();
    if (user) { const ownLikes = await client.from("community_likes").select("post_id"); liked = new Set((ownLikes.data ?? []).map((item) => item.post_id)); }
    const posts = ((data ?? []) as unknown as CommunityPostRow[]).map((post) => ({ id: post.id, authorId: post.user_id, authorName: post.profiles?.name ?? "Участник", text: post.content, likes: post.likes_count, liked: liked.has(post.id), likedBy: [], createdAt: post.created_at, comments: (post.community_comments ?? []).map((comment) => ({ id: comment.id, authorName: comment.profiles?.name ?? "Участник", text: comment.content, createdAt: comment.created_at })) }));
    return NextResponse.json({ posts, user });
  }
  const store = await readStore();
  const user = getSessionUser(request, store);
  return NextResponse.json({ posts: store.posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), user: user ? { id: user.id, name: user.name } : null });
}

export async function POST(request: Request) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    if (!user) return NextResponse.json({ error: "Войдите, чтобы публиковать" }, { status: 401 });
    const text = String((await request.json().catch(() => ({}))).text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Пост не может быть пустым" }, { status: 400 });
    const { client } = supabaseForRequest(request);
    const { data, error } = await client.from("community_posts").insert({ user_id: user.id, content: text }).select("id, content, likes_count, created_at").single();
    if (error || !data) return NextResponse.json({ error: "Не удалось опубликовать пост" }, { status: 500 });
    return NextResponse.json({ post: { id: data.id, authorId: user.id, authorName: user.name, text: data.content, likes: data.likes_count, likedBy: [], comments: [], createdAt: data.created_at } }, { status: 201 });
  }
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
