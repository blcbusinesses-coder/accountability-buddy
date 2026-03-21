-- ============================================================
-- Accountability Buddy — Supabase Schema
-- Run this in your Supabase SQL Editor (project > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── TASKS ─────────────────────────────────────────────────────
create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  due_date    date not null,
  due_time    time not null,
  status      text not null default 'pending'
                check (status in ('pending', 'completed', 'failed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ── SUBMISSIONS ───────────────────────────────────────────────
create table public.submissions (
  id              uuid primary key default uuid_generate_v4(),
  task_id         uuid not null references public.tasks(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  submission_type text not null check (submission_type in ('photo', 'text', 'audio')),
  content_url     text,
  text_content    text,
  ai_verdict      text check (ai_verdict in ('approved', 'rejected')),
  ai_reasoning    text,
  submitted_at    timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "Users can view own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

create policy "Users can insert own submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id);

-- ── STORAGE BUCKET ────────────────────────────────────────────
-- Create a storage bucket named "submissions" in:
-- Supabase Dashboard > Storage > New Bucket
-- Name: submissions
-- Public: true (so photo/audio URLs are accessible)

-- Storage policies (run after creating the bucket):
insert into storage.buckets (id, name, public)
  values ('submissions', 'submissions', true)
  on conflict (id) do nothing;

create policy "Users can upload their own files"
  on storage.objects for insert
  with check (
    bucket_id = 'submissions' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view submission files"
  on storage.objects for select
  using (bucket_id = 'submissions');
