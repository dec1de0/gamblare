import { NextResponse } from "next/server";

type Risk = "low" | "medium" | "high";

function assessRisk(messages: { role?: string; content?: string }[]): Risk {
  const text = messages.filter((item) => item.role === "user").map((item) => item.content ?? "").join(" ").toLowerCase();
  const high = /(последн(ие|яя) деньг|все проиграл|не могу останов|срочно отыгр|кредит.*став|долг.*став|продал|хочу исчез|поконч)/;
  const medium = /(долг|кредит|проиграл|отыгр|ставк|букмекер|казино|скрыва|тревог|не вез)/;
  if (high.test(text)) return "high";
  if (medium.test(text)) return "medium";
  return "low";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const risk = assessRisk(messages);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json({ content: "Опиши ситуацию конкретнее: была ли сегодня ставка, долг или желание отыграться?", risk, egovReminder: risk === "medium" });
  const response = await fetch("https://api.deepseek.com/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash", messages: [{ role: "system", content: "Ты серьёзный и прямой помощник LudoGuard. Отвечай только готовым кратким сообщением пользователю на русском: без рассуждений, цепочек мыслей, служебных заметок и markdown. Не нянчись, но не унижай. Если пользователь сообщает о долгах, попытках отыграться, потере контроля или ставках на последние деньги — прямо скажи, что это рискованная ситуация, предложи остановиться и задай один конкретный вопрос. При признаках непосредственной опасности предложи связаться с близким или экстренной службой Казахстана." }, ...messages], temperature: 0.35, max_tokens: 180 }) });
  if (!response.ok) return NextResponse.json({ error: "DeepSeek временно недоступен" }, { status: 502 });
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content?.trim() || "Я рядом. Давай начнём с того, что сейчас тревожит тебя сильнее всего?";
  return NextResponse.json({ content, risk, egovReminder: risk === "medium" });
}
