import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const event = String(body.event || "Попытка открыть букмекерское приложение");
  return NextResponse.json({ event, demo: true, timeline: [
    { step: "detect", label: "Сигнал обнаружен", detail: event, status: "done", delay: "сейчас" },
    { step: "pause", label: "Экран паузы", detail: "Пользователю показан таймер 30 секунд", status: "done", delay: "+ 0:00" },
    { step: "push", label: "Push пользователю", detail: "Ты в порядке? Ответь, чтобы остановить цепочку", status: "waiting", delay: "+ 2:00" },
    { step: "contact", label: "Экстренный контакт", detail: "Telegram / SMS маме", status: "queued", delay: "+ 5:00" },
    { step: "call", label: "Звонок", detail: "Резервный канал связи", status: "queued", delay: "+ 8:00" }
  ] });
}
