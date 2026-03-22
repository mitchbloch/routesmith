-- Auto-create a profile row when a new user signs up
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Also create a profile for any existing users
insert into public.profiles (id)
select id from auth.users
where id not in (select id from public.profiles);
