-- Keep public.users.email in sync when auth.users.email changes.
create or replace function public.sync_user_email_from_auth()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email is distinct from old.email then
    update public.users
    set email = new.email
    where id = new.id;

    -- In case a profile row does not exist yet, ensure one is created.
    if not found then
      insert into public.users (id, email)
      values (new.id, new.email)
      on conflict (id)
      do update set email = excluded.email;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
execute function public.sync_user_email_from_auth();
