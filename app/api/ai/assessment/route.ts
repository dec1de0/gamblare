import { NextResponse } from "next/server";

const questions = [
  "За последние 12 месяцев как часто ты ставил больше, чем мог себе позволить потерять?",
  "Как часто тебе приходилось возвращаться на следующий день, чтобы отыграться?",
  "Случалось ли, что азартные игры вызывали у тебя стресс или тревогу?",
  "Приходилось ли тебе скрывать от близких размер ставок или проигрышей?",
  "Влияли ли ставки на отношения, работу, учёбу или финансовые планы?"
];

function localSignals(text: string) {
  const normalized = text.toLowerCase();
  const patterns = [
    ["financial", /(долг|занял|кредит|зарплат|деньг|проиграл|отыгр)/],
    ["denial", /(контролир|просто не вез|в любой момент|это последний раз)/],
    ["emotion", /(тревож|стресс|стыд|виноват|злюсь|депресс|бессон)/],
    ["relationships", /(мам|пап|жен|муж|семь|скрыва|руга|довер)/]
  ];
  return patterns.filter(([, pattern]) => pattern.test(normalized)).map(([signal]) => signal);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastText = messages.filter((item: { role?: string }) => item.role === "user").at(-1)?.content ?? "";
  const signals = localSignals(lastText);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json({ question: questions[Math.min(messages.length, questions.length - 1)], signals, score: Math.min(signals.length, 3), demo: true });
  const response = await fetch("https://api.deepseek.com/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash", messages: [{ role: "system", content: `Ты проводишь бережный скрининг риска игровой зависимости. Задавай только один следующий вопрос из списка: ${questions.join(" | ")}. Не ставь диагноз. Ответь строго JSON без markdown: {"question":"...","signals":["financial|denial|emotion|relationships"],"score":0}. Оценивай только текст пользователя, score от 0 до 3.` }, ...messages], temperature: 0.2, max_tokens: 180, response_format: { type: "json_object" } }) });
  if (!response.ok) return NextResponse.json({ error: "Assessment API временно недоступен", question: questions[Math.min(messages.length, questions.length - 1)], signals, score: Math.min(signals.length, 3) }, { status: 200 });
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";
  try { return NextResponse.json({ ...JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")), signals }); } catch { return NextResponse.json({ question: questions[Math.min(messages.length, questions.length - 1)], signals, score: Math.min(signals.length, 3) }); }
}
