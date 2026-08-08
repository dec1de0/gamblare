import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../lib/local-store";
import { getSupabaseUser, supabaseEnabled, supabaseForRequest } from "../../../lib/supabase";

type CommunityCommentRow = { id: string; post_id: string; user_id: string; content: string; created_at: string };
type CommunityPostRow = { id: string; user_id: string; content: string; likes_count: number; created_at: string };
type ProfileRow = { id: string; name: string };

export async function GET(request: Request) {
  if (supabaseEnabled) {
    const user = await getSupabaseUser(request);
    const { client } = supabaseForRequest(request);
    const { data, error } = await client.from("community_posts").select("id, content, likes_count, created_at, user_id").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Не удалось загрузить сообщество" }, { status: 500 });
    const postRows = (data ?? []) as unknown as CommunityPostRow[];
    const postIds = postRows.map((post) => post.id);
    let commentRows: CommunityCommentRow[] = [];
    if (postIds.length) {
      const comments = await client.from("community_comments").select("id, post_id, user_id, content, created_at").in("post_id", postIds).order("created_at", { ascending: true });
      if (comments.error) return NextResponse.json({ error: "Не удалось загрузить комментарии" }, { status: 500 });
      commentRows = (comments.data ?? []) as unknown as CommunityCommentRow[];
    }
    const userIds = [...new Set([...postRows.map((post) => post.user_id), ...commentRows.map((comment) => comment.user_id)])];
    let profileRows: ProfileRow[] = [];
    if (userIds.length) {
      const profiles = await client.from("profiles").select("id, name").in("id", userIds);
      if (profiles.error) return NextResponse.json({ error: "Не удалось загрузить авторов" }, { status: 500 });
      profileRows = (profiles.data ?? []) as unknown as ProfileRow[];
    }
    const names = new Map(profileRows.map((profile) => [profile.id, profile.name]));
    const commentsByPost = new Map<string, CommunityCommentRow[]>();
    for (const comment of commentRows) commentsByPost.set(comment.post_id, [...(commentsByPost.get(comment.post_id) ?? []), comment]);
    let liked = new Set<string>();
    if (user) { const ownLikes = await client.from("community_likes").select("post_id"); liked = new Set((ownLikes.data ?? []).map((item) => item.post_id)); }
    const posts = postRows.map((post) => ({ id: post.id, authorId: post.user_id, authorName: names.get(post.user_id) ?? "Участник", text: post.content, likes: post.likes_count, liked: liked.has(post.id), likedBy: [], createdAt: post.created_at, comments: (commentsByPost.get(post.id) ?? []).map((comment) => ({ id: comment.id, authorName: names.get(comment.user_id) ?? "Участник", text: comment.content, createdAt: comment.created_at })) }));
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
