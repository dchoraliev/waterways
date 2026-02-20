drop extension if exists "pg_net";

create schema if not exists "postgis";

revoke delete on table "public"."observation_media" from "anon";

revoke insert on table "public"."observation_media" from "anon";

revoke references on table "public"."observation_media" from "anon";

revoke select on table "public"."observation_media" from "anon";

revoke trigger on table "public"."observation_media" from "anon";

revoke truncate on table "public"."observation_media" from "anon";

revoke update on table "public"."observation_media" from "anon";

revoke delete on table "public"."observation_media" from "authenticated";

revoke insert on table "public"."observation_media" from "authenticated";

revoke references on table "public"."observation_media" from "authenticated";

revoke select on table "public"."observation_media" from "authenticated";

revoke trigger on table "public"."observation_media" from "authenticated";

revoke truncate on table "public"."observation_media" from "authenticated";

revoke update on table "public"."observation_media" from "authenticated";

revoke delete on table "public"."observation_media" from "service_role";

revoke insert on table "public"."observation_media" from "service_role";

revoke references on table "public"."observation_media" from "service_role";

revoke select on table "public"."observation_media" from "service_role";

revoke trigger on table "public"."observation_media" from "service_role";

revoke truncate on table "public"."observation_media" from "service_role";

revoke update on table "public"."observation_media" from "service_role";

alter table "public"."observation_media" drop constraint "observation_media_media_type_check";

alter table "public"."observation_media" drop constraint "observation_media_observation_id_fkey";

alter table "public"."observations" drop constraint "observations_category_id_fkey";

alter table "public"."trips" drop constraint "trips_user_id_fkey";

alter table "public"."observation_media" drop constraint "observation_media_pkey";

drop index if exists "public"."idx_observation_media_observation_id";

drop index if exists "public"."idx_observations_category_id";

drop index if exists "public"."observation_media_pkey";

drop table "public"."observation_media";


  create table "public"."user_signups_audit" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "email" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
      );


alter table "public"."user_signups_audit" enable row level security;

alter table "public"."observation_categories" enable row level security;

alter table "public"."observations" drop column "category_id";

alter table "public"."observations" add column "categories" text[];

alter table "public"."observations" add column "observation_media" text[];

alter table "public"."observations" add column "unique_userID_localID_pair" text not null;

alter table "public"."observations" alter column "user_id" set default auth.uid();

alter table "public"."observations" enable row level security;

alter table "public"."project_membership" enable row level security;

alter table "public"."projects" add column "join_code" character varying;

alter table "public"."projects" enable row level security;

alter table "public"."trips" add column "unique_userID_localID_pair" text not null;

alter table "public"."trips" alter column "user_id" set default auth.uid();

alter table "public"."trips" enable row level security;

alter table "public"."users" add column "share_name_on_map" boolean not null default true;

alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX observations_local_observation_id_key ON public.observations USING btree ("unique_userID_localID_pair");

CREATE UNIQUE INDEX projects_join_code_key ON public.projects USING btree (join_code);

CREATE UNIQUE INDEX trips_local_trip_id_key ON public.trips USING btree ("unique_userID_localID_pair");

CREATE UNIQUE INDEX user_signups_audit_pkey ON public.user_signups_audit USING btree (id);

CREATE INDEX users_id_idx ON public.users USING btree (id);

CREATE INDEX users_role_idx ON public.users USING btree (role);

alter table "public"."user_signups_audit" add constraint "user_signups_audit_pkey" PRIMARY KEY using index "user_signups_audit_pkey";

alter table "public"."observations" add constraint "observations_local_observation_id_key" UNIQUE using index "observations_local_observation_id_key";

alter table "public"."projects" add constraint "projects_join_code_check" CHECK ((length((join_code)::text) <= 8)) not valid;

alter table "public"."projects" validate constraint "projects_join_code_check";

alter table "public"."projects" add constraint "projects_join_code_key" UNIQUE using index "projects_join_code_key";

alter table "public"."trips" add constraint "trips_local_trip_id_key" UNIQUE using index "trips_local_trip_id_key";

alter table "public"."trips" add constraint "trips_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."trips" validate constraint "trips_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_ban_user(target_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Only allow admins to ban users
  if not exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can ban users';
  end if;

  -- Set user status to banned
  update public.users set status = 'banned' where id = target_user;

  -- Delete all sessions for the user
  delete from auth.sessions where user_id = target_user;

  -- Delete all observations for the user
  delete from public.observations where user_id = target_user;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.user_sign_up_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.user_signups_audit (user_id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
END;
$function$
;

grant delete on table "public"."user_signups_audit" to "anon";

grant insert on table "public"."user_signups_audit" to "anon";

grant references on table "public"."user_signups_audit" to "anon";

grant select on table "public"."user_signups_audit" to "anon";

grant trigger on table "public"."user_signups_audit" to "anon";

grant truncate on table "public"."user_signups_audit" to "anon";

grant update on table "public"."user_signups_audit" to "anon";

grant delete on table "public"."user_signups_audit" to "authenticated";

grant insert on table "public"."user_signups_audit" to "authenticated";

grant references on table "public"."user_signups_audit" to "authenticated";

grant select on table "public"."user_signups_audit" to "authenticated";

grant trigger on table "public"."user_signups_audit" to "authenticated";

grant truncate on table "public"."user_signups_audit" to "authenticated";

grant update on table "public"."user_signups_audit" to "authenticated";

grant delete on table "public"."user_signups_audit" to "service_role";

grant insert on table "public"."user_signups_audit" to "service_role";

grant references on table "public"."user_signups_audit" to "service_role";

grant select on table "public"."user_signups_audit" to "service_role";

grant trigger on table "public"."user_signups_audit" to "service_role";

grant truncate on table "public"."user_signups_audit" to "service_role";

grant update on table "public"."user_signups_audit" to "service_role";


  create policy "Enable read access for all users"
  on "public"."observation_categories"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete observations"
  on "public"."observations"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text)))));



  create policy "Authenticated users can update own observations"
  on "public"."observations"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."observations"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "public"."observations"
  as permissive
  for select
  to public
using (true);



  create policy "Creators can remove members"
  on "public"."project_membership"
  as permissive
  for delete
  to public
using ((project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.created_by = auth.uid()))));



  create policy "Enable insert for authenticated users only"
  on "public"."project_membership"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can join projects"
  on "public"."project_membership"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can leave projects"
  on "public"."project_membership"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "Users can view project members"
  on "public"."project_membership"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.created_by = auth.uid())))));



  create policy "Creators can delete their projects"
  on "public"."projects"
  as permissive
  for delete
  to public
using ((created_by = auth.uid()));



  create policy "Enable insert for authenticated users only"
  on "public"."projects"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all authenticated users"
  on "public"."projects"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable read access for all users"
  on "public"."projects"
  as permissive
  for select
  to public
using (true);



  create policy "Enable insert for authenticated users only"
  on "public"."trips"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "public"."trips"
  as permissive
  for select
  to public
using (true);



  create policy "Enable update for authenticated users only"
  on "public"."trips"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable users to view their own data only"
  on "public"."user_signups_audit"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Admin User Data Access"
  on "public"."users"
  as permissive
  for select
  to authenticated
using (((role = 'admin'::text) OR (auth.uid() = id)));



  create policy "Enable read access for all users"
  on "public"."users"
  as permissive
  for select
  to public
using (true);



  create policy "Users can select own profile"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "Users can view other users in their projects"
  on "public"."users"
  as permissive
  for select
  to public
using ((id IN ( SELECT pm.user_id
   FROM public.project_membership pm
  WHERE (pm.project_id IN ( SELECT project_membership.project_id
           FROM public.project_membership
          WHERE (project_membership.user_id = auth.uid()))))));



  create policy "users_update_authenticated"
  on "public"."users"
  as permissive
  for update
  to authenticated
using (((role = 'admin'::text) OR (id = ( SELECT auth.uid() AS uid))))
with check (((role = 'admin'::text) OR (id = ( SELECT auth.uid() AS uid))));


CREATE TRIGGER user_sign_up_trigger AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.user_sign_up_notify();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Access rights for everyone. 10a042g_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'Images'::text) AND (storage.extension(name) = 'jpg'::text) AND (lower((storage.foldername(name))[1]) = 'public'::text) AND (auth.role() = 'anon'::text)));



  create policy "Images authenticated delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'Images'::text));



  create policy "Images authenticated insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'Images'::text));



  create policy "Images authenticated select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'Images'::text));



  create policy "Images authenticated update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'Images'::text))
with check ((bucket_id = 'Images'::text));



  create policy "Vidoes authenticated delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'Vidoes'::text));



  create policy "Vidoes authenticated insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'Vidoes'::text));



  create policy "Vidoes authenticated select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'Vidoes'::text));



  create policy "Vidoes authenticated update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'Vidoes'::text))
with check ((bucket_id = 'Vidoes'::text));



