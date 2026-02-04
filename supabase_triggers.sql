-- Create a function that handles new user signup
-- This function will run with elevated privileges (security definer) to bypass RLS
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

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure public access is allowed for SELECT (if not already run)
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- Allow users to update their own profile
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
