import { createClient } from "@supabase/supabase-js";

export type SupabaseUser = { id: string; name: string; email: string };

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1] ? decodeURIComponent(cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))![1]) : "";
}

export function supabase() {
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function supabaseForRequest(request: Request) {
  const client = supabase();
  const token = cookieValue(request, "ludoguard_access_token");
  if (!token) return { client, token: "" };
  return { client: createClient(url!, anonKey!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } }), token };
}

export async function getSupabaseUser(request: Request): Promise<SupabaseUser | null> {
  if (!supabaseEnabled) return null;
  const token = cookieValue(request, "ludoguard_access_token");
  if (!token) return null;
  const { data } = await supabase().auth.getUser(token);
  if (!data.user) return null;
  return { id: data.user.id, name: String(data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Участник"), email: data.user.email ?? "" };
}

export function setSupabaseSession(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }, accessToken: string) {
  response.cookies.set("ludoguard_access_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export function clearSupabaseSession(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }) {
  response.cookies.set("ludoguard_access_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}
