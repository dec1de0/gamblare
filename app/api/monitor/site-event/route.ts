import { NextResponse } from "next/server";

const recent = new Map<string, number>();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const deviceId = String(body.deviceId ?? "demo-device").trim();
  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });

  const key = `${deviceId}:${domain}`;
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < 60_000) return NextResponse.json({ ok: true, deduplicated: true });
  recent.set(key, now);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return NextResponse.json({ ok: true, notified: false, demo: true, reason: "Telegram env variables are not configured" });

  const message = `⚠️ LudoGuard\n\nОбнаружен рискованный домен: ${domain}\nУстройство: ${deviceId}\nВремя: ${new Date(now).toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`;
  const telegram = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: message }) });
  if (!telegram.ok) return NextResponse.json({ ok: false, notified: false, error: "Telegram API request failed" }, { status: 502 });
  return NextResponse.json({ ok: true, notified: true });
}
