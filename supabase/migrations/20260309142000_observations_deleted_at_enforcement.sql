alter table public.observations
  add column if not exists deleted_at timestamp with time zone;

update public.observations
set deleted_at = coalesce(deleted_at, created_at, now())
where coalesce(deleted, false) = true
  and deleted_at is null;

create index if not exists idx_observations_deleted_deleted_at_desc
  on public.observations using btree (deleted_at desc)
  where coalesce(deleted, false) = true;

create or replace function public.set_observation_deleted_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if coalesce(new.deleted, false) = true then
    if new.deleted_at is null then
      new.deleted_at = now();
    end if;
  else
    new.deleted_at = null;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_set_observation_deleted_at on public.observations;
create trigger trg_set_observation_deleted_at
before update on public.observations
for each row
execute function public.set_observation_deleted_at();
