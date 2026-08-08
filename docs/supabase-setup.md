# Supabase для LudoGuard

1. Создай проект в [Supabase](https://supabase.com/dashboard).
2. Открой **SQL Editor** и выполни содержимое `supabase/schema.sql` целиком.
3. В **Authentication → Providers → Email** для демо отключи **Confirm email**. Тогда регистрация в приложении сразу создаст сессию.
4. В **Project Settings → API** скопируй `Project URL` и `anon public key`.
5. Добавь переменные локально в `.env.local` и в Vercel:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-public-key>
```

`service_role` ключ не нужен и не должен попадать в приложение или Vercel для этой реализации.

После деплоя зарегистрируй новый demo-аккаунт. Supabase Auth хранит пароли, а в Postgres сохраняются профиль, посты, комментарии, лайки, экстренные контакты и история чата. RLS-политики в миграции ограничивают контакты и историю чата только владельцем.
