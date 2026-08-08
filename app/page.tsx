"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window { LudoGuardNative?: { setSiteMonitoringEnabled?: (enabled: boolean) => void; enableUninstallGuard?: () => void } }
}

type Tab = "home" | "chat" | "circle" | "safety" | "monitor";
type User = { id: string; name: string; email: string };
type Comment = { id: string; text: string; createdAt: string };
type Post = { id: string; text: string; likes: number; likedBy: string[]; liked?: boolean; comments: Comment[]; createdAt: string };
type MonitorEvent = { id: string; app: string; action: string; result: string; time: string; createdAt: string };
type SafetySummary = { currentStreak: number; todayBlocked: boolean; todayEvents: number; lastEventAt: string | null };
type MonitorData = { active: boolean; mode: string; monitored: { name: string; type: string; status: string; risk: string }[]; events: MonitorEvent[]; summary: SafetySummary | null };
type EmergencyContact = { id: string; name: string; phone: string; createdAt: string };

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "⌂" },
  { id: "chat", label: "Чат", icon: "◌" },
  { id: "circle", label: "Круг", icon: "♧" },
  { id: "safety", label: "Защита", icon: "◇" },
];

function Header() {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark">✦</span><span>LUDOGUARD</span></div>
    </header>
  );
}

function Dashboard({ onTab }: { onTab: (tab: Tab) => void }) {
  const [monitor, setMonitor] = useState<MonitorData | null>(null);
  async function loadMonitor() {
    const response = await fetch("/api/monitor");
    if (response.ok) setMonitor(await response.json());
  }
  useEffect(() => {
    loadMonitor();
  }, []);
  const summary = monitor?.summary;
  const todayBlocked = summary?.todayBlocked ?? false;
  return <>
    <section className="greeting">
      <div><p className="eyebrow">ПЯТНИЦА, 8 АВГУСТА</p><h1>Привет, Арман <span>✦</span></h1></div>
      <div className="avatar">А</div>
    </section>

    <section className="status-card">
      <div className="status-heading"><div><span className="live-dot" /> <span>{todayBlocked ? "СИГНАЛ ЗАФИКСИРОВАН" : "ЗАЩИТА АКТИВНА"}</span></div></div>
      <div className="shield-orb"><span>✓</span></div>
      <h2>{todayBlocked ? "Попытка остановлена" : "Сегодня ты держишься"}</h2>
      <p>{todayBlocked ? "Мониторинг заблокировал сайт" : "Без посещения букмекерских сайтов"}</p>
      <div className="status-footer"><span>Текущая серия</span><strong>{summary ? `${summary.currentStreak} ${summary.currentStreak === 1 ? "день" : "дней"}` : "—"}</strong></div>
    </section>

    <div className="section-row"><div><p className="eyebrow">ТВОЙ ФОКУС</p><h3>Маленькие шаги<br />составляют путь</h3></div><span className="sparkle">✦</span></div>

    <section className="focus-grid">
      <button className="focus-tile mint" onClick={() => onTab("chat")}><span className="tile-icon">◌</span><span className="tile-label">Проверить<br />состояние</span><span className="arrow">↗</span></button>
      <button className="focus-tile blue" onClick={() => onTab("circle")}><span className="tile-icon">♧</span><span className="tile-label">Поддержка<br />рядом</span><span className="arrow">↗</span></button>
      <button className="focus-tile dark" onClick={() => onTab("safety")}><span className="tile-icon">◇</span><span className="tile-label">Настроить<br />защиту</span><span className="arrow">↗</span></button>
    </section>

    <p className="privacy-note">Твои данные — только твои. Мы не продаём и не передаём их без твоего согласия.</p>
  </>;
}

function Chat() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([{ role: "assistant", content: "Привет. Я рядом, если захочешь поговорить. Как прошёл твой день?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfChat = useRef<HTMLDivElement>(null);
  useEffect(() => { endOfChat.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  async function send(text = input) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }]; setMessages(next); setInput(""); setLoading(true);
    try { const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) }); const data = await response.json(); setMessages([...next, { role: "assistant", content: data.content || data.error || "Я рядом." }]); } finally { setLoading(false); }
  }
  return <section className="page-section"><p className="eyebrow">ЛИЧНЫЙ ПОМОЩНИК</p><div className="page-title-row"><div><h1>Как ты сегодня?</h1></div></div>
    <div className="chat-card"><div className="chat-meta"><span className="bot-dot" /> Ludo · твой помощник</div><div className="chat-history">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`bubble ${message.role === "user" ? "user" : "bot"}`}>{message.content}</div>)}{loading && <div className="bubble bot typing"><i /><i /><i /></div>}<div ref={endOfChat} /></div>{messages.length === 1 && <div className="quick-actions"><button onClick={() => send("Мне тревожно")}>Мне тревожно</button><button onClick={() => send("Всё хорошо")}>Всё хорошо</button></div>}<div className="chat-composer"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Напиши, что чувствуешь…" /><button onClick={() => send()} aria-label="Отправить" disabled={loading || !input.trim()}>→</button></div></div>
    <div className="chat-disclaimer">Диалог помогает заметить изменения в состоянии. Это не медицинская диагностика.</div>
  </section>;
}

function Circle({ user }: { user: User | null }) {
  const [posts, setPosts] = useState<Post[]>([]); const [text, setText] = useState(""); const [comment, setComment] = useState<Record<string, string>>({}); const [error, setError] = useState("");
  async function load() { const data = await fetch("/api/community").then((response) => response.json()); setPosts(data.posts ?? []); }
  useEffect(() => { load(); }, []);
  async function publish(event: FormEvent) { event.preventDefault(); if (!text.trim()) return; const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); const data = await response.json(); if (!response.ok) { setError(data.error); return; } setText(""); setError(""); load(); }
  async function like(id: string) { const response = await fetch(`/api/community/${id}/like`, { method: "POST" }); if (response.ok) { const data = await response.json(); setPosts((current) => current.map((post) => post.id === id ? { ...post, likes: data.likes, liked: data.liked } : post)); } else setError((await response.json()).error); }
  async function addComment(id: string) { const value = comment[id]?.trim(); if (!value) return; const response = await fetch(`/api/community/${id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value }) }); if (!response.ok) setError((await response.json()).error); else { setComment({ ...comment, [id]: "" }); load(); } }
  return <section className="page-section"><p className="eyebrow">АНОНИМНОЕ СООБЩЕСТВО</p><div className="page-title-row"><div><h1>Твой круг</h1><p>Люди, которые понимают без лишних слов.</p></div><span className="circle-count">1 284<br /><small>участника</small></span></div>
    {user ? <form className="composer" onSubmit={publish}><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Поделись тем, что помогает тебе…" /><div><span>{error}</span><button className="primary" type="submit">Опубликовать</button></div></form> : <div className="login-hint">Войди, чтобы публиковать, ставить лайки и отвечать.</div>}
    {posts.map((post, index) => <article className={`post-card ${index % 2 ? "soft" : ""}`} key={post.id}><div className="post-top"><div className="post-avatar">A</div></div><p className="post-text">{post.text}</p><div className="post-actions"><button className={post.liked ? "liked" : ""} onClick={() => like(post.id)}>{post.liked ? "♥" : "♡"} {post.likes}</button></div>{post.comments.map((item) => <div className="comment" key={item.id}><span>{item.text}</span></div>)}{user && <div className="comment-input"><input value={comment[post.id] ?? ""} onChange={(event) => setComment({ ...comment, [post.id]: event.target.value })} placeholder="Написать комментарий…" onKeyDown={(event) => event.key === "Enter" && addComment(post.id)} /><button onClick={() => addComment(post.id)}>→</button></div>}</article>)}
  </section>;
}

function Monitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [error, setError] = useState("");
  async function load() {
    const response = await fetch("/api/monitor");
    if (response.ok) setData(await response.json());
  }
  useEffect(() => { load(); }, []);
  async function simulateBlockedAttempt(app: string) {
    setError("");
    const response = await fetch("/api/monitor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ app }) });
    if (!response.ok) { setError((await response.json()).error ?? "Не удалось записать событие"); return; }
    await load();
  }
  return <section className="page-section"><p className="eyebrow">МОНИТОРИНГ</p><div className="page-title-row"><div><h1>Мониторинг БК</h1><p>Приложения и сайты под защитой.</p></div><span className="monitor-pulse">●</span></div><div className="monitor-banner"><span className="live-dot" /><div><strong>{data?.active ? "Мониторинг активен" : "Загрузка…"}</strong><p>Событие блокировки сразу сохраняется</p></div></div><div className="monitor-list">{data?.monitored.map((item) => <div className="monitor-item" key={item.name}><div className={`setting-icon ${item.risk === "high" ? "pink" : "orange"}`}>{item.type === "Веб-сайт" ? "⌁" : "▣"}</div><div><strong>{item.name}</strong><p>{item.type} · {item.status.toLowerCase()}</p></div><button className="monitor-trigger" onClick={() => simulateBlockedAttempt(item.name)}>Проверить</button></div>)}</div><p className="eyebrow event-label">ПОСЛЕДНИЕ СОБЫТИЯ</p>{error && <p className="form-error">{error}</p>}{data?.events.length ? data.events.map((event) => <div className="event-row" key={event.id}><span className="event-time">{event.time}</span><div><strong>{event.app}</strong><p>{event.action} · {event.result}</p></div></div>) : <p className="privacy-note">Заблокированных попыток пока нет.</p>}<p className="privacy-note">Кнопка «Проверить» имитирует событие Android-мониторинга для тестирования streak.</p></section>;
}

function Safety({ onMonitor }: { onMonitor: () => void }) {
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [siteFilterEnabled, setSiteFilterEnabled] = useState(false);
  const [deletionSignalEnabled, setDeletionSignalEnabled] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactError, setContactError] = useState("");
  useEffect(() => { window.LudoGuardNative?.enableUninstallGuard?.(); }, []);
  function setSiteFilter(value: boolean) {
    setSiteFilterEnabled(value);
    if (typeof window !== "undefined") window.LudoGuardNative?.setSiteMonitoringEnabled?.(value);
  }
  async function loadContacts() {
    const response = await fetch("/api/emergency-contacts");
    if (response.ok) setContacts((await response.json()).contacts ?? []);
  }
  useEffect(() => { loadContacts(); }, []);
  async function addContact(event: FormEvent) {
    event.preventDefault();
    setContactError("");
    const response = await fetch("/api/emergency-contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: contactName, phone: contactPhone }) });
    const data = await response.json();
    if (!response.ok) { setContactError(data.error ?? "Не удалось добавить контакт."); return; }
    setContacts((current) => [...current, data.contact]);
    setContactName(""); setContactPhone(""); setShowContactForm(false);
  }
  async function removeContact(id: string) {
    const response = await fetch("/api/emergency-contacts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) setContacts((current) => current.filter((contact) => contact.id !== id));
  }
  return <section className="page-section"><p className="eyebrow">НАСТРОЙКИ БЕЗОПАСНОСТИ</p><h1>Защита</h1><p className="lead">Ты выбираешь, какая поддержка тебе нужна.</p>
    <div className="settings-list"><div className="setting"><div className="setting-icon green">✓</div><div><strong>Мониторинг сайтов</strong><p>Букмекерские сайты</p></div><button className={`toggle ${monitoringEnabled ? "on" : ""}`} aria-label="Переключить мониторинг сайтов" aria-pressed={monitoringEnabled} onClick={() => setMonitoringEnabled((value) => !value)} /></div><div className="setting"><div className="setting-icon purple">⌁</div><div><strong>Фильтр сайтов</strong><p>{siteFilterEnabled ? "DNS-защита включена" : "DNS-защита выключена"}</p></div><button className={`toggle ${siteFilterEnabled ? "on" : ""}`} aria-label="Переключить фильтр сайтов" aria-pressed={siteFilterEnabled} onClick={() => setSiteFilter(!siteFilterEnabled)} /></div>{contacts.map((contact) => <div className="setting" key={contact.id}><div className="setting-icon orange">♧</div><div><strong>{contact.name}</strong><p>{contact.phone}</p></div><button className="contact-remove" onClick={() => removeContact(contact.id)} aria-label={`Удалить контакт ${contact.name}`}>×</button></div>)}{contacts.length < 3 && <button className="contact-add" onClick={() => { setShowContactForm(true); setContactError(""); }}>+ Добавить экстренный контакт <span>{contacts.length}/3</span></button>}{showContactForm && <form className="contact-form" onSubmit={addContact}><input required value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Имя контакта" /><input required value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Номер телефона" type="tel" />{contactError && <p className="form-error">{contactError}</p>}<div><button type="button" className="contact-cancel" onClick={() => setShowContactForm(false)}>Отмена</button><button className="primary" type="submit">Сохранить</button></div></form>}<div className="setting"><div className="setting-icon pink">!</div><div><strong>Сигнал при удалении</strong><p>{deletionSignalEnabled ? "Уведомить экстренный контакт" : "Уведомления выключены"}</p></div><button className={`toggle ${deletionSignalEnabled ? "on" : ""}`} aria-label="Переключить сигнал при удалении" aria-pressed={deletionSignalEnabled} onClick={() => setDeletionSignalEnabled((value) => !value)} /></div></div>
    <div className="demo-trigger"><div><span className="eyebrow">ДЕМО МОНИТОРИНГА</span><strong>Открыть мониторинг БК</strong><p>Приложения, сайты и события</p></div><button onClick={onMonitor}>Открыть</button></div>
    <p className="privacy-note">Экстренный контакт получает уведомления только при срабатывании выбранного тобой сценария.</p>
  </section>;
}

function Auth({ onAuth }: { onAuth: (user: User) => void }) {
  const [register, setRegister] = useState(false); const [name, setName] = useState(""); const [email, setEmail] = useState("arman@demo.kz"); const [password, setPassword] = useState("demo-password"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) }); const data = await response.json(); setLoading(false); if (!response.ok) { setError(data.error); return; } onAuth(data.user); }
  return <div className="auth-backdrop"><form className="auth-card" onSubmit={submit}><div className="auth-brand"><span className="brand-mark">✦</span> LUDOGUARD</div><p className="eyebrow">БЕЗОПАСНОЕ ПРОСТРАНСТВО</p><h1>{register ? "Создать аккаунт" : "С возвращением"}</h1><p className="auth-copy">{register ? "Начни путь к более спокойным отношениям с азартными играми." : "Войди, чтобы увидеть своё сообщество и настройки защиты."}</p>{register && <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя" /> }<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" /><input required minLength={4} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" />{error && <p className="form-error">{error}</p>}<button className="primary full" disabled={loading}>{loading ? "Проверяем…" : register ? "Зарегистрироваться" : "Войти"}<span>→</span></button><button type="button" className="auth-switch" onClick={() => { setRegister(!register); setError(""); }}>{register ? "У меня уже есть аккаунт" : "Создать новый аккаунт"}</button><p className="demo-credentials">Демо: arman@demo.kz / demo-password</p></form></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data) => { setUser(data.user); setAuthChecked(true); }).catch(() => setAuthChecked(true)); }, []);
  if (!authChecked) return <main className="app-shell"><div className="phone-frame auth-loading">Загрузка LudoGuard…</div></main>;
  return <main className="app-shell">{!user && <Auth onAuth={setUser} />}<div className="phone-frame"><Header /><div className="scroll-area">{tab === "home" && <Dashboard onTab={setTab} />}{tab === "chat" && <Chat />}{tab === "circle" && <Circle user={user} />}{tab === "safety" && <Safety onMonitor={() => setTab("monitor")} />}{tab === "monitor" && <Monitor />}</div><nav className="bottom-nav">{tabs.map(item => <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => setTab(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav></div></main>;
}
