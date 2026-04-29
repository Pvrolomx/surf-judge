-- ==========================================
-- SURF JUDGE - Pega esto en Supabase SQL Editor
-- Proyecto: pwsrjmhmxqfxmcadhjtz
-- ==========================================

-- Tabla de heats
create table if not exists sj_heats (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  judge_count int not null check (judge_count in (3, 5)),
  surfer_count int not null check (surfer_count between 2 and 4),
  surfers jsonb not null,
  status text not null default 'active' check (status in ('active', 'finished')),
  created_at timestamptz default now()
);

-- Tabla de scores
create table if not exists sj_scores (
  id uuid primary key default gen_random_uuid(),
  heat_id uuid not null references sj_heats(id) on delete cascade,
  judge_number int not null check (judge_number between 1 and 5),
  surfer_index int not null check (surfer_index between 0 and 3),
  wave_number int not null,
  score numeric(4,2) not null check (score between 0 and 10),
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_sj_scores_heat on sj_scores(heat_id);
create index if not exists idx_sj_scores_heat_judge on sj_scores(heat_id, judge_number);

-- RLS - public read/write (sin auth por ahora, se agrega después)
alter table sj_heats enable row level security;
alter table sj_scores enable row level security;

create policy "public read heats" on sj_heats for select using (true);
create policy "public insert heats" on sj_heats for insert with check (true);
create policy "public update heats" on sj_heats for update using (true);

create policy "public read scores" on sj_scores for select using (true);
create policy "public insert scores" on sj_scores for insert with check (true);

-- Realtime
alter publication supabase_realtime add table sj_scores;
