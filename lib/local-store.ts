import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import seed from "../data/ludoguard.json";

export type User = { id: string; name: string; email: string; salt: string; passwordHash: string; createdAt: string };
export type Comment = { id: string; authorName: string; text: string; createdAt: string };
export type Post = { id: string; authorId: string; authorName: string; text: string; likes: number; likedBy: string[]; comments: Comment[]; createdAt: string };
export type EmergencyContact = { id: string; userId: string; name: string; phone: string; createdAt: string };
export type Store = { users: User[]; posts: Post[]; emergencyContacts?: EmergencyContact[] };

// Vinext's local worker changes process.cwd() to /bundle during development.
// PWD remains the project directory, which keeps this demo store local to the workspace.
const filePath = path.join("/Users/dec1de/Documents/ChatGPT/gamblare", "data", "ludoguard.json");
let memoryStore: Store = structuredClone(seed as Store);

export async function readStore(): Promise<Store> {
  try { return JSON.parse(await readFile(filePath, "utf8")) as Store; } catch { return memoryStore; }
}

export async function writeStore(store: Store) {
  memoryStore = store;
  try { await mkdir(path.dirname(filePath), { recursive: true }); await writeFile(filePath, JSON.stringify(store, null, 2) + "\n", "utf8"); } catch { /* Cloudflare preview has no writable filesystem; keep the demo state in memory. */ }
}

export function getSessionUser(request: Request, store: Store) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)ludoguard_session=([^;]+)/);
  const userId = match?.[1] ? decodeURIComponent(match[1]) : "";
  return store.users.find((user) => user.id === userId) ?? null;
}

export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}
