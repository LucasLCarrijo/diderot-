-- Create user_roles table
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'creator', 'follower')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure a user can only have each role once
  unique(user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Policies
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own roles"
  on public.user_roles for insert
  with check (auth.uid() = user_id);

-- Index for performance
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
