import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json({ content: "Я рядом. Давай начнём с простого: что сейчас сильнее всего занимает твои мысли? (Демо-режим: добавь DEEPSEEK_API_KEY для ответа DeepSeek.)", demo: true });
  const response = await fetch("https://api.deepseek.com/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash", messages: [{ role: "system", content: "Ты бережный помощник LudoGuard. Отвечай только готовым коротким сообщением пользователю на русском языке: без рассуждений, цепочек мыслей, служебных заметок, анализа процесса и markdown. Веди естественный разговор о рисках азартных игр, не ставь диагнозы, не стыди пользователя, задавай один вопрос за раз. При непосредственной угрозе предложи обратиться к близкому человеку или в экстренную службу Казахстана." }, ...messages], temperature: 0.5, max_tokens: 220 }) });
  if (!response.ok) return NextResponse.json({ error: "DeepSeek временно недоступен" }, { status: 502 });
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content?.trim() || "Я рядом. Давай начнём с того, что сейчас тревожит тебя сильнее всего?";
  return NextResponse.json({ content });
}
