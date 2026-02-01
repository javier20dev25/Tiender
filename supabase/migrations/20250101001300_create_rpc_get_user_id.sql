-- Migration 013: Create RPC to get user_id from email
-- This function allows privileged server-side processes (like Edge Functions)
-- to securely retrieve a user's ID based on their email address.

create or replace function public.get_user_id_by_email(user_email text)
returns uuid
language plpgsql
security definer
as $$
begin
  return (
    select id from auth.users where email = user_email
  );
end;
$$;

grant execute on function public.get_user_id_by_email(text) to service_role;
