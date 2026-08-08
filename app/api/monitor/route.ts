import { NextResponse } from "next/server";

const monitored = [
  { name: "Olimpbet", type: "Приложение", packageName: "kz.olimpbet.app", status: "ЗАБЛОКИРОВАНО", risk: "high" },
  { name: "Parimatch", type: "Веб-сайт", packageName: "parimatch.kz", status: "ФИЛЬТРУЕТСЯ", risk: "high" },
  { name: "1xBet", type: "Веб-сайт", packageName: "1xbet.kz", status: "ФИЛЬТРУЕТСЯ", risk: "high" },
  { name: "Fonbet", type: "Приложение", packageName: "kz.fonbet.app", status: "НАБЛЮДЕНИЕ", risk: "medium" }
];

export async function GET() {
  return NextResponse.json({ active: true, mode: "demo", checkedAt: new Date().toISOString(), monitored, events: [{ app: "Olimpbet", action: "Попытка открытия", result: "Заблокировано", time: "сегодня, 14:32" }, { app: "parimatch.kz", action: "DNS-запрос", result: "Перенаправлено на паузу", time: "вчера, 21:08" }] });
}
