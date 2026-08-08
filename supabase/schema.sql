-- Run this once in Supabase Dashboard → SQL Editor.
-- The tables use Row Level Security: a user can only alter their own data.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Участник',
  created_at timestamptz not null default now()
);

create or replace function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))) on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users for each row execute procedure public.create_profile_for_auth_user();

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1200),
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 800),
  created_at timestamptz not null default now()
);
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists community_posts_created_at_idx on public.community_posts(created_at desc);
create index if not exists community_comments_post_id_idx on public.community_comments(post_id, created_at);
create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts(user_id);
create index if not exists chat_messages_user_id_created_at_idx on public.chat_messages(user_id, created_at);

create or replace function public.update_post_likes_count() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.community_posts set likes_count = likes_count + 1 where id = new.post_id; return new; end if;
  update public.community_posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id; return old;
end;
$$;
drop trigger if exists update_post_likes_after_insert on public.community_likes;
drop trigger if exists update_post_likes_after_delete on public.community_likes;
create trigger update_post_likes_after_insert after insert on public.community_likes for each row execute procedure public.update_post_likes_count();
create trigger update_post_likes_after_delete after delete on public.community_likes for each row execute procedure public.update_post_likes_count();

alter table public.profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles readable" on public.profiles for select to anon, authenticated using (true);
create policy "profiles own update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "posts readable" on public.community_posts for select to anon, authenticated using (true);
create policy "posts own insert" on public.community_posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "posts own delete" on public.community_posts for delete to authenticated using ((select auth.uid()) = user_id);
create policy "likes own select" on public.community_likes for select to authenticated using ((select auth.uid()) = user_id);
create policy "likes own insert" on public.community_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "likes own delete" on public.community_likes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "comments readable" on public.community_comments for select to anon, authenticated using (true);
create policy "comments own insert" on public.community_comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "comments own delete" on public.community_comments for delete to authenticated using ((select auth.uid()) = user_id);
create policy "contacts own access" on public.emergency_contacts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chat own access" on public.chat_messages for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
