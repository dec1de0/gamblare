import { NextResponse } from "next/server";

const recent = new Map<string, number>();

export async function GET() {
  return NextResponse.json({ ok: true, smsConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER && process.env.SMS_EMERGENCY_PHONE) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const event = String(body.event ?? (domain ? `Открыт рискованный сайт: ${domain}` : "")).trim();
  const deviceId = String(body.deviceId ?? "demo-device").trim();
  if (!event) return NextResponse.json({ error: "event is required" }, { status: 400 });

  const key = `${deviceId}:${event}`;
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < 60_000) return NextResponse.json({ ok: true, deduplicated: true });
  recent.set(key, now);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.SMS_EMERGENCY_PHONE;
  if (!accountSid || !authToken || !from || !to) return NextResponse.json({ ok: true, notified: false, demo: true, reason: "SMS env variables are not configured" });

  const message = `LudoGuard: ${event}. Устройство: ${deviceId}. Время: ${new Date(now).toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`;
  const form = new URLSearchParams({ To: to, From: from, Body: message });
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const sms = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
  const smsData = await sms.json().catch(() => ({}));
  if (!sms.ok) return NextResponse.json({ ok: false, notified: false, error: "SMS API request failed", detail: smsData.message ?? "unknown SMS error" }, { status: 502 });
  return NextResponse.json({ ok: true, notified: true });
}
