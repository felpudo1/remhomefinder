--
-- PostgreSQL database dump
--

\restrict YqMw7824dV5kFE24bxZZ3BQo4hBK3vHom3C9FQpjJ8HvpCKaPNTexDZX3azt2ft

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: agent_pub_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.agent_pub_status AS ENUM (
    'disponible',
    'reservado',
    'vendido',
    'alquilado',
    'eliminado',
    'pausado'
);


ALTER TYPE public.agent_pub_status OWNER TO postgres;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'agency',
    'user',
    'agencymember'
);


ALTER TYPE public.app_role OWNER TO postgres;

--
-- Name: currency_code; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.currency_code AS ENUM (
    'USD',
    'ARS',
    'UYU',
    'CLP'
);


ALTER TYPE public.currency_code OWNER TO postgres;

--
-- Name: listing_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_type AS ENUM (
    'rent',
    'sale'
);


ALTER TYPE public.listing_type OWNER TO postgres;

--
-- Name: org_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.org_role AS ENUM (
    'owner',
    'agent',
    'member',
    'system_admin_delegate'
);


ALTER TYPE public.org_role OWNER TO postgres;

--
-- Name: org_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.org_type AS ENUM (
    'family',
    'agency_team',
    'sub_team'
);


ALTER TYPE public.org_type OWNER TO postgres;

--
-- Name: user_listing_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_listing_status AS ENUM (
    'ingresado',
    'contactado',
    'visita_coordinada',
    'visitado',
    'a_analizar',
    'descartado',
    'firme_candidato',
    'posible_interes',
    'eliminado'
);


ALTER TYPE public.user_listing_status OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'pending',
    'suspended',
    'rejected'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: admin_physical_delete_user(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_physical_delete_user(_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Solo admins pueden ejecutar esta función
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Borrar el perfil (CASCADE borra automáticamente: user_roles, organization_members,
  -- properties, user_listings, agent_publications, property_reviews, family_comments,
  -- agency_comments, status_history_log, partner_leads)
  DELETE FROM public.profiles WHERE user_id = _user_id;

  -- Borrar organizaciones creadas por el usuario (que ya no tienen miembros)
  DELETE FROM public.organizations WHERE created_by = _user_id;

  -- Finalmente borrar de auth.users
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;


ALTER FUNCTION public.admin_physical_delete_user(_user_id uuid) OWNER TO postgres;

--
-- Name: admin_physical_delete_user(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_display_name  TEXT;
    v_email         TEXT;
    v_phone         TEXT;
    v_plan_type     TEXT;
    v_status        TEXT;
BEGIN
    -- Solo admins pueden ejecutar esta función
    IF NOT has_role(_deleted_by, 'admin') THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Capturar datos del usuario ANTES de borrar
    SELECT
        display_name,
        email,
        phone,
        plan_type::TEXT,
        status::TEXT
    INTO v_display_name, v_email, v_phone, v_plan_type, v_status
    FROM public.profiles
    WHERE user_id = _user_id;

    -- Insertar registro de auditoría (si falla, no se borra el usuario)
    INSERT INTO public.deletion_audit_log (
        deleted_user_id,
        display_name,
        email,
        phone,
        plan_type,
        status_before,
        reason,
        deleted_by
    ) VALUES (
        _user_id,
        v_display_name,
        v_email,
        v_phone,
        v_plan_type,
        v_status,
        _reason,
        _deleted_by
    );

    -- Borrar el perfil (CASCADE borra: user_roles, organization_members,
    -- properties, user_listings, agent_publications, property_reviews,
    -- family_comments, agency_comments, status_history_log, partner_leads)
    DELETE FROM public.profiles WHERE user_id = _user_id;

    -- Borrar organizaciones creadas por el usuario (que ya no tienen miembros)
    DELETE FROM public.organizations WHERE created_by = _user_id;

    -- Finalmente borrar de auth.users
    DELETE FROM auth.users WHERE id = _user_id;
END;
$$;


ALTER FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid) OWNER TO postgres;

--
-- Name: admin_update_profile_status(uuid, public.user_status); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_update_profile_status(_user_id uuid, _status public.user_status) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles SET status = _status WHERE user_id = _user_id;
END;
$$;


ALTER FUNCTION public.admin_update_profile_status(_user_id uuid, _status public.user_status) OWNER TO postgres;

--
-- Name: count_property_listing_users(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.count_property_listing_users(_property_id uuid) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COUNT(DISTINCT ul.added_by)::integer
  FROM public.user_listings ul
  WHERE ul.property_id = _property_id;
$$;


ALTER FUNCTION public.count_property_listing_users(_property_id uuid) OWNER TO postgres;

--
-- Name: find_org_by_invite_code(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_org_by_invite_code(_code text) RETURNS TABLE(id uuid, name text, description text, type public.org_type)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id, name, description, type 
  FROM public.organizations 
  WHERE invite_code = _code LIMIT 1;
$$;


ALTER FUNCTION public.find_org_by_invite_code(_code text) OWNER TO postgres;

--
-- Name: get_marketplace_org_names(uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) RETURNS TABLE(id uuid, name text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT o.id, o.name
  FROM public.organizations o
  WHERE o.id = ANY(_org_ids)
    AND EXISTS (
      SELECT 1
      FROM public.agent_publications ap
      WHERE ap.org_id = o.id
        AND ap.status <> 'eliminado'
    );
$$;


ALTER FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) OWNER TO postgres;

--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_account_type text;
  v_display_name text;
  v_phone text;
  v_org_name text;
  v_org_id uuid;
  v_role public.org_role;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

  INSERT INTO public.profiles (user_id, display_name, phone, email, status)
  VALUES (
    NEW.id,
    v_display_name,
    v_phone,
    COALESCE(NEW.email, ''),
    CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status 
         ELSE 'active'::user_status END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL
      THEN EXCLUDED.display_name ELSE profiles.display_name END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL
      THEN EXCLUDED.phone ELSE profiles.phone END,
    email = CASE WHEN profiles.email IS NULL OR profiles.email = ''
      THEN EXCLUDED.email ELSE profiles.email END;

  IF v_account_type = 'agency' THEN
    v_org_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', v_display_name || ' Agency');
    INSERT INTO public.organizations (name, type, created_by, is_personal)
    VALUES (v_org_name, 'agency_team', NEW.id, false)
    RETURNING id INTO v_org_id;
    -- Creador recibe 'agent'; el admin lo promueve a 'owner' desde Admin → Grupos si corresponde
    v_role := 'agent';
  ELSE
    INSERT INTO public.organizations (name, type, created_by, is_personal)
    VALUES (COALESCE(NULLIF(v_display_name, ''), 'Mi Familia'), 'family', NEW.id, true)
    RETURNING id INTO v_org_id;
    v_role := 'owner';
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, v_role);

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user_profile() OWNER TO postgres;

--
-- Name: handle_new_user_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_account_type text;
BEGIN
  v_account_type := NEW.raw_user_meta_data->>'account_type';

  IF v_account_type = 'agency' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'agencymember')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user_role() OWNER TO postgres;

--
-- Name: handle_user_email_sync(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_user_email_sync() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_user_email_sync() OWNER TO postgres;

--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) OWNER TO postgres;

--
-- Name: increment_property_views(uuid, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_property_views(p_property_id uuid, p_is_publication boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF p_is_publication THEN
    UPDATE public.agent_publications 
    SET views_count = COALESCE(views_count, 0) + 1 
    WHERE id = p_property_id;
  END IF;
  INSERT INTO public.property_views_log (property_id) VALUES (p_property_id);
END;
$$;


ALTER FUNCTION public.increment_property_views(p_property_id uuid, p_is_publication boolean) OWNER TO postgres;

--
-- Name: increment_property_views(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_property_views(p_property_id uuid, p_publication_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_publication_id IS NOT NULL THEN
    UPDATE public.agent_publications
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_publication_id;
  END IF;

  INSERT INTO public.property_views_log (property_id)
  VALUES (p_property_id);
END;
$$;


ALTER FUNCTION public.increment_property_views(p_property_id uuid, p_publication_id uuid) OWNER TO postgres;

--
-- Name: is_org_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id AND is_active = true
  );
$$;


ALTER FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) OWNER TO postgres;

--
-- Name: is_org_owner(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id AND role = 'owner'
  );
$$;


ALTER FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) OWNER TO postgres;

--
-- Name: is_system_delegate(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_system_delegate(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND is_system_delegate = true
  );
$$;


ALTER FUNCTION public.is_system_delegate(_user_id uuid) OWNER TO postgres;

--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
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
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

--
-- Name: trg_sync_listing_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_sync_listing_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.user_listings
  SET current_status = NEW.new_status, updated_at = now()
  WHERE id = NEW.user_listing_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_sync_listing_status() OWNER TO postgres;

--
-- Name: trg_validate_listing_quota(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_validate_listing_quota() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_plan text;
  v_count integer;
BEGIN
  SELECT plan_type INTO v_plan FROM public.organizations WHERE id = NEW.org_id;
  IF v_plan = 'free' THEN
    SELECT count(*) INTO v_count FROM public.user_listings WHERE org_id = NEW.org_id;
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'Límite del plan gratuito alcanzado (máx 5 propiedades). Actualizá tu plan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_validate_listing_quota() OWNER TO postgres;

--
-- Name: trg_validate_sub_teams(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_validate_sub_teams() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_count integer;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.organizations WHERE parent_id = NEW.parent_id;
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'Máximo de 5 sub-equipos alcanzado para esta organización.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_validate_sub_teams() OWNER TO postgres;

--
-- Name: update_estado_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_estado_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    NEW.estado_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_estado_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: admin_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cuenta text DEFAULT ''::text NOT NULL,
    descripcion text DEFAULT ''::text NOT NULL,
    texto text DEFAULT ''::text NOT NULL,
    estado text DEFAULT 'valido'::text NOT NULL,
    created_by uuid NOT NULL,
    created_by_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    estado_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fecha date
);


ALTER TABLE public.admin_keys OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text,
    phone text DEFAULT ''::text NOT NULL,
    avatar_url text DEFAULT ''::text NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    plan_type text DEFAULT 'free'::text,
    referred_by_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: scrape_usage_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scrape_usage_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    role text DEFAULT 'user'::text NOT NULL,
    scraper text NOT NULL,
    channel text NOT NULL,
    success boolean DEFAULT false NOT NULL,
    token_charged boolean DEFAULT true NOT NULL,
    source_url text,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scrape_usage_log_channel_check CHECK ((channel = ANY (ARRAY['url'::text, 'image'::text]))),
    CONSTRAINT scrape_usage_log_role_check CHECK ((role = ANY (ARRAY['user'::text, 'agent'::text]))),
    CONSTRAINT scrape_usage_log_scraper_check CHECK ((scraper = ANY (ARRAY['firecrawl'::text, 'zenrows'::text, 'vision'::text])))
);


ALTER TABLE public.scrape_usage_log OWNER TO postgres;

--
-- Name: admin_scrape_usage_by_user; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.admin_scrape_usage_by_user AS
 SELECT sul.user_id,
    COALESCE(p.display_name, p.email, 'Usuario sin nombre'::text) AS user_name,
    p.email AS user_email,
    (count(*))::integer AS total_scrapes,
    (count(*) FILTER (WHERE sul.token_charged))::integer AS total_token_charged,
    (count(*) FILTER (WHERE sul.success))::integer AS total_success,
    (count(*) FILTER (WHERE (NOT sul.success)))::integer AS total_failed,
    (count(*) FILTER (WHERE (sul.channel = 'url'::text)))::integer AS total_url_scrapes,
    (count(*) FILTER (WHERE (sul.channel = 'image'::text)))::integer AS total_image_scrapes,
    max(sul.created_at) AS last_scrape_at
   FROM (public.scrape_usage_log sul
     LEFT JOIN public.profiles p ON ((p.user_id = sul.user_id)))
  GROUP BY sul.user_id, p.display_name, p.email;


ALTER VIEW public.admin_scrape_usage_by_user OWNER TO postgres;

--
-- Name: agency_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_pub_id uuid NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    author text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agency_comments OWNER TO postgres;

--
-- Name: agent_publications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    org_id uuid NOT NULL,
    status public.agent_pub_status DEFAULT 'disponible'::public.agent_pub_status NOT NULL,
    listing_type public.listing_type DEFAULT 'rent'::public.listing_type NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    published_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_publications OWNER TO postgres;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_url text,
    title text NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    neighborhood text DEFAULT ''::text NOT NULL,
    city text DEFAULT ''::text NOT NULL,
    lat numeric,
    lng numeric,
    m2_total numeric DEFAULT 0 NOT NULL,
    rooms integer DEFAULT 1 NOT NULL,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    currency public.currency_code DEFAULT 'USD'::public.currency_code NOT NULL,
    price_amount numeric DEFAULT 0 NOT NULL,
    price_expenses numeric DEFAULT 0 NOT NULL,
    total_cost numeric DEFAULT 0 NOT NULL,
    raw_ai_data jsonb,
    ref text DEFAULT ''::text NOT NULL,
    details text DEFAULT ''::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: status_history_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status_history_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_listing_id uuid NOT NULL,
    old_status public.user_listing_status,
    new_status public.user_listing_status NOT NULL,
    changed_by uuid NOT NULL,
    event_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.status_history_log OWNER TO postgres;

--
-- Name: user_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    org_id uuid NOT NULL,
    current_status public.user_listing_status DEFAULT 'ingresado'::public.user_listing_status NOT NULL,
    listing_type public.listing_type DEFAULT 'rent'::public.listing_type NOT NULL,
    source_publication_id uuid,
    added_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    admin_hidden boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_listings OWNER TO postgres;

--
-- Name: agent_deserter_insights; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.agent_deserter_insights AS
 SELECT ap.org_id AS agency_org_id,
    ap.id AS publication_id,
    p.title,
    slh.new_status,
    slh.event_metadata,
    count(*) AS discard_count
   FROM (((public.status_history_log slh
     JOIN public.user_listings ul ON ((ul.id = slh.user_listing_id)))
     JOIN public.agent_publications ap ON ((ap.id = ul.source_publication_id)))
     JOIN public.properties p ON ((p.id = ap.property_id)))
  WHERE (slh.new_status = 'descartado'::public.user_listing_status)
  GROUP BY ap.org_id, ap.id, p.title, slh.new_status, slh.event_metadata;


ALTER VIEW public.agent_deserter_insights OWNER TO postgres;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.app_settings OWNER TO postgres;

--
-- Name: attribute_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attribute_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    history_log_id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    score integer NOT NULL,
    CONSTRAINT attribute_scores_score_check CHECK (((score >= 1) AND (score <= 5)))
);


ALTER TABLE public.attribute_scores OWNER TO postgres;

--
-- Name: deletion_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deletion_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_user_id uuid NOT NULL,
    display_name text,
    email text,
    phone text,
    plan_type text,
    status_before text,
    reason text NOT NULL,
    deleted_by uuid NOT NULL,
    deleted_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.deletion_audit_log OWNER TO postgres;

--
-- Name: family_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_listing_id uuid NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    author text DEFAULT ''::text NOT NULL,
    avatar text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.family_comments OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type public.org_type NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    parent_id uuid,
    plan_type text DEFAULT 'free'::text NOT NULL,
    invite_code text DEFAULT encode(extensions.gen_random_bytes(6), 'hex'::text) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_personal boolean DEFAULT false NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: property_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    user_id uuid NOT NULL,
    org_id uuid NOT NULL,
    rating integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT property_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.property_reviews OWNER TO postgres;

--
-- Name: family_private_rating; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.family_private_rating AS
 SELECT pr.property_id,
    pr.org_id,
    count(*) AS total_votes,
    round(avg(pr.rating), 2) AS avg_rating,
    json_agg(json_build_object('user_id', pr.user_id, 'rating', pr.rating)) AS votes_detail
   FROM (public.property_reviews pr
     JOIN public.organizations o ON (((o.id = pr.org_id) AND (o.type = 'family'::public.org_type))))
  GROUP BY pr.property_id, pr.org_id;


ALTER VIEW public.family_private_rating OWNER TO postgres;

--
-- Name: feedback_attributes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feedback_attributes OWNER TO postgres;

--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.org_role DEFAULT 'member'::public.org_role NOT NULL,
    is_system_delegate boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.organization_members OWNER TO postgres;

--
-- Name: partner_leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partner_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_listing_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.partner_leads OWNER TO postgres;

--
-- Name: partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text DEFAULT ''::text NOT NULL,
    contact_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.partners OWNER TO postgres;

--
-- Name: property_insights_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.property_insights_summary AS
 SELECT p.id AS property_id,
    p.title,
    fa.name AS attribute_name,
    count(ats.id) AS total_scores,
    round(avg(ats.score), 2) AS avg_score
   FROM ((((public.attribute_scores ats
     JOIN public.feedback_attributes fa ON ((fa.id = ats.attribute_id)))
     JOIN public.status_history_log slh ON ((slh.id = ats.history_log_id)))
     JOIN public.user_listings ul ON ((ul.id = slh.user_listing_id)))
     JOIN public.properties p ON ((p.id = ul.property_id)))
  GROUP BY p.id, p.title, fa.name;


ALTER VIEW public.property_insights_summary OWNER TO postgres;

--
-- Name: property_views_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_views_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.property_views_log OWNER TO postgres;

--
-- Name: public_global_rating; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.public_global_rating AS
 SELECT property_id,
    count(*) AS total_votes,
    round(avg(rating), 2) AS avg_rating
   FROM public.property_reviews
  GROUP BY property_id;


ALTER VIEW public.public_global_rating OWNER TO postgres;

--
-- Name: publication_deletion_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publication_deletion_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pub_id uuid,
    pub_type text,
    title text,
    org_name text,
    status_before text,
    reason text NOT NULL,
    deleted_by uuid NOT NULL,
    deleted_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.publication_deletion_audit_log OWNER TO postgres;

--
-- Name: system_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_config (
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public.system_config OWNER TO postgres;

--
-- Name: user_listing_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_listing_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_listing_id uuid NOT NULL,
    image_url text NOT NULL,
    added_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_listing_attachments OWNER TO postgres;

--
-- Name: user_listing_comment_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_listing_comment_reads (
    user_listing_id uuid NOT NULL,
    user_id uuid NOT NULL,
    last_read_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_listing_comment_reads OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2026_03_16; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_16 OWNER TO supabase_admin;

--
-- Name: messages_2026_03_17; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_17 OWNER TO supabase_admin;

--
-- Name: messages_2026_03_18; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_18 OWNER TO supabase_admin;

--
-- Name: messages_2026_03_19; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_19 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_19 OWNER TO supabase_admin;

--
-- Name: messages_2026_03_20; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_20 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_20 OWNER TO supabase_admin;

--
-- Name: messages_2026_03_21; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_21 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_21 OWNER TO supabase_admin;

--
-- Name: messages_2026_03_22; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2026_03_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2026_03_22 OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text,
    created_by text,
    idempotency_key text,
    rollback text[]
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


ALTER TABLE supabase_migrations.seed_files OWNER TO postgres;

--
-- Name: messages_2026_03_16; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_16 FOR VALUES FROM ('2026-03-16 00:00:00') TO ('2026-03-17 00:00:00');


--
-- Name: messages_2026_03_17; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_17 FOR VALUES FROM ('2026-03-17 00:00:00') TO ('2026-03-18 00:00:00');


--
-- Name: messages_2026_03_18; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_18 FOR VALUES FROM ('2026-03-18 00:00:00') TO ('2026-03-19 00:00:00');


--
-- Name: messages_2026_03_19; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_19 FOR VALUES FROM ('2026-03-19 00:00:00') TO ('2026-03-20 00:00:00');


--
-- Name: messages_2026_03_20; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_20 FOR VALUES FROM ('2026-03-20 00:00:00') TO ('2026-03-21 00:00:00');


--
-- Name: messages_2026_03_21; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_21 FOR VALUES FROM ('2026-03-21 00:00:00') TO ('2026-03-22 00:00:00');


--
-- Name: messages_2026_03_22; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_03_22 FOR VALUES FROM ('2026-03-22 00:00:00') TO ('2026-03-23 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
a31b8ecb-24eb-4824-ba6f-04c5e8340643	a31b8ecb-24eb-4824-ba6f-04c5e8340643	{"sub": "a31b8ecb-24eb-4824-ba6f-04c5e8340643", "name": "admin", "email": "admin@1.com", "phone": "094666333", "full_name": "admin", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "admin", "email_verified": false, "phone_verified": false}	email	2026-03-15 05:25:49.084788+00	2026-03-15 05:25:49.085178+00	2026-03-15 05:25:49.085178+00	8ecb8745-5680-4bfc-99e2-5812521c4c6e
3911fef4-1232-4bb4-af56-9a4c234caaea	3911fef4-1232-4bb4-af56-9a4c234caaea	{"sub": "3911fef4-1232-4bb4-af56-9a4c234caaea", "name": "name1", "email": "1@1.com", "phone": "09465666", "full_name": "name1", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name1", "email_verified": false, "phone_verified": false}	email	2026-03-17 06:34:10.522577+00	2026-03-17 06:34:10.522626+00	2026-03-17 06:34:10.522626+00	6698a3ce-0fb9-483e-a64f-3a9706dc1c7c
67b3a6af-e66e-4139-91b6-5fc7a2835fdd	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	{"sub": "67b3a6af-e66e-4139-91b6-5fc7a2835fdd", "name": "name2", "email": "2@1.com", "phone": "09565656", "full_name": "name2", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name2", "email_verified": false, "phone_verified": false}	email	2026-03-17 15:54:39.602654+00	2026-03-17 15:54:39.603715+00	2026-03-17 15:54:39.603715+00	6af8982a-2021-459e-b191-5c9e14736516
6ce9e7c7-0070-4327-a1d4-6dcad40d93df	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	{"sub": "6ce9e7c7-0070-4327-a1d4-6dcad40d93df", "name": "Name3", "email": "3@1.com", "phone": "+59894797659", "full_name": "Name3", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "Name3", "email_verified": false, "phone_verified": false}	email	2026-03-17 16:43:37.360923+00	2026-03-17 16:43:37.361392+00	2026-03-17 16:43:37.361392+00	60649170-90d1-4b80-a704-bc0f7cd4920e
588afe49-5f74-463b-8ce3-3e938b795c81	588afe49-5f74-463b-8ce3-3e938b795c81	{"sub": "588afe49-5f74-463b-8ce3-3e938b795c81", "name": "name4", "email": "4@1.com", "phone": "094665656", "full_name": "name4", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name4", "email_verified": false, "phone_verified": false}	email	2026-03-17 17:06:56.566194+00	2026-03-17 17:06:56.56624+00	2026-03-17 17:06:56.56624+00	72da60de-5f80-4a32-b054-6cc49481468a
e23aa8ce-5b76-452a-b63f-5350daf6a6c4	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	{"sub": "e23aa8ce-5b76-452a-b63f-5350daf6a6c4", "name": "name5", "email": "5@1.com", "phone": "09465656", "full_name": "name5", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name5", "email_verified": false, "phone_verified": false}	email	2026-03-17 17:25:10.36494+00	2026-03-17 17:25:10.365335+00	2026-03-17 17:25:10.365335+00	921616d5-dc47-4233-8585-2aae78db7cb5
f22cd98e-7fd0-4a48-b70a-59194e7ffde1	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	{"sub": "f22cd98e-7fd0-4a48-b70a-59194e7ffde1", "name": "agente1", "email": "agente1@1.com", "phone": "094656366", "full_name": "agente1", "agency_name": "agencia1", "account_type": "agency", "agency_phone": "094633666", "display_name": "agente1", "email_verified": false, "phone_verified": false}	email	2026-03-17 20:06:15.19373+00	2026-03-17 20:06:15.194099+00	2026-03-17 20:06:15.194099+00	94e4fe46-cfab-4a06-9de2-230037b478a3
382e86d0-60d9-4acb-a42b-360a0bfa1666	382e86d0-60d9-4acb-a42b-360a0bfa1666	{"sub": "382e86d0-60d9-4acb-a42b-360a0bfa1666", "name": "agencyOwner1", "email": "agencyowner1@1.com", "phone": "09489666", "full_name": "agencyOwner1", "agency_name": "agencia1", "account_type": "agency", "agency_phone": "09465333", "display_name": "agencyOwner1", "email_verified": false, "phone_verified": false}	email	2026-03-17 21:50:55.248562+00	2026-03-17 21:50:55.24861+00	2026-03-17 21:50:55.24861+00	b392f62e-80e3-4fae-a5d0-c496e432ea9f
9e984948-edea-4116-b20e-b63ea3b0555f	9e984948-edea-4116-b20e-b63ea3b0555f	{"sub": "9e984948-edea-4116-b20e-b63ea3b0555f", "name": "agente2000", "email": "agente2000@1.com", "phone": "09465656", "full_name": "agente2000", "agency_name": "agencia2000", "account_type": "agency", "agency_phone": "09563232", "display_name": "agente2000", "email_verified": false, "phone_verified": false}	email	2026-03-18 00:41:35.379212+00	2026-03-18 00:41:35.380109+00	2026-03-18 00:41:35.380109+00	ec6fdb03-2ba7-4cda-9939-6d6919b8ef44
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
a9e25f4e-8044-4c49-9807-65ee45c0a7b2	2026-03-18 03:17:43.572615+00	2026-03-18 03:17:43.572615+00	password	ab9fd075-55d3-485c-9309-734d96bc1c74
95c154ea-41e1-4cf5-89b6-4847038bbba6	2026-03-18 03:23:10.354835+00	2026-03-18 03:23:10.354835+00	password	c9c8c2fd-440c-43ac-a86c-f26a90a621cc
2d208880-9f10-4f1d-83ce-6d2bc78c246f	2026-03-18 03:23:34.723278+00	2026-03-18 03:23:34.723278+00	password	15b42922-5689-42a2-8d7a-b1d9d6fb49e1
251ec0c1-2e40-4aeb-8150-c54c07cddbc9	2026-03-18 03:37:08.257338+00	2026-03-18 03:37:08.257338+00	password	27c98cc1-7918-4ef9-88cf-43d039572ab7
0af3bb93-a793-455f-a457-eb72f56cbee0	2026-03-18 03:37:17.492422+00	2026-03-18 03:37:17.492422+00	password	5e6c3440-5d89-4c74-8385-e2f91b97fb05
8d218c27-3316-4cf3-afa4-f37f719a79ad	2026-03-18 03:37:28.552537+00	2026-03-18 03:37:28.552537+00	password	97d3154a-4a05-4e89-82a3-1d823b9e7ed0
aaceb4f0-80f3-4aa5-ac0b-b725be891d4d	2026-03-18 03:38:36.513089+00	2026-03-18 03:38:36.513089+00	password	abd1c45b-baaa-4388-9e3c-03faa6910d6c
063b0e79-a3d6-4b8b-b8cd-858da3939244	2026-03-18 03:38:53.64371+00	2026-03-18 03:38:53.64371+00	password	be4d8544-f8b5-4523-9054-04ecac2b0563
2e3a4ea5-b0f5-4402-b072-d2e9723e3be2	2026-03-18 03:42:36.399679+00	2026-03-18 03:42:36.399679+00	password	9ee12e00-72fe-42cf-8523-69b2168782fa
18756145-3a03-466d-9c73-366046606279	2026-03-18 03:46:31.080618+00	2026-03-18 03:46:31.080618+00	password	8d5c61b2-377d-47e1-9cd8-8b3c4c29dba3
fcd71b78-3540-4db3-8d6f-27a382401a5d	2026-03-18 22:02:20.248318+00	2026-03-18 22:02:20.248318+00	password	f3203785-f5fc-4e96-a1af-e3b9edf02c0b
59504ee0-9775-46c4-a425-0b57708d0900	2026-03-19 03:18:48.222023+00	2026-03-19 03:18:48.222023+00	password	04babf50-feff-4903-abd3-cbf4a506fca9
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	379	ljllaoewj4fd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 05:14:30.713222+00	2026-03-18 19:24:47.537509+00	yjecvkksb64m	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	386	rhsqagv2krpc	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 19:17:34.922748+00	2026-03-18 20:15:38.139362+00	6lzeqdudx7jc	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	389	ao64w5aiz737	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 20:15:38.151486+00	2026-03-18 21:14:08.581417+00	rhsqagv2krpc	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	392	77zmn35el6er	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 21:14:08.606991+00	2026-03-18 22:12:38.064457+00	ao64w5aiz737	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	384	6bzksw7veyta	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-18 05:43:14.972216+00	2026-03-18 22:31:48.192949+00	dsr2xtd2zobo	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	395	6jyp7b7ua74m	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-18 22:01:47.537729+00	2026-03-18 22:59:49.675511+00	nqk4zrlppcus	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	396	jlfrn2ngawcv	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-18 22:02:20.236559+00	2026-03-18 23:00:50.408189+00	\N	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	398	y6ekj4jgfzp5	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 22:19:19.864306+00	2026-03-18 23:17:20.076979+00	odkistgpapv2	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	399	h53lfz77hhjs	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 22:19:48.726719+00	2026-03-18 23:17:48.994585+00	4sebq34kyxzl	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	369	mpgg6gjy3jwd	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	f	2026-03-18 03:42:36.380956+00	2026-03-18 03:42:36.380956+00	\N	2e3a4ea5-b0f5-4402-b072-d2e9723e3be2
00000000-0000-0000-0000-000000000000	401	ptkmd3t32xai	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-18 22:59:49.69601+00	2026-03-18 23:58:20.248814+00	6jyp7b7ua74m	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	362	3lkdoxgfdyr7	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-18 03:23:10.341187+00	2026-03-18 04:21:19.941056+00	\N	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	363	gj3bqmgpwipg	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	t	2026-03-18 03:23:34.708443+00	2026-03-18 04:21:50.882282+00	\N	2d208880-9f10-4f1d-83ce-6d2bc78c246f
00000000-0000-0000-0000-000000000000	402	jihlrv2seh7b	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-18 23:00:50.414458+00	2026-03-18 23:59:20.051104+00	jlfrn2ngawcv	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	371	yjecvkksb64m	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 04:16:00.446198+00	2026-03-18 05:14:30.644005+00	brgutxxy2ybp	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	374	seh3rd6kvb5c	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-18 04:35:24.091226+00	2026-03-18 05:33:48.314627+00	5r6eedbilh2d	251ec0c1-2e40-4aeb-8150-c54c07cddbc9
00000000-0000-0000-0000-000000000000	381	ee27ezhauyq7	3911fef4-1232-4bb4-af56-9a4c234caaea	f	2026-03-18 05:33:48.332741+00	2026-03-18 05:33:48.332741+00	seh3rd6kvb5c	251ec0c1-2e40-4aeb-8150-c54c07cddbc9
00000000-0000-0000-0000-000000000000	377	dsr2xtd2zobo	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-18 04:44:44.57718+00	2026-03-18 05:43:14.950354+00	q5ezmxopltmx	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	404	tnpsf4lhkt45	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 23:17:20.095979+00	2026-03-19 00:15:22.322966+00	y6ekj4jgfzp5	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	405	rczd6pu5htzk	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 23:17:49.001127+00	2026-03-19 00:16:19.290914+00	h53lfz77hhjs	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	407	jnztpe23zaib	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-18 23:58:20.262295+00	2026-03-19 00:56:50.068099+00	ptkmd3t32xai	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	408	reevvgn6qw5k	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-18 23:59:20.064655+00	2026-03-19 00:57:50.350271+00	jihlrv2seh7b	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	410	gzg37icyhgg6	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-19 00:15:22.334374+00	2026-03-19 01:13:50.752572+00	tnpsf4lhkt45	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	411	babh57p5szma	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-19 00:16:19.301116+00	2026-03-19 01:14:49.17614+00	rczd6pu5htzk	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	413	mee2z3vcbeaz	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-19 00:56:50.092678+00	2026-03-19 01:55:20.165658+00	jnztpe23zaib	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	414	j6tgzltl2zba	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-19 00:57:50.538684+00	2026-03-19 01:56:20.236858+00	reevvgn6qw5k	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	416	err3ir5n4pbk	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-19 01:13:50.763086+00	2026-03-19 02:11:52.551661+00	gzg37icyhgg6	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	417	qfeswnb6lnoj	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-19 01:14:49.184494+00	2026-03-19 02:13:19.265555+00	babh57p5szma	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	419	chua7blppq2q	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-19 01:55:20.181466+00	2026-03-19 02:53:27.148245+00	mee2z3vcbeaz	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	420	3rbp4focpbbu	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-19 01:56:20.241746+00	2026-03-19 02:54:27.857254+00	j6tgzltl2zba	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	422	oymurlehha7h	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-19 02:11:52.558463+00	2026-03-19 03:10:09.73363+00	err3ir5n4pbk	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	424	hjgtms2mws6q	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-19 02:25:35.800852+00	2026-03-19 03:24:06.412633+00	4d6262fstrzy	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	427	jbni7ds7bnem	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-19 03:04:51.556497+00	2026-03-19 04:03:20.16417+00	b72oc4dxwy5b	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	433	ndty4wl6yz3f	3911fef4-1232-4bb4-af56-9a4c234caaea	f	2026-03-19 04:04:51.696074+00	2026-03-19 04:04:51.696074+00	34vr7zep4wcj	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	429	ydn4rpkjhbyk	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-19 03:11:49.477089+00	2026-03-19 04:10:19.555419+00	3cgkewysbng2	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	435	7ytr64yb5aud	588afe49-5f74-463b-8ce3-3e938b795c81	f	2026-03-19 04:10:19.56769+00	2026-03-19 04:10:19.56769+00	ydn4rpkjhbyk	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	431	iu5kel4kgj6s	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-19 03:24:06.433066+00	2026-03-19 04:22:36.341788+00	hjgtms2mws6q	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	437	ihpbptoyoy2x	382e86d0-60d9-4acb-a42b-360a0bfa1666	f	2026-03-19 06:34:08.203872+00	2026-03-19 06:34:08.203872+00	i3gi4qf2opkz	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	383	6lzeqdudx7jc	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 05:35:40.470391+00	2026-03-18 19:17:34.814905+00	jvi6gun73v3s	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	382	achdiesh2wit	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 05:35:25.817748+00	2026-03-18 19:25:12.154584+00	lys5aylth4il	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	388	5jn4mgtg6uzg	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 19:25:12.171103+00	2026-03-18 20:23:13.930968+00	achdiesh2wit	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	387	ofozz6dcdirh	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 19:24:47.550705+00	2026-03-18 20:23:18.713153+00	ljllaoewj4fd	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	391	47vmvtyrnalp	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 20:23:18.727116+00	2026-03-18 21:21:19.499988+00	ofozz6dcdirh	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	390	p2l7khxgb3uh	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 20:23:13.947175+00	2026-03-18 21:21:43.77687+00	5jn4mgtg6uzg	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	385	nqk4zrlppcus	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-18 19:08:46.640923+00	2026-03-18 22:01:47.523411+00	pxhdieg2bolv	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	366	eljolqba6u6d	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	f	2026-03-18 03:37:28.543162+00	2026-03-18 03:37:28.543162+00	\N	8d218c27-3316-4cf3-afa4-f37f719a79ad
00000000-0000-0000-0000-000000000000	393	odkistgpapv2	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 21:21:19.590219+00	2026-03-18 22:19:19.833447+00	47vmvtyrnalp	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	394	4sebq34kyxzl	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 21:21:43.78433+00	2026-03-18 22:19:48.719524+00	p2l7khxgb3uh	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	361	brgutxxy2ybp	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-18 03:17:43.556279+00	2026-03-18 04:16:00.43076+00	\N	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	397	wiuwpyipktee	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 22:12:38.074835+00	2026-03-18 23:10:49.047345+00	77zmn35el6er	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	364	5r6eedbilh2d	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-18 03:37:08.236265+00	2026-03-18 04:35:24.072617+00	\N	251ec0c1-2e40-4aeb-8150-c54c07cddbc9
00000000-0000-0000-0000-000000000000	400	mjg5vums3bet	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-18 22:31:48.243133+00	2026-03-18 23:30:05.853472+00	6bzksw7veyta	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	367	ablrlrfsj5tp	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 03:38:36.503163+00	2026-03-18 04:36:54.963181+00	\N	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	403	cdzjwmc6yl4c	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 23:10:49.066788+00	2026-03-19 00:09:19.989281+00	wiuwpyipktee	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	368	ztjinua5o5fz	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 03:38:53.628028+00	2026-03-18 04:37:10.38845+00	\N	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	370	q5ezmxopltmx	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-18 03:46:31.044994+00	2026-03-18 04:44:44.564014+00	\N	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	365	7abjp5bizyb3	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	t	2026-03-18 03:37:17.481741+00	2026-03-18 04:54:11.781005+00	\N	0af3bb93-a793-455f-a457-eb72f56cbee0
00000000-0000-0000-0000-000000000000	378	xzioal6thosv	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	f	2026-03-18 04:54:11.80148+00	2026-03-18 04:54:11.80148+00	7abjp5bizyb3	0af3bb93-a793-455f-a457-eb72f56cbee0
00000000-0000-0000-0000-000000000000	373	dm6s6p4ch3rb	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	t	2026-03-18 04:21:50.885686+00	2026-03-18 05:20:11.983227+00	gj3bqmgpwipg	2d208880-9f10-4f1d-83ce-6d2bc78c246f
00000000-0000-0000-0000-000000000000	380	ud44vel3cvw2	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	f	2026-03-18 05:20:11.990237+00	2026-03-18 05:20:11.990237+00	dm6s6p4ch3rb	2d208880-9f10-4f1d-83ce-6d2bc78c246f
00000000-0000-0000-0000-000000000000	375	lys5aylth4il	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-18 04:36:54.978005+00	2026-03-18 05:35:25.802124+00	ablrlrfsj5tp	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	376	jvi6gun73v3s	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-18 04:37:10.390038+00	2026-03-18 05:35:40.459165+00	ztjinua5o5fz	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	372	pxhdieg2bolv	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-18 04:21:19.954125+00	2026-03-18 19:08:46.6033+00	3lkdoxgfdyr7	95c154ea-41e1-4cf5-89b6-4847038bbba6
00000000-0000-0000-0000-000000000000	406	jy44kcgfqoee	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-18 23:30:05.962413+00	2026-03-19 00:28:36.372756+00	mjg5vums3bet	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	409	zd6kfuagwfif	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-19 00:09:20.032986+00	2026-03-19 01:07:49.778554+00	cdzjwmc6yl4c	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	412	57s3xhdkkkth	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-19 00:28:36.419507+00	2026-03-19 01:27:05.997581+00	jy44kcgfqoee	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	415	monlftk7mssz	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-19 01:07:49.790296+00	2026-03-19 02:06:19.435938+00	zd6kfuagwfif	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	418	4d6262fstrzy	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	t	2026-03-19 01:27:06.013244+00	2026-03-19 02:25:35.789471+00	57s3xhdkkkth	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	421	b72oc4dxwy5b	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	t	2026-03-19 02:06:19.450251+00	2026-03-19 03:04:51.469528+00	monlftk7mssz	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	423	3cgkewysbng2	588afe49-5f74-463b-8ce3-3e938b795c81	t	2026-03-19 02:13:19.275756+00	2026-03-19 03:11:49.47005+00	qfeswnb6lnoj	aaceb4f0-80f3-4aa5-ac0b-b725be891d4d
00000000-0000-0000-0000-000000000000	430	fp2hct6jtgej	3911fef4-1232-4bb4-af56-9a4c234caaea	f	2026-03-19 03:18:48.200493+00	2026-03-19 03:18:48.200493+00	\N	59504ee0-9775-46c4-a425-0b57708d0900
00000000-0000-0000-0000-000000000000	432	wj4y4mw6iekz	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	f	2026-03-19 04:03:20.176089+00	2026-03-19 04:03:20.176089+00	jbni7ds7bnem	063b0e79-a3d6-4b8b-b8cd-858da3939244
00000000-0000-0000-0000-000000000000	426	34vr7zep4wcj	3911fef4-1232-4bb4-af56-9a4c234caaea	t	2026-03-19 02:54:27.868544+00	2026-03-19 04:04:51.683154+00	3rbp4focpbbu	fcd71b78-3540-4db3-8d6f-27a382401a5d
00000000-0000-0000-0000-000000000000	428	wsnktwq2i6dl	a31b8ecb-24eb-4824-ba6f-04c5e8340643	t	2026-03-19 03:10:09.74709+00	2026-03-19 04:08:39.798254+00	oymurlehha7h	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	434	hobkfvrdz3x4	a31b8ecb-24eb-4824-ba6f-04c5e8340643	f	2026-03-19 04:08:39.808576+00	2026-03-19 04:08:39.808576+00	wsnktwq2i6dl	a9e25f4e-8044-4c49-9807-65ee45c0a7b2
00000000-0000-0000-0000-000000000000	436	usazzu3njxz2	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	f	2026-03-19 04:22:36.353324+00	2026-03-19 04:22:36.353324+00	iu5kel4kgj6s	18756145-3a03-466d-9c73-366046606279
00000000-0000-0000-0000-000000000000	425	i3gi4qf2opkz	382e86d0-60d9-4acb-a42b-360a0bfa1666	t	2026-03-19 02:53:27.162321+00	2026-03-19 06:34:08.174863+00	chua7blppq2q	95c154ea-41e1-4cf5-89b6-4847038bbba6
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
2d208880-9f10-4f1d-83ce-6d2bc78c246f	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	2026-03-18 03:23:34.674879+00	2026-03-18 05:20:11.997339+00	\N	aal1	\N	2026-03-18 05:20:11.997251	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	167.60.167.217	\N	\N	\N	\N	\N
251ec0c1-2e40-4aeb-8150-c54c07cddbc9	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 03:37:08.210628+00	2026-03-18 05:33:48.346323+00	\N	aal1	\N	2026-03-18 05:33:48.345865	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	167.60.167.217	\N	\N	\N	\N	\N
8d218c27-3316-4cf3-afa4-f37f719a79ad	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	2026-03-18 03:37:28.536977+00	2026-03-18 03:37:28.536977+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	167.60.167.217	\N	\N	\N	\N	\N
2e3a4ea5-b0f5-4402-b072-d2e9723e3be2	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	2026-03-18 03:42:36.357364+00	2026-03-18 03:42:36.357364+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 15; 2312DRA50G Build/AQ3A.240912.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.159 Mobile Safari/537.36	167.60.167.217	\N	\N	\N	\N	\N
59504ee0-9775-46c4-a425-0b57708d0900	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-19 03:18:48.184842+00	2026-03-19 03:18:48.184842+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
063b0e79-a3d6-4b8b-b8cd-858da3939244	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	2026-03-18 03:38:53.610118+00	2026-03-19 04:03:20.185503+00	\N	aal1	\N	2026-03-19 04:03:20.185407	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
0af3bb93-a793-455f-a457-eb72f56cbee0	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	2026-03-18 03:37:17.471855+00	2026-03-18 04:54:11.809512+00	\N	aal1	\N	2026-03-18 04:54:11.809421	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	167.60.167.217	\N	\N	\N	\N	\N
fcd71b78-3540-4db3-8d6f-27a382401a5d	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 22:02:20.206792+00	2026-03-19 04:04:51.709215+00	\N	aal1	\N	2026-03-19 04:04:51.708444	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
a9e25f4e-8044-4c49-9807-65ee45c0a7b2	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 03:17:43.534998+00	2026-03-19 04:08:39.822538+00	\N	aal1	\N	2026-03-19 04:08:39.822435	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.6.11 Chrome/142.0.7444.265 Electron/39.6.0 Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
aaceb4f0-80f3-4aa5-ac0b-b725be891d4d	588afe49-5f74-463b-8ce3-3e938b795c81	2026-03-18 03:38:36.491276+00	2026-03-19 04:10:19.579744+00	\N	aal1	\N	2026-03-19 04:10:19.579645	Mozilla/5.0 (Linux; Android 11; 2107113SI Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.120 Mobile Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
18756145-3a03-466d-9c73-366046606279	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	2026-03-18 03:46:31.013604+00	2026-03-19 04:22:36.362825+00	\N	aal1	\N	2026-03-19 04:22:36.362718	Mozilla/5.0 (Linux; Android 11; 2107113SI Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.120 Mobile Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
95c154ea-41e1-4cf5-89b6-4847038bbba6	382e86d0-60d9-4acb-a42b-360a0bfa1666	2026-03-18 03:23:10.319576+00	2026-03-19 06:34:08.217939+00	\N	aal1	\N	2026-03-19 06:34:08.217835	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	167.61.205.187	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	a31b8ecb-24eb-4824-ba6f-04c5e8340643	authenticated	authenticated	admin@1.com	$2a$10$exdPVzL1U/fsUp6KTvDS..Ovih1VRZ1N8MJVAJHOvXW5d56jqzxvm	2026-03-15 05:25:49.103808+00	\N		\N		\N			\N	2026-03-18 03:17:43.534899+00	{"provider": "email", "providers": ["email"]}	{"sub": "a31b8ecb-24eb-4824-ba6f-04c5e8340643", "name": "admin", "email": "admin@1.com", "phone": "094666333", "full_name": "admin", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "admin", "email_verified": true, "phone_verified": false}	\N	2026-03-15 05:25:49.000524+00	2026-03-19 04:08:39.814533+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	382e86d0-60d9-4acb-a42b-360a0bfa1666	authenticated	authenticated	agencyowner1@1.com	$2a$10$b.pw7RoVnAc.u6eTl19vyO8msmyjdSoPVY9IadzdzAlSiq2dfoBgu	2026-03-17 21:50:55.25723+00	\N		\N		\N			\N	2026-03-18 03:23:10.319166+00	{"provider": "email", "providers": ["email"]}	{"sub": "382e86d0-60d9-4acb-a42b-360a0bfa1666", "name": "agencyOwner1", "email": "agencyowner1@1.com", "phone": "09489666", "full_name": "agencyOwner1", "agency_name": "agencia1", "account_type": "agency", "agency_phone": "09465333", "display_name": "agencyOwner1", "email_verified": true, "phone_verified": false}	\N	2026-03-17 21:50:55.191152+00	2026-03-19 06:34:08.212955+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	authenticated	authenticated	5@1.com	$2a$10$bEKahndk06ORHJmCgiT.g.5TocfGMn5IrtrJHs82vOgXHkNWJ5MwO	2026-03-17 17:25:10.375186+00	\N		\N		\N			\N	2026-03-18 03:38:53.60832+00	{"provider": "email", "providers": ["email"]}	{"sub": "e23aa8ce-5b76-452a-b63f-5350daf6a6c4", "name": "name5", "email": "5@1.com", "phone": "09465656", "full_name": "name5", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name5", "email_verified": true, "phone_verified": false}	\N	2026-03-17 17:25:10.281206+00	2026-03-19 04:03:20.182613+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9e984948-edea-4116-b20e-b63ea3b0555f	authenticated	authenticated	agente2000@1.com	$2a$10$eY7vDukGa6Jkb9ztBMupnOtLN/klaRrt6MHZvChrimnDEABbC27jy	2026-03-18 00:41:35.392001+00	\N		\N		\N			\N	2026-03-18 02:45:24.626529+00	{"provider": "email", "providers": ["email"]}	{"sub": "9e984948-edea-4116-b20e-b63ea3b0555f", "name": "agente2000", "email": "agente2000@1.com", "phone": "09465656", "full_name": "agente2000", "agency_name": "agencia2000", "account_type": "agency", "agency_phone": "09563232", "display_name": "agente2000", "email_verified": true, "phone_verified": false}	\N	2026-03-18 00:41:35.209499+00	2026-03-18 02:45:38.682394+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3911fef4-1232-4bb4-af56-9a4c234caaea	authenticated	authenticated	1@1.com	$2a$10$kGfAPTDzmNRr4gYqTmbhjO3qJAoXblOrvwGhxja4fsmpPQqZQHNB.	2026-03-17 06:34:10.531433+00	\N		\N		\N			\N	2026-03-19 03:18:48.183252+00	{"provider": "email", "providers": ["email"]}	{"sub": "3911fef4-1232-4bb4-af56-9a4c234caaea", "name": "name1", "email": "1@1.com", "phone": "09465666", "full_name": "name1", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name1", "email_verified": true, "phone_verified": false}	\N	2026-03-17 06:34:10.436477+00	2026-03-19 04:04:51.704094+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	588afe49-5f74-463b-8ce3-3e938b795c81	authenticated	authenticated	4@1.com	$2a$10$IXn5T07P/hyEngoy43WuK.81GHosWWHuDgC0oBkrkmaG7uVzbx5Uq	2026-03-17 17:06:56.579112+00	\N		\N		\N			\N	2026-03-18 03:38:36.491184+00	{"provider": "email", "providers": ["email"]}	{"sub": "588afe49-5f74-463b-8ce3-3e938b795c81", "name": "name4", "email": "4@1.com", "phone": "094665656", "full_name": "name4", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name4", "email_verified": true, "phone_verified": false}	\N	2026-03-17 17:06:56.505872+00	2026-03-19 04:10:19.574479+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	authenticated	authenticated	agente1@1.com	$2a$10$7K8s9PaxB7NZo/ERZn.az.Ps3Xhm0uJluKPVTmyi.uA0zVPAA43.C	2026-03-17 20:06:15.202291+00	\N		\N		\N			\N	2026-03-18 03:23:34.671569+00	{"provider": "email", "providers": ["email"]}	{"sub": "f22cd98e-7fd0-4a48-b70a-59194e7ffde1", "name": "agente1", "email": "agente1@1.com", "phone": "094656366", "full_name": "agente1", "agency_name": "agencia1", "account_type": "agency", "agency_phone": "094633666", "display_name": "agente1", "email_verified": true, "phone_verified": false}	\N	2026-03-17 20:06:15.121323+00	2026-03-18 05:20:11.995175+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	authenticated	authenticated	3@1.com	$2a$10$l8qYsc2Zoszq1mnAIznf2O6LcgLCMKtBNj6UvJHmYM5okx9HPs/u6	2026-03-17 16:43:37.374449+00	\N		\N		\N			\N	2026-03-18 03:46:31.013478+00	{"provider": "email", "providers": ["email"]}	{"sub": "6ce9e7c7-0070-4327-a1d4-6dcad40d93df", "name": "Name3", "email": "3@1.com", "phone": "+59894797659", "full_name": "Name3", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "Name3", "email_verified": true, "phone_verified": false}	\N	2026-03-17 16:43:37.289612+00	2026-03-19 04:22:36.359093+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	authenticated	authenticated	2@1.com	$2a$10$a7cGVDGziUSfLj7Jmj9BkOINvAB/MPgac/.kPLW/8LAUOIH9XmVgq	2026-03-17 15:54:39.61604+00	\N		\N		\N			\N	2026-03-18 03:42:36.356923+00	{"provider": "email", "providers": ["email"]}	{"sub": "67b3a6af-e66e-4139-91b6-5fc7a2835fdd", "name": "name2", "email": "2@1.com", "phone": "09565656", "full_name": "name2", "agency_name": "", "account_type": "user", "agency_phone": "", "display_name": "name2", "email_verified": true, "phone_verified": false}	\N	2026-03-17 15:54:39.534482+00	2026-03-18 04:54:11.806236+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: admin_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_keys (id, cuenta, descripcion, texto, estado, created_by, created_by_name, created_at, updated_at, estado_updated_at, fecha) FROM stdin;
9a78c4cc-bde8-49ea-a73c-24f6d12e82b3	juan.sequeira	fc-a5daaf5dbb094c8b97a71b05793b9e84	api de firecrawl	valido	a31b8ecb-24eb-4824-ba6f-04c5e8340643	admin	2026-03-17 00:52:16.674925+00	2026-03-17 00:52:16.674925+00	2026-03-17 00:52:16.674925+00	\N
a8c024db-95a6-4916-9783-741e281740c0	juan.seq	apikey deepseek	sk-18838a4f3d01497f9d7a0d6e0bf61df6	valido	a31b8ecb-24eb-4824-ba6f-04c5e8340643	admin	2026-03-17 04:58:12.529233+00	2026-03-17 04:58:12.529233+00	2026-03-17 04:58:12.529233+00	\N
b6057e45-c4a9-4e62-929b-e1ccb0870d2f	juan		bug1  en una famiila 1-2-3 que tiene compartido 1 aviso  XX.   si otro user que tiene guardado ese mismo aviso XX  se ingresa  a la famila dsp  ese aviso aparece 2 veces.  un aviso guardado por el y el aviso compartido familar-	valido	a31b8ecb-24eb-4824-ba6f-04c5e8340643	admin	2026-03-17 17:45:07.141448+00	2026-03-17 17:45:07.141448+00	2026-03-17 17:45:07.141448+00	\N
\.


--
-- Data for Name: agency_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agency_comments (id, agent_pub_id, user_id, text, author, created_at) FROM stdin;
\.


--
-- Data for Name: agent_publications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_publications (id, property_id, org_id, status, listing_type, description, views_count, published_by, created_at, updated_at) FROM stdin;
ee3854ef-3beb-498a-b01c-4a31dbea2d00	ae36cdb4-c58f-4fb1-b91c-226f9c17278f	b850d854-468e-43d4-931b-620932873b34	disponible	rent	Se alquila local comercial en Cerrito, Montevideo, con 1 ambiente, 1 baño y 50m² edificados. Ideal para Red Pagos o financiera, ofrece buena visibilidad. El precio de alquiler es de $19.000.	0	9e984948-edea-4116-b20e-b63ea3b0555f	2026-03-18 01:21:13.482317+00	2026-03-18 01:21:13.482317+00
a483b9ea-6a8e-4f48-885c-c0c52b237d33	0c01a605-fa43-4c2a-9a61-5b4916051653	b850d854-468e-43d4-931b-620932873b34	disponible	rent	Esta espaciosa vivienda en Tres Cruces ofrece 3 dormitorios grandes, living comedor, cocina equipada y 2 baños completos. Además, cuenta con garaje, fondo verde privado y barbacoa con parrillero, ideal para disfrutar en familia. Se considera un posible 4to dormitorio o cuarto de servicio.	0	9e984948-edea-4116-b20e-b63ea3b0555f	2026-03-18 01:37:25.414685+00	2026-03-18 01:37:25.414685+00
8764e6dd-dbd4-4a65-b8a9-a952540fb090	b00ffa8d-5b82-4b79-ac99-c0be74b9e604	9b53e2f2-1159-4836-a6a1-6b82a6b4fdef	disponible	rent	Apartamento cómodo y luminoso en Unión, ideal para alquiler. Cuenta con dos dormitorios, incluyendo uno pequeño tipo escritorio, y un baño. Disfruta de un pequeño patio y una azotea de uso exclusivo con parrillero. No tiene gastos comunes.	2	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	2026-03-18 04:29:02.400104+00	2026-03-18 22:41:02.845004+00
95ceb3c9-77fe-435b-8b3d-dd46e4067deb	823faf24-7283-456d-920f-cacac89bbe05	03f5ded7-8507-447d-be97-ed7ccf4416ee	disponible	rent	Este apartamento en planta baja en Pocitos es ideal para quienes buscan comodidad y practicidad. Cuenta con cocina definida, un dormitorio, baño completo y un patio. Con gastos comunes accesibles, es una excelente opción de alquiler en una ubicación privilegiada.	0	382e86d0-60d9-4acb-a42b-360a0bfa1666	2026-03-19 02:36:04.354915+00	2026-03-19 02:36:04.354915+00
63d31618-7222-4f70-8a0f-5eb41469941f	1f432440-007f-4e6e-ae17-0583722cb0c8	03f5ded7-8507-447d-be97-ed7ccf4416ee	disponible	sale	Este apartamento contrafrente en Aguada, ideal para vivir por su proximidad a servicios, o como una excelente oportunidad de inversión. Ofrece dos dormitorios, living comedor, cocina definida y baño. El edificio cuenta con ascensor y circuito de cámaras de seguridad para mayor tranquilidad. Se encuentra en un primer piso con orientación este. Un lugar ideal en una zona en constante crecimiento, próxima a supermercados, y locomoción.	0	382e86d0-60d9-4acb-a42b-360a0bfa1666	2026-03-19 02:37:48.415478+00	2026-03-19 02:37:48.415478+00
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_settings (key, value, description, updated_by, updated_at) FROM stdin;
scraper_prompt_user	Sos un extractor de avisos inmobiliarios de Uruguay. Reglas muy estrictas:\n- TIPO DE OPERACIÓN (PRIORIDAD MÁXIMA): Determiná si el aviso es alquiler o venta.\n  → Palabras clave de VENTA: "venta", "en venta", "se vende", "precio de venta", "compra". Retorná listingType: "sale"\n  → Palabras clave de ALQUILER: "alquiler", "se alquila", "arriendo", "renta". Retorná listingType: "rent"\n  → Ante duda: las ventas tienen precios altos en USD sin cuota mensual; los alquileres tienen precio mensual + gastos comunes.\n- MONEDA: URL con ".uy" → UYU. "U$S" o "USD" → USD. "$" sin aclaración → ARS.\n- PRECIO: En alquiler extraé precio mensual + gastos comunes/G.C./expensas por separado. En venta, extraé el precio total en priceRent y dejá priceExpenses en 0.\n- BARRIO: Solo el barrio o zona. NUNCA la ciudad.\n- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3. (ambientes = dormitorios + 1)\n- SUPERFICIE: Priorizá metros cubiertos sobre totales si ambos aparecen.\n- RESUMEN: 1-2 oraciones. Mencioná siempre si es venta o alquiler.\n- Dato no disponible → número 0 o texto vacío. Never invent data..	Prompt para usuarios	\N	2026-03-15 18:26:33.750361+00
scraper_prompt_agent	Sos un extractor de avisos inmobiliarios profesional para agencias de Uruguay. Reglas muy estrictas:\n- MONEDA: Si la URL contiene ".uy" → UYU. Si contiene ".com.ar" o precio en "$" → ARS. "U$S" o "USD" → USD.\n- PRECIO: Extraé precio de alquiler/venta y gastos comunes por separado.\n- TIPO DE OPERACIÓN: Si el aviso es una venta, retorná listingType: "sale". Si es alquiler, retorná listingType: "rent". Buscá palabras como "venta", "en venta", "se vende", "compra", "sale price" para determinar si es venta.\n- BARRIO: Extraé el barrio o zona mencionada. NUNCA pongas la ciudad, solo el barrio.\n- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3. (ambientes = dormitorios + 1)\n- SUPERFICIE: Extraé los metros cuadrados. Diferenciá entre superficie total y cubierta si aparecen.\n- RESUMEN: Hacé un resumen profesional de 2-3 oraciones orientado a la venta/alquiler del inmueble.\n- Si un dato no está disponible, dejá el número en 0 o el texto vacío. Never invent data.	Prompt para agentes	\N	2026-03-15 18:27:39.728742+00
image_extract_prompt_user	Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay a partir de capturas de pantalla de publicaciones en redes sociales (Instagram, Facebook Marketplace, etc.).\nAnalizá la imagen y extraé los datos de la propiedad que puedas identificar.\n- TIPO DE OPERACIÓN: Determiná si el aviso es de VENTA ("sale") o ALQUILER ("rent"). Buscá palabras clave como "venta", "vendo", "se vende", "USD venta" para sale, o "alquiler", "alquilo", "se alquila", "/mes" para rent.\n- MONEDA: Usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares.\n- BARRIO: Extraé el barrio o zona mencionada. NUNCA pongas la ciudad.\n- AMBIENTES: "monoambiente" = 1, "1 dormitorio" = 2, "2 dormitorios" = 3 (ambientes = dormitorios + 1).\n- SUPERFICIE: Priorizá metros cubiertos sobre totales.\n- RESUMEN: Hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso. Mencioná si es venta o alquiler.\n- IMPORTANTE: Si un dato no está disponible o no se puede leer claramente en la imagen, dejalo vacío (string vacío) o en 0. No inventes datos.	Prompt para extracción de imágenes	\N	2026-03-15 18:28:11.727767+00
\.


--
-- Data for Name: attribute_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attribute_scores (id, history_log_id, attribute_id, score) FROM stdin;
\.


--
-- Data for Name: deletion_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deletion_audit_log (id, deleted_user_id, display_name, email, phone, plan_type, status_before, reason, deleted_by, deleted_at) FROM stdin;
a0e3dc10-c2a2-46e9-861a-11dd0daa49e3	a2909cd9-520e-4899-af59-8104d8956c44	agente1	agente1@1.com	095636555	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 04:41:53.247355+00
237e5716-5702-47ad-b12a-f931d31d3819	5262bf0f-1a11-48c6-94bd-bffd94075b84	Agente2	agente2@1.com	+59894797659	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 04:42:02.982432+00
5eb1ce15-dbf1-42a1-b980-64c3ae235e35	b16e006f-89f5-435b-a78f-fcde8de9ef58	agente3	agente3@1.com	094615151515	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 04:42:12.279507+00
f62344c3-b1be-4224-8b9c-9125fd921312	c396af31-ff6d-45ed-b880-1bbdc6c17914	agente1de100	agente1de100@1.com	09455454	free	active	trdy	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 04:53:07.802275+00
2cc7d3b6-7b8c-46fd-bf4e-5fbd47a59de2	e374064a-6221-4a2d-bfd3-0378bf28916c	agentewnerde100	agentewnerde100@1.com	096451515	free	active	fdfd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 04:53:18.540869+00
e7b9851c-7f71-4172-83f6-14165d6ddd46	6522b882-6215-458f-a72f-bf2337f016b7	agente1d100	agente1d100@1.com	094662323	free	active	mal ingresado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:01:32.077902+00
d41fbfdf-340f-4a9a-bb36-2d1ed5dcda91	2d5d1fe2-8d98-4f5d-ace0-687d4427fd04	agente1d500	agente1d500@1.com	09456332	free	active	mal ingresado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:01:44.384609+00
9946fc02-a8f5-47d6-a1f2-f6d9730bc6c0	83c2c9d0-d10d-490f-b97f-a716dc0e62f2	agente2d100	agente2d100@1.com	0946565633	free	active	mal ingresado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:02:00.391916+00
15bdc6e2-6242-4074-aca5-bca9b24a76a0	e6d11599-aebe-41e6-a898-10266e2f3cc9	agente1d100	agente1d100@1.com	094566336	free	active	fgsdgf	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:17:25.70829+00
def3e7ba-cbef-41fe-903f-b792abef8906	016b26e3-f1f8-47f2-a9ab-54398242974c	agente1d5000	agente1d5000@1.com	094966986	free	active	dddd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:17:34.238287+00
90e42724-e575-4986-9982-d3cb4796c7dd	7733690f-dd6d-4101-a133-0ca5f1119de2	agente3d100	agente3d100@1.com	09465622	free	active	vcdf	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:17:43.65586+00
ace1f522-7612-4718-a341-18dec0b4bce9	770ffbf3-af2b-4940-a5e3-1c5eb3ada68d	ownerAgencia100	ownerAgencia100@1.com	094633663	free	active	dffd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:17:55.667088+00
82cb739f-bca1-42bb-b99d-bf2299d55e09	8d09902a-3666-45f1-bd8c-9b9d83f6d9d9	owner1d100	owner1d100@1.com	09845565	free	active	sdsds	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:18:08.131485+00
8d693694-d4c1-431c-8dab-c64575e95f59	4c5f94ca-abe4-4b47-9edf-d3feab757529	name1	1@1.com	094566336	free	active	ffd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:18:14.076831+00
47eb9ee1-a75c-4197-8b8c-f49a634bc62c	4ecb0e77-3f58-4bba-a94d-5b3a52838d8a	name2	2@1.com	096565223	free	active	fdfd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:18:25.218766+00
d6229ca9-3f83-4e93-935c-8331ee746d12	14dcc15b-89a5-4661-9966-9139740486b4	name3	3@1.com	0995633333	free	active	fdf	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:18:31.534867+00
9b3ad454-bcab-47d5-ba3d-c6bdda2760fa	544afc1c-8ac3-408c-840f-25fafe46d82d	name4	4@1.com	094563333	free	active	fdfd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:18:37.817508+00
8e719d9b-16aa-44f9-8f12-3b7680ae73cc	62fb1b14-885b-4e63-b2aa-dbb644ad2042	name5	5@5.com	094565666	free	active	fdfd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 06:18:43.175602+00
02fb0123-2f13-4da7-8225-57976cb74b1f	3a94f0b3-8837-462a-9b92-8e0ba03254b3	agente1d100	agente1d100@1.com	09465663	premium	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 15:58:02.935761+00
507c3061-bb6c-4122-b2b1-c9ac921c0025	bcb1c817-ed45-4e74-bd73-f3e67e9022c9	agente1d500	agente1d500@1.com	094656633	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 15:58:14.846152+00
0cd331ab-6d02-4a73-82c7-07853a00f4fb	22b99130-3036-4c84-b907-8da8099b24a8	agente1de100	agente1de100@1.com	094786566	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 15:58:23.072162+00
557cf258-905b-49eb-b974-73a63ce73c07	c1fcb72d-6bed-4ab7-a84e-8e2a5e74633e	agente1d100	agente1d100@1.com	09465663	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 20:08:03.882406+00
0613f341-0f01-464a-a519-e3ebba6a104e	434f81d8-854e-4ae4-8742-2533d572fc7e	agente1d500	agente1d500@1.com	09563222	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 20:08:17.260928+00
ca1c7c76-bbd3-4806-9d01-76d718821d58	7bf53ebe-7ec6-49aa-88cf-cf77d31972e0	ownerAgencia100	ownerAgencia100@1.com	094656565	free	active	test	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 20:08:29.80123+00
\.


--
-- Data for Name: family_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_comments (id, user_listing_id, user_id, text, author, avatar, created_at) FROM stdin;
\.


--
-- Data for Name: feedback_attributes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback_attributes (id, name, active, display_order, created_at) FROM stdin;
bd10c367-a4ed-43f6-8c7f-7a71e30402cb	Seguridad	t	2	2026-03-15 05:05:01.627258+00
d77af6d9-26e7-4353-84d6-e4ca6cd7e3c8	Humedad	t	3	2026-03-15 05:05:01.627258+00
c21d500e-d386-4965-b350-522587ea1df0	Precio	t	4	2026-03-15 05:05:01.627258+00
055f9b5f-9d8d-4769-af30-6305a15f7061	Entorno	t	5	2026-03-15 05:05:01.627258+00
fd7a3744-623f-459e-9172-374898526034	Luminosidad	t	6	2026-03-15 05:05:01.627258+00
fd55b358-1fab-4a5b-b9e4-ff01b42ba2ec	Ruido	t	7	2026-03-15 05:05:01.627258+00
4520e0b9-f99e-44fd-8145-7d63dbb8a14f	Est. Gral.	t	1	2026-03-15 05:05:01.627258+00
d2516774-0fac-49cf-bd58-36112ee742a1	Otro	t	8	2026-03-17 18:30:28.242509+00
\.


--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_members (id, org_id, user_id, role, is_system_delegate, created_at, is_active) FROM stdin;
bd816a3f-a8f7-4366-ba7b-028f954403ef	6006522c-2488-43a7-9666-125484cc37a5	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	owner	f	2026-03-17 16:43:37.287117+00	t
d29d6878-d40b-4099-ad8a-0870f18e4774	e6511765-ad66-4945-bda3-bfec7576199e	a31b8ecb-24eb-4824-ba6f-04c5e8340643	owner	f	2026-03-15 05:25:48.993214+00	t
6150dcba-095e-41c6-bfcc-b248d5cff9d2	339e3e73-c500-4a56-99a7-f7b1dc51fabb	3911fef4-1232-4bb4-af56-9a4c234caaea	owner	f	2026-03-17 16:45:45.952536+00	t
730dee59-d58a-4c7e-8853-a9cb17336656	339e3e73-c500-4a56-99a7-f7b1dc51fabb	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	member	f	2026-03-17 16:46:06.081308+00	t
a7bc6367-3f4e-4a17-9a55-9da54ff7e910	fdb8483a-5be9-44ee-86b8-71efd3f4da8f	588afe49-5f74-463b-8ce3-3e938b795c81	owner	f	2026-03-17 17:06:56.503718+00	t
a40acdd2-acbe-4609-abe3-cca69286b6d4	9bc386f7-97b8-476c-b9a3-9486e59c8267	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	owner	f	2026-03-17 17:25:10.280065+00	t
55428190-8f74-4e9a-9eb5-cbfdd3f300f4	9b53e2f2-1159-4836-a6a1-6b82a6b4fdef	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	agent	f	2026-03-17 20:06:15.120528+00	t
8d79ad12-3a97-4df8-882d-9b386b403fe0	03f5ded7-8507-447d-be97-ed7ccf4416ee	382e86d0-60d9-4acb-a42b-360a0bfa1666	agent	f	2026-03-17 21:50:55.190413+00	t
16972d0f-d936-49a6-a06d-7aff11cee46a	b850d854-468e-43d4-931b-620932873b34	9e984948-edea-4116-b20e-b63ea3b0555f	agent	f	2026-03-18 00:41:35.208275+00	t
bf2f101c-e61f-4485-8a5a-380b02a7dfa8	03f5ded7-8507-447d-be97-ed7ccf4416ee	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	member	f	2026-03-17 22:10:18.754441+00	t
2ab1336d-a342-457c-b5b8-43441f08ce16	05501a4d-7b33-4667-b46a-4e717420e013	3911fef4-1232-4bb4-af56-9a4c234caaea	owner	f	2026-03-17 06:34:10.434081+00	t
fd87539e-f9a6-4b72-8f69-d64731f5b2d5	d0b1f03f-0dd5-4dba-b772-6dd238bd945d	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	owner	f	2026-03-17 15:54:39.531907+00	t
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, type, description, parent_id, plan_type, invite_code, created_by, created_at, updated_at, is_personal) FROM stdin;
e6511765-ad66-4945-bda3-bfec7576199e	admin	family		\N	free	cd7afa804e30	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-15 05:25:48.993214+00	2026-03-15 15:16:38.308782+00	t
fdb8483a-5be9-44ee-86b8-71efd3f4da8f	name4	family		\N	free	a5593b0be97a	588afe49-5f74-463b-8ce3-3e938b795c81	2026-03-17 17:06:56.503718+00	2026-03-17 17:06:56.503718+00	t
9bc386f7-97b8-476c-b9a3-9486e59c8267	name5	family		\N	free	2a81c5370307	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	2026-03-17 17:25:10.280065+00	2026-03-17 17:25:10.280065+00	t
05501a4d-7b33-4667-b46a-4e717420e013	name1	family		\N	free	9695ec3f1edd	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-17 06:34:10.434081+00	2026-03-17 06:34:10.434081+00	t
d0b1f03f-0dd5-4dba-b772-6dd238bd945d	name2	family		\N	free	7b7713579f86	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	2026-03-17 15:54:39.531907+00	2026-03-17 15:54:39.531907+00	t
6006522c-2488-43a7-9666-125484cc37a5	Name3	family		\N	free	51e7a61c6228	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	2026-03-17 16:43:37.287117+00	2026-03-17 16:43:37.287117+00	t
339e3e73-c500-4a56-99a7-f7b1dc51fabb	familia1-2	family	familia1-2desc	\N	free	a54bc242d67c	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-17 16:45:45.518142+00	2026-03-17 16:45:45.518142+00	f
9b53e2f2-1159-4836-a6a1-6b82a6b4fdef	agencia1	agency_team		\N	free	a7279fc5e2cc	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	2026-03-17 20:06:15.120528+00	2026-03-17 20:06:15.120528+00	f
03f5ded7-8507-447d-be97-ed7ccf4416ee	agencia1	agency_team		\N	free	d5b9ebf7ab80	382e86d0-60d9-4acb-a42b-360a0bfa1666	2026-03-17 21:50:55.190413+00	2026-03-17 21:50:55.190413+00	f
b850d854-468e-43d4-931b-620932873b34	agencia2000	agency_team		\N	free	35f612066cfe	9e984948-edea-4116-b20e-b63ea3b0555f	2026-03-18 00:41:35.208275+00	2026-03-18 00:41:35.208275+00	f
\.


--
-- Data for Name: partner_leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partner_leads (id, partner_id, user_id, user_listing_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partners (id, name, type, contact_info, active, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, user_id, display_name, email, phone, avatar_url, status, plan_type, referred_by_id, created_at, updated_at) FROM stdin;
d3bec667-a7dc-4cc2-b668-bb8a653c8c21	a31b8ecb-24eb-4824-ba6f-04c5e8340643	admin	admin@1.com	094666333		active	free	\N	2026-03-15 05:25:48.993214+00	2026-03-15 05:25:49.891471+00
e301d2cc-e1ea-41e0-bec4-cb1dcb606a77	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	agente1	agente1@1.com	094656366		active	premium	\N	2026-03-17 20:06:15.120528+00	2026-03-17 22:56:18.352385+00
8a6c50c8-d113-4407-989f-e37defcc18f4	9e984948-edea-4116-b20e-b63ea3b0555f	agente2000	agente2000@1.com	09465656		active	free	\N	2026-03-18 00:41:35.208275+00	2026-03-18 00:41:59.504519+00
156a1e30-5326-4286-83e5-2692fa96e57d	3911fef4-1232-4bb4-af56-9a4c234caaea	name1	1@1.com	09465666		active	free	\N	2026-03-17 06:34:10.434081+00	2026-03-17 06:34:11.657209+00
f2444667-db44-4170-9c8e-5c107c9bffd0	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	name2	2@1.com	09565656		active	free	\N	2026-03-17 15:54:39.531907+00	2026-03-17 15:54:40.585634+00
5cd5285e-448f-401d-bc4b-95f514ee4145	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	Name3	3@1.com	+59894797659		active	free	\N	2026-03-17 16:43:37.287117+00	2026-03-17 16:43:38.850287+00
a094b8d5-1eba-4343-8317-c838ccf3ae57	588afe49-5f74-463b-8ce3-3e938b795c81	name4	4@1.com	094665656		active	free	\N	2026-03-17 17:06:56.503718+00	2026-03-17 17:06:57.490782+00
f65b36fd-3e88-466b-8d71-93c91c3297c2	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	name5	5@1.com	09465656		active	free	\N	2026-03-17 17:25:10.280065+00	2026-03-17 17:25:11.159986+00
a48d903c-4ef5-47df-94c0-601840fd3ba3	382e86d0-60d9-4acb-a42b-360a0bfa1666	agencyOwner1	agencyOwner1@1.com	09489666		active	free	\N	2026-03-17 21:50:55.190413+00	2026-03-17 21:56:20.829581+00
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, source_url, title, address, neighborhood, city, lat, lng, m2_total, rooms, images, currency, price_amount, price_expenses, total_cost, raw_ai_data, ref, details, created_by, created_at, updated_at) FROM stdin;
ae36cdb4-c58f-4fb1-b91c-226f9c17278f	https://www.infocasas.com.uy/general-flores-y-leon-perez-ideal-red-pagos-o-financiera-buena-visibilidad/192212207	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.		Cerrito	Montevideo	\N	\N	50	1	{https://cdn4.fincaraiz.com.co/repo/img/th.outside742x400.c8767c9af71e3139aa89b3a820dd99ed40ac8195.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.a78744a6a52a686c3820b4c55e833b6d230a4d1a.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.d9d7299cc839239c455b313f17594e1c90345164.jpg,https://tile.openstreetmap.org/16/22543/39545.png,https://tile.openstreetmap.org/16/22544/39545.png,https://tile.openstreetmap.org/16/22542/39545.png,https://tile.openstreetmap.org/16/22545/39545.png,https://tile.openstreetmap.org/16/22541/39545.png,https://tile.openstreetmap.org/16/22546/39545.png,https://tile.openstreetmap.org/16/22540/39545.png,https://tile.openstreetmap.org/16/22547/39545.png,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.219_CW241703_913.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.6925f01074de4_14e0b262-505d-476c-a642-16eac13028bc.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.772_CW243215_780.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.208555_alq_nai_278_1522_446.jpg}	UYU	19000	0	19000	\N	PB2F70	Se alquila local comercial en Cerrito, Montevideo, con 1 ambiente, 1 baño y 50m² edificados. Ideal para Red Pagos o financiera, ofrece buena visibilidad. El precio de alquiler es de $19.000.	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 00:55:55.662826+00	2026-03-18 00:55:55.662826+00
bcd36dbe-6af0-429f-af04-71399b0a8e85	https://www.infocasas.com.uy/terrenos-en-union/192722379	Terrenos en Unión		Unión	Montevideo	\N	\N	505	1	{https://cdn4.fincaraiz.com.co/repo/img/th.outside742x400.4_nai_391_299_387.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.4_nai_391_299_725.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.4_nai_391_299_523.jpg,https://tile.openstreetmap.org/16/22548/39546.png,https://tile.openstreetmap.org/16/22549/39546.png,https://tile.openstreetmap.org/16/22548/39547.png,https://tile.openstreetmap.org/16/22549/39547.png,https://tile.openstreetmap.org/16/22547/39546.png,https://tile.openstreetmap.org/16/22550/39546.png,https://tile.openstreetmap.org/16/22547/39547.png,https://tile.openstreetmap.org/16/22550/39547.png,https://tile.openstreetmap.org/16/22546/39546.png,https://tile.openstreetmap.org/16/22551/39546.png,https://tile.openstreetmap.org/16/22546/39547.png,https://tile.openstreetmap.org/16/22551/39547.png}	UYU	45000	0	45000	\N	W1A38E	Se alquila terreno de 505 m² en Unión, Montevideo, sobre Av. 8 de Octubre. Ideal para comercio con depósito, estacionamiento, desarrollo de servicios o proyectos temporales. El precio de alquiler es de $45.000.	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	2026-03-18 00:59:43.61456+00	2026-03-18 00:59:43.61456+00
6d6988e3-a769-48de-95c1-33ce2c0d606e	https://www.infocasas.com.uy/alquiler/terrenos/montevideo/union	Alquiler de Terrenos en Unión		Unión	Montevideo	\N	\N	505	1	{https://cdn4.fincaraiz.com.co/repo/img/th.outside384x275.5315_nai_220_719_165.jpg,https://cdn4.fincaraiz.com.co/web/th.outside384x275.6979b892ad67f_infocdn.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside384x275.4_nai_391_299_387.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside384x275.772_CW206619_886.jpg,https://cdn4.fincaraiz.com.co/web/th.outside700x200.5f771b79c47c0_infocdn__montevideo.png}	UYU	45000	0	45000	\N		Se alquila terreno de 505 m² en Unión, sobre Av. 8 de Octubre esquina Vera. Es una zona de alto tránsito y es ideal para comercio con depósito, estacionamiento, desarrollo de servicios o proyectos temporales. Cuenta con 16 metros de frente y una altura permitida de 13,5 metros.	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 01:01:46.512715+00	2026-03-18 01:01:46.512715+00
0c01a605-fa43-4c2a-9a61-5b4916051653	https://www.infocasas.com.uy/a-diaz-y-palmar-espectacular-vivienda-con-barbacoa-garaje/193316114	A. Díaz y Palmar. Espectacular vivienda, con barbacoa, garaje.		Tres Cruces	Montevideo	\N	\N	220	4	{https://cdn4.fincaraiz.com.co/repo/img/th.outside742x400.6973c82e90010_infocdn__zcrukhqrgrvav6pcodmbssr8m5dmhtldvzkubaoyjpg.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.6973c82edf70e_infocdn__0hwfc3u9q7jjzuntokdcmtkoam5xi3qo3olnbc9ojpg.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.6973c82ecb2fd_infocdn__wg7y5a2w5tb5xjnhihouawlki1jpldqd5dubqmbdjpg.jpg,https://tile.openstreetmap.org/16/22542/39555.png,https://tile.openstreetmap.org/16/22543/39555.png,https://tile.openstreetmap.org/16/22541/39555.png,https://tile.openstreetmap.org/16/22544/39555.png,https://tile.openstreetmap.org/16/22540/39555.png,https://tile.openstreetmap.org/16/22545/39555.png,https://tile.openstreetmap.org/16/22539/39555.png,https://tile.openstreetmap.org/16/22546/39555.png,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.6904eeab82375_infocdn__ykns2tv7vjt20vja7ievorypq9watzie9fkghmajjpg.jpg,https://cdn4.fincaraiz.com.co/web/th.outside300x225.68e36907e17bf_infocdn.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.914695_28706_928.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.220_33810_395.jpg}	UYU	82000	0	82000	\N	MLC03E6	Esta espaciosa vivienda en Tres Cruces ofrece 3 dormitorios grandes, living comedor, cocina equipada y 2 baños completos. Además, cuenta con garaje, fondo verde privado y barbacoa con parrillero, ideal para disfrutar en familia. Se considera un posible 4to dormitorio o cuarto de servicio.	9e984948-edea-4116-b20e-b63ea3b0555f	2026-03-18 01:37:25.11326+00	2026-03-18 01:37:25.11326+00
b00ffa8d-5b82-4b79-ac99-c0be74b9e604	https://www.infocasas.com.uy/apto-tipo-casa-pequeno-patio-con-azotea-y-parrilero/192936991	Apartamento tipo casa, pequeño patio, con azotea y parrillero		Unión	Montevideo	\N	\N	32	3	{https://cdn4.fincaraiz.com.co/repo/img/th.outside742x400.68dd69ae426aa_infocdn__qo7t9nn06qmnwdwjufio4qcedb5edhypzcubjkgijpg.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.68dd69ae84656_infocdn__gg3lxkibqnenbbfz2nmevvjqvmzs1ybjyg8atsnxjpg.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside1x210.68dd69aedb567_infocdn__md35xh9slyfngdxmg21vbwspw3vfbfjeggx7jxffjpg.jpg,https://tile.openstreetmap.org/16/22548/39547.png,https://tile.openstreetmap.org/16/22549/39547.png,https://tile.openstreetmap.org/16/22547/39547.png,https://tile.openstreetmap.org/16/22550/39547.png,https://tile.openstreetmap.org/16/22546/39547.png,https://tile.openstreetmap.org/16/22551/39547.png,https://tile.openstreetmap.org/16/22545/39547.png,https://tile.openstreetmap.org/16/22552/39547.png,https://cdn4.fincaraiz.com.co/repo/img/th.outside110x50.5c543866c7784_mjr-y-asociados-417x417.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.69a876be24848_infocdn__lwru4vsqucmhke9hud69qyeqrp9our8hkyivokg0jpg.jpg,https://cdn4.fincaraiz.com.co/web/th.outside300x225.69b5064058de8_infocdn.jpg,https://cdn4.fincaraiz.com.co/repo/img/th.outside300x225.69a085650e169_infocdn__3rkbz7wnlggqhogjlo1zevkrdej7rpham0d3w4vsjpg.jpg}	UYU	18000	0	18000	\N	EQD8CF8	Apartamento cómodo y luminoso en Unión, ideal para alquiler. Cuenta con dos dormitorios, incluyendo uno pequeño tipo escritorio, y un baño. Disfruta de un pequeño patio y una azotea de uso exclusivo con parrillero. No tiene gastos comunes.	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	2026-03-18 04:29:01.97422+00	2026-03-18 04:29:01.97422+00
823faf24-7283-456d-920f-cacac89bbe05	https://www.lars.com.uy/ficha/2610	Apartamento en alquiler en Pocitos		Pocitos	Montevideo	\N	\N	25	2	{https://www.lars.com.uy/archivos/CACHE/images/fichas/1612/Editable_0002_Firefly-Upscaler-escala-2x/ad9f51711c6168e24081a3e3108b003f.jpg,http://www.lars.com.uy/archivos/CACHE/images/fichas/1612/Editable_0002_Firefly-Upscaler-escala-2x/ad9f51711c6168e24081a3e3108b003f.jpg}	UYU	17600	2000	19600	\N	2610	Este apartamento en planta baja en Pocitos es ideal para quienes buscan comodidad y practicidad. Cuenta con cocina definida, un dormitorio, baño completo y un patio. Con gastos comunes accesibles, es una excelente opción de alquiler en una ubicación privilegiada.	382e86d0-60d9-4acb-a42b-360a0bfa1666	2026-03-19 02:36:03.995262+00	2026-03-19 02:36:03.995262+00
1f432440-007f-4e6e-ae17-0583722cb0c8	https://www.lars.com.uy/ficha/5872	Apartamento en Aguada		Aguada	Montevideo	\N	\N	49	3	{https://www.lars.com.uy/archivos/CACHE/images/fichas/12128/Editable.psd_0006_IMG_E6609/7e0b16fca2c9827ef7d3ee7502b82796.jpg,http://www.lars.com.uy/archivos/CACHE/images/fichas/12128/Editable.psd_0006_IMG_E6609/7e0b16fca2c9827ef7d3ee7502b82796.jpg}	USD	90000	0	90000	\N	5872	Este apartamento contrafrente en Aguada, ideal para vivir por su proximidad a servicios, o como una excelente oportunidad de inversión. Ofrece dos dormitorios, living comedor, cocina definida y baño. El edificio cuenta con ascensor y circuito de cámaras de seguridad para mayor tranquilidad. Se encuentra en un primer piso con orientación este. Un lugar ideal en una zona en constante crecimiento, próxima a supermercados, y locomoción.	382e86d0-60d9-4acb-a42b-360a0bfa1666	2026-03-19 02:37:48.133644+00	2026-03-19 02:37:48.133644+00
fbeb7bfc-612f-41d9-a1b7-7bc8fd39c862	https://www.lars.com.uy/ficha/5697	Local comercial en alquiler		Cordón	Montevideo	\N	\N	214	5	{https://www.lars.com.uy/archivos/CACHE/images/fichas/12130/Editable-5697-Magallanes-1408_0000_Ediciones-de-herramienta-Quitar/cd68a7e01818e93bdca860e34500e048.jpg,http://www.lars.com.uy/archivos/CACHE/images/fichas/12130/Editable-5697-Magallanes-1408_0000_Ediciones-de-herramienta-Quitar/cd68a7e01818e93bdca860e34500e048.jpg}	UYU	95000	0	95000	\N	5697	Se alquila local comercial en Cordón. Cuenta con hall de entrada, 2 salas de conferencias con aire acondicionado, cocina definida y 2 baños, además de un amplio sótano.	588afe49-5f74-463b-8ce3-3e938b795c81	2026-03-19 02:44:13.937476+00	2026-03-19 02:44:13.937476+00
c4b442b4-7250-45dc-a253-9cd640c39b3b	https://www.acsa.com.uy/propiedad/venta-de-apartamento-en-cord%C3%B3n-montevideo-24775	Apartamento con dos dormitorios y patio		Cordón	Montevideo	\N	\N	56	3	{https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269199649.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269202617.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269225533.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269234268.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269296038.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269311897.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269361103.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269377119.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269423729.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269439174.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/17671269408095.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/1767126945457.JPG,https://backend.acsa.com.uy/cache/54df1d51ab904976321d238a7107740d/15301126449477.jpg,https://backend.acsa.com.uy/cache/3899983a6b792e04c22ff9b70ba45c8d/17671269199649.JPG,https://backend.acsa.com.uy/cache/3899983a6b792e04c22ff9b70ba45c8d/17671269202617.JPG}	USD	118000	0	118000	\N	28775	Este es un apartamento en venta en Cordón, Montevideo, con dos dormitorios, patio y una superficie total de 65 m². Cuenta con living comedor, cocina integrada y baño actualizado. No acepta banco.	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-19 03:20:05.012836+00	2026-03-19 03:20:05.012836+00
\.


--
-- Data for Name: property_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_reviews (id, property_id, user_id, org_id, rating, created_at) FROM stdin;
3b4fd5e5-cc13-450d-9390-af7fda96ff4a	0c01a605-fa43-4c2a-9a61-5b4916051653	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	6006522c-2488-43a7-9666-125484cc37a5	3	2026-03-18 02:50:09.804722+00
d50c7a34-b767-4a11-949e-a2a4b993cb4a	b00ffa8d-5b82-4b79-ac99-c0be74b9e604	3911fef4-1232-4bb4-af56-9a4c234caaea	339e3e73-c500-4a56-99a7-f7b1dc51fabb	4	2026-03-18 22:41:18.776613+00
\.


--
-- Data for Name: property_views_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_views_log (id, property_id, created_at) FROM stdin;
6f676e9e-15b2-4e83-883d-025da9468082	b00ffa8d-5b82-4b79-ac99-c0be74b9e604	2026-03-18 22:05:21.685866+00
62967b9a-74e5-48ed-bdd0-a64d1befa27c	b00ffa8d-5b82-4b79-ac99-c0be74b9e604	2026-03-18 22:41:02.845004+00
d43cc3e0-66a5-4a3a-8f27-8703acf9200c	fbeb7bfc-612f-41d9-a1b7-7bc8fd39c862	2026-03-19 02:46:17.649759+00
\.


--
-- Data for Name: publication_deletion_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.publication_deletion_audit_log (id, pub_id, pub_type, title, org_name, status_before, reason, deleted_by, deleted_at) FROM stdin;
dc7b76aa-7846-469c-886b-046c27bbe34b	6e12783d-3d7e-4a51-ac6a-fe148acb5051	user_listing	Venta de Apartamento con 2 dormitorios y patio en Cordón	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 04:55:00.490585+00
f56edfac-3de0-4e0e-9262-571f3a13c9f6	3f729a6c-e035-4989-89bf-59b01d9452bb	user_listing	Apartamento con dos dormitorios y patio	\N	ingresado	rhdfhdhd	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 05:01:12.498489+00
8575880e-2c75-4d34-8386-8a12492c9be8	3f729a6c-e035-4989-89bf-59b01d9452bb	user_listing	Apartamento con dos dormitorios y patio	\N	ingresado	bvcbvc	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 05:03:50.552423+00
3248e8e0-5dbf-4100-a780-600fd542cbc4	23d66842-2da2-4fdc-bb6e-878a7633086c	user_listing	gdfgd	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 05:09:34.844334+00
2150968e-3af9-4afc-8ce6-5606a69d922a	fe36aaf3-636a-480f-aede-303c9521e6d8	user_listing	dfgdf	\N	ingresado	hgfhfgh	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 05:11:23.371343+00
aef77e78-4586-431f-91dd-248a1a721cb5	7f3099de-e6f0-4433-bfe4-7447e69b8254	user_listing	bcvbcvb	\N	ingresado	jghjghj	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 05:12:54.153388+00
8bb1bce6-c211-4d5e-85bc-59e79098f290	3d9f4b44-dae7-4b29-bdab-01ccc24996b4	user_listing	Apartamento en Alquiler en Cadiz y Av. Luis Alberto de Herrera	\N	ingresado	vcvxc	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 17:19:18.295915+00
aba04e96-a03c-4c59-99cd-9dbc4aa07cdf	754e1f2a-8536-46a2-afec-72cd19f90ba6	user_listing	ALQUILER Apartamento Cadiz y Av. Luis Alberto de Herrera	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 17:23:15.108879+00
66524fe7-08c6-46dd-9ef1-410e7a331482	70a38540-0c21-4be8-ace5-ece83a930a83	user_listing	Apartamento con dos dormitorios y patio en Tres Cruces - La Paz y Requena	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 17:27:34.804344+00
42750cb7-3055-4149-9e4a-787532059c84	6fceb323-b7cd-49ba-ac1b-8b4bceedaa2f	user_listing	Venta - Apartamento con dos dormitorios y patio	\N	visitado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 19:43:50.756349+00
65fcbecd-5086-4442-b009-98a429bfe506	2bdc770f-e9cc-4c83-9b13-a03c140c6efd	user_listing	ddddddd	\N	firme_candidato	gfdg	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 20:33:35.108456+00
622f6679-dfaf-4125-bfe1-9df57ae6c5fe	2bdc770f-e9cc-4c83-9b13-a03c140c6efd	user_listing	ddddddd	\N	firme_candidato	dfgdf	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 20:33:40.029779+00
4d1e75c7-e43e-4d6c-a6a4-7285b06af524	ef4fed2d-145d-4cde-9ba2-34234c1ecf88	user_listing	vvvvvvvvvvvvvvvvvv	\N	visita_coordinada	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 20:33:47.730481+00
edfdd5b5-d1be-4790-9608-a5023f11ca01	cd5fb237-01e3-43b9-80ea-03bacf5e3bf2	user_listing	hfghfghfhf	\N	posible_interes	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 20:33:52.466993+00
023907aa-10df-4820-b7f6-d0cedb11aebb	809ebd31-0fab-46ef-874f-ec8e1b434c95	user_listing	gdfgdf	\N	descartado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 20:33:55.833814+00
93428208-ea7a-4908-a20f-37e3d267bcc5	58806bc0-19f8-404d-bb50-87066e9cbf12	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 23:08:40.732592+00
f3cb799f-611c-4b80-b8c6-95c23af8d807	bb6724fe-0dca-4f60-84b6-2946b7fae064	user_listing	uuuuuuuuuuuu	\N	firme_candidato	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 23:08:45.074759+00
5c12b5a2-3948-4560-90ef-32201930306b	1e48e1e6-c06c-42eb-b945-d2bf33b42f7d	user_listing	Apartamento con dos dormitorios y patio en Tres Cruces	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 23:10:54.491734+00
ef56c251-642f-465b-be9e-2251ece40166	ea329967-9469-4b40-ab19-103f149d6748	user_listing	Apartamento con dos dormitorios y patio en Tres Cruces	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-16 23:10:58.099702+00
a14ebf4b-7e7d-4206-ad36-ef25c56407d0	17d70898-a699-4d4d-81fd-40769488a484	user_listing	Apartamento con dos dormitorios y patio en Tres Cruces	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 00:27:51.702274+00
4d1dbba0-1717-4663-8a31-53286f0911ac	f981062f-24ce-48f9-8a43-02bab58c10a2	user_listing	Apartamento con dos dormitorios y patio en Tres Cruces	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 00:30:28.351231+00
09155216-7d85-4ea6-85db-f5822f370c00	6450f53c-b805-4887-bc86-762c8be719f5	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 00:36:10.089498+00
0be5aecc-edb8-4722-878c-f99559fea77d	10964c57-cbb1-483c-8e66-efd3368715ac	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 00:36:14.175678+00
d04e3502-5d6b-4474-b5f1-4443c41a141b	38baf2ae-1160-420c-9b47-e5a4e7c5462e	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:01:09.789589+00
5cf40b08-a042-4100-a0b1-3b29c166f1e2	f943f531-56cf-482e-a10b-dae9bfb20dc3	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:10:40.06094+00
2598b452-2988-468f-942b-d88c665e2e43	dd2831fd-cc59-4c76-9638-3ca39a1d7826	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:10:53.912576+00
4707e76d-dfda-488b-86e3-02041f63014f	03371d88-d9f1-4f20-afb3-0c4f099a3899	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:11:18.827325+00
2a5ded10-0e31-4c26-8ca7-7965c45b7d04	a1a2bc22-76a3-4137-98dd-5f11168d7411	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:22:16.658375+00
f5f7d203-efe9-4aa2-91fb-33aa4b04af40	72494148-7169-46c2-a2b5-cff8346966f3	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:22:20.06929+00
f5849a8a-74d8-43d9-b71f-54156cc9db46	4fb946be-9f93-4e54-afcf-f9517321cf04	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:22:23.344568+00
3c819169-6ee3-45de-8218-687e42c83ea1	f2822fcb-634f-4f53-ac6f-5080d1c7d3d5	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:27:56.152698+00
781281f1-bebd-4db1-85b2-20e5039a1cd4	6bf15e3b-5440-45e5-b0c6-84e97dd317c7	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:30:08.045655+00
1a663e30-5468-4918-bf4d-86c12957753a	4010c76a-2031-43bc-bd11-00bbb7a1f712	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 01:46:22.02939+00
262fc5d7-da2a-4715-9412-38a6e76312af	cb670f98-33a7-4eb5-af54-38e27adfec98	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 02:02:47.297689+00
9bfad19a-fe0a-4a83-83fe-5585809d3e40	8fc98050-65bc-451c-88b2-f343decfb83b	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 02:02:50.513665+00
5c64fe79-0575-46a2-b3e2-5ca5eb9f841f	6af4694d-d1b4-439e-a8f9-942f5b6c31d8	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 02:04:13.535194+00
c97e0031-02f0-486b-be31-8f31d7b44470	e4fcfc83-c9cf-42a1-a8a1-0470201e44b2	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 02:13:53.245801+00
126480f2-ecdc-4375-b592-c04314c6ce13	86f6aa4a-8e2f-48ff-9b7b-7040c62efe8f	user_listing	Apartamento en Aguada	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 02:21:31.259824+00
05b15188-cc74-4bd6-9634-03a9efb0c4c1	104262e9-0e40-4b62-a077-6ca3824022cd	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 02:32:55.948762+00
4e55658e-0ea1-432e-8786-30d75e10af64	e0b33cad-3103-45f7-9d8a-693d883bb99b	user_listing	fffffffffff	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 03:06:18.136552+00
8604bdd1-a778-4a3c-825a-f7e34a18dcc8	ec2b5bc0-2f50-4517-9062-3f856dedb109	user_listing	qqqqqqqqq	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 03:06:22.74316+00
71c9cc2c-cd73-4cec-ac56-260aa6242f87	5b71cbca-dba3-48ae-a625-36f296d89be9	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 03:06:27.094621+00
954e25aa-8630-4a97-88df-0ee9a18d5b80	c340dd6f-05e5-4669-b905-7c8d6fd88541	user_listing	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 03:35:49.587705+00
4ba80d74-b53a-455d-8683-1d6e67249ccf	f2d35e42-3ff1-4614-ab3d-2616595a35ff	user_listing	Apartamento en alquiler en Aguada, 2 dormitorios	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 03:35:54.666782+00
49c5877d-4d44-4b16-9916-aa2e1db954c6	834a42dd-52df-4a13-abae-3339012530f0	user_listing	A. Diaz y Palmar. Espectacular vivienda, con barbacoa, garaje.	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 03:59:48.792551+00
e789efcc-3cd4-4683-838e-3ce5471a3f23	76583d07-b5f0-4202-9745-be4e464280b5	marketplace	qqqqqqqqqq	agencia500	active	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 04:41:33.338962+00
fea83aad-4c03-48e5-9d43-e9d17fe8fed8	a0bc0e3e-806b-4a98-a20e-4f0733abce20	user_listing	A. Diaz y Palmar. Espectacular vivienda, con barbacoa, garaje.	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 15:48:17.105399+00
66bfc389-aa3c-4ed2-a759-751afae61bb8	92866cd4-ae76-49eb-80b3-7fef9fab986a	user_listing	fffffffffffff	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 15:48:20.260688+00
4bd3cc2a-f573-4283-b699-ad70645c6e44	517d488f-899a-4365-bbe7-f6edb0f06869	marketplace	Apartamento en alquiler en Aguada	agencia100	disponible	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 15:48:25.647283+00
48ec7606-803b-4468-b4f9-8f3f58a6564c	d90ca03d-f324-4bf4-aa2a-3fbd124cda52	user_listing	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	\N	eliminado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 22:36:30.11049+00
73148dbf-c9f1-466f-92d7-41c47bbbf49a	582fdaae-bdc1-4c75-91dc-378c064b2dbd	user_listing	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	\N	eliminado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-17 22:36:34.041106+00
1000fae8-a666-4dbd-b79a-d837b0d198ad	4da21001-f8b4-4783-ba38-ad006d7fbe03	user_listing	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:14.318936+00
6ec71578-3c6a-42cd-9b70-d4a3b3c453f7	020aa484-d5a9-4cf3-97ff-c6326c305040	user_listing	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:18.512811+00
f9dac118-f967-4b2a-9bc5-d7a900ea9e9a	bb09c2b7-23af-47e1-8da0-1612555e3535	user_listing	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:21.850804+00
abec8a1f-f2e4-40f1-9ff2-caf23cf70b00	ab98f3a3-42c3-4930-b076-51b621408d9f	marketplace	General Flores Y Leon Perez. Ideal Red Pagos o financiera. Buena Visibilidad.	agencia1	paused	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:26.488361+00
383efe0c-50e6-46be-9b04-2f1be33ed197	79ccfcc9-3e2f-4235-8e26-c9d18c4130b6	marketplace	ALQ. CASA PLANTA ALTA PSJE. PALOMAS 4071/104	agencia1	active	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:29.098428+00
1d197c03-0c12-4cf5-af82-c4b69c3be449	2d968a9d-fb00-409a-8563-2ef8be451d96	marketplace	Casa en Alquiler Monte Caseros 2948 bis	agencia1	active	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:31.312187+00
02ebe271-a13c-4e2b-8240-65439b43673c	5e805602-86e6-4d05-b9b6-9995967c2a9b	marketplace	A. Díaz y Palmar. Espectacular vivienda, con barbacoa, garaje.	agencia1	active	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:38:34.086465+00
43e5a84f-b7e9-4b61-af83-98b5220400fd	50443310-3e3e-4892-bcfe-9373582dfc7a	marketplace	VENTA Y ALQUILER DE LOCAL EN AVDA. 8 DE OCTUBRE	agencia2000	active	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:48:35.601493+00
d7b854cd-3707-42ae-a3f5-c13e77aada70	2fce47fc-9b7b-43ae-80cd-adf6727b41d7	user_listing	8 DE OCTUBRE Y VERA, PADRÓN 38637	\N	ingresado	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:51:18.923627+00
dad9b0ef-0353-44c9-af16-241ba9c29d7a	e42629d9-03ad-49d0-b084-3772db3c2ba1	marketplace	Terreno en Unión	agencia2000	active	Sin motivo especificado	a31b8ecb-24eb-4824-ba6f-04c5e8340643	2026-03-18 00:53:39.02581+00
\.


--
-- Data for Name: scrape_usage_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scrape_usage_log (id, user_id, role, scraper, channel, success, token_charged, source_url, error_message, created_at) FROM stdin;
862b4deb-71e0-40df-b6ac-b6dc88b9cf38	3911fef4-1232-4bb4-af56-9a4c234caaea	user	firecrawl	url	t	t	https://www.acsa.com.uy/propiedad/venta-de-apartamento-en-cord%C3%B3n-montevideo-24775	\N	2026-03-19 03:19:58.765331+00
\.


--
-- Data for Name: status_history_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status_history_log (id, user_listing_id, old_status, new_status, changed_by, event_metadata, created_at) FROM stdin;
b9f58fd0-4ff1-4c8d-83f3-75d1b0b24a3a	820d40fe-9f45-448b-8c18-feb3e98db92c	ingresado	ingresado	3911fef4-1232-4bb4-af56-9a4c234caaea	{}	2026-03-18 22:41:06.260465+00
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_config (key, value) FROM stdin;
support_phone	059894797659
support_email	juan.sequeira@gmail.com
agent_free_plan_publish_limit	2
user_free_plan_save_limit	5
add_button_config	blue
show_auth_video	false
\.


--
-- Data for Name: user_listing_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_listing_attachments (id, user_listing_id, image_url, added_by, created_at) FROM stdin;
\.


--
-- Data for Name: user_listing_comment_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_listing_comment_reads (user_listing_id, user_id, last_read_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_listings (id, property_id, org_id, current_status, listing_type, source_publication_id, added_by, created_at, updated_at, admin_hidden) FROM stdin;
d496980a-7d92-42fc-9751-b3ddbb546fd7	ae36cdb4-c58f-4fb1-b91c-226f9c17278f	339e3e73-c500-4a56-99a7-f7b1dc51fabb	ingresado	rent	\N	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 00:55:56.065131+00	2026-03-18 00:55:56.065131+00	f
aaac8bbd-93a4-43e5-833d-85b484046f67	bcd36dbe-6af0-429f-af04-71399b0a8e85	6006522c-2488-43a7-9666-125484cc37a5	ingresado	rent	\N	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	2026-03-18 00:59:43.992447+00	2026-03-18 00:59:43.992447+00	f
865e9935-2eb7-44fb-8cdd-a7133dcb3444	bcd36dbe-6af0-429f-af04-71399b0a8e85	339e3e73-c500-4a56-99a7-f7b1dc51fabb	ingresado	rent	\N	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 01:00:30.18596+00	2026-03-18 01:00:30.18596+00	f
e452b9c3-7a2e-42df-b910-2d90fa5ddb37	6d6988e3-a769-48de-95c1-33ce2c0d606e	339e3e73-c500-4a56-99a7-f7b1dc51fabb	ingresado	rent	\N	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 01:01:46.894256+00	2026-03-18 01:01:46.894256+00	f
9fd9ef13-e396-4c1b-9307-144b4913176d	0c01a605-fa43-4c2a-9a61-5b4916051653	6006522c-2488-43a7-9666-125484cc37a5	ingresado	rent	a483b9ea-6a8e-4f48-885c-c0c52b237d33	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	2026-03-18 02:46:16.32886+00	2026-03-18 02:46:16.32886+00	f
820d40fe-9f45-448b-8c18-feb3e98db92c	b00ffa8d-5b82-4b79-ac99-c0be74b9e604	339e3e73-c500-4a56-99a7-f7b1dc51fabb	ingresado	rent	8764e6dd-dbd4-4a65-b8a9-a952540fb090	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-18 22:26:18.566801+00	2026-03-18 22:41:06.674116+00	f
cb02f0aa-576e-43c1-acc7-ab615326dfff	fbeb7bfc-612f-41d9-a1b7-7bc8fd39c862	fdb8483a-5be9-44ee-86b8-71efd3f4da8f	ingresado	rent	\N	588afe49-5f74-463b-8ce3-3e938b795c81	2026-03-19 02:44:14.291837+00	2026-03-19 02:44:14.291837+00	f
6fa17f65-13f8-4395-a5ee-7a0df7983e33	c4b442b4-7250-45dc-a253-9cd640c39b3b	339e3e73-c500-4a56-99a7-f7b1dc51fabb	ingresado	sale	\N	3911fef4-1232-4bb4-af56-9a4c234caaea	2026-03-19 03:20:05.313679+00	2026-03-19 03:20:05.313679+00	f
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role, created_at) FROM stdin;
3cf5d41b-b613-4f91-8eb3-cb2c53480256	a31b8ecb-24eb-4824-ba6f-04c5e8340643	admin	2026-03-15 05:27:44.745768+00
83fc83ec-d50f-494f-a5b9-326242082fc7	3911fef4-1232-4bb4-af56-9a4c234caaea	user	2026-03-17 06:34:10.434081+00
f27a0e41-7301-4e71-a5e4-1ec2b6eaa099	67b3a6af-e66e-4139-91b6-5fc7a2835fdd	user	2026-03-17 15:54:39.531907+00
0cb20021-75c6-4695-8f3e-cc979c89f091	6ce9e7c7-0070-4327-a1d4-6dcad40d93df	user	2026-03-17 16:43:37.287117+00
28cfefc5-57a3-4e6e-84da-126058372921	588afe49-5f74-463b-8ce3-3e938b795c81	user	2026-03-17 17:06:56.503718+00
6477efe4-edb0-4c69-95f6-414804e4a0a6	e23aa8ce-5b76-452a-b63f-5350daf6a6c4	user	2026-03-17 17:25:10.280065+00
f4db2185-909c-43a3-af75-20b9bf6c7969	f22cd98e-7fd0-4a48-b70a-59194e7ffde1	agencymember	2026-03-17 20:12:43.257659+00
976e52eb-d260-484c-969a-067499fb1f60	382e86d0-60d9-4acb-a42b-360a0bfa1666	agency	2026-03-17 21:56:23.818968+00
b1581d15-f800-4bd2-99fa-c65d34548e4d	9e984948-edea-4116-b20e-b63ea3b0555f	agencymember	2026-03-18 00:41:35.208275+00
\.


--
-- Data for Name: messages_2026_03_16; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_16 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_03_17; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_17 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_03_18; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_18 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_03_19; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_19 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_03_20; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_20 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_03_21; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_21 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2026_03_22; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2026_03_22 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-03-15 03:52:34
20211116045059	2026-03-15 03:52:34
20211116050929	2026-03-15 03:52:35
20211116051442	2026-03-15 03:52:35
20211116212300	2026-03-15 03:52:35
20211116213355	2026-03-15 03:52:35
20211116213934	2026-03-15 03:52:36
20211116214523	2026-03-15 03:52:36
20211122062447	2026-03-15 03:52:36
20211124070109	2026-03-15 03:52:37
20211202204204	2026-03-15 03:52:38
20211202204605	2026-03-15 03:55:11
20211210212804	2026-03-15 03:55:13
20211228014915	2026-03-15 03:55:13
20220107221237	2026-03-15 03:55:14
20220228202821	2026-03-15 03:55:14
20220312004840	2026-03-15 03:55:14
20220603231003	2026-03-15 03:55:15
20220603232444	2026-03-15 03:55:15
20220615214548	2026-03-15 03:55:15
20220712093339	2026-03-15 03:55:15
20220908172859	2026-03-15 03:55:15
20220916233421	2026-03-15 03:55:16
20230119133233	2026-03-15 03:55:16
20230128025114	2026-03-15 03:55:16
20230128025212	2026-03-15 03:55:16
20230227211149	2026-03-15 03:55:16
20230228184745	2026-03-15 03:55:17
20230308225145	2026-03-15 03:55:17
20230328144023	2026-03-15 03:55:17
20231018144023	2026-03-15 03:55:17
20231204144023	2026-03-15 03:55:17
20231204144024	2026-03-15 03:55:18
20231204144025	2026-03-15 03:55:18
20240108234812	2026-03-15 03:55:18
20240109165339	2026-03-15 03:55:18
20240227174441	2026-03-15 03:55:19
20240311171622	2026-03-15 03:55:19
20240321100241	2026-03-15 03:55:19
20240401105812	2026-03-15 03:55:20
20240418121054	2026-03-15 03:55:20
20240523004032	2026-03-15 03:55:21
20240618124746	2026-03-15 03:55:21
20240801235015	2026-03-15 03:55:21
20240805133720	2026-03-15 03:55:21
20240827160934	2026-03-15 03:55:22
20240919163303	2026-03-15 03:55:22
20240919163305	2026-03-15 03:55:22
20241019105805	2026-03-15 03:55:22
20241030150047	2026-03-15 03:55:23
20241108114728	2026-03-15 03:55:23
20241121104152	2026-03-15 03:55:23
20241130184212	2026-03-15 03:55:24
20241220035512	2026-03-15 03:55:24
20241220123912	2026-03-15 03:55:24
20241224161212	2026-03-15 03:55:24
20250107150512	2026-03-15 03:55:24
20250110162412	2026-03-15 03:55:24
20250123174212	2026-03-15 03:55:25
20250128220012	2026-03-15 03:55:25
20250506224012	2026-03-15 03:55:25
20250523164012	2026-03-15 03:55:25
20250714121412	2026-03-15 03:55:25
20250905041441	2026-03-15 03:55:26
20251103001201	2026-03-15 03:55:26
20251120212548	2026-03-15 03:55:26
20251120215549	2026-03-15 03:55:26
20260218120000	2026-03-15 03:55:26
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
property-images	property-images	\N	2026-03-16 20:40:33.430359+00	2026-03-16 20:40:33.430359+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-03-15 03:52:35.705404
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-03-15 03:52:35.741299
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-03-15 03:52:35.755078
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-03-15 03:52:35.799782
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-03-15 03:52:37.38927
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-03-15 03:52:37.6781
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-03-15 03:52:37.80766
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-03-15 03:52:37.830094
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-03-15 03:52:37.83557
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-03-15 03:52:37.891238
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-03-15 03:52:37.897453
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-03-15 03:52:37.903324
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-03-15 03:52:37.917798
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-03-15 03:52:37.923582
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-03-15 03:52:37.932085
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-03-15 03:52:38.164724
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-03-15 03:53:02.927375
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-03-15 03:53:02.972075
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-03-15 03:53:02.981873
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-03-15 03:53:03.001619
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-03-15 03:53:03.027843
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-03-15 03:53:03.081453
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-03-15 03:53:03.207018
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-03-15 03:53:03.469123
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-03-15 03:53:03.639689
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-03-15 03:53:03.643316
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-03-15 03:53:03.646078
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-03-15 03:53:03.648109
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-03-15 03:53:03.650352
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-03-15 03:53:03.65243
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-03-15 03:53:03.654857
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-03-15 03:53:03.657081
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-03-15 03:53:03.660266
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-03-15 03:53:03.662426
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-03-15 03:53:03.665794
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-03-15 03:53:03.668341
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-03-15 03:53:03.672354
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-03-15 03:53:03.674671
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-03-15 03:53:03.678403
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-03-15 03:53:03.693355
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-03-15 03:53:03.695568
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-03-15 03:53:03.697656
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-03-15 03:53:03.699884
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-03-15 03:53:03.702853
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-03-15 03:53:03.705059
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-03-15 03:53:03.70777
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-03-15 03:53:03.74466
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-03-15 03:53:03.752583
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-03-15 03:53:03.755793
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-03-15 03:53:03.906983
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-03-15 03:53:03.910023
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-03-15 03:53:07.47499
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-03-15 03:53:07.490147
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-03-15 03:53:08.28516
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-03-15 03:53:08.291652
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-03-15 03:53:08.292765
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-03-15 03:53:08.565504
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
a4a9cd5a-6524-42ac-b581-737888e24361	property-images	4c5f94ca-abe4-4b47-9edf-d3feab757529/36493fc7-e0bd-4b74-bad6-0909e6599370.jpg	4c5f94ca-abe4-4b47-9edf-d3feab757529	2026-03-16 20:41:08.573868+00	2026-03-16 20:41:08.573868+00	2026-03-16 20:41:08.573868+00	{"eTag": "\\"c931a361bdadb151b7b8a347809fbd40\\"", "size": 36724, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T20:41:09.000Z", "contentLength": 36724, "httpStatusCode": 200}	7df53762-1b05-41eb-8ee7-5ea238450f48	4c5f94ca-abe4-4b47-9edf-d3feab757529	{}
ff41a956-f530-4b25-b765-9fb65574bf52	property-images	4c5f94ca-abe4-4b47-9edf-d3feab757529/d3bab5cf-bb16-49dc-93b8-affd7b9f534f.jfif	4c5f94ca-abe4-4b47-9edf-d3feab757529	2026-03-16 20:41:17.953537+00	2026-03-16 20:41:17.953537+00	2026-03-16 20:41:17.953537+00	{"eTag": "\\"d27ccdacd101fceba354b2d2d75617f1\\"", "size": 11762, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T20:41:18.000Z", "contentLength": 11762, "httpStatusCode": 200}	79cd7854-ea36-495f-ba62-686610f06e07	4c5f94ca-abe4-4b47-9edf-d3feab757529	{}
496d344c-d72f-4e90-988f-2139e7f78712	property-images	4c5f94ca-abe4-4b47-9edf-d3feab757529/95ea223c-0ba9-4baf-8793-ece8699f2c3b.jpg	4c5f94ca-abe4-4b47-9edf-d3feab757529	2026-03-16 20:41:26.893297+00	2026-03-16 20:41:26.893297+00	2026-03-16 20:41:26.893297+00	{"eTag": "\\"43b924c63e0462b073f88f372d347a40\\"", "size": 44136, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T20:41:27.000Z", "contentLength": 44136, "httpStatusCode": 200}	9afd0ab6-bc26-4ac6-90ff-07da8874a844	4c5f94ca-abe4-4b47-9edf-d3feab757529	{}
db8e6fae-2ccd-43d3-b364-3daa5e5d739e	property-images	4c5f94ca-abe4-4b47-9edf-d3feab757529/46612204-8437-4486-87d0-cbf8ae30c842.jpg	4c5f94ca-abe4-4b47-9edf-d3feab757529	2026-03-16 20:41:36.818199+00	2026-03-16 20:41:36.818199+00	2026-03-16 20:41:36.818199+00	{"eTag": "\\"9fbdef25f6cf691aba7f646a5c42b359\\"", "size": 60647, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T20:41:37.000Z", "contentLength": 60647, "httpStatusCode": 200}	f96eaf0f-dea5-4ec2-aa53-443afbe2a7e1	4c5f94ca-abe4-4b47-9edf-d3feab757529	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.schema_migrations (version, statements, name, created_by, idempotency_key, rollback) FROM stdin;
20260315061715	{"\n-- Limpiar referred_by_id huérfanos antes de crear la FK\nUPDATE public.profiles \nSET referred_by_id = NULL \nWHERE referred_by_id IS NOT NULL \n  AND referred_by_id NOT IN (SELECT user_id FROM public.profiles);\n\n-- Ahora sí, crear todas las FKs\n\n-- UNIQUE en profiles.user_id\nALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);\n\n-- FK: user_roles.user_id -> profiles.user_id\nALTER TABLE public.user_roles\n  ADD CONSTRAINT user_roles_user_id_fkey\n  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: organization_members.user_id -> profiles.user_id\nALTER TABLE public.organization_members\n  ADD CONSTRAINT organization_members_user_id_fkey\n  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: properties.created_by -> profiles.user_id\nALTER TABLE public.properties\n  ADD CONSTRAINT properties_created_by_fkey\n  FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: user_listings.added_by -> profiles.user_id\nALTER TABLE public.user_listings\n  ADD CONSTRAINT user_listings_added_by_fkey\n  FOREIGN KEY (added_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: agent_publications.published_by -> profiles.user_id\nALTER TABLE public.agent_publications\n  ADD CONSTRAINT agent_publications_published_by_fkey\n  FOREIGN KEY (published_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: property_reviews.user_id -> profiles.user_id\nALTER TABLE public.property_reviews\n  ADD CONSTRAINT property_reviews_user_id_fkey\n  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: family_comments.user_id -> profiles.user_id\nALTER TABLE public.family_comments\n  ADD CONSTRAINT family_comments_user_id_fkey\n  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: agency_comments.user_id -> profiles.user_id\nALTER TABLE public.agency_comments\n  ADD CONSTRAINT agency_comments_user_id_fkey\n  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: status_history_log.changed_by -> profiles.user_id\nALTER TABLE public.status_history_log\n  ADD CONSTRAINT status_history_log_changed_by_fkey\n  FOREIGN KEY (changed_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: partner_leads.user_id -> profiles.user_id\nALTER TABLE public.partner_leads\n  ADD CONSTRAINT partner_leads_user_id_fkey\n  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;\n\n-- FK: profiles.referred_by_id -> profiles.user_id (auto-referencia, SET NULL)\nALTER TABLE public.profiles\n  ADD CONSTRAINT profiles_referred_by_id_fkey\n  FOREIGN KEY (referred_by_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;\n"}		jpsequeira1980@gmail.com	\N	\N
20260315062713	{"\n-- Limpiar updated_by huérfanos antes de crear la FK\nUPDATE public.app_settings\nSET updated_by = NULL\nWHERE updated_by IS NOT NULL\n  AND updated_by NOT IN (SELECT user_id FROM public.profiles);\n\n-- FK: app_settings.updated_by -> profiles.user_id (SET NULL)\nALTER TABLE public.app_settings\n  ADD CONSTRAINT app_settings_updated_by_fkey\n  FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;\n"}		jpsequeira1980@gmail.com	\N	\N
20260315063402	{"\nCREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid)\nRETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path TO 'public'\nAS $$\nBEGIN\n  -- Solo admins pueden ejecutar esta función\n  IF NOT has_role(auth.uid(), 'admin') THEN\n    RAISE EXCEPTION 'Unauthorized';\n  END IF;\n\n  -- Borrar el perfil (CASCADE borra automáticamente: user_roles, organization_members,\n  -- properties, user_listings, agent_publications, property_reviews, family_comments,\n  -- agency_comments, status_history_log, partner_leads)\n  DELETE FROM public.profiles WHERE user_id = _user_id;\n\n  -- Borrar organizaciones creadas por el usuario (que ya no tienen miembros)\n  DELETE FROM public.organizations WHERE created_by = _user_id;\n\n  -- Finalmente borrar de auth.users\n  DELETE FROM auth.users WHERE id = _user_id;\nEND;\n$$;\n"}		jpsequeira1980@gmail.com	\N	\N
20260315071909	{"-- 1. Corregir escalación de privilegios en organization_members\nDROP POLICY \\"Users can join orgs\\" ON public.organization_members;\n\nCREATE POLICY \\"Users can join orgs\\"\nON public.organization_members\nFOR INSERT TO authenticated\nWITH CHECK (\n  user_id = auth.uid()\n  AND role = 'member'\n  AND is_system_delegate = false\n);\n\n-- 2. Corregir exposición de datos sensibles en profiles\nDROP POLICY \\"Users can view all profiles\\" ON public.profiles;\n\nCREATE POLICY \\"Users can view own or org profiles\\"\nON public.profiles\nFOR SELECT TO authenticated\nUSING (\n  user_id = auth.uid()\n  OR EXISTS (\n    SELECT 1 FROM public.organization_members om1\n    WHERE om1.user_id = auth.uid()\n      AND om1.org_id IN (\n        SELECT om2.org_id FROM public.organization_members om2\n        WHERE om2.user_id = profiles.user_id\n      )\n  )\n);"}		jpsequeira1980@gmail.com	\N	\N
20260315151638	{"\n-- 1. Add is_personal column\nALTER TABLE public.organizations ADD COLUMN is_personal BOOLEAN NOT NULL DEFAULT false;\n\n-- 2. Mark existing auto-created personal orgs (family type, single owner member = creator)\nUPDATE public.organizations o\nSET is_personal = true\nWHERE o.type = 'family'\n  AND EXISTS (\n    SELECT 1 FROM public.organization_members om\n    WHERE om.org_id = o.id AND om.user_id = o.created_by AND om.role = 'owner'\n  )\n  AND (SELECT count(*) FROM public.organization_members om2 WHERE om2.org_id = o.id) = 1;\n\n-- 3. Update trigger to mark personal orgs for regular users\nCREATE OR REPLACE FUNCTION public.handle_new_user_profile()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nDECLARE\n  v_account_type text;\n  v_display_name text;\n  v_phone text;\n  v_org_name text;\n  v_org_id uuid;\nBEGIN\n  v_account_type := NEW.raw_user_meta_data->>'account_type';\n  v_display_name := COALESCE(\n    NEW.raw_user_meta_data->>'display_name',\n    NEW.raw_user_meta_data->>'full_name',\n    NEW.raw_user_meta_data->>'name',\n    ''\n  );\n  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');\n\n  INSERT INTO public.profiles (user_id, display_name, phone, email, status)\n  VALUES (\n    NEW.id,\n    v_display_name,\n    v_phone,\n    COALESCE(NEW.email, ''),\n    CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status \n         ELSE 'active'::user_status END\n  )\n  ON CONFLICT (user_id) DO UPDATE SET\n    display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL\n      THEN EXCLUDED.display_name ELSE profiles.display_name END,\n    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL\n      THEN EXCLUDED.phone ELSE profiles.phone END,\n    email = CASE WHEN profiles.email IS NULL OR profiles.email = ''\n      THEN EXCLUDED.email ELSE profiles.email END;\n\n  IF v_account_type = 'agency' THEN\n    v_org_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', v_display_name || ' Agency');\n    INSERT INTO public.organizations (name, type, created_by, is_personal)\n    VALUES (v_org_name, 'agency_team', NEW.id, false)\n    RETURNING id INTO v_org_id;\n  ELSE\n    INSERT INTO public.organizations (name, type, created_by, is_personal)\n    VALUES (COALESCE(NULLIF(v_display_name, ''), 'Mi Familia'), 'family', NEW.id, true)\n    RETURNING id INTO v_org_id;\n  END IF;\n\n  INSERT INTO public.organization_members (org_id, user_id, role)\n  VALUES (v_org_id, NEW.id, 'owner');\n\n  RETURN NEW;\nEND;\n$function$;\n"}		jpsequeira1980@gmail.com	\N	\N
20260315173529	{"ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'sub_team';"}		jpsequeira1980@gmail.com	\N	\N
20260315181948	{"\n-- Fix 1: Replace admin_physical_delete_user (3-param) to actually delete profile + orgs + auth.users\nCREATE OR REPLACE FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $$\nDECLARE\n    v_display_name  TEXT;\n    v_email         TEXT;\n    v_phone         TEXT;\n    v_plan_type     TEXT;\n    v_status        TEXT;\nBEGIN\n    -- Solo admins pueden ejecutar esta función\n    IF NOT has_role(_deleted_by, 'admin') THEN\n      RAISE EXCEPTION 'Unauthorized';\n    END IF;\n\n    -- Capturar datos del usuario ANTES de borrar\n    SELECT\n        display_name,\n        email,\n        phone,\n        plan_type::TEXT,\n        status::TEXT\n    INTO v_display_name, v_email, v_phone, v_plan_type, v_status\n    FROM public.profiles\n    WHERE user_id = _user_id;\n\n    -- Insertar registro de auditoría (si falla, no se borra el usuario)\n    INSERT INTO public.deletion_audit_log (\n        deleted_user_id,\n        display_name,\n        email,\n        phone,\n        plan_type,\n        status_before,\n        reason,\n        deleted_by\n    ) VALUES (\n        _user_id,\n        v_display_name,\n        v_email,\n        v_phone,\n        v_plan_type,\n        v_status,\n        _reason,\n        _deleted_by\n    );\n\n    -- Borrar el perfil (CASCADE borra: user_roles, organization_members,\n    -- properties, user_listings, agent_publications, property_reviews,\n    -- family_comments, agency_comments, status_history_log, partner_leads)\n    DELETE FROM public.profiles WHERE user_id = _user_id;\n\n    -- Borrar organizaciones creadas por el usuario (que ya no tienen miembros)\n    DELETE FROM public.organizations WHERE created_by = _user_id;\n\n    -- Finalmente borrar de auth.users\n    DELETE FROM auth.users WHERE id = _user_id;\nEND;\n$$;\n\n-- Fix 2: Allow admins to INSERT into publication_deletion_audit_log\nCREATE POLICY \\"Admins can insert publication audit log\\"\nON public.publication_deletion_audit_log\nFOR INSERT\nTO authenticated\nWITH CHECK (\n  EXISTS (\n    SELECT 1 FROM user_roles\n    WHERE user_roles.user_id = auth.uid()\n    AND user_roles.role = 'admin'::app_role\n  )\n);\n"}		jpsequeira1980@gmail.com	\N	\N
20260316020010	{"ALTER TABLE public.user_listings ADD COLUMN admin_hidden BOOLEAN NOT NULL DEFAULT false;"}		jpsequeira1980@gmail.com	\N	\N
20260316024636	{"DROP POLICY \\"Users can join orgs\\" ON public.organization_members;\n\nCREATE POLICY \\"Users can join orgs\\" ON public.organization_members\nFOR INSERT TO authenticated\nWITH CHECK (\n  user_id = auth.uid()\n  AND is_system_delegate = false\n  AND (\n    role = 'member'\n    OR (role = 'owner' AND EXISTS (\n      SELECT 1 FROM public.organizations\n      WHERE id = org_id AND created_by = auth.uid()\n    ))\n  )\n);"}		jpsequeira1980@gmail.com	\N	\N
20260316041114	{"\n-- 1. Add is_active column to organization_members\nALTER TABLE public.organization_members \n  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;\n\n-- 2. Update is_org_member to filter only active members\nCREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $$\n  SELECT EXISTS (\n    SELECT 1 FROM public.organization_members\n    WHERE user_id = _user_id AND org_id = _org_id AND is_active = true\n  );\n$$;\n\n-- 3. Add UPDATE policy for owners on organization_members\nCREATE POLICY \\"Owners can update members\\" ON public.organization_members\nFOR UPDATE TO authenticated\nUSING (is_org_owner(auth.uid(), org_id));\n"}		jpsequeira1980@gmail.com	\N	\N
20260316202833	{"-- Agregar nuevos estados al enum user_listing_status para soportar transición desde visita_coordinada\nALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'firme_candidato';\nALTER TYPE public.user_listing_status ADD VALUE IF NOT EXISTS 'posible_interes';"}		jpsequeira1980@gmail.com	\N	\N
20260316204033	{"\n-- Crear bucket de storage para imágenes de propiedades\nINSERT INTO storage.buckets (id, name, public)\nVALUES ('property-images', 'property-images', true)\nON CONFLICT (id) DO NOTHING;\n\n-- Política: usuarios autenticados pueden subir imágenes\nCREATE POLICY \\"Authenticated users can upload property images\\"\nON storage.objects FOR INSERT TO authenticated\nWITH CHECK (bucket_id = 'property-images');\n\n-- Política: cualquiera puede ver las imágenes (bucket público)\nCREATE POLICY \\"Anyone can view property images\\"\nON storage.objects FOR SELECT TO public\nUSING (bucket_id = 'property-images');\n\n-- Política: usuarios pueden borrar sus propias imágenes\nCREATE POLICY \\"Users can delete own property images\\"\nON storage.objects FOR DELETE TO authenticated\nUSING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);\n"}		jpsequeira1980@gmail.com	\N	\N
20260317004533	{"-- Create admin_keys table\nCREATE TABLE public.admin_keys (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  cuenta text NOT NULL DEFAULT '',\n  descripcion text NOT NULL DEFAULT '',\n  texto text NOT NULL DEFAULT '',\n  estado text NOT NULL DEFAULT 'valido',\n  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,\n  created_by_name text NOT NULL DEFAULT '',\n  created_at timestamptz NOT NULL DEFAULT now(),\n  updated_at timestamptz NOT NULL DEFAULT now(),\n  estado_updated_at timestamptz NOT NULL DEFAULT now()\n);\n\n-- RLS: only admins\nALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY \\"Admins can manage admin_keys\\"\n  ON public.admin_keys\n  FOR ALL\n  TO authenticated\n  USING (has_role(auth.uid(), 'admin'))\n  WITH CHECK (has_role(auth.uid(), 'admin'));\n\n-- Auto-update updated_at\nCREATE TRIGGER update_admin_keys_updated_at\n  BEFORE UPDATE ON public.admin_keys\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column();\n\n-- Auto-update estado_updated_at when estado changes\nCREATE OR REPLACE FUNCTION public.update_estado_updated_at()\n  RETURNS trigger\n  LANGUAGE plpgsql\n  SET search_path TO 'public'\nAS $$\nBEGIN\n  IF NEW.estado IS DISTINCT FROM OLD.estado THEN\n    NEW.estado_updated_at = now();\n  END IF;\n  RETURN NEW;\nEND;\n$$;\n\nCREATE TRIGGER update_admin_keys_estado_updated_at\n  BEFORE UPDATE ON public.admin_keys\n  FOR EACH ROW\n  EXECUTE FUNCTION update_estado_updated_at();"}		jpsequeira1980@gmail.com	\N	\N
20260317004946	{"ALTER TABLE public.admin_keys ADD COLUMN fecha date;"}		jpsequeira1980@gmail.com	\N	\N
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.seed_files (path, hash) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 437, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1689, true);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_keys admin_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_keys
    ADD CONSTRAINT admin_keys_pkey PRIMARY KEY (id);


--
-- Name: agency_comments agency_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_comments
    ADD CONSTRAINT agency_comments_pkey PRIMARY KEY (id);


--
-- Name: agent_publications agent_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_publications
    ADD CONSTRAINT agent_publications_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: attribute_scores attribute_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_scores
    ADD CONSTRAINT attribute_scores_pkey PRIMARY KEY (id);


--
-- Name: deletion_audit_log deletion_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deletion_audit_log
    ADD CONSTRAINT deletion_audit_log_pkey PRIMARY KEY (id);


--
-- Name: family_comments family_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_comments
    ADD CONSTRAINT family_comments_pkey PRIMARY KEY (id);


--
-- Name: feedback_attributes feedback_attributes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_attributes
    ADD CONSTRAINT feedback_attributes_name_key UNIQUE (name);


--
-- Name: feedback_attributes feedback_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_attributes
    ADD CONSTRAINT feedback_attributes_pkey PRIMARY KEY (id);


--
-- Name: organization_members organization_members_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: partner_leads partner_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_leads
    ADD CONSTRAINT partner_leads_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: properties properties_source_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_source_url_key UNIQUE (source_url);


--
-- Name: property_reviews property_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_reviews
    ADD CONSTRAINT property_reviews_pkey PRIMARY KEY (id);


--
-- Name: property_reviews property_reviews_property_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_reviews
    ADD CONSTRAINT property_reviews_property_id_user_id_key UNIQUE (property_id, user_id);


--
-- Name: property_views_log property_views_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_views_log
    ADD CONSTRAINT property_views_log_pkey PRIMARY KEY (id);


--
-- Name: publication_deletion_audit_log publication_deletion_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_deletion_audit_log
    ADD CONSTRAINT publication_deletion_audit_log_pkey PRIMARY KEY (id);


--
-- Name: scrape_usage_log scrape_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_usage_log
    ADD CONSTRAINT scrape_usage_log_pkey PRIMARY KEY (id);


--
-- Name: status_history_log status_history_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_history_log
    ADD CONSTRAINT status_history_log_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


--
-- Name: user_listing_attachments user_listing_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listing_attachments
    ADD CONSTRAINT user_listing_attachments_pkey PRIMARY KEY (id);


--
-- Name: user_listing_comment_reads user_listing_comment_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listing_comment_reads
    ADD CONSTRAINT user_listing_comment_reads_pkey PRIMARY KEY (user_listing_id, user_id);


--
-- Name: user_listings user_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_16 messages_2026_03_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_16
    ADD CONSTRAINT messages_2026_03_16_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_17 messages_2026_03_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_17
    ADD CONSTRAINT messages_2026_03_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_18 messages_2026_03_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_18
    ADD CONSTRAINT messages_2026_03_18_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_19 messages_2026_03_19_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_19
    ADD CONSTRAINT messages_2026_03_19_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_20 messages_2026_03_20_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_20
    ADD CONSTRAINT messages_2026_03_20_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_21 messages_2026_03_21_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_21
    ADD CONSTRAINT messages_2026_03_21_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_22 messages_2026_03_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_22
    ADD CONSTRAINT messages_2026_03_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_idempotency_key_key; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_scrape_usage_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_usage_log_created_at ON public.scrape_usage_log USING btree (created_at DESC);


--
-- Name: idx_scrape_usage_log_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_usage_log_role ON public.scrape_usage_log USING btree (role);


--
-- Name: idx_scrape_usage_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scrape_usage_log_user_id ON public.scrape_usage_log USING btree (user_id);


--
-- Name: idx_ulcr_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ulcr_listing_id ON public.user_listing_comment_reads USING btree (user_listing_id);


--
-- Name: idx_ulcr_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ulcr_user_id ON public.user_listing_comment_reads USING btree (user_id);


--
-- Name: idx_user_listing_attachments_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_listing_attachments_listing ON public.user_listing_attachments USING btree (user_listing_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_16_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_16_inserted_at_topic_idx ON realtime.messages_2026_03_16 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_17_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_17_inserted_at_topic_idx ON realtime.messages_2026_03_17 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_18_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_18_inserted_at_topic_idx ON realtime.messages_2026_03_18 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_19_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_19_inserted_at_topic_idx ON realtime.messages_2026_03_19 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_20_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_20_inserted_at_topic_idx ON realtime.messages_2026_03_20 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_21_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_21_inserted_at_topic_idx ON realtime.messages_2026_03_21 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_03_22_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2026_03_22_inserted_at_topic_idx ON realtime.messages_2026_03_22 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_03_16_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_16_inserted_at_topic_idx;


--
-- Name: messages_2026_03_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_16_pkey;


--
-- Name: messages_2026_03_17_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_17_inserted_at_topic_idx;


--
-- Name: messages_2026_03_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_17_pkey;


--
-- Name: messages_2026_03_18_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_18_inserted_at_topic_idx;


--
-- Name: messages_2026_03_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_18_pkey;


--
-- Name: messages_2026_03_19_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_19_inserted_at_topic_idx;


--
-- Name: messages_2026_03_19_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_19_pkey;


--
-- Name: messages_2026_03_20_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_20_inserted_at_topic_idx;


--
-- Name: messages_2026_03_20_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_20_pkey;


--
-- Name: messages_2026_03_21_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_21_inserted_at_topic_idx;


--
-- Name: messages_2026_03_21_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_21_pkey;


--
-- Name: messages_2026_03_22_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_22_inserted_at_topic_idx;


--
-- Name: messages_2026_03_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_22_pkey;


--
-- Name: users on_auth_user_created_profile; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


--
-- Name: users on_auth_user_created_role; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();


--
-- Name: organizations before_insert_organization; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER before_insert_organization BEFORE INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.trg_validate_sub_teams();


--
-- Name: user_listings before_insert_user_listing; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER before_insert_user_listing BEFORE INSERT ON public.user_listings FOR EACH ROW EXECUTE FUNCTION public.trg_validate_listing_quota();


--
-- Name: status_history_log on_status_history_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_status_history_insert AFTER INSERT ON public.status_history_log FOR EACH ROW EXECUTE FUNCTION public.trg_sync_listing_status();


--
-- Name: agent_publications set_updated_at_agent_publications; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_agent_publications BEFORE UPDATE ON public.agent_publications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations set_updated_at_organizations; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles set_updated_at_profiles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: properties set_updated_at_properties; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_properties BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_listing_comment_reads set_updated_at_user_listing_comment_reads; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_user_listing_comment_reads BEFORE UPDATE ON public.user_listing_comment_reads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_listings set_updated_at_user_listings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at_user_listings BEFORE UPDATE ON public.user_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_keys update_admin_keys_estado_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_keys_estado_updated_at BEFORE UPDATE ON public.admin_keys FOR EACH ROW EXECUTE FUNCTION public.update_estado_updated_at();


--
-- Name: admin_keys update_admin_keys_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_keys_updated_at BEFORE UPDATE ON public.admin_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: admin_keys admin_keys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_keys
    ADD CONSTRAINT admin_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: agency_comments agency_comments_agent_pub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_comments
    ADD CONSTRAINT agency_comments_agent_pub_id_fkey FOREIGN KEY (agent_pub_id) REFERENCES public.agent_publications(id) ON DELETE CASCADE;


--
-- Name: agency_comments agency_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_comments
    ADD CONSTRAINT agency_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: agent_publications agent_publications_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_publications
    ADD CONSTRAINT agent_publications_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: agent_publications agent_publications_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_publications
    ADD CONSTRAINT agent_publications_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: agent_publications agent_publications_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_publications
    ADD CONSTRAINT agent_publications_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: app_settings app_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;


--
-- Name: attribute_scores attribute_scores_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_scores
    ADD CONSTRAINT attribute_scores_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.feedback_attributes(id) ON DELETE CASCADE;


--
-- Name: attribute_scores attribute_scores_history_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_scores
    ADD CONSTRAINT attribute_scores_history_log_id_fkey FOREIGN KEY (history_log_id) REFERENCES public.status_history_log(id) ON DELETE CASCADE;


--
-- Name: family_comments family_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_comments
    ADD CONSTRAINT family_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: family_comments family_comments_user_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_comments
    ADD CONSTRAINT family_comments_user_listing_id_fkey FOREIGN KEY (user_listing_id) REFERENCES public.user_listings(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: organizations organizations_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: partner_leads partner_leads_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_leads
    ADD CONSTRAINT partner_leads_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_leads partner_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_leads
    ADD CONSTRAINT partner_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: partner_leads partner_leads_user_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_leads
    ADD CONSTRAINT partner_leads_user_listing_id_fkey FOREIGN KEY (user_listing_id) REFERENCES public.user_listings(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_referred_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referred_by_id_fkey FOREIGN KEY (referred_by_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;


--
-- Name: properties properties_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: property_reviews property_reviews_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_reviews
    ADD CONSTRAINT property_reviews_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: property_reviews property_reviews_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_reviews
    ADD CONSTRAINT property_reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: property_reviews property_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_reviews
    ADD CONSTRAINT property_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: property_views_log property_views_log_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_views_log
    ADD CONSTRAINT property_views_log_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: scrape_usage_log scrape_usage_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scrape_usage_log
    ADD CONSTRAINT scrape_usage_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;


--
-- Name: status_history_log status_history_log_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_history_log
    ADD CONSTRAINT status_history_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: status_history_log status_history_log_user_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_history_log
    ADD CONSTRAINT status_history_log_user_listing_id_fkey FOREIGN KEY (user_listing_id) REFERENCES public.user_listings(id) ON DELETE CASCADE;


--
-- Name: user_listing_attachments user_listing_attachments_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listing_attachments
    ADD CONSTRAINT user_listing_attachments_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.profiles(user_id);


--
-- Name: user_listing_attachments user_listing_attachments_user_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listing_attachments
    ADD CONSTRAINT user_listing_attachments_user_listing_id_fkey FOREIGN KEY (user_listing_id) REFERENCES public.user_listings(id) ON DELETE CASCADE;


--
-- Name: user_listing_comment_reads user_listing_comment_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listing_comment_reads
    ADD CONSTRAINT user_listing_comment_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: user_listing_comment_reads user_listing_comment_reads_user_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listing_comment_reads
    ADD CONSTRAINT user_listing_comment_reads_user_listing_id_fkey FOREIGN KEY (user_listing_id) REFERENCES public.user_listings(id) ON DELETE CASCADE;


--
-- Name: user_listings user_listings_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: user_listings user_listings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_listings user_listings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: user_listings user_listings_source_publication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_source_publication_id_fkey FOREIGN KEY (source_publication_id) REFERENCES public.agent_publications(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_listing_attachments Added by or admin can delete attachments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Added by or admin can delete attachments" ON public.user_listing_attachments FOR DELETE TO authenticated USING (((added_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: properties Admins can delete properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: publication_deletion_audit_log Admins can insert publication audit log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert publication audit log" ON public.publication_deletion_audit_log FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: admin_keys Admins can manage admin_keys; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage admin_keys" ON public.admin_keys TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: organization_members Admins can manage all members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all members" ON public.organization_members TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can manage app_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage app_settings" ON public.app_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feedback_attributes Admins can manage attributes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage attributes" ON public.feedback_attributes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: partners Admins can manage partners; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage partners" ON public.partners TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_config Admins can manage system_config; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage system_config" ON public.system_config TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: organizations Admins can view all orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all orgs" ON public.organizations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: deletion_audit_log Admins can view deletion audit log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view deletion audit log" ON public.deletion_audit_log FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: publication_deletion_audit_log Admins can view publication audit log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view publication audit log" ON public.publication_deletion_audit_log FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: scrape_usage_log Admins can view scrape usage log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view scrape usage log" ON public.scrape_usage_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_config Anon can read video config; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anon can read video config" ON public.system_config FOR SELECT TO anon USING ((key = 'show_auth_video'::text));


--
-- Name: properties Anon can view properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anon can view properties" ON public.properties FOR SELECT TO anon USING (true);


--
-- Name: property_views_log Anyone can insert views; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can insert views" ON public.property_views_log FOR INSERT WITH CHECK (true);


--
-- Name: property_views_log Anyone can read views; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read views" ON public.property_views_log FOR SELECT USING (true);


--
-- Name: agent_publications Anyone can view non-deleted publications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view non-deleted publications" ON public.agent_publications FOR SELECT TO authenticated USING ((status <> 'eliminado'::public.agent_pub_status));


--
-- Name: organizations Auth users can create orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Auth users can create orgs" ON public.organizations FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));


--
-- Name: properties Auth users can create properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Auth users can create properties" ON public.properties FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));


--
-- Name: system_config Auth users can read system_config; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Auth users can read system_config" ON public.system_config FOR SELECT TO authenticated USING (true);


--
-- Name: feedback_attributes Auth users can view attributes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Auth users can view attributes" ON public.feedback_attributes FOR SELECT TO authenticated USING (true);


--
-- Name: partners Auth users can view partners; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Auth users can view partners" ON public.partners FOR SELECT TO authenticated USING ((active = true));


--
-- Name: properties Auth users can view properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Auth users can view properties" ON public.properties FOR SELECT TO authenticated USING (true);


--
-- Name: properties Creator can update properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Creator can update properties" ON public.properties FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: organization_members Members can view org members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: organizations Members can view their orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Members can view their orgs" ON public.organizations FOR SELECT TO authenticated USING ((public.is_org_member(auth.uid(), id) OR (created_by = auth.uid())));


--
-- Name: user_listings Org members can delete listings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can delete listings" ON public.user_listings FOR DELETE TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: agent_publications Org members can delete publications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can delete publications" ON public.agent_publications FOR DELETE TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: agency_comments Org members can insert agency comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert agency comments" ON public.agency_comments FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.agent_publications ap
  WHERE ((ap.id = agency_comments.agent_pub_id) AND public.is_org_member(auth.uid(), ap.org_id))))));


--
-- Name: user_listing_attachments Org members can insert attachments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert attachments" ON public.user_listing_attachments FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = user_listing_attachments.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id)))));


--
-- Name: family_comments Org members can insert family comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert family comments" ON public.family_comments FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = family_comments.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id))))));


--
-- Name: status_history_log Org members can insert history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert history" ON public.status_history_log FOR INSERT TO authenticated WITH CHECK (((changed_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = status_history_log.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id))))));


--
-- Name: user_listings Org members can insert listings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert listings" ON public.user_listings FOR INSERT TO authenticated WITH CHECK ((public.is_org_member(auth.uid(), org_id) AND (added_by = auth.uid())));


--
-- Name: agent_publications Org members can insert publications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert publications" ON public.agent_publications FOR INSERT TO authenticated WITH CHECK ((public.is_org_member(auth.uid(), org_id) OR public.is_system_delegate(auth.uid())));


--
-- Name: attribute_scores Org members can insert scores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can insert scores" ON public.attribute_scores FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.status_history_log slh
     JOIN public.user_listings ul ON ((ul.id = slh.user_listing_id)))
  WHERE ((slh.id = attribute_scores.history_log_id) AND public.is_org_member(auth.uid(), ul.org_id)))));


--
-- Name: user_listings Org members can update listings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can update listings" ON public.user_listings FOR UPDATE TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: agent_publications Org members can update publications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can update publications" ON public.agent_publications FOR UPDATE TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: agency_comments Org members can view agency comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view agency comments" ON public.agency_comments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.agent_publications ap
  WHERE ((ap.id = agency_comments.agent_pub_id) AND public.is_org_member(auth.uid(), ap.org_id)))));


--
-- Name: user_listing_attachments Org members can view attachments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view attachments" ON public.user_listing_attachments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = user_listing_attachments.user_listing_id) AND (public.is_org_member(auth.uid(), ul.org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));


--
-- Name: family_comments Org members can view family comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view family comments" ON public.family_comments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = family_comments.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id)))));


--
-- Name: status_history_log Org members can view history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view history" ON public.status_history_log FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = status_history_log.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id)))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_listings Org members can view listings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view listings" ON public.user_listings FOR SELECT TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: agent_publications Org members can view own publications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view own publications" ON public.agent_publications FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));


--
-- Name: property_reviews Org members can view reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view reviews" ON public.property_reviews FOR SELECT TO authenticated USING ((public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: attribute_scores Org members can view scores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Org members can view scores" ON public.attribute_scores FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM (public.status_history_log slh
     JOIN public.user_listings ul ON ((ul.id = slh.user_listing_id)))
  WHERE ((slh.id = attribute_scores.history_log_id) AND public.is_org_member(auth.uid(), ul.org_id)))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: organizations Owners can delete orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can delete orgs" ON public.organizations FOR DELETE TO authenticated USING ((public.is_org_owner(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: organization_members Owners can manage members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can manage members" ON public.organization_members FOR DELETE TO authenticated USING ((public.is_org_owner(auth.uid(), org_id) OR (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = organization_members.org_id) AND (o.created_by = auth.uid())))) OR (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: organization_members Owners can update members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can update members" ON public.organization_members FOR UPDATE TO authenticated USING ((public.is_org_owner(auth.uid(), org_id) OR (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = organization_members.org_id) AND (o.created_by = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((public.is_org_owner(auth.uid(), org_id) OR (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = organization_members.org_id) AND (o.created_by = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: organizations Owners can update orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owners can update orgs" ON public.organizations FOR UPDATE TO authenticated USING ((public.is_org_owner(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: family_comments Users can delete own comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own comments" ON public.family_comments FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: partner_leads Users can insert leads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert leads" ON public.partner_leads FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_listing_comment_reads Users can insert own listing comment reads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own listing comment reads" ON public.user_listing_comment_reads FOR INSERT TO authenticated WITH CHECK ((((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = user_listing_comment_reads.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: property_reviews Users can insert reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert reviews" ON public.property_reviews FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND public.is_org_member(auth.uid(), org_id)));


--
-- Name: organization_members Users can join orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can join orgs" ON public.organization_members FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND (is_system_delegate = false) AND ((role = 'member'::public.org_role) OR ((role = 'owner'::public.org_role) AND (EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = organization_members.org_id) AND (organizations.created_by = auth.uid()))))))));


--
-- Name: user_listing_comment_reads Users can update own listing comment reads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own listing comment reads" ON public.user_listing_comment_reads FOR UPDATE TO authenticated USING ((((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = user_listing_comment_reads.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id))))) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = user_listing_comment_reads.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: property_reviews Users can update own reviews; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own reviews" ON public.property_reviews FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: partner_leads Users can view own leads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own leads" ON public.partner_leads FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_listing_comment_reads Users can view own listing comment reads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own listing comment reads" ON public.user_listing_comment_reads FOR SELECT TO authenticated USING ((((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_listings ul
  WHERE ((ul.id = user_listing_comment_reads.user_listing_id) AND public.is_org_member(auth.uid(), ul.org_id))))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can view own or org profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own or org profiles" ON public.profiles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.organization_members om1
  WHERE ((om1.user_id = auth.uid()) AND (om1.org_id IN ( SELECT om2.org_id
           FROM public.organization_members om2
          WHERE (om2.user_id = profiles.user_id))))))));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: admin_keys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: agency_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.agency_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_publications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_publications ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: attribute_scores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.attribute_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: deletion_audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: family_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.family_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback_attributes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feedback_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_leads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: property_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: property_views_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_views_log ENABLE ROW LEVEL SECURITY;

--
-- Name: publication_deletion_audit_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.publication_deletion_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: scrape_usage_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.scrape_usage_log ENABLE ROW LEVEL SECURITY;

--
-- Name: status_history_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.status_history_log ENABLE ROW LEVEL SECURITY;

--
-- Name: system_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

--
-- Name: user_listing_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_listing_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: user_listing_comment_reads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_listing_comment_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: user_listings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_listings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Anyone can view property images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING ((bucket_id = 'property-images'::text));


--
-- Name: objects Authenticated users can upload property images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'property-images'::text));


--
-- Name: objects Users can delete own property images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users can delete own property images" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'property-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- Name: supabase_realtime family_comments; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.family_comments;


--
-- Name: supabase_realtime property_reviews; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.property_reviews;


--
-- Name: supabase_realtime user_listing_comment_reads; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.user_listing_comment_reads;


--
-- Name: supabase_realtime user_listings; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.user_listings;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION admin_physical_delete_user(_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.admin_physical_delete_user(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.admin_physical_delete_user(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_physical_delete_user(_user_id uuid) TO service_role;


--
-- Name: FUNCTION admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid) TO anon;
GRANT ALL ON FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_physical_delete_user(_user_id uuid, _reason text, _deleted_by uuid) TO service_role;


--
-- Name: FUNCTION admin_update_profile_status(_user_id uuid, _status public.user_status); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.admin_update_profile_status(_user_id uuid, _status public.user_status) TO anon;
GRANT ALL ON FUNCTION public.admin_update_profile_status(_user_id uuid, _status public.user_status) TO authenticated;
GRANT ALL ON FUNCTION public.admin_update_profile_status(_user_id uuid, _status public.user_status) TO service_role;


--
-- Name: FUNCTION count_property_listing_users(_property_id uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.count_property_listing_users(_property_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.count_property_listing_users(_property_id uuid) TO anon;
GRANT ALL ON FUNCTION public.count_property_listing_users(_property_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.count_property_listing_users(_property_id uuid) TO service_role;


--
-- Name: FUNCTION find_org_by_invite_code(_code text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.find_org_by_invite_code(_code text) TO anon;
GRANT ALL ON FUNCTION public.find_org_by_invite_code(_code text) TO authenticated;
GRANT ALL ON FUNCTION public.find_org_by_invite_code(_code text) TO service_role;


--
-- Name: FUNCTION get_marketplace_org_names(_org_ids uuid[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_marketplace_org_names(_org_ids uuid[]) TO service_role;


--
-- Name: FUNCTION handle_new_user_profile(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user_profile() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user_profile() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user_profile() TO service_role;


--
-- Name: FUNCTION handle_new_user_role(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user_role() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user_role() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user_role() TO service_role;


--
-- Name: FUNCTION handle_user_email_sync(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_user_email_sync() TO anon;
GRANT ALL ON FUNCTION public.handle_user_email_sync() TO authenticated;
GRANT ALL ON FUNCTION public.handle_user_email_sync() TO service_role;


--
-- Name: FUNCTION has_role(_user_id uuid, _role public.app_role); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;


--
-- Name: FUNCTION increment_property_views(p_property_id uuid, p_is_publication boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_property_views(p_property_id uuid, p_is_publication boolean) TO anon;
GRANT ALL ON FUNCTION public.increment_property_views(p_property_id uuid, p_is_publication boolean) TO authenticated;
GRANT ALL ON FUNCTION public.increment_property_views(p_property_id uuid, p_is_publication boolean) TO service_role;


--
-- Name: FUNCTION increment_property_views(p_property_id uuid, p_publication_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_property_views(p_property_id uuid, p_publication_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_property_views(p_property_id uuid, p_publication_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_property_views(p_property_id uuid, p_publication_id uuid) TO service_role;


--
-- Name: FUNCTION is_org_member(_user_id uuid, _org_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_org_member(_user_id uuid, _org_id uuid) TO service_role;


--
-- Name: FUNCTION is_org_owner(_user_id uuid, _org_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid) TO service_role;


--
-- Name: FUNCTION is_system_delegate(_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_system_delegate(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_system_delegate(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_system_delegate(_user_id uuid) TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION trg_sync_listing_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trg_sync_listing_status() TO anon;
GRANT ALL ON FUNCTION public.trg_sync_listing_status() TO authenticated;
GRANT ALL ON FUNCTION public.trg_sync_listing_status() TO service_role;


--
-- Name: FUNCTION trg_validate_listing_quota(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trg_validate_listing_quota() TO anon;
GRANT ALL ON FUNCTION public.trg_validate_listing_quota() TO authenticated;
GRANT ALL ON FUNCTION public.trg_validate_listing_quota() TO service_role;


--
-- Name: FUNCTION trg_validate_sub_teams(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trg_validate_sub_teams() TO anon;
GRANT ALL ON FUNCTION public.trg_validate_sub_teams() TO authenticated;
GRANT ALL ON FUNCTION public.trg_validate_sub_teams() TO service_role;


--
-- Name: FUNCTION update_estado_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_estado_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_estado_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_estado_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE admin_keys; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_keys TO anon;
GRANT ALL ON TABLE public.admin_keys TO authenticated;
GRANT ALL ON TABLE public.admin_keys TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE scrape_usage_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.scrape_usage_log TO anon;
GRANT ALL ON TABLE public.scrape_usage_log TO authenticated;
GRANT ALL ON TABLE public.scrape_usage_log TO service_role;


--
-- Name: TABLE admin_scrape_usage_by_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_scrape_usage_by_user TO anon;
GRANT ALL ON TABLE public.admin_scrape_usage_by_user TO authenticated;
GRANT ALL ON TABLE public.admin_scrape_usage_by_user TO service_role;


--
-- Name: TABLE agency_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.agency_comments TO anon;
GRANT ALL ON TABLE public.agency_comments TO authenticated;
GRANT ALL ON TABLE public.agency_comments TO service_role;


--
-- Name: TABLE agent_publications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.agent_publications TO anon;
GRANT ALL ON TABLE public.agent_publications TO authenticated;
GRANT ALL ON TABLE public.agent_publications TO service_role;


--
-- Name: TABLE properties; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.properties TO anon;
GRANT ALL ON TABLE public.properties TO authenticated;
GRANT ALL ON TABLE public.properties TO service_role;


--
-- Name: TABLE status_history_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.status_history_log TO anon;
GRANT ALL ON TABLE public.status_history_log TO authenticated;
GRANT ALL ON TABLE public.status_history_log TO service_role;


--
-- Name: TABLE user_listings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_listings TO anon;
GRANT ALL ON TABLE public.user_listings TO authenticated;
GRANT ALL ON TABLE public.user_listings TO service_role;


--
-- Name: TABLE agent_deserter_insights; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.agent_deserter_insights TO anon;
GRANT ALL ON TABLE public.agent_deserter_insights TO authenticated;
GRANT ALL ON TABLE public.agent_deserter_insights TO service_role;


--
-- Name: TABLE app_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.app_settings TO anon;
GRANT ALL ON TABLE public.app_settings TO authenticated;
GRANT ALL ON TABLE public.app_settings TO service_role;


--
-- Name: TABLE attribute_scores; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attribute_scores TO anon;
GRANT ALL ON TABLE public.attribute_scores TO authenticated;
GRANT ALL ON TABLE public.attribute_scores TO service_role;


--
-- Name: TABLE deletion_audit_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.deletion_audit_log TO anon;
GRANT ALL ON TABLE public.deletion_audit_log TO authenticated;
GRANT ALL ON TABLE public.deletion_audit_log TO service_role;


--
-- Name: TABLE family_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.family_comments TO anon;
GRANT ALL ON TABLE public.family_comments TO authenticated;
GRANT ALL ON TABLE public.family_comments TO service_role;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organizations TO anon;
GRANT ALL ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;


--
-- Name: TABLE property_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_reviews TO anon;
GRANT ALL ON TABLE public.property_reviews TO authenticated;
GRANT ALL ON TABLE public.property_reviews TO service_role;


--
-- Name: TABLE family_private_rating; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.family_private_rating TO anon;
GRANT ALL ON TABLE public.family_private_rating TO authenticated;
GRANT ALL ON TABLE public.family_private_rating TO service_role;


--
-- Name: TABLE feedback_attributes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feedback_attributes TO anon;
GRANT ALL ON TABLE public.feedback_attributes TO authenticated;
GRANT ALL ON TABLE public.feedback_attributes TO service_role;


--
-- Name: TABLE organization_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organization_members TO anon;
GRANT ALL ON TABLE public.organization_members TO authenticated;
GRANT ALL ON TABLE public.organization_members TO service_role;


--
-- Name: TABLE partner_leads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.partner_leads TO anon;
GRANT ALL ON TABLE public.partner_leads TO authenticated;
GRANT ALL ON TABLE public.partner_leads TO service_role;


--
-- Name: TABLE partners; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.partners TO anon;
GRANT ALL ON TABLE public.partners TO authenticated;
GRANT ALL ON TABLE public.partners TO service_role;


--
-- Name: TABLE property_insights_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_insights_summary TO anon;
GRANT ALL ON TABLE public.property_insights_summary TO authenticated;
GRANT ALL ON TABLE public.property_insights_summary TO service_role;


--
-- Name: TABLE property_views_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_views_log TO anon;
GRANT ALL ON TABLE public.property_views_log TO authenticated;
GRANT ALL ON TABLE public.property_views_log TO service_role;


--
-- Name: TABLE public_global_rating; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.public_global_rating TO anon;
GRANT ALL ON TABLE public.public_global_rating TO authenticated;
GRANT ALL ON TABLE public.public_global_rating TO service_role;


--
-- Name: TABLE publication_deletion_audit_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.publication_deletion_audit_log TO anon;
GRANT ALL ON TABLE public.publication_deletion_audit_log TO authenticated;
GRANT ALL ON TABLE public.publication_deletion_audit_log TO service_role;


--
-- Name: TABLE system_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_config TO anon;
GRANT ALL ON TABLE public.system_config TO authenticated;
GRANT ALL ON TABLE public.system_config TO service_role;


--
-- Name: TABLE user_listing_attachments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_listing_attachments TO anon;
GRANT ALL ON TABLE public.user_listing_attachments TO authenticated;
GRANT ALL ON TABLE public.user_listing_attachments TO service_role;


--
-- Name: TABLE user_listing_comment_reads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_listing_comment_reads TO anon;
GRANT ALL ON TABLE public.user_listing_comment_reads TO authenticated;
GRANT ALL ON TABLE public.user_listing_comment_reads TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2026_03_16; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_16 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_16 TO dashboard_user;


--
-- Name: TABLE messages_2026_03_17; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_17 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_17 TO dashboard_user;


--
-- Name: TABLE messages_2026_03_18; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_18 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_18 TO dashboard_user;


--
-- Name: TABLE messages_2026_03_19; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_19 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_19 TO dashboard_user;


--
-- Name: TABLE messages_2026_03_20; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_20 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_20 TO dashboard_user;


--
-- Name: TABLE messages_2026_03_21; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_21 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_21 TO dashboard_user;


--
-- Name: TABLE messages_2026_03_22; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2026_03_22 TO postgres;
GRANT ALL ON TABLE realtime.messages_2026_03_22 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


ALTER EVENT TRIGGER ensure_rls OWNER TO postgres;

--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict YqMw7824dV5kFE24bxZZ3BQo4hBK3vHom3C9FQpjJ8HvpCKaPNTexDZX3azt2ft

