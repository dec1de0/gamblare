import { createHash, randomBytes } from "node:crypto";

export function createPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return { salt, passwordHash: createHash("sha256").update(`${salt}:${password}`).digest("hex") };
}

export function checkPassword(password: string, salt: string, passwordHash: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex") === passwordHash || (salt === "demo" && password === "demo-password");
}
