import { NextResponse } from "next/server";
import { getSessionUser, publicUser, readStore } from "../../../../lib/local-store";

export async function GET(request: Request) {
  const user = getSessionUser(request, await readStore());
  return NextResponse.json({ user: user ? publicUser(user) : null });
}
