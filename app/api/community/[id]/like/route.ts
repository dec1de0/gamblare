import { NextResponse } from "next/server";
import { getSessionUser, readStore, writeStore } from "../../../../../lib/local-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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
