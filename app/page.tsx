"use client";

import { FormEvent, useEffect, useState } from "react";

type Tab = "home" | "chat" | "circle" | "safety" | "monitor";
type User = { id: string; name: string; email: string };
type Comment = { id: string; authorName: string; text: string; createdAt: string };
type Post = { id: string; authorName: string; text: string; likes: number; likedBy: string[]; comments: Comment[]; createdAt: string };

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "⌂" },
  { id: "chat", label: "Чат", icon: "◌" },
  { id: "circle", label: "Круг", icon: "♧" },
  { id: "safety", label: "Защита", icon: "◇" },
];

function Header({ onHelp }: { onHelp: () => void }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark">✦</span><span>LUDOGUARD</span></div>
      <button className="icon-button" aria-label="Быстрая помощь" onClick={onHelp}>?</button>
    </header>
  );
}

function Dashboard({ onHelp, onTab }: { onHelp: () => void; onTab: (tab: Tab) => void }) {
  return <>
    <section className="greeting">
      <div><p className="eyebrow">ПЯТНИЦА, 8 АВГУСТА</p><h1>Привет, Арман <span>✦</span></h1></div>
      <div className="avatar">А</div>
    </section>

    <section className="status-card">
      <div className="status-heading"><div><span className="live-dot" /> <span>ЗАЩИТА АКТИВНА</span></div><span className="status-time">обновлено 2 мин назад</span></div>
      <div className="shield-orb"><span>✓</span></div>
      <h2>Сегодня ты держишься</h2>
      <p>Без букмекерских приложений</p>
      <div className="progress"><span /></div>
      <div className="status-footer"><span>Текущая серия</span><strong>4 дня</strong></div>
    </section>

    <div className="section-row"><div><p className="eyebrow">ТВОЙ ФОКУС</p><h3>Маленькие шаги<br />составляют путь</h3></div><span className="sparkle">✦</span></div>

    <section className="focus-grid">
      <button className="focus-tile mint" onClick={() => onTab("chat")}><span className="tile-icon">◌</span><span className="tile-label">Проверить<br />состояние</span><span className="arrow">↗</span></button>
      <button className="focus-tile blue" onClick={() => onTab("circle")}><span className="tile-icon">♧</span><span className="tile-label">Поддержка<br />рядом</span><span className="arrow">↗</span></button>
      <button className="focus-tile dark" onClick={() => onTab("safety")}><span className="tile-icon">◇</span><span className="tile-label">Настроить<br />защиту</span><span className="arrow">↗</span></button>
    </section>

    <section className="alert-card"><div className="alert-icon">!</div><div><strong>Если станет трудно</strong><p>Твой экстренный контакт на связи</p></div><button onClick={onHelp} aria-label="Позвонить">↗</button></section>
    <p className="privacy-note">Твои данные — только твои. Мы не продаём и не передаём их без твоего согласия.</p>
  </>;
}

function Chat({ onHelp }: { onHelp: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([{ role: "assistant", content: "Привет. Я рядом, если захочешь поговорить. Как прошёл твой день?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<{ question: string; signals: string[]; score: number } | null>(null);
  const [assessmentAnswer, setAssessmentAnswer] = useState("");
  const [aiConsent, setAiConsent] = useState(false);
  const [consentPrompt, setConsentPrompt] = useState(false);
  async function send(text = input) {
    if (!text.trim() || loading) return;
    if (!aiConsent) { setConsentPrompt(true); return; }
    const next = [...messages, { role: "user" as const, content: text.trim() }]; setMessages(next); setInput(""); setLoading(true);
    try { const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) }); const data = await response.json(); setMessages([...next, { role: "assistant", content: data.content || data.error || "Я рядом." }]); } finally { setLoading(false); }
  }
  async function runAssessment(text = assessmentAnswer) {
    if (!text.trim()) return;
    if (!aiConsent) { setConsentPrompt(true); return; }
    const next = [...messages, { role: "user" as const, content: text.trim() }]; setAssessmentAnswer(""); setLoading(true);
    try { const response = await fetch("/api/ai/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) }); const data = await response.json(); setAssessment({ question: data.question || "Что ты замечаешь в своём отношении к ставкам?", signals: data.signals || [], score: data.score || 0 }); } finally { setLoading(false); }
  }
  return <section className="page-section"><p className="eyebrow">ЛИЧНЫЙ ПОМОЩНИК · DEEPSEEK</p><div className="page-title-row"><div><h1>Как ты сегодня?</h1><p>Без оценок. Просто честный разговор.</p></div><div className="bot-face">✦</div></div>
    <div className="chat-card"><div className="chat-meta"><span className="bot-dot" /> Ludo · твой помощник <span className="online">онлайн</span></div>{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`bubble ${message.role === "user" ? "user" : "bot"}`}>{message.content}</div>)}{loading && <div className="bubble bot">Печатает…</div>}<div className="quick-actions"><button onClick={() => send("Мне тревожно")}>Мне тревожно</button><button onClick={() => send("Всё хорошо")}>Всё хорошо</button></div><div className="chat-input"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Напиши, что чувствуешь…" /><button onClick={() => send()} aria-label="Отправить">→</button></div><button className="assessment-button" onClick={() => setAssessment({ question: "За последние 12 месяцев как часто ты ставил больше, чем мог себе позволить потерять?", signals: [], score: 0 })}>Мягко проверить состояние · 5 вопросов <span>→</span></button></div>
    {assessment && <div className="assessment-card"><div className="assessment-top"><span className="eyebrow">БЕРЕЖНЫЙ СКРИНИНГ</span><span>{assessment.score}/3</span></div><h3>{assessment.question}</h3><p>Это не диагноз. Ответ останется частью твоего личного диалога.</p><div className="chat-input"><input value={assessmentAnswer} onChange={(event) => setAssessmentAnswer(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runAssessment()} placeholder="Напиши своим словами…" /><button onClick={() => runAssessment()} aria-label="Ответить">→</button></div>{assessment.signals.length > 0 && <div className="signal-row">Замечены темы: {assessment.signals.join(" · ")}</div>}</div>}
    {consentPrompt && <div className="consent-card"><span className="setting-icon purple">⌁</span><div><strong>Подключить AI-помощника?</strong><p>Текст диалога будет передан DeepSeek для ответа и анализа. Можно отказаться в любой момент.</p></div><button onClick={() => { setAiConsent(true); setConsentPrompt(false); }}>Разрешить</button></div>}
    <button className="help-link" onClick={onHelp}>Мне нужна срочная помощь</button><div className="chat-disclaimer">Диалог помогает заметить изменения в состоянии. Это не медицинская диагностика.</div>
  </section>;
}

function Circle({ user }: { user: User | null }) {
  const [posts, setPosts] = useState<Post[]>([]); const [text, setText] = useState(""); const [comment, setComment] = useState<Record<string, string>>({}); const [error, setError] = useState("");
  async function load() { const data = await fetch("/api/community").then((response) => response.json()); setPosts(data.posts ?? []); }
  useEffect(() => { load(); }, []);
  async function publish(event: FormEvent) { event.preventDefault(); if (!text.trim()) return; const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); const data = await response.json(); if (!response.ok) { setError(data.error); return; } setText(""); setError(""); load(); }
  async function like(id: string) { const response = await fetch(`/api/community/${id}/like`, { method: "POST" }); if (response.ok) load(); else setError((await response.json()).error); }
  async function addComment(id: string) { const value = comment[id]?.trim(); if (!value) return; const response = await fetch(`/api/community/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value }) }); if (!response.ok) setError((await response.json()).error); else { setComment({ ...comment, [id]: "" }); load(); } }
  return <section className="page-section"><p className="eyebrow">АНОНИМНОЕ СООБЩЕСТВО</p><div className="page-title-row"><div><h1>Твой круг</h1><p>Люди, которые понимают без лишних слов.</p></div><span className="circle-count">1 284<br /><small>участника</small></span></div>
    {user ? <form className="composer" onSubmit={publish}><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Поделись тем, что помогает тебе…" /><div><span>{error}</span><button className="primary" type="submit">Опубликовать</button></div></form> : <div className="login-hint">Войди, чтобы публиковать, ставить лайки и отвечать.</div>}
    {posts.map((post, index) => <article className={`post-card ${index % 2 ? "soft" : ""}`} key={post.id}><div className="post-top"><div className="post-avatar">{post.authorName.slice(0, 1)}</div><div><strong>{post.authorName}</strong><p>анонимная публикация</p></div><span>•••</span></div><p className="post-text">{post.text}</p><div className="post-actions"><button onClick={() => like(post.id)}>♡ {post.likes}</button><span>◌ {post.comments.length}</span></div>{post.comments.map((item) => <div className="comment" key={item.id}><strong>{item.authorName}</strong><span>{item.text}</span></div>)}{user && <div className="comment-input"><input value={comment[post.id] ?? ""} onChange={(event) => setComment({ ...comment, [post.id]: event.target.value })} placeholder="Написать комментарий…" onKeyDown={(event) => event.key === "Enter" && addComment(post.id)} /><button onClick={() => addComment(post.id)}>→</button></div>}</article>)}
  </section>;
}

function Monitor() {
  const [data, setData] = useState<{ active: boolean; mode: string; monitored: { name: string; type: string; status: string; risk: string }[]; events: { app: string; action: string; result: string; time: string }[] } | null>(null);
  const [timeline, setTimeline] = useState<{ label: string; detail: string; status: string; delay: string }[] | null>(null);
  useEffect(() => { fetch("/api/monitor").then((response) => response.json()).then(setData); }, []);
  async function escalate() { const response = await fetch("/api/monitor/escalate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "Попытка открыть Olimpbet" }) }); const result = await response.json(); setTimeline(result.timeline); }
  return <section className="page-section"><p className="eyebrow">ДЕМО МОНИТОРИНГА</p><div className="page-title-row"><div><h1>Мониторинг БК</h1><p>Приложения и сайты под защитой.</p></div><span className="monitor-pulse">●</span></div><div className="monitor-banner"><span className="live-dot" /><div><strong>{data?.active ? "Мониторинг активен" : "Загрузка…"}</strong><p>UsageStats + DNS-фильтр · demo</p></div></div><div className="monitor-list">{data?.monitored.map((item) => <div className="monitor-item" key={item.name}><div className={`setting-icon ${item.risk === "high" ? "pink" : "orange"}`}>{item.type === "Веб-сайт" ? "⌁" : "▣"}</div><div><strong>{item.name}</strong><p>{item.type} · {item.status.toLowerCase()}</p></div><span className="monitor-check">✓</span></div>)}</div><p className="eyebrow event-label">ПОСЛЕДНИЕ СОБЫТИЯ</p>{data?.events.map((event) => <div className="event-row" key={`${event.app}-${event.time}`}><span className="event-time">{event.time}</span><div><strong>{event.app}</strong><p>{event.action} · {event.result}</p></div></div>)}<button className="primary full escalation-button" onClick={escalate}>Симулировать событие и эскалацию <span>→</span></button>{timeline && <div className="timeline">{timeline.map((item) => <div className={`timeline-item ${item.status}`} key={item.label}><span className="timeline-dot" /><div><strong>{item.label}</strong><p>{item.detail}</p></div><time>{item.delay}</time></div>)}</div>}<p className="privacy-note">В этой web-версии данные смоделированы. На Android здесь подключаются UsageStatsManager и VPNService.</p></section>;
}

function Safety({ onHelp, onMonitor }: { onHelp: () => void; onMonitor: () => void }) {
  return <section className="page-section"><p className="eyebrow">НАСТРОЙКИ БЕЗОПАСНОСТИ</p><h1>Защита</h1><p className="lead">Ты выбираешь, какая поддержка тебе нужна.</p>
    <div className="settings-list"><div className="setting"><div className="setting-icon green">✓</div><div><strong>Мониторинг приложений</strong><p>Букмекерские сайты и приложения</p></div><span className="toggle on" /></div><div className="setting"><div className="setting-icon purple">⌁</div><div><strong>Фильтр сайтов</strong><p>DNS-защита включена</p></div><span className="toggle on" /></div><div className="setting"><div className="setting-icon orange">♧</div><div><strong>Экстренный контакт</strong><p>Мама · +7 777 123 45 67</p></div><span className="chevron">›</span></div><div className="setting"><div className="setting-icon pink">!</div><div><strong>Сигнал при удалении</strong><p>Уведомить экстренный контакт</p></div><span className="toggle on" /></div></div>
    <div className="demo-trigger"><div><span className="eyebrow">ДЕМО МОНИТОРИНГА</span><strong>Открыть мониторинг БК</strong><p>Приложения, сайты и события</p></div><button onClick={onMonitor}>Открыть</button></div><div className="demo-trigger secondary-trigger"><div><span className="eyebrow">ДЕМО СЦЕНАРИЯ</span><strong>Проверить тревожный сигнал</strong><p>Покажет экран поддержки</p></div><button onClick={onHelp}>Запустить</button></div>
    <p className="privacy-note">Экстренный контакт получает уведомления только при срабатывании выбранного тобой сценария.</p>
  </section>;
}

function Intervention({ close }: { close: () => void }) {
  return <div className="intervention-backdrop"><div className="intervention"><button className="close" onClick={close}>×</button><div className="intervention-symbol">✦</div><p className="eyebrow">LUDOGUARD · ПАУЗА</p><h2>Ты в порядке?</h2><p className="intervention-copy">Мы заметили, что ты открыл букмекерское приложение. Давай сделаем паузу на 30 секунд.</p><div className="timer">00:24</div><div className="intervention-actions"><button className="primary full" onClick={close}>Да, я в порядке <span>✓</span></button><button className="outline full" onClick={close}>Мне нужна помощь</button></div><p className="contact-hint">При отсутствии ответа через 2 минуты мы напишем маме.</p></div></div>;
}

function Auth({ onAuth }: { onAuth: (user: User) => void }) {
  const [register, setRegister] = useState(false); const [name, setName] = useState(""); const [email, setEmail] = useState("arman@demo.kz"); const [password, setPassword] = useState("demo-password"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) }); const data = await response.json(); setLoading(false); if (!response.ok) { setError(data.error); return; } onAuth(data.user); }
  return <div className="auth-backdrop"><form className="auth-card" onSubmit={submit}><div className="auth-brand"><span className="brand-mark">✦</span> LUDOGUARD</div><p className="eyebrow">БЕЗОПАСНОЕ ПРОСТРАНСТВО</p><h1>{register ? "Создать аккаунт" : "С возвращением"}</h1><p className="auth-copy">{register ? "Начни путь к более спокойным отношениям с азартными играми." : "Войди, чтобы увидеть своё сообщество и настройки защиты."}</p>{register && <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя" /> }<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" /><input required minLength={4} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" />{error && <p className="form-error">{error}</p>}<button className="primary full" disabled={loading}>{loading ? "Проверяем…" : register ? "Зарегистрироваться" : "Войти"}<span>→</span></button><button type="button" className="auth-switch" onClick={() => { setRegister(!register); setError(""); }}>{register ? "У меня уже есть аккаунт" : "Создать новый аккаунт"}</button><p className="demo-credentials">Демо: arman@demo.kz / demo-password</p></form></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<User | null>(null);
  const [intervention, setIntervention] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data) => { setUser(data.user); setAuthChecked(true); }).catch(() => setAuthChecked(true)); }, []);
  if (!authChecked) return <main className="app-shell"><div className="phone-frame auth-loading">Загрузка LudoGuard…</div></main>;
  return <main className="app-shell">{!user && <Auth onAuth={setUser} />}<div className="phone-frame"><Header onHelp={() => setIntervention(true)} /><div className="scroll-area">{tab === "home" && <Dashboard onHelp={() => setIntervention(true)} onTab={setTab} />}{tab === "chat" && <Chat onHelp={() => setIntervention(true)} />}{tab === "circle" && <Circle user={user} />}{tab === "safety" && <Safety onHelp={() => setIntervention(true)} onMonitor={() => setTab("monitor")} />}{tab === "monitor" && <Monitor />}</div><nav className="bottom-nav">{tabs.map(item => <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => setTab(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav></div>{intervention && <Intervention close={() => setIntervention(false)} />}</main>;
}
