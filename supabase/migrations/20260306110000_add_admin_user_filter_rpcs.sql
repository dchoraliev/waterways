drop function if exists public.get_filtered_observations(
	double precision,
	double precision,
	double precision,
	double precision,
	integer,
	integer,
	text[],
	text,
	uuid,
	boolean,
	timestamp with time zone,
	timestamp with time zone,
	integer,
	integer
);

create or replace function public.get_filtered_observations(
	p_min_lat double precision default null,
	p_min_lng double precision default null,
	p_max_lat double precision default null,
	p_max_lng double precision default null,
	p_year integer default null,
	p_month integer default null,
	p_categories text[] default null,
	p_keywords text default null,
	p_project_id uuid default null,
	p_my_projects_only boolean default false,
	p_since timestamp with time zone default null,
	p_until timestamp with time zone default null,
	p_user_id uuid default null,
	p_limit integer default 2000,
	p_offset integer default 0
)
returns table (
	id uuid,
	location text,
	user_id uuid,
	trip_id uuid,
	created_at timestamp with time zone,
	observation text,
	categories text[],
	observation_media text[],
	project_id uuid,
	project_name text,
	project_description text,
	observer_first_name text,
	observer_last_name text,
	latitude double precision,
	longitude double precision,
	total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $function$
	with filtered as (
		select
			o.id,
			st_asewkb(o.location::geometry)::text as location,
			o.user_id,
			o.trip_id,
			o.created_at,
			o.observation,
			o.categories,
			o.observation_media,
			t.project_id,
			p.name as project_name,
			p.description as project_description,
			case when u.share_name_on_map then u.first_name else null end as observer_first_name,
			case when u.share_name_on_map then u.last_name else null end as observer_last_name,
			st_y(o.location::geometry) as latitude,
			st_x(o.location::geometry) as longitude
		from public.observations o
		left join public.trips t on t.id = o.trip_id
		left join public.projects p on p.id = t.project_id
		left join public.users u on u.id = o.user_id
		where
			(
				p_since is null
				or o.created_at >= p_since
			)
			and (
				p_until is null
				or o.created_at < p_until
			)
			and (
				p_year is null
				or extract(year from o.created_at) = p_year
			)
			and (
				p_month is null
				or extract(month from o.created_at) = p_month
			)
			and (
				coalesce(array_length(p_categories, 1), 0) = 0
				or o.categories && p_categories
			)
			and (
				p_keywords is null
				or btrim(p_keywords) = ''
				or coalesce(o.observation, '') ilike '%' || btrim(p_keywords) || '%'
				or coalesce(p.name, '') ilike '%' || btrim(p_keywords) || '%'
				or coalesce(u.first_name || ' ' || u.last_name, '') ilike '%' || btrim(p_keywords) || '%'
				or coalesce(u.email, '') ilike '%' || btrim(p_keywords) || '%'
				or exists (
					select 1
					from unnest(coalesce(o.categories, '{}'::text[])) as category
					where category ilike '%' || btrim(p_keywords) || '%'
				)
			)
			and (
				p_project_id is null
				or t.project_id = p_project_id
			)
			and (
				not p_my_projects_only
				or (
					auth.uid() is not null
					and exists (
						select 1
						from public.project_membership pm
						where pm.project_id = t.project_id
							and pm.user_id = auth.uid()
					)
				)
			)
			and (
				p_user_id is null
				or (
					o.user_id = p_user_id
					and exists (
						select 1
						from public.users admin_user
						where admin_user.id = auth.uid()
							and admin_user.role = 'admin'
					)
				)
			)
			and (
				p_min_lat is null
				or p_min_lng is null
				or p_max_lat is null
				or p_max_lng is null
				or (
					p_min_lng <= p_max_lng
					and st_intersects(
						o.location::geometry,
						st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
					)
				)
				or (
					p_min_lng > p_max_lng
					and (
						st_intersects(
							o.location::geometry,
							st_makeenvelope(-180, p_min_lat, p_max_lng, p_max_lat, 4326)
						)
						or st_intersects(
							o.location::geometry,
							st_makeenvelope(p_min_lng, p_min_lat, 180, p_max_lat, 4326)
						)
					)
				)
			)
	),
	paged as (
		select
			*,
			count(*) over() as total_count
		from filtered
		order by created_at desc
		limit greatest(1, least(coalesce(p_limit, 2000), 5000))
		offset greatest(0, coalesce(p_offset, 0))
	)
	select
		id,
		location,
		user_id,
		trip_id,
		created_at,
		observation,
		categories,
		observation_media,
		project_id,
		project_name,
		project_description,
		observer_first_name,
		observer_last_name,
		latitude,
		longitude,
		total_count
	from paged;
$function$;

grant execute on function public.get_filtered_observations(
	double precision,
	double precision,
	double precision,
	double precision,
	integer,
	integer,
	text[],
	text,
	uuid,
	boolean,
	timestamp with time zone,
	timestamp with time zone,
	uuid,
	integer,
	integer
) to anon, authenticated, service_role;

drop function if exists public.get_admin_observation_users();

create or replace function public.get_admin_observation_users()
returns table (
	user_id uuid,
	first_name text,
	last_name text,
	email text,
	observation_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
	if not exists (
		select 1
		from public.users admin_actor
		where admin_actor.id = auth.uid()
			and admin_actor.role = 'admin'
	) then
		raise exception 'Only admins can view users';
	end if;

	return query
	select
		u.id as user_id,
		u.first_name,
		u.last_name,
		u.email,
		count(o.id)::bigint as observation_count
	from public.users u
	left join public.observations o on o.user_id = u.id
	group by u.id, u.first_name, u.last_name, u.email
	order by
		case
			when coalesce(btrim(u.first_name), '') = '' and coalesce(btrim(u.last_name), '') = '' then 1
			else 0
		end,
		lower(coalesce(nullif(btrim(u.last_name), ''), nullif(btrim(u.first_name), ''), nullif(btrim(u.email), ''), u.id::text)),
		lower(coalesce(nullif(btrim(u.first_name), ''), nullif(btrim(u.email), ''), u.id::text)),
		u.id;
end;
$function$;

grant execute on function public.get_admin_observation_users() to authenticated, service_role;
