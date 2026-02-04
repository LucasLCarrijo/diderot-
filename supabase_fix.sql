-- 1. DROP EVERYTHING FIRST (To fix the "Already Exists" error)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. RE-CREATE THE READ POLICY
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- 3. RE-CREATE THE TRIGGER FUNCTION (This fixes the "Profile not created" bug)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, name, categories)
  values (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'name',
    '{}'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. ACTIVATE THE TRIGGER
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
