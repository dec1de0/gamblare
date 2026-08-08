import { NextResponse } from "next/server";

type Risk = "low" | "medium" | "high";
type ChatMessage = { role?: string; content?: string };

function assessRisk(messages: ChatMessage[]): Risk {
  const text = messages
    .filter((item) => item.role === "user")
    .map((item) => item.content ?? "")
    .join(" ")
    .toLowerCase();

  const high = /(ломк|буду став|сейчас став|хочу став|не могу останов|последн(ие|яя) деньг|все проиграл|срочно отыгр|кредит.*став|долг.*став|продал|хочу исчез|поконч)/;
  const medium = /(хочу азарта|азарт|долг|кредит|проиграл|отыгр|ставк|букмекер|казино|скрыва|тревог|не вез)/;

  if (high.test(text)) return "high";
  if (medium.test(text)) return "medium";
  return "low";
}

function fallbackFor(risk: Risk) {
  if (risk === "high") return "Похоже, импульс сейчас сильный. Не открывай БК ближайшие 20 минут: отложи телефон, убери банковское приложение из быстрого доступа и напиши близкому. Ты сейчас один или рядом есть кто-то?";
  if (risk === "medium") return "Желание азарта — сигнал остановиться до первой ставки. На сегодня можно включить самоограничение через eGov Mobile и убрать БК из быстрого доступа. Что обычно запускает этот импульс у тебя?";
  return "Давай без общих слов: что произошло прямо перед тем, как захотелось играть?";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const risk = assessRisk(messages);
  const fallback = fallbackFor(risk);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const lastUserMessage = messages.filter((item) => item.role === "user").at(-1)?.content?.trim() ?? "";

  if (!apiKey) return NextResponse.json({ content: fallback, risk, egovReminder: risk === "medium" });

  const systemPrompt = `Ты — Ludo AI, внимательный, спокойный и прямой собеседник для человека с риском лудомании. Пиши только готовый ответ пользователю на русском, 2–4 коротких предложения. Никаких chain-of-thought, анализа, служебных пометок, markdown, списков и фраз вроде «я рядом» в каждом сообщении. Не повторяй формулировки предыдущих ответов и не отвечай шаблонно. Сначала назови конкретный смысл того, что сказал человек, затем дай один реалистичный шаг на ближайшие 10–20 минут и задай один новый, уместный вопрос. Тон: тёплый, взрослый, уверенный; не сюсюкай и не осуждай. В этом приложении слова «ломка» и «ставить» относятся к азартным ставкам, а не к наркотикам. Если есть ломка, намерение сделать ставку, потеря контроля, долги или попытка отыграться — прямо обозначь высокий риск и помоги отложить ставку. При непосредственной опасности предложи связаться с близким или экстренной службой Казахстана. Последнее сообщение пользователя: «${lastUserMessage.replaceAll("\"", "'")}».`;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      // `deepseek-v4-pro` may return only a reasoning field. The chat model
      // returns a user-facing answer, which is the only thing this screen needs.
      model: "deepseek-chat",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      frequency_penalty: 0.8,
      presence_penalty: 0.35,
      max_tokens: 220,
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "DeepSeek временно недоступен" }, { status: 502 });

  const data = await response.json();
  const content = (data.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || fallback;
  return NextResponse.json({ content, risk, egovReminder: risk === "medium" });
}
