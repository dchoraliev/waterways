alter table public.users
  add column if not exists banned_at timestamp with time zone;

alter table public.observations
  add column if not exists deleted_at timestamp with time zone;

update public.users
set banned_at = coalesce(banned_at, created_at)
where status = 'banned'
  and banned_at is null;

update public.observations
set deleted_at = coalesce(deleted_at, created_at)
where coalesce(deleted, false) = true
  and deleted_at is null;

create or replace function public.rpc_ban_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admins can ban users';
  end if;

  update public.users
  set status = 'banned',
      banned_at = now()
  where id = target_user;

  delete from auth.sessions where user_id = target_user;

  update public.observations
  set deleted = true,
      deleted_at = now()
  where user_id = target_user
    and coalesce(deleted, false) = false;
end;
$function$;

create or replace function public.rpc_unban_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admins can unban users';
  end if;

  update public.users
  set status = 'active',
      banned_at = null
  where id = target_user;
end;
$function$;

grant execute on function public.rpc_ban_user(uuid) to authenticated, service_role;
grant execute on function public.rpc_unban_user(uuid) to authenticated, service_role;
