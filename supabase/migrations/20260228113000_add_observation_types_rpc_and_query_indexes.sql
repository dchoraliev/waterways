create or replace function public.get_observation_types()
returns table (
	type text
)
language sql
stable
security invoker
set search_path = public
as $function$
	select distinct btrim(category) as type
	from public.observations o
	cross join lateral unnest(coalesce(o.categories, '{}'::text[])) as category
	where btrim(category) <> ''
	order by type asc;
$function$;

grant execute on function public.get_observation_types() to anon, authenticated, service_role;

create index if not exists idx_project_membership_user_joined_at
	on public.project_membership using btree (user_id, joined_at desc);

create index if not exists idx_project_membership_project_joined_at
	on public.project_membership using btree (project_id, joined_at asc);

create index if not exists idx_trips_user_created_at
	on public.trips using btree (user_id, created_at desc);

create index if not exists idx_observations_trip_user_created_at
	on public.observations using btree (trip_id, user_id, created_at desc);

create index if not exists idx_observations_created_at_desc
	on public.observations using btree (created_at desc);
