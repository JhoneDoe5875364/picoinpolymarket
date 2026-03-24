--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5

-- Started on 2025-11-14 21:23:15

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
-- TOC entry 95 (class 2615 OID 16492)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- TOC entry 23 (class 2615 OID 16388)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- TOC entry 30 (class 2615 OID 16622)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- TOC entry 29 (class 2615 OID 16611)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- TOC entry 13 (class 2615 OID 16386)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- TOC entry 10 (class 2615 OID 16603)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- TOC entry 96 (class 2615 OID 16540)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- TOC entry 28 (class 2615 OID 16651)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- TOC entry 6 (class 3079 OID 16687)
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- TOC entry 4590 (class 0 OID 0)
-- core: 6
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- TOC entry 4 (class 3079 OID 16389)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 4591 (class 0 OID 0)
-- core: 4
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 7 (class 3079 OID 64099)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 4592 (class 0 OID 0)
-- core: 7
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 2 (class 3079 OID 16441)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 4593 (class 0 OID 0)
-- core: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16652)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 4594 (class 0 OID 0)
-- core: 5
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 3 (class 3079 OID 16430)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 4595 (class 0 OID 0)
-- core: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1262 (class 1247 OID 16780)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- TOC entry 1292 (class 1247 OID 16921)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- TOC entry 1259 (class 1247 OID 16774)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1256 (class 1247 OID 16769)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1444 (class 1247 OID 113158)
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
-- TOC entry 1456 (class 1247 OID 113231)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1424 (class 1247 OID 62932)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1447 (class 1247 OID 113168)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1298 (class 1247 OID 16963)
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
-- TOC entry 1323 (class 1247 OID 17134)
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
-- TOC entry 1313 (class 1247 OID 17090)
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
-- TOC entry 1316 (class 1247 OID 17105)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- TOC entry 1331 (class 1247 OID 17177)
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
-- TOC entry 1326 (class 1247 OID 17147)
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
-- TOC entry 1418 (class 1247 OID 49698)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- TOC entry 447 (class 1255 OID 16538)
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
-- TOC entry 4598 (class 0 OID 0)
-- core: 447
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 493 (class 1255 OID 16751)
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
-- TOC entry 586 (class 1255 OID 16537)
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
-- TOC entry 4601 (class 0 OID 0)
-- core: 586
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 573 (class 1255 OID 16536)
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
-- TOC entry 4603 (class 0 OID 0)
-- core: 573
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 425 (class 1255 OID 16595)
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
-- TOC entry 4619 (class 0 OID 0)
-- core: 425
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 589 (class 1255 OID 16616)
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
-- TOC entry 4621 (class 0 OID 0)
-- core: 589
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 523 (class 1255 OID 16597)
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
-- TOC entry 4623 (class 0 OID 0)
-- core: 523
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 423 (class 1255 OID 16607)
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
-- TOC entry 502 (class 1255 OID 16608)
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
-- TOC entry 501 (class 1255 OID 16618)
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
-- TOC entry 4652 (class 0 OID 0)
-- core: 501
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 479 (class 1255 OID 16387)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- TOC entry 530 (class 1255 OID 89783)
-- Name: _clamp(numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public._clamp(val numeric, lo numeric, hi numeric) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT GREATEST(lo, LEAST(hi, val))
$$;


ALTER FUNCTION public._clamp(val numeric, lo numeric, hi numeric) OWNER TO postgres;

--
-- TOC entry 488 (class 1255 OID 50560)
-- Name: _require_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public._require_admin() RETURNS void
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_is_admin boolean := false;
  v_role text;
begin
  -- 1) Allow service role JWT (SQL editor or backend with service key)
  -- NOTE: when no JWT, this returns NULL. With service key, role='service_role'.
  begin
    v_role := (select coalesce(current_setting('request.jwt.claim.role', true), ''));
  exception when others then
    v_role := '';
  end;

  if v_role = 'service_role' then
    return; -- allow
  end if;

  -- 2) Otherwise require membership in public.admins
  -- Try common shapes: admins(user_id) then admins(id)
  begin
    select exists (select 1 from public.admins a where a.user_id = auth.uid())
      into v_is_admin;
  exception when undefined_column then
    begin
      select exists (select 1 from public.admins a where a.id = auth.uid())
        into v_is_admin;
    exception when undefined_column then
      v_is_admin := false;
    end;
  end;

  if not coalesce(v_is_admin, false) then
    raise exception 'forbidden: admin only' using errcode = '42501';
  end if;
end;
$$;


ALTER FUNCTION public._require_admin() OWNER TO postgres;

--
-- TOC entry 544 (class 1255 OID 50692)
-- Name: admin_add(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_add(p_user uuid) RETURNS TABLE(user_id uuid)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  has_user_id boolean;
begin
  -- allow service role or existing admins
  perform public._require_admin();

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admins' and column_name='user_id'
  ) into has_user_id;

  if has_user_id then
    insert into public.admins(user_id) values (p_user)
    on conflict do nothing;
    return query
      select a.user_id from public.admins a where a.user_id = p_user;
  else
    insert into public.admins(id) values (p_user)
    on conflict do nothing;
    return query
      select a.id as user_id from public.admins a where a.id = p_user;
  end if;
end;
$$;


ALTER FUNCTION public.admin_add(p_user uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 376 (class 1259 OID 17281)
-- Name: markets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.markets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    question text NOT NULL,
    category text,
    creator_id uuid,
    tier text,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone,
    liquidity numeric,
    resolution_criteria text,
    resolution_source text,
    resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp without time zone,
    resolved_outcome text,
    is_archived boolean DEFAULT false,
    closes_at timestamp with time zone,
    outcome_reason text,
    title text GENERATED ALWAYS AS (question) STORED,
    seed_total numeric DEFAULT 0,
    description text,
    close_at timestamp with time zone,
    rules text,
    sources jsonb DEFAULT '[]'::jsonb NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    checklist_resolution_clarity boolean DEFAULT true NOT NULL,
    checklist_restricted_topics boolean DEFAULT true NOT NULL,
    checklist_verifiable_outcome boolean DEFAULT true NOT NULL
);


ALTER TABLE public.markets OWNER TO postgres;

--
-- TOC entry 476 (class 1255 OID 50561)
-- Name: admin_create_market(text, text, text, timestamp with time zone, timestamp with time zone, numeric, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_create_market(p_question text, p_category text DEFAULT NULL::text, p_tier text DEFAULT NULL::text, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_closes_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_liquidity numeric DEFAULT 0, p_resolution_criteria text DEFAULT NULL::text, p_resolution_source text DEFAULT NULL::text) RETURNS public.markets
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_row public.markets%rowtype;
begin
  -- gate
  perform public._require_admin();

  -- minimal validation
  if coalesce(trim(p_question), '') = '' then
    raise exception 'question is required' using errcode='22023';
  end if;

  -- insert (status=open, resolved=false, creator_id=auth.uid())
  insert into public.markets (
    question, category, tier, status,
    creator_id, end_date, closes_at, liquidity,
    resolution_criteria, resolution_source,
    resolved, outcome, is_archived
  )
  values (
    p_question, p_category, p_tier, 'open',
    auth.uid(), p_end_date, p_closes_at, p_liquidity,
    p_resolution_criteria, p_resolution_source,
    false, null, false
  )
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION public.admin_create_market(p_question text, p_category text, p_tier text, p_end_date timestamp with time zone, p_closes_at timestamp with time zone, p_liquidity numeric, p_resolution_criteria text, p_resolution_source text) OWNER TO postgres;

--
-- TOC entry 577 (class 1255 OID 50694)
-- Name: admin_list(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_list() RETURNS TABLE(user_id uuid)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  has_user_id boolean;
begin
  perform public._require_admin();

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admins' and column_name='user_id'
  ) into has_user_id;

  if has_user_id then
    return query select a.user_id from public.admins a;
  else
    return query select a.id as user_id from public.admins a;
  end if;
end;
$$;


ALTER FUNCTION public.admin_list() OWNER TO postgres;

--
-- TOC entry 474 (class 1255 OID 50693)
-- Name: admin_remove(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_remove(p_user uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  has_user_id boolean;
  v_deleted int := 0;
begin
  perform public._require_admin();

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='admins' and column_name='user_id'
  ) into has_user_id;

  if has_user_id then
    delete from public.admins a where a.user_id = p_user;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  else
    delete from public.admins a where a.id = p_user;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  end if;

  return v_deleted > 0;
end;
$$;


ALTER FUNCTION public.admin_remove(p_user uuid) OWNER TO postgres;

--
-- TOC entry 466 (class 1255 OID 50604)
-- Name: admin_resolve_market(uuid, text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean DEFAULT false) RETURNS TABLE(market_id uuid, outcome text, resolved boolean, resolved_at timestamp with time zone, winners integer, pot_pi numeric, payouts_created integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_outcome text;
  v_exists boolean;
  v_resolved boolean;
  v_yes_total numeric := 0;
  v_no_total  numeric := 0;
  v_pot       numeric := 0;
  v_winners   int := 0;
  v_inserts   int := 0;
begin
  -- admin gate
  perform public._require_admin();

  -- normalize + validate outcome
  v_outcome := lower(coalesce(p_outcome,''));
  if v_outcome not in ('yes','no') then
    raise exception 'invalid outcome: % (must be yes|no)', p_outcome using errcode='22023';
  end if;

  -- ensure market exists and not already resolved
  select true, resolved into v_exists, v_resolved
  from public.markets
  where id = p_market_id;

  if not coalesce(v_exists,false) then
    raise exception 'market not found' using errcode='22023';
  end if;

  if coalesce(v_resolved,false) then
    raise exception 'market already resolved' using errcode='22023';
  end if;

  -- resolve
  update public.markets
  set resolved = true,
      outcome  = v_outcome,
      resolved_at = now()
  where id = p_market_id;

  -- compute pot totals (net exposures)
  with agg as (
    select side,
           sum(case when type='buy' then net_pi when type='sell' then -net_pi else 0 end) as net_side_pi
    from public.trades
    where market_id = p_market_id
    group by side
  )
  select
    coalesce(max(case when side='yes' then net_side_pi end),0),
    coalesce(max(case when side='no'  then net_side_pi end),0)
  into v_yes_total, v_no_total
  from agg;

  v_pot := v_yes_total + v_no_total;

  if p_auto_payout then
    if v_outcome = 'yes' then
      if v_yes_total <= 0 or v_pot <= 0 then
        raise exception 'no positive pool for YES; cannot auto-payout' using errcode='22023';
      end if;

      with user_win as (
        select
          t.user_id,
          -- user net YES exposure
          coalesce(sum(case when t.type='buy' and t.side='yes' then t.net_pi
                            when t.type='sell' and t.side='yes' then -t.net_pi
                            else 0 end),0) as user_yes
        from public.trades t
        where t.market_id = p_market_id
        group by t.user_id
      ),
      winners as (
        select user_id,
               user_yes,
               round( (user_yes / v_yes_total) * v_pot, 6) as payout_pi
        from user_win
        where user_yes > 0
      ),
      ins as (
        insert into public.trades (user_id, market_id, type, side, pi_amount)
        select w.user_id, p_market_id, 'payout', 'yes', w.payout_pi
        from winners w
        on conflict (user_id, market_id) where (type = 'payout')
        do nothing
        returning 1
      )
      select count(*) into v_inserts from ins;

      select count(*) into v_winners from (
        select 1 from public.trades
        where market_id = p_market_id and type='payout' and side='yes'
      ) q;

    else -- outcome = 'no'
      if v_no_total <= 0 or v_pot <= 0 then
        raise exception 'no positive pool for NO; cannot auto-payout' using errcode='22023';
      end if;

      with user_win as (
        select
          t.user_id,
          coalesce(sum(case when t.type='buy' and t.side='no' then t.net_pi
                            when t.type='sell' and t.side='no' then -t.net_pi
                            else 0 end),0) as user_no
        from public.trades t
        where t.market_id = p_market_id
        group by t.user_id
      ),
      winners as (
        select user_id,
               user_no,
               round( (user_no / v_no_total) * v_pot, 6) as payout_pi
        from user_win
        where user_no > 0
      ),
      ins as (
        insert into public.trades (user_id, market_id, type, side, pi_amount)
        select w.user_id, p_market_id, 'payout', 'no', w.payout_pi
        from winners w
        on conflict (user_id, market_id) where (type = 'payout')
        do nothing
        returning 1
      )
      select count(*) into v_inserts from ins;

      select count(*) into v_winners from (
        select 1 from public.trades
        where market_id = p_market_id and type='payout' and side='no'
      ) q;
    end if;
  end if;

  return query
  select
    p_market_id      as market_id,
    v_outcome        as outcome,
    true             as resolved,
    (select resolved_at from public.markets where id = p_market_id) as resolved_at,
    v_winners        as winners,
    v_pot            as pot_pi,
    v_inserts        as payouts_created;

end;
$$;


ALTER FUNCTION public.admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean) OWNER TO postgres;

--
-- TOC entry 527 (class 1255 OID 80582)
-- Name: comments_insert_rpc(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.comments_insert_rpc(p_market_id uuid, p_author text, p_body text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
  v_market_col text;
  v_author_col text;
  v_body_col   text;
  v_row        public.comments; -- if comments is a VIEW, this can be "record"; JSON return makes it safe
begin
  -- Pick the first matching column name that exists in "comments"
  select column_name into v_market_col
  from information_schema.columns
  where table_schema='public' and table_name='comments'
    and column_name = any(array['market_id','market','market_uuid'])
  limit 1;

  select column_name into v_author_col
  from information_schema.columns
  where table_schema='public' and table_name='comments'
    and column_name = any(array['author','handle','user_handle','username','created_by'])
  limit 1;

  select column_name into v_body_col
  from information_schema.columns
  where table_schema='public' and table_name='comments'
    and column_name = any(array['body','text','content','message','comment','comment_text'])
  limit 1;

  if v_market_col is null then
    raise exception 'comments table has no market-id column (tried: market_id, market, market_uuid)';
  end if;
  if v_author_col is null then
    raise exception 'comments table has no author/handle column (tried: author, handle, user_handle, username, created_by)';
  end if;
  if v_body_col is null then
    raise exception 'comments table has no body/text column (tried: body, text, content, message, comment, comment_text)';
  end if;

  -- Insert using detected columns, capture the full row
  execute format(
    'insert into public.comments (%I, %I, %I) values ($1, $2, $3) returning *',
    v_market_col, v_author_col, v_body_col
  ) into v_row
  using p_market_id, p_author, p_body;

  return to_jsonb(v_row);
end;
$_$;


ALTER FUNCTION public.comments_insert_rpc(p_market_id uuid, p_author text, p_body text) OWNER TO postgres;

--
-- TOC entry 556 (class 1255 OID 44084)
-- Name: ensure_user_for_position(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.ensure_user_for_position() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.users (id) VALUES (NEW.user_id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;


ALTER FUNCTION public.ensure_user_for_position() OWNER TO postgres;

--
-- TOC entry 375 (class 1259 OID 17269)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pi_username text,
    created_at timestamp with time zone DEFAULT now(),
    referral_code text,
    referred_by text,
    tutorial_completed boolean DEFAULT false,
    handle_norm text,
    status character varying(255),
    is_admin boolean,
    balance numeric DEFAULT 0 NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 520 (class 1255 OID 133475)
-- Name: get_or_create_user_by_pi(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_or_create_user_by_pi(p_user_id uuid, p_username text) RETURNS public.users
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  u public.users;
begin
  -- try find (case-insensitive)
  select * into u
  from public.users
  where id = p_user_id AND lower(pi_username) = lower(p_username)
  limit 1;

  if not found then
    insert into public.users (id, pi_username)
    values (p_user_id, p_username)
    returning * into u;
  end if;

  return u;
end;
$$;


ALTER FUNCTION public.get_or_create_user_by_pi(p_user_id uuid, p_username text) OWNER TO postgres;

--
-- TOC entry 472 (class 1255 OID 75840)
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin(uid uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists (select 1 from public.admins a where a.user_id = uid)
$$;


ALTER FUNCTION public.is_admin(uid uuid) OWNER TO postgres;

--
-- TOC entry 585 (class 1255 OID 77152)
-- Name: leaderboard_rollup(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.leaderboard_rollup(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(user_id uuid, username text, volume numeric, success_pct integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select user_id, username, volume, success_pct
  from public.mv_leaderboard
  order by volume desc
  limit coalesce(p_limit, 50)
  offset coalesce(p_offset, 0);
$$;


ALTER FUNCTION public.leaderboard_rollup(p_limit integer, p_offset integer) OWNER TO postgres;

--
-- TOC entry 480 (class 1255 OID 53404)
-- Name: market_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.market_stats(p_market_id uuid) RETURNS TABLE(total_volume numeric, yes_total numeric, no_total numeric, implied_pct numeric, volume_24h numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  with pos as (
    select side, amount, created_at
    from public.positions
    where market_id = p_market_id
  ),
  agg as (
    select
      coalesce(sum(case when side = 'yes' then amount else 0 end), 0) as yes_total,
      coalesce(sum(case when side = 'no'  then amount else 0 end), 0) as no_total
    from pos
  ),
  v24 as (
    select coalesce(sum(amount), 0) as v24
    from pos
    where created_at >= (now() - interval '24 hours')
  )
  select
    (a.yes_total + a.no_total) as total_volume,
    a.yes_total,
    a.no_total,
    case when (a.yes_total + a.no_total) > 0
         then (a.yes_total::numeric) / (a.yes_total + a.no_total)
         else null end             as implied_pct,
    v.v24                         as volume_24h
  from agg a
  cross join v24 v;
$$;


ALTER FUNCTION public.market_stats(p_market_id uuid) OWNER TO postgres;

--
-- TOC entry 560 (class 1255 OID 66518)
-- Name: norm_handle(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.norm_handle(txt text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $_$
  SELECT NULLIF(regexp_replace(lower(btrim(coalesce($1,''))), '^[[:space:]@]+', ''), '');
$_$;


ALTER FUNCTION public.norm_handle(txt text) OWNER TO postgres;

--
-- TOC entry 557 (class 1255 OID 66676)
-- Name: portfolio_closed_latest5(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.portfolio_closed_latest5() RETURNS TABLE(market_id uuid, market_title text, outcome text, active_side text, active_exposure_pi numeric, updated_at timestamp with time zone)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH my_pos AS (
    SELECT p.market_id, p.user_id, p.side, p.amount, p.created_at
    FROM public.positions p
    WHERE p.user_id = auth.uid()
  ),
  side_sums AS (
    SELECT
      mp.market_id,
      COALESCE(SUM(CASE WHEN mp.side = 'yes' THEN mp.amount END), 0)::numeric AS yes_sum,
      COALESCE(SUM(CASE WHEN mp.side = 'no'  THEN mp.amount END), 0)::numeric AS no_sum,
      MAX(mp.created_at) AS updated_at
    FROM my_pos mp
    GROUP BY mp.market_id
  )
  SELECT
    m.id AS market_id,
    COALESCE(m.title, m.question, 'Untitled') AS market_title,
    m.outcome::text AS outcome,
    CASE WHEN ss.yes_sum >= ss.no_sum THEN 'yes' ELSE 'no' END AS active_side,
    (ss.yes_sum + ss.no_sum)::numeric AS active_exposure_pi,
    ss.updated_at
  FROM side_sums ss
  JOIN public.markets m ON m.id = ss.market_id
  WHERE COALESCE(m.resolved, false) = true AND m.outcome IS NOT NULL
  ORDER BY ss.updated_at DESC
  LIMIT 5;
$$;


ALTER FUNCTION public.portfolio_closed_latest5() OWNER TO postgres;

--
-- TOC entry 427 (class 1255 OID 66675)
-- Name: portfolio_open_latest5(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.portfolio_open_latest5() RETURNS TABLE(market_id uuid, market_title text, active_side text, active_exposure_pi numeric, updated_at timestamp with time zone)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH my_pos AS (
    SELECT p.market_id, p.user_id, p.side, p.amount, p.created_at
    FROM public.positions p
    WHERE p.user_id = auth.uid()
  ),
  side_sums AS (
    SELECT
      mp.market_id,
      COALESCE(SUM(CASE WHEN mp.side = 'yes' THEN mp.amount END), 0)::numeric AS yes_sum,
      COALESCE(SUM(CASE WHEN mp.side = 'no'  THEN mp.amount END), 0)::numeric AS no_sum,
      MAX(mp.created_at) AS updated_at
    FROM my_pos mp
    GROUP BY mp.market_id
  )
  SELECT
    m.id AS market_id,
    COALESCE(m.title, m.question, 'Untitled') AS market_title,
    CASE WHEN ss.yes_sum >= ss.no_sum THEN 'yes' ELSE 'no' END AS active_side,
    (ss.yes_sum + ss.no_sum)::numeric AS active_exposure_pi,
    ss.updated_at
  FROM side_sums ss
  JOIN public.markets m ON m.id = ss.market_id
  WHERE COALESCE(m.resolved, false) = false OR m.outcome IS NULL
  ORDER BY ss.updated_at DESC
  LIMIT 5;
$$;


ALTER FUNCTION public.portfolio_open_latest5() OWNER TO postgres;

--
-- TOC entry 495 (class 1255 OID 50468)
-- Name: portfolio_totals_me(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.portfolio_totals_me() RETURNS TABLE(user_id uuid, buys_gross_pi numeric, buys_fee_pi numeric, buys_net_pi numeric, sells_gross_pi numeric, sells_fee_pi numeric, sells_net_pi numeric, payouts_gross_pi numeric, payouts_net_pi numeric, total_fees_pi numeric, net_result_pi numeric, current_net_exposure_pi numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    t.user_id,
    t.buys_gross_pi,
    t.buys_fee_pi,
    t.buys_net_pi,
    t.sells_gross_pi,
    t.sells_fee_pi,
    t.sells_net_pi,
    t.payouts_gross_pi,
    t.payouts_net_pi,
    t.total_fees_pi,
    t.net_result_pi,
    t.current_net_exposure_pi
  from public.v_portfolio_totals t
  where t.user_id = auth.uid();
$$;


ALTER FUNCTION public.portfolio_totals_me() OWNER TO postgres;

--
-- TOC entry 510 (class 1255 OID 66677)
-- Name: portfolio_unclaimed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.portfolio_unclaimed() RETURNS TABLE(market_id uuid, market_title text, outcome text, active_side text, active_exposure_pi numeric, claimable boolean, reason text, updated_at timestamp with time zone)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH my_pos AS (
    SELECT p.market_id, p.user_id, p.side, p.amount, p.created_at
    FROM public.positions p
    WHERE p.user_id = auth.uid()
  ),
  side_sums AS (
    SELECT
      mp.market_id,
      COALESCE(SUM(CASE WHEN mp.side = 'yes' THEN mp.amount END), 0)::numeric AS yes_sum,
      COALESCE(SUM(CASE WHEN mp.side = 'no'  THEN mp.amount END), 0)::numeric AS no_sum,
      CASE
        WHEN COALESCE(SUM(CASE WHEN mp.side = 'yes' THEN mp.amount END), 0)
           >= COALESCE(SUM(CASE WHEN mp.side = 'no'  THEN mp.amount END), 0)
        THEN 'yes' ELSE 'no'
      END AS active_side,
      COALESCE(SUM(mp.amount),0)::numeric AS exposure,
      MAX(mp.created_at) AS updated_at
    FROM my_pos mp
    GROUP BY mp.market_id
  )
  SELECT
    m.id AS market_id,
    COALESCE(m.title, m.question, 'Untitled') AS market_title,
    m.outcome::text AS outcome,
    ss.active_side,
    ss.exposure AS active_exposure_pi,
    CASE
      WHEN m.outcome = 'invalid' THEN false
      WHEN m.outcome IS NULL THEN false
      ELSE (m.outcome = ss.active_side)
    END AS claimable,
    CASE
      WHEN m.outcome = 'invalid' THEN 'invalid_outcome'
      WHEN m.outcome IS NULL THEN 'unresolved'
      ELSE NULL
    END AS reason,
    ss.updated_at
  FROM side_sums ss
  JOIN public.markets m ON m.id = ss.market_id
  WHERE COALESCE(m.resolved, false) = true AND m.outcome IS NOT NULL
  ORDER BY ss.updated_at DESC;
$$;


ALTER FUNCTION public.portfolio_unclaimed() OWNER TO postgres;

--
-- TOC entry 531 (class 1255 OID 89784)
-- Name: positions_after_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.positions_after_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  prev_yes numeric;
  prev_no  numeric;
  step     numeric := 0.01;     -- nudge size per unit
  new_yes  numeric;
  new_no   numeric;
  px       numeric;             -- price to store (non-NULL)
BEGIN
  -- Read last implieds; fall back to 0.50/0.50
  SELECT implied_yes, implied_no
    INTO prev_yes, prev_no
  FROM market_history
  WHERE market_id = NEW.market_id
  ORDER BY ts DESC
  LIMIT 1;

  IF prev_yes IS NULL THEN
    prev_yes := 0.50;
    prev_no  := 0.50;
  END IF;

  -- Use prior implied_yes as the trade price
  px := prev_yes;

  -- Record trade with non-NULL price
  INSERT INTO trades (market_id, created_at, side, pi_amount, user_id)
  VALUES (NEW.market_id, COALESCE(NEW.created_at, now()), NEW.side, NEW.amount, NEW.user_id);

  -- Nudge implieds
  IF lower(NEW.side) = 'yes' THEN
    new_yes := _clamp(prev_yes + step * NEW.amount, 0.01, 0.99);
  ELSE
    new_yes := _clamp(prev_yes - step * NEW.amount, 0.01, 0.99);
  END IF;
  new_no := 1 - new_yes;

  -- Append history
  INSERT INTO market_history (market_id, ts, implied_yes, implied_no, source)
  VALUES (NEW.market_id, COALESCE(NEW.created_at, now()), new_yes, new_no, 'trade');

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.positions_after_insert() OWNER TO postgres;

--
-- TOC entry 567 (class 1255 OID 77151)
-- Name: refresh_mv_leaderboard(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_mv_leaderboard() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  refresh materialized view concurrently public.mv_leaderboard;
$$;


ALTER FUNCTION public.refresh_mv_leaderboard() OWNER TO postgres;

--
-- TOC entry 379 (class 1259 OID 17334)
-- Name: trades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trades (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    market_id uuid,
    type text,
    side text,
    pi_amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    fee_pi numeric DEFAULT 0 NOT NULL,
    net_pi numeric GENERATED ALWAYS AS ((pi_amount - fee_pi)) STORED,
    invalid boolean DEFAULT false NOT NULL,
    kind text DEFAULT 'buy'::text,
    CONSTRAINT trades_kind_check CHECK ((kind = ANY (ARRAY['buy'::text, 'sell'::text, 'refund'::text]))),
    CONSTRAINT trades_side_check CHECK ((side = ANY (ARRAY['yes'::text, 'no'::text]))),
    CONSTRAINT trades_type_check CHECK ((type = ANY (ARRAY['buy'::text, 'sell'::text, 'payout'::text])))
);


ALTER TABLE public.trades OWNER TO postgres;

--
-- TOC entry 470 (class 1255 OID 66652)
-- Name: sell_position(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sell_position(p_position_id uuid, p_user_id uuid DEFAULT NULL::uuid) RETURNS public.trades
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pos public.positions%ROWTYPE;
  v_mkt public.markets%ROWTYPE;
  v_trade public.trades%ROWTYPE;
BEGIN
  SELECT * INTO v_pos
  FROM public.positions
  WHERE id = p_position_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'position % not found', p_position_id USING ERRCODE = 'NO_DATA_FOUND';
  END IF;

  IF p_user_id IS NOT NULL AND v_pos.user_id <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: position not owned by user %', p_user_id USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_mkt FROM public.markets WHERE id = v_pos.market_id;
  IF v_mkt.resolved THEN
    RAISE EXCEPTION 'market % already resolved', v_pos.market_id USING ERRCODE = '22023';
  END IF;

  IF v_pos.status = 'sold' THEN
    RAISE EXCEPTION 'position % already sold', v_pos.id USING ERRCODE = '22023';
  END IF;

  -- mark position as sold
  UPDATE public.positions
  SET status = 'sold'
  WHERE id = v_pos.id;

  -- write a trade row for the sale (0 fee for MVP)
  INSERT INTO public.trades (id, user_id, market_id, type, side, pi_amount, fee_pi, net_pi, created_at, invalid)
  VALUES (
    uuid_generate_v4(),
    v_pos.user_id,
    v_pos.market_id,
    'sell',
    v_pos.side,
    v_pos.amount,
    0,
    v_pos.amount,
    now(),
    false
  )
  RETURNING * INTO v_trade;

  RETURN v_trade;
END;
$$;


ALTER FUNCTION public.sell_position(p_position_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- TOC entry 467 (class 1255 OID 68952)
-- Name: testers_username_normalize_trg_fn(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.testers_username_normalize_trg_fn() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := '@' || lower(regexp_replace(NEW.username, '^[[:space:]]*@?', ''));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.testers_username_normalize_trg_fn() OWNER TO postgres;

--
-- TOC entry 492 (class 1255 OID 50493)
-- Name: trade_sell_full(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trade_sell_full(p_market_id uuid) RETURNS TABLE(id uuid, user_id uuid, market_id uuid, type text, side text, pi_amount numeric, fee_pi numeric, net_pi numeric, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_exposure_yes numeric := 0;
  v_exposure_no  numeric := 0;
  v_side         text;
  v_exposure     numeric;
  v_gross        numeric;
  v_resolved     boolean;
begin
  -- Disallow selling after resolution (explicit guard)
  select resolved into v_resolved from public.markets where id = p_market_id;
  if v_resolved is null then
    raise exception 'market not found' using errcode='22023';
  end if;
  if v_resolved then
    raise exception 'cannot sell in a resolved market' using errcode='22023';
  end if;

  -- Get user exposure on each side for this market
  select
    u.exposure_yes_pi,
    u.exposure_no_pi
  into v_exposure_yes, v_exposure_no
  from public.v_user_market_agg u
  where u.user_id = auth.uid()
    and u.market_id = p_market_id;

  if not found then
    raise exception 'no activity for this market' using errcode='22023';
  end if;

  -- MVP: full sell only; reject if both sides have exposure
  if (v_exposure_yes > 0 and v_exposure_no > 0) then
    raise exception 'cannot full-sell when both sides are open (MVP restricts to single-side exposure)'
      using errcode='22023';
  end if;

  if v_exposure_yes > 0 then
    v_side := 'yes';
    v_exposure := v_exposure_yes;
  elsif v_exposure_no > 0 then
    v_side := 'no';
    v_exposure := v_exposure_no;
  else
    raise exception 'nothing to sell (no open exposure)' using errcode='22023';
  end if;

  -- Sell gross chosen so that NET (after 2% fee) equals remaining exposure
  v_gross := round(v_exposure / 0.98, 6);

  return query
  insert into public.trades (user_id, market_id, type, side, pi_amount)
  values (auth.uid(), p_market_id, 'sell', v_side, v_gross)
  returning id, user_id, market_id, type, side, pi_amount, fee_pi, net_pi, created_at;
end;
$$;


ALTER FUNCTION public.trade_sell_full(p_market_id uuid) OWNER TO postgres;

--
-- TOC entry 491 (class 1255 OID 50114)
-- Name: trades_apply_fee(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trades_apply_fee() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.type in ('buy','sell') then
    -- Enforce 2% fee on buys/sells; round to 6 decimal places for consistency
    new.fee_pi := round(new.pi_amount * 0.02, 6);
  elsif new.type = 'payout' then
    -- Enforce zero fee on payouts
    new.fee_pi := 0;
  else
    -- Safety: if an unknown type ever appears, default to zero fee
    new.fee_pi := 0;
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.trades_apply_fee() OWNER TO postgres;

--
-- TOC entry 454 (class 1255 OID 66521)
-- Name: trades_autovalidate(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trades_autovalidate() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  u_handle text;
  is_match boolean;
BEGIN
  SELECT handle_norm INTO u_handle
  FROM public.users
  WHERE id = NEW.user_id;

  -- Fail-open if user has no handle yet (prevents surprise quarantine)
  IF u_handle IS NULL THEN
    NEW.invalid := FALSE;
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tester_whitelist w WHERE w.handle_norm = u_handle
  ) INTO is_match;

  NEW.invalid := NOT is_match;
  RETURN NEW;
END
$$;


ALTER FUNCTION public.trades_autovalidate() OWNER TO postgres;

--
-- TOC entry 440 (class 1255 OID 87567)
-- Name: trg_trades_to_history(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_trades_to_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO market_history (market_id, ts, implied_yes, implied_no, source)
  VALUES (
    NEW.market_id,
    NEW.ts,
    CASE WHEN NEW.side='yes' THEN NEW.price ELSE 1-NEW.price END,
    CASE WHEN NEW.side='no'  THEN NEW.price ELSE 1-NEW.price END,
    'trade'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_trades_to_history() OWNER TO postgres;

--
-- TOC entry 528 (class 1255 OID 66544)
-- Name: users_autofill_handle_norm(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.users_autofill_handle_norm() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_email_local text;
BEGIN
  -- Try pi_username first
  NEW.handle_norm := public.norm_handle(NEW.pi_username);

  -- If still NULL, fall back to auth.users email local-part
  IF NEW.handle_norm IS NULL THEN
    SELECT public.norm_handle(split_part(au.email, '@', 1))
    INTO v_email_local
    FROM auth.users au
    WHERE au.id = NEW.id;  -- assumes public.users.id == auth.users.id

    NEW.handle_norm := v_email_local;
  END IF;

  RETURN NEW;
END
$$;


ALTER FUNCTION public.users_autofill_handle_norm() OWNER TO postgres;

--
-- TOC entry 433 (class 1255 OID 17169)
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
        subs.entity = entity_;

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
-- TOC entry 465 (class 1255 OID 17250)
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
-- TOC entry 505 (class 1255 OID 17182)
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
-- TOC entry 512 (class 1255 OID 17131)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- TOC entry 559 (class 1255 OID 17126)
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
-- TOC entry 588 (class 1255 OID 17178)
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
-- TOC entry 515 (class 1255 OID 17190)
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
-- TOC entry 540 (class 1255 OID 17125)
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
-- TOC entry 455 (class 1255 OID 17249)
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
-- TOC entry 487 (class 1255 OID 17119)
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
-- TOC entry 459 (class 1255 OID 17158)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- TOC entry 484 (class 1255 OID 17243)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- TOC entry 485 (class 1255 OID 49676)
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 416 (class 1255 OID 17033)
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
-- TOC entry 445 (class 1255 OID 103214)
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- TOC entry 555 (class 1255 OID 49677)
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 461 (class 1255 OID 49680)
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- TOC entry 494 (class 1255 OID 49695)
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
-- TOC entry 475 (class 1255 OID 17007)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 538 (class 1255 OID 17006)
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
-- TOC entry 552 (class 1255 OID 17005)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 426 (class 1255 OID 49658)
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 595 (class 1255 OID 49674)
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 458 (class 1255 OID 49675)
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 417 (class 1255 OID 49693)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- TOC entry 451 (class 1255 OID 17072)
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
-- TOC entry 498 (class 1255 OID 17035)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- TOC entry 553 (class 1255 OID 103213)
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- TOC entry 576 (class 1255 OID 103215)
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- TOC entry 438 (class 1255 OID 49679)
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- TOC entry 490 (class 1255 OID 103216)
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- TOC entry 551 (class 1255 OID 103221)
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- TOC entry 534 (class 1255 OID 49694)
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- TOC entry 422 (class 1255 OID 17088)
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
-- TOC entry 503 (class 1255 OID 103217)
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- TOC entry 428 (class 1255 OID 49678)
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- TOC entry 439 (class 1255 OID 17022)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 436 (class 1255 OID 49691)
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 597 (class 1255 OID 49690)
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 481 (class 1255 OID 103212)
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- TOC entry 525 (class 1255 OID 17023)
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

--
-- TOC entry 347 (class 1259 OID 16523)
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
-- TOC entry 4740 (class 0 OID 0)
-- core: 347
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 364 (class 1259 OID 16925)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- TOC entry 4742 (class 0 OID 0)
-- core: 364
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- TOC entry 355 (class 1259 OID 16723)
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
-- TOC entry 4744 (class 0 OID 0)
-- core: 355
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 4745 (class 0 OID 0)
-- core: 355
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 346 (class 1259 OID 16516)
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
-- TOC entry 4747 (class 0 OID 0)
-- core: 346
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 359 (class 1259 OID 16812)
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
-- TOC entry 4749 (class 0 OID 0)
-- core: 359
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 358 (class 1259 OID 16800)
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
-- TOC entry 4751 (class 0 OID 0)
-- core: 358
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 357 (class 1259 OID 16787)
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
-- TOC entry 4753 (class 0 OID 0)
-- core: 357
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 4754 (class 0 OID 0)
-- core: 357
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- TOC entry 408 (class 1259 OID 113171)
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
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- TOC entry 386 (class 1259 OID 62937)
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
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- TOC entry 409 (class 1259 OID 113204)
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
-- TOC entry 365 (class 1259 OID 16975)
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
-- TOC entry 345 (class 1259 OID 16505)
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
-- TOC entry 4760 (class 0 OID 0)
-- core: 345
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 344 (class 1259 OID 16504)
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
-- TOC entry 4762 (class 0 OID 0)
-- core: 344
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 362 (class 1259 OID 16854)
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
-- TOC entry 4764 (class 0 OID 0)
-- core: 362
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 363 (class 1259 OID 16872)
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
-- TOC entry 4766 (class 0 OID 0)
-- core: 363
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 348 (class 1259 OID 16531)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- TOC entry 4768 (class 0 OID 0)
-- core: 348
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 356 (class 1259 OID 16753)
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
    refresh_token_counter bigint
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- TOC entry 4769 (class 0 OID 0)
-- core: 356
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 4770 (class 0 OID 0)
-- core: 356
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 4771 (class 0 OID 0)
-- core: 356
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- TOC entry 4772 (class 0 OID 0)
-- core: 356
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- TOC entry 361 (class 1259 OID 16839)
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
-- TOC entry 4774 (class 0 OID 0)
-- core: 361
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 360 (class 1259 OID 16830)
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
-- TOC entry 4776 (class 0 OID 0)
-- core: 360
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 4777 (class 0 OID 0)
-- core: 360
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 343 (class 1259 OID 16493)
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
-- TOC entry 4779 (class 0 OID 0)
-- core: 343
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 4780 (class 0 OID 0)
-- core: 343
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 387 (class 1259 OID 64090)
-- Name: admin_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit (
    id uuid NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL,
    action text NOT NULL,
    target_id uuid,
    details jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.admin_audit OWNER TO postgres;

--
-- TOC entry 380 (class 1259 OID 39650)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    user_id uuid NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 384 (class 1259 OID 54777)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    name text NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 399 (class 1259 OID 75992)
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    user_id uuid,
    username text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comments_body_check CHECK (((length(TRIM(BOTH FROM body)) >= 1) AND (length(TRIM(BOTH FROM body)) <= 2000)))
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- TOC entry 410 (class 1259 OID 133130)
-- Name: leaderboards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaderboards (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    total_markets numeric(255,0),
    participated_markets numeric(255,0),
    corrected_markets numeric(255,0),
    volume numeric
);


ALTER TABLE public.leaderboards OWNER TO postgres;

--
-- TOC entry 406 (class 1259 OID 87557)
-- Name: market_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_comments (
    id bigint NOT NULL,
    market_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id text,
    body text NOT NULL
);


ALTER TABLE public.market_comments OWNER TO postgres;

--
-- TOC entry 405 (class 1259 OID 87556)
-- Name: market_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.market_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.market_comments_id_seq OWNER TO postgres;

--
-- TOC entry 4790 (class 0 OID 0)
-- core: 405
-- Name: market_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.market_comments_id_seq OWNED BY public.market_comments.id;


--
-- TOC entry 404 (class 1259 OID 87529)
-- Name: market_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_history (
    id bigint NOT NULL,
    market_id uuid NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    implied_yes numeric NOT NULL,
    implied_no numeric NOT NULL,
    source text DEFAULT 'snapshot'::text NOT NULL,
    CONSTRAINT market_history_implied_no_check CHECK (((implied_no >= (0)::numeric) AND (implied_no <= (1)::numeric))),
    CONSTRAINT market_history_implied_yes_check CHECK (((implied_yes >= (0)::numeric) AND (implied_yes <= (1)::numeric)))
);


ALTER TABLE public.market_history OWNER TO postgres;

--
-- TOC entry 403 (class 1259 OID 87528)
-- Name: market_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.market_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.market_history_id_seq OWNER TO postgres;

--
-- TOC entry 4793 (class 0 OID 0)
-- core: 403
-- Name: market_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.market_history_id_seq OWNED BY public.market_history.id;


--
-- TOC entry 402 (class 1259 OID 87468)
-- Name: market_price_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_price_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    yes double precision NOT NULL,
    no double precision NOT NULL,
    volume_pi numeric DEFAULT 0
);


ALTER TABLE public.market_price_history OWNER TO postgres;

--
-- TOC entry 390 (class 1259 OID 65698)
-- Name: valid_trades; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.valid_trades AS
 SELECT id,
    user_id,
    market_id,
    type,
    side,
    pi_amount,
    created_at,
    fee_pi,
    net_pi,
    invalid
   FROM public.trades t
  WHERE (COALESCE(invalid, false) = false);


ALTER VIEW public.valid_trades OWNER TO postgres;

--
-- TOC entry 400 (class 1259 OID 77132)
-- Name: v_leaderboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_leaderboard AS
 SELECT vt.user_id,
    COALESCE(u.pi_username, ('@'::text || "left"((vt.user_id)::text, 8))) AS username,
    sum(vt.pi_amount) AS volume,
    COALESCE((round(((100)::numeric * avg(
        CASE
            WHEN ((m.resolved IS TRUE) AND (m.resolved_outcome IS NOT NULL)) THEN
            CASE
                WHEN (m.resolved_outcome = vt.side) THEN 1.0
                ELSE 0.0
            END
            ELSE NULL::numeric
        END))))::integer, 0) AS success_pct
   FROM ((public.valid_trades vt
     LEFT JOIN public.markets m ON ((m.id = vt.market_id)))
     LEFT JOIN public.users u ON ((u.id = vt.user_id)))
  GROUP BY vt.user_id, u.pi_username;


ALTER VIEW public.v_leaderboard OWNER TO postgres;

--
-- TOC entry 401 (class 1259 OID 77137)
-- Name: mv_leaderboard; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_leaderboard AS
 SELECT user_id,
    username,
    volume,
    success_pct
   FROM public.v_leaderboard
  ORDER BY volume DESC
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_leaderboard OWNER TO postgres;

--
-- TOC entry 377 (class 1259 OID 17296)
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    market_id uuid,
    side text,
    amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    status text,
    user_handle text,
    CONSTRAINT positions_side_check CHECK ((side = ANY (ARRAY['yes'::text, 'no'::text])))
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- TOC entry 4799 (class 0 OID 0)
-- core: 377
-- Name: COLUMN positions.amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.positions.amount IS 'refresh';


--
-- TOC entry 378 (class 1259 OID 17316)
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    referrer_id uuid,
    referred_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    reward_earned boolean DEFAULT false
);


ALTER TABLE public.referrals OWNER TO postgres;

--
-- TOC entry 385 (class 1259 OID 54784)
-- Name: suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    category text NOT NULL,
    resolution_criteria text NOT NULL,
    description text,
    end_time timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reject_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid,
    submitted_by text,
    CONSTRAINT suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.suggestions OWNER TO postgres;

--
-- TOC entry 414 (class 1259 OID 136810)
-- Name: tester_whitelist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tester_whitelist (
    username text NOT NULL,
    added_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    note text,
    handle_norm text
);


ALTER TABLE public.tester_whitelist OWNER TO postgres;

--
-- TOC entry 411 (class 1259 OID 133448)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    market_id uuid,
    amount numeric(255,0),
    type character varying(255),
    status character varying(255),
    details character varying(255),
    date date
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 407 (class 1259 OID 89788)
-- Name: v_latest_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_latest_history AS
 SELECT DISTINCT ON (market_id) market_id,
    ts AS updated_at,
    implied_yes,
    implied_no
   FROM public.market_history h
  ORDER BY market_id, ts DESC;


ALTER VIEW public.v_latest_history OWNER TO postgres;

--
-- TOC entry 415 (class 1259 OID 136821)
-- Name: v_market_snapshots; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_market_snapshots AS
 WITH lh AS (
         SELECT DISTINCT ON (h.market_id) h.market_id,
            h.ts AS updated_at,
            h.implied_yes
           FROM public.market_history h
          ORDER BY h.market_id, h.ts DESC
        ), vol AS (
         SELECT mt.market_id,
            sum(mt.pi_amount) AS total_volume,
            sum(mt.pi_amount) FILTER (WHERE (mt.created_at > (now() - '24:00:00'::interval))) AS volume_24h
           FROM public.trades mt
          GROUP BY mt.market_id
        )
 SELECT m.id,
    m.title,
    m.created_at,
    m.end_date,
    m.resolved_at,
    m.status,
    m.category,
    m.description,
    COALESCE(lh.updated_at, m.created_at) AS updated_at,
    COALESCE(lh.implied_yes, 0.50) AS yes,
    ((1)::numeric - COALESCE(lh.implied_yes, 0.50)) AS no,
    (round((COALESCE(lh.implied_yes, 0.50) * (100)::numeric)))::integer AS yes_pct,
    (100 - (round((COALESCE(lh.implied_yes, 0.50) * (100)::numeric)))::integer) AS no_pct,
    COALESCE(vol.total_volume, (0)::numeric) AS total_volume,
    COALESCE(vol.volume_24h, (0)::numeric) AS volume_24h
   FROM ((public.markets m
     LEFT JOIN lh ON ((lh.market_id = m.id)))
     LEFT JOIN vol ON ((vol.market_id = m.id)))
  WHERE (m.status = ANY (ARRAY['open'::text, 'pending'::text, 'resolved'::text]));


ALTER VIEW public.v_market_snapshots OWNER TO postgres;

--
-- TOC entry 392 (class 1259 OID 65727)
-- Name: v_market_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_market_stats AS
 SELECT m.id AS market_id,
    m.question,
    sum(
        CASE
            WHEN (vt.side = 'yes'::text) THEN vt.pi_amount
            ELSE (0)::numeric
        END) AS yes_volume,
    sum(
        CASE
            WHEN (vt.side = 'no'::text) THEN vt.pi_amount
            ELSE (0)::numeric
        END) AS no_volume
   FROM (public.markets m
     LEFT JOIN public.valid_trades vt ON ((vt.market_id = m.id)))
  GROUP BY m.id, m.question;


ALTER VIEW public.v_market_stats OWNER TO postgres;

--
-- TOC entry 383 (class 1259 OID 53628)
-- Name: v_market_stats_v2; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_market_stats_v2 AS
 SELECT market_id,
    sum(
        CASE
            WHEN (side = 'yes'::text) THEN amount
            ELSE (0)::numeric
        END) AS yes_total,
    sum(
        CASE
            WHEN (side = 'no'::text) THEN amount
            ELSE (0)::numeric
        END) AS no_total,
    count(*) AS trades
   FROM public.positions
  GROUP BY market_id;


ALTER VIEW public.v_market_stats_v2 OWNER TO postgres;

--
-- TOC entry 413 (class 1259 OID 136801)
-- Name: v_market_volumes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_market_volumes AS
 SELECT market_id,
    sum(pi_amount) AS total_volume,
    sum(pi_amount) FILTER (WHERE (created_at > (now() - '24:00:00'::interval))) AS volume_24h
   FROM public.trades mt
  GROUP BY market_id;


ALTER VIEW public.v_market_volumes OWNER TO postgres;

--
-- TOC entry 412 (class 1259 OID 133459)
-- Name: v_portfolio_open_markets; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_portfolio_open_markets AS
 SELECT p.market_id AS id,
    p.market_id,
    p.id AS position_id,
    p.user_id,
    m.title,
    m.title AS market_title,
    COALESCE(m.status, 'open'::text) AS status,
    m.resolved_outcome,
    p.side,
    p.amount,
    p.amount AS pi_amount,
    p.created_at,
    COALESCE(a.yes, (0)::numeric) AS yes,
    COALESCE(a.no, (0)::numeric) AS no
   FROM ((public.positions p
     JOIN public.markets m ON ((m.id = p.market_id)))
     LEFT JOIN ( SELECT positions.market_id,
            sum(
                CASE
                    WHEN (positions.side = 'yes'::text) THEN positions.amount
                    ELSE (0)::numeric
                END) AS yes,
            sum(
                CASE
                    WHEN (positions.side = 'no'::text) THEN positions.amount
                    ELSE (0)::numeric
                END) AS no
           FROM public.positions
          GROUP BY positions.market_id) a ON ((a.market_id = p.market_id)))
  WHERE ((p.status IS NULL) OR (p.status = ANY (ARRAY['open'::text, 'pending'::text])));


ALTER VIEW public.v_portfolio_open_markets OWNER TO postgres;

--
-- TOC entry 391 (class 1259 OID 65722)
-- Name: v_portfolio_totals; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_portfolio_totals WITH (security_invoker='true') AS
 SELECT u.id AS user_id,
    COALESCE(sum(vt.pi_amount), (0)::numeric) AS total_pi,
    COALESCE(sum(vt.fee_pi), (0)::numeric) AS total_fees
   FROM (public.users u
     LEFT JOIN public.valid_trades vt ON ((vt.user_id = u.id)))
  GROUP BY u.id;


ALTER VIEW public.v_portfolio_totals OWNER TO postgres;

--
-- TOC entry 393 (class 1259 OID 65777)
-- Name: v_portfolio_unclaimed; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_portfolio_unclaimed AS
 SELECT u.id AS user_id,
    m.id AS market_id,
    m.question,
    m.resolved_outcome AS outcome,
    sum(vt.pi_amount) AS unclaimed_pi
   FROM ((public.users u
     JOIN public.valid_trades vt ON ((vt.user_id = u.id)))
     JOIN public.markets m ON ((m.id = vt.market_id)))
  WHERE ((m.status = 'resolved'::text) AND (NOT m.resolved))
  GROUP BY u.id, m.id, m.question, m.resolved_outcome;


ALTER VIEW public.v_portfolio_unclaimed OWNER TO postgres;

--
-- TOC entry 374 (class 1259 OID 17253)
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
-- TOC entry 388 (class 1259 OID 64206)
-- Name: messages_2025_09_06; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_06 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_06 OWNER TO supabase_admin;

--
-- TOC entry 389 (class 1259 OID 64217)
-- Name: messages_2025_09_07; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_07 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_07 OWNER TO supabase_admin;

--
-- TOC entry 394 (class 1259 OID 67821)
-- Name: messages_2025_09_08; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_08 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_08 OWNER TO supabase_admin;

--
-- TOC entry 395 (class 1259 OID 67832)
-- Name: messages_2025_09_09; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_09 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_09 OWNER TO supabase_admin;

--
-- TOC entry 396 (class 1259 OID 70057)
-- Name: messages_2025_09_10; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_10 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_10 OWNER TO supabase_admin;

--
-- TOC entry 397 (class 1259 OID 70068)
-- Name: messages_2025_09_11; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_11 OWNER TO supabase_admin;

--
-- TOC entry 398 (class 1259 OID 71184)
-- Name: messages_2025_09_12; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_09_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_09_12 OWNER TO supabase_admin;

--
-- TOC entry 366 (class 1259 OID 17000)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- TOC entry 371 (class 1259 OID 17107)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- TOC entry 370 (class 1259 OID 17106)
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
-- TOC entry 349 (class 1259 OID 16544)
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
-- TOC entry 4824 (class 0 OID 0)
-- core: 349
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 382 (class 1259 OID 49704)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- TOC entry 351 (class 1259 OID 16586)
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
-- TOC entry 350 (class 1259 OID 16559)
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
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- TOC entry 4827 (class 0 OID 0)
-- core: 350
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 381 (class 1259 OID 49659)
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- TOC entry 367 (class 1259 OID 17037)
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
-- TOC entry 368 (class 1259 OID 17051)
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
-- TOC entry 3865 (class 0 OID 0)
-- Name: messages_2025_09_06; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_06 FOR VALUES FROM ('2025-09-06 00:00:00') TO ('2025-09-07 00:00:00');


--
-- TOC entry 3866 (class 0 OID 0)
-- Name: messages_2025_09_07; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_07 FOR VALUES FROM ('2025-09-07 00:00:00') TO ('2025-09-08 00:00:00');


--
-- TOC entry 3867 (class 0 OID 0)
-- Name: messages_2025_09_08; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_08 FOR VALUES FROM ('2025-09-08 00:00:00') TO ('2025-09-09 00:00:00');


--
-- TOC entry 3868 (class 0 OID 0)
-- Name: messages_2025_09_09; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_09 FOR VALUES FROM ('2025-09-09 00:00:00') TO ('2025-09-10 00:00:00');


--
-- TOC entry 3869 (class 0 OID 0)
-- Name: messages_2025_09_10; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_10 FOR VALUES FROM ('2025-09-10 00:00:00') TO ('2025-09-11 00:00:00');


--
-- TOC entry 3870 (class 0 OID 0)
-- Name: messages_2025_09_11; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_11 FOR VALUES FROM ('2025-09-11 00:00:00') TO ('2025-09-12 00:00:00');


--
-- TOC entry 3871 (class 0 OID 0)
-- Name: messages_2025_09_12; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_09_12 FOR VALUES FROM ('2025-09-12 00:00:00') TO ('2025-09-13 00:00:00');


--
-- TOC entry 3881 (class 2604 OID 16508)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 3993 (class 2604 OID 87560)
-- Name: market_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_comments ALTER COLUMN id SET DEFAULT nextval('public.market_comments_id_seq'::regclass);


--
-- TOC entry 3990 (class 2604 OID 87532)
-- Name: market_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_history ALTER COLUMN id SET DEFAULT nextval('public.market_history_id_seq'::regclass);


--
-- TOC entry 4527 (class 0 OID 16523)
-- core: 347
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	8673576c-077c-495b-b7af-89fc706040c6	{"action":"user_confirmation_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-11 02:20:39.602321+00	
00000000-0000-0000-0000-000000000000	fe9dac51-b914-4162-b1d0-49fb5b78107e	{"action":"user_signedup","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-09-11 02:21:28.7506+00	
00000000-0000-0000-0000-000000000000	fb1a7100-380e-4d10-bdc7-50d5a50bbe68	{"action":"user_recovery_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user"}	2025-09-11 02:26:01.216843+00	
00000000-0000-0000-0000-000000000000	199ed881-237f-46b8-b48a-bfa026c26ae6	{"action":"login","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"account"}	2025-09-11 02:26:14.761822+00	
00000000-0000-0000-0000-000000000000	b1332b86-2968-4fe5-bb40-f41c6ea8121b	{"action":"user_recovery_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user"}	2025-09-11 23:08:29.497555+00	
00000000-0000-0000-0000-000000000000	7465b244-fcbe-473f-8b51-0558e7c9938a	{"action":"login","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"account"}	2025-09-11 23:09:14.386854+00	
00000000-0000-0000-0000-000000000000	86b31250-6dff-4590-a543-5f491f67b76a	{"action":"user_recovery_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user"}	2025-09-17 00:08:20.624338+00	
00000000-0000-0000-0000-000000000000	ff8ba03f-67f0-4e25-8c21-d66e9c4ada81	{"action":"login","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"account"}	2025-09-17 00:08:46.731634+00	
00000000-0000-0000-0000-000000000000	6b223811-7e77-4309-bc42-87ea11f5a240	{"action":"user_confirmation_requested","actor_id":"f3891537-058f-43e6-aad7-2f5bc0ffe606","actor_username":"cli-1759675166@predictpix.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-10-05 14:39:26.770551+00	
00000000-0000-0000-0000-000000000000	6aea76c2-45cc-47ca-8127-bd4ebbe589a7	{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"cli-1759675166@predictpix.com","user_id":"f3891537-058f-43e6-aad7-2f5bc0ffe606","user_phone":""}}	2025-10-05 14:47:45.1398+00	
00000000-0000-0000-0000-000000000000	360d2e0d-d6f9-4b1d-913d-26d2a2da49a6	{"action":"login","actor_id":"f3891537-058f-43e6-aad7-2f5bc0ffe606","actor_username":"cli-1759675166@predictpix.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-10-05 14:48:15.815133+00	
00000000-0000-0000-0000-000000000000	152ac8b2-949b-4804-8cea-cdd968773f72	{"action":"login","actor_id":"f3891537-058f-43e6-aad7-2f5bc0ffe606","actor_username":"cli-1759675166@predictpix.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-10-05 15:38:43.320715+00	
00000000-0000-0000-0000-000000000000	e2e975cc-77b7-471d-94b8-dcda884b3bdd	{"action":"user_recovery_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user"}	2025-10-06 23:46:12.559135+00	
00000000-0000-0000-0000-000000000000	d012cd10-39b0-4c4b-a727-60c598ddcf57	{"action":"login","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"account"}	2025-10-06 23:46:26.503173+00	
00000000-0000-0000-0000-000000000000	cb94ce04-28e8-488f-995d-3522fd2fbf1d	{"action":"user_recovery_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user"}	2025-10-06 23:51:47.416724+00	
00000000-0000-0000-0000-000000000000	7feba718-e21f-4f32-b5ae-b99b88b6e144	{"action":"login","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"account"}	2025-10-06 23:52:03.296244+00	
00000000-0000-0000-0000-000000000000	b4de8da6-a6cd-429d-865a-f4b05321cda6	{"action":"user_recovery_requested","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"user"}	2025-10-06 23:56:52.756733+00	
00000000-0000-0000-0000-000000000000	273f4ab6-c1bb-4777-b29f-5242ac43d6e6	{"action":"login","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"account"}	2025-10-06 23:57:22.064605+00	
00000000-0000-0000-0000-000000000000	15f3b632-f230-45a4-bada-ae3e73f56490	{"action":"token_refreshed","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-07 00:56:04.658377+00	
00000000-0000-0000-0000-000000000000	6cee933c-4f05-4396-9394-83610b2d7433	{"action":"token_revoked","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-07 00:56:04.679269+00	
00000000-0000-0000-0000-000000000000	4fe5ef43-d12f-421d-95b3-1e3ec1dd9078	{"action":"token_refreshed","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-07 00:58:08.278322+00	
00000000-0000-0000-0000-000000000000	4b151efd-2981-4210-b644-b9c2398660f2	{"action":"token_revoked","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-07 00:58:08.280125+00	
00000000-0000-0000-0000-000000000000	31f610f4-392a-4c1e-a98d-00edae8f5dd1	{"action":"token_refreshed","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-07 01:58:38.374751+00	
00000000-0000-0000-0000-000000000000	e0fa6c66-b5c0-45d8-b999-e2de918e7c65	{"action":"token_revoked","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-07 01:58:38.387571+00	
00000000-0000-0000-0000-000000000000	c9ad146b-6066-45bc-b2af-60bea6081d94	{"action":"token_refreshed","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-29 03:17:32.118273+00	
00000000-0000-0000-0000-000000000000	1f1521c0-d190-4c0c-be3e-49bc3021e513	{"action":"token_revoked","actor_id":"64e754de-c470-4edc-98ad-5f7740ac4b46","actor_username":"andrewatchison@outlook.com","actor_via_sso":false,"log_type":"token"}	2025-10-29 03:17:32.144156+00	
00000000-0000-0000-0000-000000000000	57d251c4-a837-4670-aaa3-bd595e5ed943	{"action":"user_confirmation_requested","actor_id":"88e20625-9076-4648-a052-25b5279d7515","actor_username":"jodanmike848@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-10-31 06:57:01.477351+00	
00000000-0000-0000-0000-000000000000	5f8b98c1-6dc6-4d91-8080-e731e1d9a35a	{"action":"user_signedup","actor_id":"88e20625-9076-4648-a052-25b5279d7515","actor_username":"jodanmike848@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-10-31 06:57:35.783594+00	
00000000-0000-0000-0000-000000000000	90b66023-9c3a-45e0-a8f1-2016ff8c8186	{"action":"user_recovery_requested","actor_id":"88e20625-9076-4648-a052-25b5279d7515","actor_username":"jodanmike848@gmail.com","actor_via_sso":false,"log_type":"user"}	2025-10-31 06:59:37.32946+00	
00000000-0000-0000-0000-000000000000	31c2c132-7c62-4bc3-aa31-438b4fde6066	{"action":"login","actor_id":"88e20625-9076-4648-a052-25b5279d7515","actor_username":"jodanmike848@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-10-31 06:59:49.890207+00	
\.


--
-- TOC entry 4541 (class 0 OID 16925)
-- core: 364
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
1df7b4c7-1dde-48f1-911f-442c0c88e4ea	64e754de-c470-4edc-98ad-5f7740ac4b46	bba1662f-c668-423f-a444-2ecb758a08bc	s256	vS5UHqbX9Mt2qxnEit3NSJCJquaJro99AEU34Gd4pBg	email			2025-09-11 02:20:39.621743+00	2025-09-11 02:21:28.757965+00	email/signup	2025-09-11 02:21:28.757923+00
86e0d847-76cd-4ec4-a08f-467ce32ebe6a	64e754de-c470-4edc-98ad-5f7740ac4b46	440d4ec3-b57a-49c2-b57a-b9186f1d3e99	s256	JXMAvclRtXcBCC-V38qo5A8pUIk4huGuG_ZHjW8TN88	magiclink			2025-09-11 02:26:01.20402+00	2025-09-11 02:26:14.769832+00	magiclink	2025-09-11 02:26:14.769779+00
77f01455-a994-45f3-a95c-cf7aef06a55d	64e754de-c470-4edc-98ad-5f7740ac4b46	2c61534f-2d6c-40dd-8e73-bef2bdbac330	s256	nnyxy0u8BBq3zLnqW8QMLBA6kghX9sg2pp4RSb_aR2I	magiclink			2025-09-11 23:08:29.462659+00	2025-09-11 23:09:14.396444+00	magiclink	2025-09-11 23:09:14.395777+00
6a742e37-e5c5-4e28-9942-dae008db57e4	64e754de-c470-4edc-98ad-5f7740ac4b46	8eb62997-43f9-4280-b334-653cfb23f393	s256	IpsPmb6wGuOaSiCXBUov8oSXIzWLWk7rMTUHNYRRd9A	magiclink			2025-09-17 00:08:20.590094+00	2025-09-17 00:08:46.741071+00	magiclink	2025-09-17 00:08:46.741023+00
\.


--
-- TOC entry 4532 (class 0 OID 16723)
-- core: 355
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
64e754de-c470-4edc-98ad-5f7740ac4b46	64e754de-c470-4edc-98ad-5f7740ac4b46	{"sub": "64e754de-c470-4edc-98ad-5f7740ac4b46", "email": "andrewatchison@outlook.com", "email_verified": true, "phone_verified": false}	email	2025-09-11 02:20:39.568567+00	2025-09-11 02:20:39.568619+00	2025-09-11 02:20:39.568619+00	a12933be-7d5d-4fce-b2b1-cfcabd7ace36
f3891537-058f-43e6-aad7-2f5bc0ffe606	f3891537-058f-43e6-aad7-2f5bc0ffe606	{"sub": "f3891537-058f-43e6-aad7-2f5bc0ffe606", "email": "cli-1759675166@predictpix.com", "email_verified": false, "phone_verified": false}	email	2025-10-05 14:39:26.758093+00	2025-10-05 14:39:26.759332+00	2025-10-05 14:39:26.759332+00	49733fcf-1230-4328-944e-ecb534c22d0e
88e20625-9076-4648-a052-25b5279d7515	88e20625-9076-4648-a052-25b5279d7515	{"sub": "88e20625-9076-4648-a052-25b5279d7515", "email": "jodanmike848@gmail.com", "email_verified": true, "phone_verified": false}	email	2025-10-31 06:57:01.473903+00	2025-10-31 06:57:01.473952+00	2025-10-31 06:57:01.473952+00	7915f683-9ed0-4964-96fc-8114874b590c
\.


--
-- TOC entry 4526 (class 0 OID 16516)
-- core: 346
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4536 (class 0 OID 16812)
-- core: 359
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
e08483a7-578a-4d5d-8388-2c156de4def3	2025-10-05 14:48:15.864341+00	2025-10-05 14:48:15.864341+00	password	a0198bf3-4bca-49e2-b730-7cbdf4d34a0b
d63f3290-aceb-40d6-afc9-21c90a9ee13e	2025-10-05 15:38:43.413825+00	2025-10-05 15:38:43.413825+00	password	fd4bdae3-3ba4-4850-ae97-9a836e46440e
4c0f16df-65ed-4365-b83a-945dc86286ce	2025-10-06 23:46:26.550187+00	2025-10-06 23:46:26.550187+00	otp	7fe98e5f-9fbc-493e-a64e-7df0d9cbd70b
ba6c852a-bc32-4c59-8cdb-c97f3fbadc6c	2025-10-06 23:52:03.320405+00	2025-10-06 23:52:03.320405+00	otp	81c8cd0c-352d-4fe4-a44c-000a7c15b6ac
ae8fd94f-c6cf-4bcc-b3c2-ab0b34dc85ee	2025-10-06 23:57:22.071436+00	2025-10-06 23:57:22.071436+00	otp	9b9746f8-c1ef-49b7-95cf-11b45a8d0324
aeecccc2-5945-4f1c-80d8-2ae20e9ef0f5	2025-10-31 06:57:35.829724+00	2025-10-31 06:57:35.829724+00	otp	8eebb22b-7df8-4fc4-94d1-5f5359a69f69
9c5218be-41fc-431b-8f32-f551e1ca3cee	2025-10-31 06:59:49.902817+00	2025-10-31 06:59:49.902817+00	otp	e937d93a-9fb8-4408-856c-30e6bad7191b
\.


--
-- TOC entry 4535 (class 0 OID 16800)
-- core: 358
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- TOC entry 4534 (class 0 OID 16787)
-- core: 357
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- TOC entry 4574 (class 0 OID 113171)
-- core: 408
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at) FROM stdin;
\.


--
-- TOC entry 4558 (class 0 OID 62937)
-- core: 386
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type) FROM stdin;
\.


--
-- TOC entry 4575 (class 0 OID 113204)
-- core: 409
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 4542 (class 0 OID 16975)
-- core: 365
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4525 (class 0 OID 16505)
-- core: 345
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	1	xtrlvjpjbxai	f3891537-058f-43e6-aad7-2f5bc0ffe606	f	2025-10-05 14:48:15.835175+00	2025-10-05 14:48:15.835175+00	\N	e08483a7-578a-4d5d-8388-2c156de4def3
00000000-0000-0000-0000-000000000000	2	mlxxwintmvky	f3891537-058f-43e6-aad7-2f5bc0ffe606	f	2025-10-05 15:38:43.368171+00	2025-10-05 15:38:43.368171+00	\N	d63f3290-aceb-40d6-afc9-21c90a9ee13e
00000000-0000-0000-0000-000000000000	3	2uaidc4mfguo	64e754de-c470-4edc-98ad-5f7740ac4b46	f	2025-10-06 23:46:26.52314+00	2025-10-06 23:46:26.52314+00	\N	4c0f16df-65ed-4365-b83a-945dc86286ce
00000000-0000-0000-0000-000000000000	5	gol4pegtuutm	64e754de-c470-4edc-98ad-5f7740ac4b46	t	2025-10-06 23:57:22.068879+00	2025-10-07 00:56:04.682358+00	\N	ae8fd94f-c6cf-4bcc-b3c2-ab0b34dc85ee
00000000-0000-0000-0000-000000000000	4	aifucxedcpmx	64e754de-c470-4edc-98ad-5f7740ac4b46	t	2025-10-06 23:52:03.308127+00	2025-10-07 00:58:08.281344+00	\N	ba6c852a-bc32-4c59-8cdb-c97f3fbadc6c
00000000-0000-0000-0000-000000000000	7	3gsn5i2m6k6w	64e754de-c470-4edc-98ad-5f7740ac4b46	f	2025-10-07 00:58:08.281996+00	2025-10-07 00:58:08.281996+00	aifucxedcpmx	ba6c852a-bc32-4c59-8cdb-c97f3fbadc6c
00000000-0000-0000-0000-000000000000	6	25ngzyhxvedw	64e754de-c470-4edc-98ad-5f7740ac4b46	t	2025-10-07 00:56:04.703813+00	2025-10-07 01:58:38.390517+00	gol4pegtuutm	ae8fd94f-c6cf-4bcc-b3c2-ab0b34dc85ee
00000000-0000-0000-0000-000000000000	8	pvcvapnsnkxa	64e754de-c470-4edc-98ad-5f7740ac4b46	t	2025-10-07 01:58:38.404256+00	2025-10-29 03:17:32.145437+00	25ngzyhxvedw	ae8fd94f-c6cf-4bcc-b3c2-ab0b34dc85ee
00000000-0000-0000-0000-000000000000	9	zkowceubiqar	64e754de-c470-4edc-98ad-5f7740ac4b46	f	2025-10-29 03:17:32.168495+00	2025-10-29 03:17:32.168495+00	pvcvapnsnkxa	ae8fd94f-c6cf-4bcc-b3c2-ab0b34dc85ee
00000000-0000-0000-0000-000000000000	10	cicrhiwzoici	88e20625-9076-4648-a052-25b5279d7515	f	2025-10-31 06:57:35.806382+00	2025-10-31 06:57:35.806382+00	\N	aeecccc2-5945-4f1c-80d8-2ae20e9ef0f5
00000000-0000-0000-0000-000000000000	11	6e6cmhgjaqif	88e20625-9076-4648-a052-25b5279d7515	f	2025-10-31 06:59:49.90099+00	2025-10-31 06:59:49.90099+00	\N	9c5218be-41fc-431b-8f32-f551e1ca3cee
\.


--
-- TOC entry 4539 (class 0 OID 16854)
-- core: 362
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- TOC entry 4540 (class 0 OID 16872)
-- core: 363
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- TOC entry 4528 (class 0 OID 16531)
-- core: 348
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
\.


--
-- TOC entry 4533 (class 0 OID 16753)
-- core: 356
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter) FROM stdin;
e08483a7-578a-4d5d-8388-2c156de4def3	f3891537-058f-43e6-aad7-2f5bc0ffe606	2025-10-05 14:48:15.816673+00	2025-10-05 14:48:15.816673+00	\N	aal1	\N	\N	curl/8.5.0	64.23.198.220	\N	\N	\N	\N
d63f3290-aceb-40d6-afc9-21c90a9ee13e	f3891537-058f-43e6-aad7-2f5bc0ffe606	2025-10-05 15:38:43.345671+00	2025-10-05 15:38:43.345671+00	\N	aal1	\N	\N	curl/8.5.0	64.23.198.220	\N	\N	\N	\N
4c0f16df-65ed-4365-b83a-945dc86286ce	64e754de-c470-4edc-98ad-5f7740ac4b46	2025-10-06 23:46:26.508977+00	2025-10-06 23:46:26.508977+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 EdgA/140.0.0.0	75.159.130.162	\N	\N	\N	\N
ba6c852a-bc32-4c59-8cdb-c97f3fbadc6c	64e754de-c470-4edc-98ad-5f7740ac4b46	2025-10-06 23:52:03.300246+00	2025-10-07 00:58:08.2883+00	\N	aal1	\N	2025-10-07 00:58:08.28823	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 EdgA/140.0.0.0	75.159.130.162	\N	\N	\N	\N
ae8fd94f-c6cf-4bcc-b3c2-ab0b34dc85ee	64e754de-c470-4edc-98ad-5f7740ac4b46	2025-10-06 23:57:22.067675+00	2025-10-29 03:17:32.191878+00	\N	aal1	\N	2025-10-29 03:17:32.191783	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	172.219.91.73	\N	\N	\N	\N
aeecccc2-5945-4f1c-80d8-2ae20e9ef0f5	88e20625-9076-4648-a052-25b5279d7515	2025-10-31 06:57:35.79088+00	2025-10-31 06:57:35.79088+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	61.97.243.9	\N	\N	\N	\N
9c5218be-41fc-431b-8f32-f551e1ca3cee	88e20625-9076-4648-a052-25b5279d7515	2025-10-31 06:59:49.899065+00	2025-10-31 06:59:49.899065+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	61.97.243.9	\N	\N	\N	\N
\.


--
-- TOC entry 4538 (class 0 OID 16839)
-- core: 361
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4537 (class 0 OID 16830)
-- core: 360
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- TOC entry 4523 (class 0 OID 16493)
-- core: 343
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	64e754de-c470-4edc-98ad-5f7740ac4b46	authenticated	authenticated	andrewatchison@outlook.com	$2a$10$QloU5jQ644ofGC7I4uXFpeBGuPJxTQe25ZVZdNDFcOaOuMiXEKp3G	2025-09-11 02:21:28.751292+00	\N		2025-09-11 02:20:39.64854+00		2025-10-06 23:56:52.75862+00			\N	2025-10-06 23:57:22.067603+00	{"provider": "email", "providers": ["email"]}	{"sub": "64e754de-c470-4edc-98ad-5f7740ac4b46", "email": "andrewatchison@outlook.com", "email_verified": true, "phone_verified": false}	\N	2025-09-11 02:20:39.509504+00	2025-10-29 03:17:32.179248+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	88e20625-9076-4648-a052-25b5279d7515	authenticated	authenticated	jodanmike848@gmail.com	$2a$10$hT.ptbNpKBccSYdfs8x/K.cX/ymsSlz8js3j34FQA12tk/Vz2bVY.	2025-10-31 06:57:35.785156+00	\N		2025-10-31 06:57:01.477819+00		2025-10-31 06:59:37.330938+00			\N	2025-10-31 06:59:49.898983+00	{"provider": "email", "providers": ["email"]}	{"sub": "88e20625-9076-4648-a052-25b5279d7515", "email": "jodanmike848@gmail.com", "email_verified": true, "phone_verified": false}	\N	2025-10-31 06:57:01.470196+00	2025-10-31 06:59:49.90237+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f3891537-058f-43e6-aad7-2f5bc0ffe606	authenticated	authenticated	cli-1759675166@predictpix.com	$2a$10$AwQhtWmQOTmsKM4nyRIBcurpkb9fy8/hv9gFMraLgU.Sboiu8dvS2	2025-10-05 14:47:45.1125+00	\N		2025-10-05 14:39:26.774904+00		\N			\N	2025-10-05 15:38:43.345557+00	{"provider": "email", "providers": ["email"]}	{"sub": "f3891537-058f-43e6-aad7-2f5bc0ffe606", "email": "cli-1759675166@predictpix.com", "email_verified": true, "phone_verified": false}	\N	2025-10-05 14:39:26.750721+00	2025-10-05 15:38:43.39915+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- TOC entry 4559 (class 0 OID 64090)
-- core: 387
-- Data for Name: admin_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit (id, at, action, target_id, details) FROM stdin;
93bac914-7e15-45fc-b26f-d3d835daad55	2025-09-04 02:11:30.894609+00	market.create	770d2aae-40e3-4673-a09b-a83ff92b4059	{"category": "Test", "question": "AUDIT: extension-free"}
c538c940-13dd-4c6b-b143-99e193eaaf29	2025-09-04 02:11:36.29752+00	market.resolve	770d2aae-40e3-4673-a09b-a83ff92b4059	{"outcome": "yes"}
\.


--
-- TOC entry 4553 (class 0 OID 39650)
-- core: 380
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (user_id) FROM stdin;
754760c0-ec5a-431d-9d9a-5b1ff85a430a
\.


--
-- TOC entry 4556 (class 0 OID 54777)
-- core: 384
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (name) FROM stdin;
Pi Coin
Tech
Creators
Sports
Politics
Crypto
Entertainment
World
Weather
Other
\.


--
-- TOC entry 4567 (class 0 OID 75992)
-- core: 399
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, market_id, user_id, username, body, created_at) FROM stdin;
de49f603-72d0-4517-ab62-d95d5d38925b	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	\N	@AtchesSon	from SQL	2025-09-16 01:39:08.862709+00
\.


--
-- TOC entry 4576 (class 0 OID 133130)
-- core: 410
-- Data for Name: leaderboards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaderboards (id, user_id, total_markets, participated_markets, corrected_markets, volume) FROM stdin;
5e528148-ffff-4180-b460-cabf0ff4c5c9	3bb86098-a5fc-45fc-8b7b-b4d2bc2ca682	50	30	20	500
1879bc9b-e3a9-4bad-be62-f56fa4abf50b	c6b4c472-39a2-46cf-a93f-9c6151b4c563	50	25	15	400
7b14d887-00ba-41d1-8726-314699309685	31f7b10f-00ef-48e7-8972-4b89a7fdc776	50	20	12	300
b36c1802-2269-495e-bcf9-53ee15962690	b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19	50	15	10	240
\.


--
-- TOC entry 4573 (class 0 OID 87557)
-- core: 406
-- Data for Name: market_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_comments (id, market_id, created_at, author_id, body) FROM stdin;
1	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	2025-09-21 17:07:05.482914+00	sanity-user	first comment via API
\.


--
-- TOC entry 4571 (class 0 OID 87529)
-- core: 404
-- Data for Name: market_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_history (id, market_id, ts, implied_yes, implied_no, source) FROM stdin;
1	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	2025-09-21 16:57:23.942692+00	0.61	0.39	trade
2	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	2025-09-23 23:27:07.934222+00	0.60	0.40	trade
3	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	2025-09-23 23:27:09.409736+00	0.60	0.4	trade
6	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	2025-10-05 14:49:25.302853+00	0.620	0.380	trade
5	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	2025-09-23 23:40:06.213805+00	0.610	0.390	trade
\.


--
-- TOC entry 4569 (class 0 OID 87468)
-- core: 402
-- Data for Name: market_price_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_price_history (id, market_id, ts, yes, no, volume_pi) FROM stdin;
318df02e-e306-45aa-b876-7ff0ba78c1a0	904bb69a-6ad3-4431-8731-4c6b7404be0a	2025-11-01 16:54:04+00	50	50	100
fcc1de77-805e-4c5e-8c59-1376a9378452	904bb69a-6ad3-4431-8731-4c6b7404be0a	2025-11-02 16:54:36+00	55	45	150
23ae7e8e-6b33-4074-bc02-e6b3a8fa5bce	904bb69a-6ad3-4431-8731-4c6b7404be0a	2025-11-10 16:54:59+00	60	40	250
\.


--
-- TOC entry 4549 (class 0 OID 17281)
-- core: 376
-- Data for Name: markets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.markets (id, question, category, creator_id, tier, status, created_at, end_date, liquidity, resolution_criteria, resolution_source, resolved, resolved_at, resolved_outcome, is_archived, closes_at, outcome_reason, seed_total, description, close_at, rules, sources, tags, checklist_resolution_clarity, checklist_restricted_topics, checklist_verifiable_outcome) FROM stdin;
484dabfe-45f9-4664-9397-ce6fb7e34e9f	TEST: ETH > $5k 2025	Crypto	\N	Standard	resolved	2025-08-31 21:44:35.673192+00	2025-12-31 23:59:00+00	500	\N	api-admin	t	2025-09-06 22:56:52.399105	yes	f	\N	audit verify	0	\N	\N	\N	[]	{}	t	t	t
91ebdf83-4eeb-4982-ad3d-0188f5f3f27c	AUDIT DEMO create	Crypto	\N	\N	open	2025-09-04 02:08:35.621864+00	\N	\N	\N	\N	f	\N	\N	f	2025-12-31 00:00:00+00	\N	0	Test MVP market	2025-12-16 03:01:10.93383+00	\N	[]	{}	t	t	t
6d7d716e-faf7-42dd-ba19-1aa2f54deae5	Will BTC close above $80k on 2025-12-31?	Pi Coin	\N	\N	resolved	2025-08-28 05:13:21.253758+00	\N	\N	\N	\N	t	2025-08-28 05:14:19.658416	yes	f	\N	manual resolve via public path	0	\N	\N	\N	[]	{}	t	t	t
77934a4a-2ba4-4dda-b03c-64cd2ae0d874	Will Pi reach 10 million downloads by August 15	Pi Coin	\N	Boosted	resolved	2025-08-14 16:20:29.686682+00	2025-08-14 16:19:00.391+00	100	\N	Pi Network	t	2025-08-24 14:56:36.603312	yes	f	2025-08-14 16:19:00.391+00	\N	0	\N	\N	\N	[]	{}	t	t	t
81954cc2-9938-4f1f-b471-157840e2c1eb	Will pi close higher than yesterday?	Pi Coin	\N	Boosted	resolved	2025-08-25 14:27:02.520213+00	2025-08-25 14:26:17.72+00	1000	\N	CoinGecko	t	2025-08-30 00:55:07.484308	yes	f	\N	admin sidecar test	0	\N	\N	\N	[]	{}	t	t	t
f77862cd-c231-4d7f-aee8-a568136a7f89	Will Pi hit $1 by July 31	PI coin	\N	Standard	resolved	2025-07-31 02:56:10.867+00	2025-08-01 02:30:00+00	1000	Pi hits $1	Coingecko	t	2025-08-30 16:26:55.7903	yes	f	2025-08-01 02:30:00+00	\N	0	\N	\N	\N	[]	{}	t	t	t
7e603642-0d7e-4f21-911d-cd88f3020f7e	Nasdaq will close higher than 2024	Finance	\N	Standard	resolved	2025-08-01 23:17:09.290273+00	2025-08-01 23:15:25.504+00	100	\N	Wallstreet Journal	t	2025-08-30 16:30:29.335261	yes	f	2025-08-01 23:15:25.504+00	\N	0	\N	\N	\N	[]	{}	t	t	t
3c1dc1b6-8e98-4d6a-a103-af644b100a14	Will Ryan poop his pants before August 3	Trending	\N	Standard	resolved	2025-08-01 00:37:19.454983+00	\N	1000	\N	\N	t	2025-08-30 16:42:53.433097	yes	f	\N	\N	0	\N	\N	\N	[]	{}	t	t	t
904bb69a-6ad3-4431-8731-4c6b7404be0a	Will BTC > $110k by Dec?	Crypto	\N	\N	open	2025-11-10 12:19:03.003094+00	2025-12-31 00:00:00+00	\N	\N	\N	f	\N	\N	f	\N	\N	0	Bitcoin (BTC) price will surpass $110,000 by December 31, 2025.	2026-01-01 00:00:00+00	\N	[]	{}	t	t	t
72d9b3ea-452d-4ade-89d9-5d67301fd55d	Will BTC > $90k by Dec?	Crypto	\N	\N	open	2025-09-06 22:13:37.821647+00	\N	\N	\N	\N	f	\N	\N	f	\N	\N	0	Will BTC > $90k by Dec?	2025-12-16 03:01:10.93383+00	\N	[]	{}	t	t	t
3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	Will BTC > $90k by Dec?	Crypto	\N	\N	open	2025-09-06 22:17:18.286598+00	\N	\N	\N	\N	f	\N	\N	f	\N	\N	0	Will BTC > $90k by Dec?	2025-12-16 03:01:10.93383+00	\N	[]	{}	t	t	t
\.


--
-- TOC entry 4550 (class 0 OID 17296)
-- core: 377
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (id, user_id, market_id, side, amount, created_at, status, user_handle) FROM stdin;
4b5cd4c7-0886-4b98-ac80-2b4885758c2e	38b86098-af5c-45fc-8b7b-b4d2bc2ca682	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	yes	5	2025-08-18 22:45:02.900906+00	\N	\N
6fa74c5c-8aac-4699-af5d-9fd1c053bc4e	49b19763-90d0-4990-b63b-dca945db892c	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	yes	1	2025-08-21 01:32:20.091029+00	\N	\N
f575145c-1de6-4f96-ba37-780186d1916f	9b287f8d-4727-451f-84d9-505ec9edd213	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	yes	1	2025-08-21 01:34:36.220561+00	\N	\N
e7f8b3c6-aa9e-45f6-9fa7-f3b282a194a4	3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	yes	10	2025-08-24 14:54:31.709231+00	\N	\N
8ede6d5c-b373-4786-bb65-4958289564ca	b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19	81954cc2-9938-4f1f-b471-157840e2c1eb	yes	100	2025-08-26 03:57:34.439936+00	\N	\N
14ef5378-2575-42ed-abfd-fea170938760	b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19	3c1dc1b6-8e98-4d6a-a103-af644b100a14	no	100	2025-08-26 03:58:56.533954+00	\N	\N
56ac0d15-103f-4018-981b-c33d117dc455	31f7b10f-00ef-48e7-8972-4b89a7fdc776	81954cc2-9938-4f1f-b471-157840e2c1eb	yes	100	2025-08-26 22:38:18.072752+00	\N	\N
004eb1f2-722f-41ec-afe3-3d75fd230581	31f7b10f-00ef-48e7-8972-4b89a7fdc776	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	no	100	2025-08-26 23:19:57.076949+00	\N	\N
d86baff3-7db9-4bac-9e56-3d7bbf1f7e7a	8647eeb1-6635-45b5-9b44-24f15485d9d9	484dabfe-45f9-4664-9397-ce6fb7e34e9f	yes	5	2025-09-06 22:44:41.170594+00	sold	\N
3e1ff7ca-42ea-4bee-9108-61ba31299085	82a1db16-3282-50ef-b977-d60ccf71417a	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	yes	3.0	2025-09-06 23:05:20.887142+00	\N	\N
e4783e07-9a30-445c-bcb8-b1462f9012a9	ca745c47-3ee1-57c9-8e16-2040c0c1790f	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	yes	20.0	2025-09-08 00:38:22.786945+00	\N	\N
91eeb5db-7ce1-4ebc-8e11-b26fbbc5a166	ca745c47-3ee1-57c9-8e16-2040c0c1790f	72d9b3ea-452d-4ade-89d9-5d67301fd55d	yes	200.0	2025-09-08 00:47:24.525904+00	\N	\N
78b9a611-a3d9-49e3-bf7e-007901707372	652f83e5-865f-4330-9dfe-c50d20b1c0c7	91ebdf83-4eeb-4982-ad3d-0188f5f3f27c	yes	5.0	2025-09-18 00:46:35.090875+00	\N	\N
542c1557-e91e-4460-8bcb-b8dba2512f87	f3891537-058f-43e6-aad7-2f5bc0ffe606	3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea	yes	1	2025-10-05 14:49:25.302853+00	\N	\N
\.


--
-- TOC entry 4551 (class 0 OID 17316)
-- core: 378
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referrals (id, referrer_id, referred_id, created_at, reward_earned) FROM stdin;
\.


--
-- TOC entry 4557 (class 0 OID 54784)
-- core: 385
-- Data for Name: suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suggestions (id, user_id, title, category, resolution_criteria, description, end_time, status, reject_reason, created_at, approved_at, approved_by, submitted_by) FROM stdin;
\.


--
-- TOC entry 4578 (class 0 OID 136810)
-- core: 414
-- Data for Name: tester_whitelist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tester_whitelist (username, added_at, note, handle_norm) FROM stdin;
@atchesson	2025-08-31 20:50:49.982307+00	owner	atchesson
@rson959	2025-08-31 20:50:49.982307+00	brother	rson959
@Atcheson	2025-09-04 22:49:56.314466+00	owner	atcheson
\.


--
-- TOC entry 4552 (class 0 OID 17334)
-- core: 379
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trades (id, user_id, market_id, type, side, pi_amount, created_at, fee_pi, invalid, kind) FROM stdin;
3de5fca3-111b-41b6-b6d7-5f8a7887ca80	3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	payout	yes	10	2025-08-24 15:04:29.524545+00	0	f	buy
c8e031bc-6ed9-442e-a2b5-02f485d2437e	3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682	7e603642-0d7e-4f21-911d-cd88f3020f7e	buy	yes	10	2025-08-24 15:15:08.514263+00	0.200000	f	buy
7522d3f5-cec6-4ec7-93c7-282339209ca9	3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682	7e603642-0d7e-4f21-911d-cd88f3020f7e	sell	yes	10	2025-08-24 15:17:45.900765+00	0.200000	f	buy
2e879b69-d520-49be-8b33-e6ade93068b2	3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682	77934a4a-2ba4-4dda-b03c-64cd2ae0d874	sell	yes	10	2025-08-24 15:01:38.942175+00	0	f	buy
9cc80c62-2cfa-4871-bef7-78a801337871	8647eeb1-6635-45b5-9b44-24f15485d9d9	904bb69a-6ad3-4431-8731-4c6b7404be0a	buy	yes	10	2025-11-14 17:26:22+00	0.200000	t	buy
574f0639-a0d6-4278-bc28-a274f4482f8b	82a1db16-3282-50ef-b977-d60ccf71417a	904bb69a-6ad3-4431-8731-4c6b7404be0a	buy	yes	10	2025-11-14 17:26:22+00	0.200000	t	buy
\.


--
-- TOC entry 4577 (class 0 OID 133448)
-- core: 411
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, market_id, amount, type, status, details, date) FROM stdin;
8241c76d-e31e-4804-b92e-c52b3251c856	8647eeb1-6635-45b5-9b44-24f15485d9d9	484dabfe-45f9-4664-9397-ce6fb7e34e9f	500	deposit	completed	Initial account deposit	2025-11-10
\.


--
-- TOC entry 4548 (class 0 OID 17269)
-- core: 375
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, pi_username, created_at, referral_code, referred_by, tutorial_completed, handle_norm, status, is_admin, balance) FROM stdin;
754760c0-ec5a-431d-9d9a-5b1ff85a430a	supertiger0805	2025-11-10 07:01:54.091148+00	\N	\N	f	supertiger0805	active	t	2000
8647eeb1-6635-45b5-9b44-24f15485d9d9	test1	2025-09-06 22:44:41.170594+00	\N	\N	f	test1	active	f	0
82a1db16-3282-50ef-b977-d60ccf71417a	test2	2025-09-06 23:05:20.887142+00	\N	\N	f	test2	active	f	0
ca745c47-3ee1-57c9-8e16-2040c0c1790f	test3	2025-09-08 00:38:22.786945+00	\N	\N	f	test3	active	f	0
652f83e5-865f-4330-9dfe-c50d20b1c0c7	test4	2025-09-17 23:48:30.669639+00	\N	\N	f	test4	active	f	0
f3891537-058f-43e6-aad7-2f5bc0ffe606	test5	2025-10-05 14:49:25.302853+00	\N	\N	f	test5	active	f	0
9b287f8d-4727-451f-84d9-505ec9edd213	test6	2025-08-21 01:34:36.220561+00	\N	\N	f	test6	suspended	f	0
3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682	test7	2025-08-24 14:54:31.709231+00	\N	\N	f	test7	suspended	f	0
38b86098-af5c-45fc-8b7b-b4d2bc2ca682	test8	2025-08-18 22:43:56.96465+00	\N	\N	f	test8	banned	f	0
49b19763-90d0-4990-b63b-dca945db892c	test9	2025-08-21 01:32:20.091029+00	\N	\N	f	test9	banned	f	0
b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19	AtchesSon	2025-08-26 03:45:53.451336+00	\N	\N	f	atchesson	active	t	0
6961cc7f-38ac-45ab-8256-00483252a6ef	@admin	2025-08-28 00:33:25.232849+00	\N	\N	f	admin	active	t	0
4165145e-bb70-4248-a9b6-ee05a151cb51	@AtchesSon	2025-08-28 00:33:37.745834+00	\N	\N	f	atchesson	active	t	0
c6b4c472-39a2-46cf-a93f-9c6151b4c563	@AtchesSon 	2025-08-28 00:40:45.378349+00	\N	\N	f	atchesson	active	t	0
3bb86098-a5fc-45fc-8b7b-b4d2bc2ca682	@Atcheson	2025-09-04 22:49:56.314466+00	\N	\N	f	atcheson	active	t	0
31f7b10f-00ef-48e7-8972-4b89a7fdc776	andy	2025-08-26 02:33:43.4153+00	\N	\N	f	andy	active	t	0
\.


--
-- TOC entry 4560 (class 0 OID 64206)
-- core: 388
-- Data for Name: messages_2025_09_06; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_06 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4561 (class 0 OID 64217)
-- core: 389
-- Data for Name: messages_2025_09_07; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_07 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4562 (class 0 OID 67821)
-- core: 394
-- Data for Name: messages_2025_09_08; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_08 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4563 (class 0 OID 67832)
-- core: 395
-- Data for Name: messages_2025_09_09; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_09 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4564 (class 0 OID 70057)
-- core: 396
-- Data for Name: messages_2025_09_10; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_10 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4565 (class 0 OID 70068)
-- core: 397
-- Data for Name: messages_2025_09_11; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_11 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4566 (class 0 OID 71184)
-- core: 398
-- Data for Name: messages_2025_09_12; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_09_12 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 4543 (class 0 OID 17000)
-- core: 366
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-07-30 02:21:25
20211116045059	2025-07-30 02:21:28
20211116050929	2025-07-30 02:21:30
20211116051442	2025-07-30 02:21:32
20211116212300	2025-07-30 02:21:34
20211116213355	2025-07-30 02:21:36
20211116213934	2025-07-30 02:21:38
20211116214523	2025-07-30 02:21:41
20211122062447	2025-07-30 02:21:43
20211124070109	2025-07-30 02:21:45
20211202204204	2025-07-30 02:21:47
20211202204605	2025-07-30 02:21:49
20211210212804	2025-07-30 02:21:54
20211228014915	2025-07-30 02:21:56
20220107221237	2025-07-30 02:21:58
20220228202821	2025-07-30 02:22:00
20220312004840	2025-07-30 02:22:02
20220603231003	2025-07-30 02:22:05
20220603232444	2025-07-30 02:22:06
20220615214548	2025-07-30 02:22:09
20220712093339	2025-07-30 02:22:10
20220908172859	2025-07-30 02:22:12
20220916233421	2025-07-30 02:22:14
20230119133233	2025-07-30 02:22:16
20230128025114	2025-07-30 02:22:18
20230128025212	2025-07-30 02:22:20
20230227211149	2025-07-30 02:22:22
20230228184745	2025-07-30 02:22:24
20230308225145	2025-07-30 02:22:26
20230328144023	2025-07-30 02:22:27
20231018144023	2025-07-30 02:22:29
20231204144023	2025-07-30 02:22:32
20231204144024	2025-07-30 02:22:34
20231204144025	2025-07-30 02:22:36
20240108234812	2025-07-30 02:22:38
20240109165339	2025-07-30 02:22:40
20240227174441	2025-07-30 02:22:43
20240311171622	2025-07-30 02:22:45
20240321100241	2025-07-30 02:22:49
20240401105812	2025-07-30 02:22:54
20240418121054	2025-07-30 02:22:57
20240523004032	2025-07-30 02:23:03
20240618124746	2025-07-30 02:23:05
20240801235015	2025-07-30 02:23:07
20240805133720	2025-07-30 02:23:09
20240827160934	2025-07-30 02:23:11
20240919163303	2025-07-30 02:23:13
20240919163305	2025-07-30 02:23:15
20241019105805	2025-07-30 02:23:17
20241030150047	2025-07-30 02:23:23
20241108114728	2025-07-30 02:23:26
20241121104152	2025-07-30 02:23:28
20241130184212	2025-07-30 02:23:30
20241220035512	2025-07-30 02:23:32
20241220123912	2025-07-30 02:23:34
20241224161212	2025-07-30 02:23:35
20250107150512	2025-07-30 02:23:37
20250110162412	2025-07-30 02:23:39
20250123174212	2025-07-30 02:23:41
20250128220012	2025-07-30 02:23:42
20250506224012	2025-07-30 02:23:44
20250523164012	2025-07-30 02:23:46
20250714121412	2025-07-30 02:23:48
20250905041441	2025-09-23 22:28:36
20251103001201	2025-11-13 15:07:21
\.


--
-- TOC entry 4547 (class 0 OID 17107)
-- core: 371
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- TOC entry 4529 (class 0 OID 16544)
-- core: 349
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- TOC entry 4555 (class 0 OID 49704)
-- core: 382
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (id, type, format, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4531 (class 0 OID 16586)
-- core: 351
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-07-30 02:21:21.718299
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-07-30 02:21:21.765154
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-07-30 02:21:21.778933
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-07-30 02:21:22.025898
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-07-30 02:21:22.307335
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-07-30 02:21:22.310136
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-07-30 02:21:22.313227
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-07-30 02:21:22.315988
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-07-30 02:21:22.318591
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-07-30 02:21:22.321388
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-07-30 02:21:22.324528
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-07-30 02:21:22.327772
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-07-30 02:21:22.336737
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-07-30 02:21:22.341337
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-07-30 02:21:22.344274
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-07-30 02:21:22.402607
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-07-30 02:21:22.410986
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-07-30 02:21:22.415332
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-07-30 02:21:22.424547
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-07-30 02:21:22.433288
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-07-30 02:21:22.438841
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-07-30 02:21:22.446297
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-07-30 02:21:22.469709
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-07-30 02:21:22.492243
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-07-30 02:21:22.497036
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-07-30 02:21:22.500674
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-08-24 08:00:48.995635
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-08-24 08:00:49.204611
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-08-24 08:00:49.219307
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-08-24 08:00:49.246145
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-08-24 08:00:49.255756
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-08-24 08:00:49.26385
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-08-24 08:00:49.277783
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-08-24 08:00:49.286582
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-08-24 08:00:49.288921
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-08-24 08:00:49.298879
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-08-24 08:00:49.30618
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-08-24 08:00:49.333514
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-08-24 08:00:49.342929
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-10-05 14:27:58.356916
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-10-05 14:27:58.405189
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-10-05 14:27:58.427684
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-10-05 14:27:58.431302
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-10-05 14:27:58.436536
\.


--
-- TOC entry 4530 (class 0 OID 16559)
-- core: 350
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- TOC entry 4554 (class 0 OID 49659)
-- core: 381
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4544 (class 0 OID 17037)
-- core: 367
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- TOC entry 4545 (class 0 OID 17051)
-- core: 368
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- TOC entry 3864 (class 0 OID 16656)
-- core: 352
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4834 (class 0 OID 0)
-- core: 344
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 11, true);


--
-- TOC entry 4835 (class 0 OID 0)
-- core: 405
-- Name: market_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.market_comments_id_seq', 1, true);


--
-- TOC entry 4836 (class 0 OID 0)
-- core: 403
-- Name: market_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.market_history_id_seq', 6, true);


--
-- TOC entry 4837 (class 0 OID 0)
-- core: 370
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- TOC entry 4103 (class 2606 OID 16825)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 4057 (class 2606 OID 16529)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4126 (class 2606 OID 16931)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 4081 (class 2606 OID 16949)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 4083 (class 2606 OID 16959)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 4055 (class 2606 OID 16522)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 4105 (class 2606 OID 16818)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 4101 (class 2606 OID 16806)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4093 (class 2606 OID 16999)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 4095 (class 2606 OID 16793)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 4227 (class 2606 OID 113192)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 4229 (class 2606 OID 113190)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4231 (class 2606 OID 113188)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4185 (class 2606 OID 62948)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4235 (class 2606 OID 113214)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4237 (class 2606 OID 113216)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 4130 (class 2606 OID 16984)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4049 (class 2606 OID 16512)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4052 (class 2606 OID 16736)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 4115 (class 2606 OID 16865)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 4117 (class 2606 OID 16863)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4122 (class 2606 OID 16879)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4060 (class 2606 OID 16535)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4088 (class 2606 OID 16757)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4112 (class 2606 OID 16846)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 4107 (class 2606 OID 16837)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4042 (class 2606 OID 16919)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 4044 (class 2606 OID 16499)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4187 (class 2606 OID 64098)
-- Name: admin_audit admin_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit
    ADD CONSTRAINT admin_audit_pkey PRIMARY KEY (id);


--
-- TOC entry 4173 (class 2606 OID 39654)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4180 (class 2606 OID 54783)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (name);


--
-- TOC entry 4211 (class 2606 OID 76001)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4240 (class 2606 OID 133137)
-- Name: leaderboards leaderboards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaderboards
    ADD CONSTRAINT leaderboards_pkey PRIMARY KEY (id);


--
-- TOC entry 4224 (class 2606 OID 87565)
-- Name: market_comments market_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_comments
    ADD CONSTRAINT market_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4220 (class 2606 OID 87540)
-- Name: market_history market_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_history
    ADD CONSTRAINT market_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4216 (class 2606 OID 87477)
-- Name: market_price_history market_price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_price_history
    ADD CONSTRAINT market_price_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4157 (class 2606 OID 17290)
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- TOC entry 4164 (class 2606 OID 17305)
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- TOC entry 4166 (class 2606 OID 17323)
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 4182 (class 2606 OID 54794)
-- Name: suggestions suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_pkey PRIMARY KEY (id);


--
-- TOC entry 4168 (class 2606 OID 17344)
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- TOC entry 4242 (class 2606 OID 133453)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4151 (class 2606 OID 17278)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4153 (class 2606 OID 17280)
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- TOC entry 4147 (class 2606 OID 17267)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4190 (class 2606 OID 64214)
-- Name: messages_2025_09_06 messages_2025_09_06_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_06
    ADD CONSTRAINT messages_2025_09_06_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4193 (class 2606 OID 64225)
-- Name: messages_2025_09_07 messages_2025_09_07_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_07
    ADD CONSTRAINT messages_2025_09_07_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4196 (class 2606 OID 67829)
-- Name: messages_2025_09_08 messages_2025_09_08_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_08
    ADD CONSTRAINT messages_2025_09_08_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4199 (class 2606 OID 67840)
-- Name: messages_2025_09_09 messages_2025_09_09_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_09
    ADD CONSTRAINT messages_2025_09_09_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4202 (class 2606 OID 70065)
-- Name: messages_2025_09_10 messages_2025_09_10_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_10
    ADD CONSTRAINT messages_2025_09_10_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4205 (class 2606 OID 70076)
-- Name: messages_2025_09_11 messages_2025_09_11_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_11
    ADD CONSTRAINT messages_2025_09_11_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4208 (class 2606 OID 71192)
-- Name: messages_2025_09_12 messages_2025_09_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_09_12
    ADD CONSTRAINT messages_2025_09_12_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4143 (class 2606 OID 17115)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4135 (class 2606 OID 17004)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4178 (class 2606 OID 49714)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4063 (class 2606 OID 16552)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 4073 (class 2606 OID 16593)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4075 (class 2606 OID 16591)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4071 (class 2606 OID 16569)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4176 (class 2606 OID 49668)
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- TOC entry 4140 (class 2606 OID 17060)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4138 (class 2606 OID 17045)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4058 (class 1259 OID 16530)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 4032 (class 1259 OID 16746)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4033 (class 1259 OID 16748)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4034 (class 1259 OID 16749)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4091 (class 1259 OID 16827)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 4124 (class 1259 OID 16935)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 4079 (class 1259 OID 16915)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 4838 (class 0 OID 0)
-- core: 4079
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 4084 (class 1259 OID 16743)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4127 (class 1259 OID 16932)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4128 (class 1259 OID 16933)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 4099 (class 1259 OID 16938)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 4096 (class 1259 OID 16799)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 4097 (class 1259 OID 16944)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 4225 (class 1259 OID 113203)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 4183 (class 1259 OID 62952)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4232 (class 1259 OID 113229)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4233 (class 1259 OID 113227)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4238 (class 1259 OID 113228)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 4131 (class 1259 OID 16991)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 4132 (class 1259 OID 16990)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 4133 (class 1259 OID 16992)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 4035 (class 1259 OID 16750)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4036 (class 1259 OID 16747)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4045 (class 1259 OID 16513)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 4046 (class 1259 OID 16514)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 4047 (class 1259 OID 16742)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 4050 (class 1259 OID 16829)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 4053 (class 1259 OID 16934)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 4118 (class 1259 OID 16871)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 4119 (class 1259 OID 16936)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 4120 (class 1259 OID 16886)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 4123 (class 1259 OID 16885)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 4085 (class 1259 OID 16937)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 4086 (class 1259 OID 113241)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 4089 (class 1259 OID 16828)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 4110 (class 1259 OID 16853)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 4113 (class 1259 OID 16852)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 4108 (class 1259 OID 16838)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 4109 (class 1259 OID 40767)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 4098 (class 1259 OID 16997)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 4090 (class 1259 OID 16826)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 4037 (class 1259 OID 16906)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 4839 (class 0 OID 0)
-- core: 4037
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 4038 (class 1259 OID 16744)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 4039 (class 1259 OID 16503)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 4040 (class 1259 OID 16961)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4209 (class 1259 OID 76002)
-- Name: comments_market_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_market_created_idx ON public.comments USING btree (market_id, created_at DESC);


--
-- TOC entry 4222 (class 1259 OID 87566)
-- Name: idx_comments_market_ts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_market_ts ON public.market_comments USING btree (market_id, created_at DESC);


--
-- TOC entry 4218 (class 1259 OID 87541)
-- Name: idx_history_market_ts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_history_market_ts ON public.market_history USING btree (market_id, ts DESC);


--
-- TOC entry 4154 (class 1259 OID 44083)
-- Name: idx_markets_closes_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_closes_at ON public.markets USING btree (closes_at);


--
-- TOC entry 4155 (class 1259 OID 64182)
-- Name: idx_markets_unresolved_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_unresolved_created ON public.markets USING btree (created_at DESC) WHERE ((COALESCE(resolved, false) = false) OR (resolved_outcome IS NULL));


--
-- TOC entry 4158 (class 1259 OID 39661)
-- Name: idx_positions_market; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_market ON public.positions USING btree (market_id);


--
-- TOC entry 4159 (class 1259 OID 53607)
-- Name: idx_positions_market_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_market_id ON public.positions USING btree (market_id);


--
-- TOC entry 4160 (class 1259 OID 70080)
-- Name: idx_positions_market_side; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_market_side ON public.positions USING btree (market_id, side);


--
-- TOC entry 4161 (class 1259 OID 70079)
-- Name: idx_positions_market_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_market_time ON public.positions USING btree (market_id, created_at DESC);


--
-- TOC entry 4162 (class 1259 OID 39660)
-- Name: idx_positions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_user ON public.positions USING btree (user_id);


--
-- TOC entry 4148 (class 1259 OID 66519)
-- Name: idx_users_handle_norm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_handle_norm ON public.users USING btree (handle_norm);


--
-- TOC entry 4217 (class 1259 OID 87483)
-- Name: mph_market_ts_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mph_market_ts_idx ON public.market_price_history USING btree (market_id, ts DESC);


--
-- TOC entry 4212 (class 1259 OID 77150)
-- Name: mv_leaderboard_by_success; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mv_leaderboard_by_success ON public.mv_leaderboard USING btree (success_pct);


--
-- TOC entry 4213 (class 1259 OID 77149)
-- Name: mv_leaderboard_by_volume; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mv_leaderboard_by_volume ON public.mv_leaderboard USING btree (volume);


--
-- TOC entry 4214 (class 1259 OID 77148)
-- Name: mv_leaderboard_user_ux; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX mv_leaderboard_user_ux ON public.mv_leaderboard USING btree (user_id);


--
-- TOC entry 4169 (class 1259 OID 50934)
-- Name: trades_unique_payout_per_user_market; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX trades_unique_payout_per_user_market ON public.trades USING btree (user_id, market_id) WHERE (type = 'payout'::text);


--
-- TOC entry 4170 (class 1259 OID 50060)
-- Name: uq_trades_payout_once; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_trades_payout_once ON public.trades USING btree (user_id, market_id) WHERE (type = 'payout'::text);


--
-- TOC entry 4149 (class 1259 OID 52171)
-- Name: users_pi_username_unique_ci; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_pi_username_unique_ci ON public.users USING btree (lower(pi_username));


--
-- TOC entry 4221 (class 1259 OID 89787)
-- Name: ux_market_history_market_ts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_market_history_market_ts ON public.market_history USING btree (market_id, ts);


--
-- TOC entry 4171 (class 1259 OID 50716)
-- Name: ux_trades_unique_payout; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_trades_unique_payout ON public.trades USING btree (user_id, market_id) WHERE (type = 'payout'::text);


--
-- TOC entry 4141 (class 1259 OID 17268)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4145 (class 1259 OID 89775)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4188 (class 1259 OID 89776)
-- Name: messages_2025_09_06_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_06_inserted_at_topic_idx ON realtime.messages_2025_09_06 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4191 (class 1259 OID 89777)
-- Name: messages_2025_09_07_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_07_inserted_at_topic_idx ON realtime.messages_2025_09_07 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4194 (class 1259 OID 89778)
-- Name: messages_2025_09_08_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_08_inserted_at_topic_idx ON realtime.messages_2025_09_08 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4197 (class 1259 OID 89779)
-- Name: messages_2025_09_09_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_09_inserted_at_topic_idx ON realtime.messages_2025_09_09 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4200 (class 1259 OID 89780)
-- Name: messages_2025_09_10_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_10_inserted_at_topic_idx ON realtime.messages_2025_09_10 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4203 (class 1259 OID 89781)
-- Name: messages_2025_09_11_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_11_inserted_at_topic_idx ON realtime.messages_2025_09_11 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4206 (class 1259 OID 89782)
-- Name: messages_2025_09_12_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_09_12_inserted_at_topic_idx ON realtime.messages_2025_09_12 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4144 (class 1259 OID 17168)
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- TOC entry 4061 (class 1259 OID 16558)
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 4064 (class 1259 OID 16580)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 4136 (class 1259 OID 17071)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 4065 (class 1259 OID 49686)
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- TOC entry 4066 (class 1259 OID 17036)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 4067 (class 1259 OID 49688)
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- TOC entry 4174 (class 1259 OID 49689)
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- TOC entry 4068 (class 1259 OID 16581)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4069 (class 1259 OID 49687)
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- TOC entry 4243 (class 0 OID 0)
-- Name: messages_2025_09_06_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_06_inserted_at_topic_idx;


--
-- TOC entry 4244 (class 0 OID 0)
-- Name: messages_2025_09_06_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_06_pkey;


--
-- TOC entry 4245 (class 0 OID 0)
-- Name: messages_2025_09_07_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_07_inserted_at_topic_idx;


--
-- TOC entry 4246 (class 0 OID 0)
-- Name: messages_2025_09_07_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_07_pkey;


--
-- TOC entry 4247 (class 0 OID 0)
-- Name: messages_2025_09_08_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_08_inserted_at_topic_idx;


--
-- TOC entry 4248 (class 0 OID 0)
-- Name: messages_2025_09_08_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_08_pkey;


--
-- TOC entry 4249 (class 0 OID 0)
-- Name: messages_2025_09_09_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_09_inserted_at_topic_idx;


--
-- TOC entry 4250 (class 0 OID 0)
-- Name: messages_2025_09_09_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_09_pkey;


--
-- TOC entry 4251 (class 0 OID 0)
-- Name: messages_2025_09_10_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_10_inserted_at_topic_idx;


--
-- TOC entry 4252 (class 0 OID 0)
-- Name: messages_2025_09_10_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_10_pkey;


--
-- TOC entry 4253 (class 0 OID 0)
-- Name: messages_2025_09_11_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_11_inserted_at_topic_idx;


--
-- TOC entry 4254 (class 0 OID 0)
-- Name: messages_2025_09_11_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_11_pkey;


--
-- TOC entry 4255 (class 0 OID 0)
-- Name: messages_2025_09_12_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_09_12_inserted_at_topic_idx;


--
-- TOC entry 4256 (class 0 OID 0)
-- Name: messages_2025_09_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_09_12_pkey;


--
-- TOC entry 4298 (class 2620 OID 44085)
-- Name: positions positions_ensure_user; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER positions_ensure_user BEFORE INSERT ON public.positions FOR EACH ROW EXECUTE FUNCTION public.ensure_user_for_position();


--
-- TOC entry 4299 (class 2620 OID 89785)
-- Name: positions trg_positions_after_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_positions_after_insert AFTER INSERT ON public.positions FOR EACH ROW EXECUTE FUNCTION public.positions_after_insert();


--
-- TOC entry 4300 (class 2620 OID 50115)
-- Name: trades trg_trades_apply_fee; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_trades_apply_fee BEFORE INSERT OR UPDATE OF type, pi_amount ON public.trades FOR EACH ROW EXECUTE FUNCTION public.trades_apply_fee();


--
-- TOC entry 4301 (class 2620 OID 66522)
-- Name: trades trg_trades_autovalidate_ins; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_trades_autovalidate_ins BEFORE INSERT ON public.trades FOR EACH ROW EXECUTE FUNCTION public.trades_autovalidate();


--
-- TOC entry 4302 (class 2620 OID 66523)
-- Name: trades trg_trades_autovalidate_upd; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_trades_autovalidate_upd BEFORE UPDATE OF user_id ON public.trades FOR EACH ROW EXECUTE FUNCTION public.trades_autovalidate();


--
-- TOC entry 4296 (class 2620 OID 66545)
-- Name: users trg_users_autofill_ins; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_autofill_ins BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.users_autofill_handle_norm();


--
-- TOC entry 4297 (class 2620 OID 66546)
-- Name: users trg_users_autofill_upd; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_autofill_upd BEFORE UPDATE OF pi_username ON public.users FOR EACH ROW EXECUTE FUNCTION public.users_autofill_handle_norm();


--
-- TOC entry 4295 (class 2620 OID 17120)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 4290 (class 2620 OID 49696)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 4291 (class 2620 OID 103224)
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- TOC entry 4292 (class 2620 OID 49682)
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- TOC entry 4293 (class 2620 OID 103223)
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- TOC entry 4303 (class 2620 OID 49692)
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- TOC entry 4304 (class 2620 OID 103225)
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- TOC entry 4294 (class 2620 OID 17024)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 4259 (class 2606 OID 16730)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4264 (class 2606 OID 16819)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4263 (class 2606 OID 16807)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4262 (class 2606 OID 16794)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4286 (class 2606 OID 113193)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4287 (class 2606 OID 113198)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4288 (class 2606 OID 113222)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4289 (class 2606 OID 113217)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4269 (class 2606 OID 16985)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4257 (class 2606 OID 16763)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4266 (class 2606 OID 16866)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4267 (class 2606 OID 16939)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4268 (class 2606 OID 16880)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4260 (class 2606 OID 113236)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4261 (class 2606 OID 16758)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4265 (class 2606 OID 16847)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4280 (class 2606 OID 133477)
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4285 (class 2606 OID 87478)
-- Name: market_price_history market_price_history_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_price_history
    ADD CONSTRAINT market_price_history_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- TOC entry 4273 (class 2606 OID 17291)
-- Name: markets markets_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- TOC entry 4274 (class 2606 OID 17311)
-- Name: positions positions_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- TOC entry 4275 (class 2606 OID 17306)
-- Name: positions positions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4276 (class 2606 OID 17329)
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(id);


--
-- TOC entry 4277 (class 2606 OID 17324)
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- TOC entry 4282 (class 2606 OID 54800)
-- Name: suggestions suggestions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 4283 (class 2606 OID 54805)
-- Name: suggestions suggestions_category_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_category_fkey FOREIGN KEY (category) REFERENCES public.categories(name) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4284 (class 2606 OID 54795)
-- Name: suggestions suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4278 (class 2606 OID 17350)
-- Name: trades trades_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- TOC entry 4279 (class 2606 OID 17345)
-- Name: trades trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4258 (class 2606 OID 16570)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4281 (class 2606 OID 49669)
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4270 (class 2606 OID 17046)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4271 (class 2606 OID 17066)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4272 (class 2606 OID 17061)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4467 (class 0 OID 16523)
-- core: 347
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4481 (class 0 OID 16925)
-- core: 364
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4472 (class 0 OID 16723)
-- core: 355
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4466 (class 0 OID 16516)
-- core: 346
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4476 (class 0 OID 16812)
-- core: 359
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4475 (class 0 OID 16800)
-- core: 358
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4474 (class 0 OID 16787)
-- core: 357
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4482 (class 0 OID 16975)
-- core: 365
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4465 (class 0 OID 16505)
-- core: 345
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4479 (class 0 OID 16854)
-- core: 362
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4480 (class 0 OID 16872)
-- core: 363
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4468 (class 0 OID 16531)
-- core: 348
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4473 (class 0 OID 16753)
-- core: 356
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4478 (class 0 OID 16839)
-- core: 361
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4477 (class 0 OID 16830)
-- core: 360
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4464 (class 0 OID 16493)
-- core: 343
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4505 (class 3256 OID 17440)
-- Name: markets Allow all inserts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all inserts" ON public.markets FOR INSERT WITH CHECK (true);


--
-- TOC entry 4506 (class 3256 OID 17441)
-- Name: markets Allow all reads; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all reads" ON public.markets FOR SELECT USING (true);


--
-- TOC entry 4507 (class 3256 OID 53582)
-- Name: positions Public read access to positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access to positions" ON public.positions FOR SELECT USING (true);


--
-- TOC entry 4497 (class 3256 OID 17387)
-- Name: positions User can insert their own position; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can insert their own position" ON public.positions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 4499 (class 3256 OID 17389)
-- Name: referrals User can insert their referrals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can insert their referrals" ON public.referrals FOR INSERT WITH CHECK ((referrer_id = auth.uid()));


--
-- TOC entry 4501 (class 3256 OID 17391)
-- Name: trades User can insert their trades; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can insert their trades" ON public.trades FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 4496 (class 3256 OID 17386)
-- Name: positions User can read their own positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can read their own positions" ON public.positions FOR SELECT USING ((user_id = auth.uid()));


--
-- TOC entry 4498 (class 3256 OID 17388)
-- Name: referrals User can read their referrals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can read their referrals" ON public.referrals FOR SELECT USING (((referrer_id = auth.uid()) OR (referred_id = auth.uid())));


--
-- TOC entry 4500 (class 3256 OID 17390)
-- Name: trades User can read their trades; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "User can read their trades" ON public.trades FOR SELECT USING ((user_id = auth.uid()));


--
-- TOC entry 4503 (class 3256 OID 17415)
-- Name: users Users can insert their own row; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own row" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- TOC entry 4502 (class 3256 OID 17414)
-- Name: users Users can read their own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own data" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- TOC entry 4504 (class 3256 OID 17416)
-- Name: users Users can update their own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- TOC entry 4493 (class 0 OID 64090)
-- core: 387
-- Name: admin_audit; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4488 (class 0 OID 39650)
-- core: 380
-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4514 (class 3256 OID 74575)
-- Name: admins admins.self_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "admins.self_select" ON public.admins FOR SELECT USING ((auth.uid() = user_id));


--
-- TOC entry 4491 (class 0 OID 54777)
-- core: 384
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4509 (class 3256 OID 54810)
-- Name: categories categories_read_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY categories_read_all ON public.categories FOR SELECT TO authenticated USING (true);


--
-- TOC entry 4494 (class 0 OID 75992)
-- core: 399
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4515 (class 3256 OID 80669)
-- Name: comments comments_insert_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY comments_insert_all ON public.comments FOR INSERT WITH CHECK (true);


--
-- TOC entry 4518 (class 3256 OID 87486)
-- Name: comments comments_select_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY comments_select_all ON public.comments FOR SELECT USING (true);


--
-- TOC entry 4495 (class 0 OID 87468)
-- core: 402
-- Name: market_price_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4486 (class 0 OID 17281)
-- core: 376
-- Name: markets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4517 (class 3256 OID 87485)
-- Name: market_price_history mph_insert_admin_or_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY mph_insert_admin_or_service ON public.market_price_history FOR INSERT WITH CHECK (((auth.role() = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM public.admins a
  WHERE (a.user_id = auth.uid())))));


--
-- TOC entry 4516 (class 3256 OID 87484)
-- Name: market_price_history mph_select_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY mph_select_all ON public.market_price_history FOR SELECT USING (true);


--
-- TOC entry 4508 (class 3256 OID 53606)
-- Name: positions public_read_positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_read_positions ON public.positions FOR SELECT USING (true);


--
-- TOC entry 4513 (class 3256 OID 54902)
-- Name: categories read_categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY read_categories ON public.categories FOR SELECT USING (true);


--
-- TOC entry 4510 (class 3256 OID 54899)
-- Name: suggestions read_suggestions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY read_suggestions ON public.suggestions FOR SELECT USING (true);


--
-- TOC entry 4487 (class 0 OID 17316)
-- core: 378
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4492 (class 0 OID 54784)
-- core: 385
-- Name: suggestions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4519 (class 3256 OID 87487)
-- Name: trades trades_select_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY trades_select_all ON public.trades FOR SELECT USING (true);


--
-- TOC entry 4512 (class 3256 OID 54901)
-- Name: suggestions update_suggestions_dev; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_suggestions_dev ON public.suggestions FOR UPDATE USING (true);


--
-- TOC entry 4511 (class 3256 OID 54900)
-- Name: suggestions write_suggestions_dev; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY write_suggestions_dev ON public.suggestions FOR INSERT WITH CHECK (true);


--
-- TOC entry 4485 (class 0 OID 17253)
-- core: 374
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4469 (class 0 OID 16544)
-- core: 349
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4490 (class 0 OID 49704)
-- core: 382
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4471 (class 0 OID 16586)
-- core: 351
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4470 (class 0 OID 16559)
-- core: 350
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4489 (class 0 OID 49659)
-- core: 381
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4483 (class 0 OID 17037)
-- core: 367
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4484 (class 0 OID 17051)
-- core: 368
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4520 (class 6104 OID 16426)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- TOC entry 4521 (class 6104 OID 53381)
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- TOC entry 4522 (class 6106 OID 53382)
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- TOC entry 4584 (class 0 OID 0)
-- core: 95
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- TOC entry 4585 (class 0 OID 0)
-- core: 23
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- TOC entry 4586 (class 0 OID 0)
-- core: 111
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 4587 (class 0 OID 0)
-- core: 10
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- TOC entry 4588 (class 0 OID 0)
-- core: 96
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- TOC entry 4589 (class 0 OID 0)
-- core: 28
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- TOC entry 4596 (class 0 OID 0)
-- core: 497
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO service_role;


--
-- TOC entry 4597 (class 0 OID 0)
-- core: 500
-- Name: FUNCTION gtrgm_out(public.gtrgm); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO service_role;


--
-- TOC entry 4599 (class 0 OID 0)
-- core: 447
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- TOC entry 4600 (class 0 OID 0)
-- core: 493
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- TOC entry 4602 (class 0 OID 0)
-- core: 586
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- TOC entry 4604 (class 0 OID 0)
-- core: 573
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- TOC entry 4605 (class 0 OID 0)
-- core: 578
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- TOC entry 4606 (class 0 OID 0)
-- core: 473
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- TOC entry 4607 (class 0 OID 0)
-- core: 575
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- TOC entry 4608 (class 0 OID 0)
-- core: 489
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- TOC entry 4609 (class 0 OID 0)
-- core: 592
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4610 (class 0 OID 0)
-- core: 504
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4611 (class 0 OID 0)
-- core: 457
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- TOC entry 4612 (class 0 OID 0)
-- core: 460
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- TOC entry 4613 (class 0 OID 0)
-- core: 596
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4614 (class 0 OID 0)
-- core: 464
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4615 (class 0 OID 0)
-- core: 437
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- TOC entry 4616 (class 0 OID 0)
-- core: 471
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- TOC entry 4617 (class 0 OID 0)
-- core: 435
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- TOC entry 4618 (class 0 OID 0)
-- core: 518
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- TOC entry 4620 (class 0 OID 0)
-- core: 425
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- TOC entry 4622 (class 0 OID 0)
-- core: 589
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4624 (class 0 OID 0)
-- core: 523
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- TOC entry 4625 (class 0 OID 0)
-- core: 558
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4626 (class 0 OID 0)
-- core: 524
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- TOC entry 4627 (class 0 OID 0)
-- core: 542
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- TOC entry 4628 (class 0 OID 0)
-- core: 590
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- TOC entry 4629 (class 0 OID 0)
-- core: 529
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- TOC entry 4630 (class 0 OID 0)
-- core: 537
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- TOC entry 4631 (class 0 OID 0)
-- core: 569
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- TOC entry 4632 (class 0 OID 0)
-- core: 477
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4633 (class 0 OID 0)
-- core: 565
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4634 (class 0 OID 0)
-- core: 420
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 4635 (class 0 OID 0)
-- core: 561
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4636 (class 0 OID 0)
-- core: 443
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4637 (class 0 OID 0)
-- core: 581
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 4638 (class 0 OID 0)
-- core: 478
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- TOC entry 4639 (class 0 OID 0)
-- core: 483
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- TOC entry 4640 (class 0 OID 0)
-- core: 563
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4641 (class 0 OID 0)
-- core: 462
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4642 (class 0 OID 0)
-- core: 496
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- TOC entry 4643 (class 0 OID 0)
-- core: 564
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4644 (class 0 OID 0)
-- core: 572
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 4645 (class 0 OID 0)
-- core: 568
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4646 (class 0 OID 0)
-- core: 532
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- TOC entry 4647 (class 0 OID 0)
-- core: 594
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- TOC entry 4648 (class 0 OID 0)
-- core: 429
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 4649 (class 0 OID 0)
-- core: 446
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4650 (class 0 OID 0)
-- core: 423
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4651 (class 0 OID 0)
-- core: 502
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4653 (class 0 OID 0)
-- core: 501
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4654 (class 0 OID 0)
-- core: 574
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- TOC entry 4655 (class 0 OID 0)
-- core: 521
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- TOC entry 4656 (class 0 OID 0)
-- core: 486
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 4657 (class 0 OID 0)
-- core: 550
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- TOC entry 4658 (class 0 OID 0)
-- core: 419
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 4659 (class 0 OID 0)
-- core: 526
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- TOC entry 4660 (class 0 OID 0)
-- core: 571
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- TOC entry 4661 (class 0 OID 0)
-- core: 463
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- TOC entry 4662 (class 0 OID 0)
-- core: 519
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- TOC entry 4663 (class 0 OID 0)
-- core: 513
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- TOC entry 4664 (class 0 OID 0)
-- core: 549
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- TOC entry 4665 (class 0 OID 0)
-- core: 479
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- TOC entry 4666 (class 0 OID 0)
-- core: 530
-- Name: FUNCTION _clamp(val numeric, lo numeric, hi numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public._clamp(val numeric, lo numeric, hi numeric) TO anon;
GRANT ALL ON FUNCTION public._clamp(val numeric, lo numeric, hi numeric) TO authenticated;
GRANT ALL ON FUNCTION public._clamp(val numeric, lo numeric, hi numeric) TO service_role;


--
-- TOC entry 4667 (class 0 OID 0)
-- core: 488
-- Name: FUNCTION _require_admin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public._require_admin() TO anon;
GRANT ALL ON FUNCTION public._require_admin() TO authenticated;
GRANT ALL ON FUNCTION public._require_admin() TO service_role;


--
-- TOC entry 4668 (class 0 OID 0)
-- core: 544
-- Name: FUNCTION admin_add(p_user uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.admin_add(p_user uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_add(p_user uuid) TO anon;
GRANT ALL ON FUNCTION public.admin_add(p_user uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_add(p_user uuid) TO service_role;


--
-- TOC entry 4669 (class 0 OID 0)
-- core: 376
-- Name: TABLE markets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.markets TO anon;
GRANT ALL ON TABLE public.markets TO authenticated;
GRANT ALL ON TABLE public.markets TO service_role;


--
-- TOC entry 4670 (class 0 OID 0)
-- core: 476
-- Name: FUNCTION admin_create_market(p_question text, p_category text, p_tier text, p_end_date timestamp with time zone, p_closes_at timestamp with time zone, p_liquidity numeric, p_resolution_criteria text, p_resolution_source text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.admin_create_market(p_question text, p_category text, p_tier text, p_end_date timestamp with time zone, p_closes_at timestamp with time zone, p_liquidity numeric, p_resolution_criteria text, p_resolution_source text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_create_market(p_question text, p_category text, p_tier text, p_end_date timestamp with time zone, p_closes_at timestamp with time zone, p_liquidity numeric, p_resolution_criteria text, p_resolution_source text) TO anon;
GRANT ALL ON FUNCTION public.admin_create_market(p_question text, p_category text, p_tier text, p_end_date timestamp with time zone, p_closes_at timestamp with time zone, p_liquidity numeric, p_resolution_criteria text, p_resolution_source text) TO authenticated;
GRANT ALL ON FUNCTION public.admin_create_market(p_question text, p_category text, p_tier text, p_end_date timestamp with time zone, p_closes_at timestamp with time zone, p_liquidity numeric, p_resolution_criteria text, p_resolution_source text) TO service_role;


--
-- TOC entry 4671 (class 0 OID 0)
-- core: 577
-- Name: FUNCTION admin_list(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.admin_list() FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_list() TO anon;
GRANT ALL ON FUNCTION public.admin_list() TO authenticated;
GRANT ALL ON FUNCTION public.admin_list() TO service_role;


--
-- TOC entry 4672 (class 0 OID 0)
-- core: 474
-- Name: FUNCTION admin_remove(p_user uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.admin_remove(p_user uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_remove(p_user uuid) TO anon;
GRANT ALL ON FUNCTION public.admin_remove(p_user uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_remove(p_user uuid) TO service_role;


--
-- TOC entry 4673 (class 0 OID 0)
-- core: 466
-- Name: FUNCTION admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean) TO anon;
GRANT ALL ON FUNCTION public.admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean) TO authenticated;
GRANT ALL ON FUNCTION public.admin_resolve_market(p_market_id uuid, p_outcome text, p_auto_payout boolean) TO service_role;


--
-- TOC entry 4674 (class 0 OID 0)
-- core: 527
-- Name: FUNCTION comments_insert_rpc(p_market_id uuid, p_author text, p_body text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.comments_insert_rpc(p_market_id uuid, p_author text, p_body text) TO anon;
GRANT ALL ON FUNCTION public.comments_insert_rpc(p_market_id uuid, p_author text, p_body text) TO authenticated;
GRANT ALL ON FUNCTION public.comments_insert_rpc(p_market_id uuid, p_author text, p_body text) TO service_role;


--
-- TOC entry 4675 (class 0 OID 0)
-- core: 556
-- Name: FUNCTION ensure_user_for_position(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.ensure_user_for_position() TO anon;
GRANT ALL ON FUNCTION public.ensure_user_for_position() TO authenticated;
GRANT ALL ON FUNCTION public.ensure_user_for_position() TO service_role;


--
-- TOC entry 4676 (class 0 OID 0)
-- core: 375
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- TOC entry 4677 (class 0 OID 0)
-- core: 520
-- Name: FUNCTION get_or_create_user_by_pi(p_user_id uuid, p_username text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_or_create_user_by_pi(p_user_id uuid, p_username text) TO anon;
GRANT ALL ON FUNCTION public.get_or_create_user_by_pi(p_user_id uuid, p_username text) TO authenticated;
GRANT ALL ON FUNCTION public.get_or_create_user_by_pi(p_user_id uuid, p_username text) TO service_role;


--
-- TOC entry 4678 (class 0 OID 0)
-- core: 506
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO service_role;


--
-- TOC entry 4679 (class 0 OID 0)
-- core: 441
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO service_role;


--
-- TOC entry 4680 (class 0 OID 0)
-- core: 541
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO service_role;


--
-- TOC entry 4681 (class 0 OID 0)
-- core: 482
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO service_role;


--
-- TOC entry 4682 (class 0 OID 0)
-- core: 587
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO service_role;


--
-- TOC entry 4683 (class 0 OID 0)
-- core: 424
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO service_role;


--
-- TOC entry 4684 (class 0 OID 0)
-- core: 583
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO service_role;


--
-- TOC entry 4685 (class 0 OID 0)
-- core: 562
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO service_role;


--
-- TOC entry 4686 (class 0 OID 0)
-- core: 591
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO service_role;


--
-- TOC entry 4687 (class 0 OID 0)
-- core: 421
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO service_role;


--
-- TOC entry 4688 (class 0 OID 0)
-- core: 508
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO service_role;


--
-- TOC entry 4689 (class 0 OID 0)
-- core: 570
-- Name: FUNCTION gtrgm_same(public.gtrgm, public.gtrgm, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO service_role;


--
-- TOC entry 4690 (class 0 OID 0)
-- core: 507
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO service_role;


--
-- TOC entry 4691 (class 0 OID 0)
-- core: 472
-- Name: FUNCTION is_admin(uid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin(uid uuid) TO anon;
GRANT ALL ON FUNCTION public.is_admin(uid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_admin(uid uuid) TO service_role;


--
-- TOC entry 4692 (class 0 OID 0)
-- core: 585
-- Name: FUNCTION leaderboard_rollup(p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.leaderboard_rollup(p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.leaderboard_rollup(p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.leaderboard_rollup(p_limit integer, p_offset integer) TO service_role;


--
-- TOC entry 4693 (class 0 OID 0)
-- core: 480
-- Name: FUNCTION market_stats(p_market_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.market_stats(p_market_id uuid) TO anon;
GRANT ALL ON FUNCTION public.market_stats(p_market_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.market_stats(p_market_id uuid) TO service_role;


--
-- TOC entry 4694 (class 0 OID 0)
-- core: 560
-- Name: FUNCTION norm_handle(txt text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.norm_handle(txt text) TO anon;
GRANT ALL ON FUNCTION public.norm_handle(txt text) TO authenticated;
GRANT ALL ON FUNCTION public.norm_handle(txt text) TO service_role;


--
-- TOC entry 4695 (class 0 OID 0)
-- core: 557
-- Name: FUNCTION portfolio_closed_latest5(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.portfolio_closed_latest5() TO anon;
GRANT ALL ON FUNCTION public.portfolio_closed_latest5() TO authenticated;
GRANT ALL ON FUNCTION public.portfolio_closed_latest5() TO service_role;


--
-- TOC entry 4696 (class 0 OID 0)
-- core: 427
-- Name: FUNCTION portfolio_open_latest5(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.portfolio_open_latest5() TO anon;
GRANT ALL ON FUNCTION public.portfolio_open_latest5() TO authenticated;
GRANT ALL ON FUNCTION public.portfolio_open_latest5() TO service_role;


--
-- TOC entry 4697 (class 0 OID 0)
-- core: 495
-- Name: FUNCTION portfolio_totals_me(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.portfolio_totals_me() FROM PUBLIC;
GRANT ALL ON FUNCTION public.portfolio_totals_me() TO anon;
GRANT ALL ON FUNCTION public.portfolio_totals_me() TO authenticated;
GRANT ALL ON FUNCTION public.portfolio_totals_me() TO service_role;


--
-- TOC entry 4698 (class 0 OID 0)
-- core: 510
-- Name: FUNCTION portfolio_unclaimed(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.portfolio_unclaimed() TO anon;
GRANT ALL ON FUNCTION public.portfolio_unclaimed() TO authenticated;
GRANT ALL ON FUNCTION public.portfolio_unclaimed() TO service_role;


--
-- TOC entry 4699 (class 0 OID 0)
-- core: 531
-- Name: FUNCTION positions_after_insert(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.positions_after_insert() TO anon;
GRANT ALL ON FUNCTION public.positions_after_insert() TO authenticated;
GRANT ALL ON FUNCTION public.positions_after_insert() TO service_role;


--
-- TOC entry 4700 (class 0 OID 0)
-- core: 567
-- Name: FUNCTION refresh_mv_leaderboard(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.refresh_mv_leaderboard() TO anon;
GRANT ALL ON FUNCTION public.refresh_mv_leaderboard() TO authenticated;
GRANT ALL ON FUNCTION public.refresh_mv_leaderboard() TO service_role;


--
-- TOC entry 4701 (class 0 OID 0)
-- core: 379
-- Name: TABLE trades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trades TO anon;
GRANT ALL ON TABLE public.trades TO authenticated;
GRANT ALL ON TABLE public.trades TO service_role;


--
-- TOC entry 4702 (class 0 OID 0)
-- core: 470
-- Name: FUNCTION sell_position(p_position_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sell_position(p_position_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sell_position(p_position_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sell_position(p_position_id uuid, p_user_id uuid) TO service_role;


--
-- TOC entry 4703 (class 0 OID 0)
-- core: 533
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.set_limit(real) TO postgres;
GRANT ALL ON FUNCTION public.set_limit(real) TO anon;
GRANT ALL ON FUNCTION public.set_limit(real) TO authenticated;
GRANT ALL ON FUNCTION public.set_limit(real) TO service_role;


--
-- TOC entry 4704 (class 0 OID 0)
-- core: 509
-- Name: FUNCTION show_limit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_limit() TO postgres;
GRANT ALL ON FUNCTION public.show_limit() TO anon;
GRANT ALL ON FUNCTION public.show_limit() TO authenticated;
GRANT ALL ON FUNCTION public.show_limit() TO service_role;


--
-- TOC entry 4705 (class 0 OID 0)
-- core: 543
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_trgm(text) TO postgres;
GRANT ALL ON FUNCTION public.show_trgm(text) TO anon;
GRANT ALL ON FUNCTION public.show_trgm(text) TO authenticated;
GRANT ALL ON FUNCTION public.show_trgm(text) TO service_role;


--
-- TOC entry 4706 (class 0 OID 0)
-- core: 444
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity(text, text) TO service_role;


--
-- TOC entry 4707 (class 0 OID 0)
-- core: 418
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO service_role;


--
-- TOC entry 4708 (class 0 OID 0)
-- core: 499
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO service_role;


--
-- TOC entry 4709 (class 0 OID 0)
-- core: 547
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO service_role;


--
-- TOC entry 4710 (class 0 OID 0)
-- core: 448
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO service_role;


--
-- TOC entry 4711 (class 0 OID 0)
-- core: 456
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- TOC entry 4712 (class 0 OID 0)
-- core: 536
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO service_role;


--
-- TOC entry 4713 (class 0 OID 0)
-- core: 545
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO service_role;


--
-- TOC entry 4714 (class 0 OID 0)
-- core: 467
-- Name: FUNCTION testers_username_normalize_trg_fn(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.testers_username_normalize_trg_fn() TO anon;
GRANT ALL ON FUNCTION public.testers_username_normalize_trg_fn() TO authenticated;
GRANT ALL ON FUNCTION public.testers_username_normalize_trg_fn() TO service_role;


--
-- TOC entry 4715 (class 0 OID 0)
-- core: 492
-- Name: FUNCTION trade_sell_full(p_market_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trade_sell_full(p_market_id uuid) TO anon;
GRANT ALL ON FUNCTION public.trade_sell_full(p_market_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.trade_sell_full(p_market_id uuid) TO service_role;


--
-- TOC entry 4716 (class 0 OID 0)
-- core: 491
-- Name: FUNCTION trades_apply_fee(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trades_apply_fee() TO anon;
GRANT ALL ON FUNCTION public.trades_apply_fee() TO authenticated;
GRANT ALL ON FUNCTION public.trades_apply_fee() TO service_role;


--
-- TOC entry 4717 (class 0 OID 0)
-- core: 454
-- Name: FUNCTION trades_autovalidate(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trades_autovalidate() TO anon;
GRANT ALL ON FUNCTION public.trades_autovalidate() TO authenticated;
GRANT ALL ON FUNCTION public.trades_autovalidate() TO service_role;


--
-- TOC entry 4718 (class 0 OID 0)
-- core: 440
-- Name: FUNCTION trg_trades_to_history(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trg_trades_to_history() TO anon;
GRANT ALL ON FUNCTION public.trg_trades_to_history() TO authenticated;
GRANT ALL ON FUNCTION public.trg_trades_to_history() TO service_role;


--
-- TOC entry 4719 (class 0 OID 0)
-- core: 528
-- Name: FUNCTION users_autofill_handle_norm(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.users_autofill_handle_norm() TO anon;
GRANT ALL ON FUNCTION public.users_autofill_handle_norm() TO authenticated;
GRANT ALL ON FUNCTION public.users_autofill_handle_norm() TO service_role;


--
-- TOC entry 4720 (class 0 OID 0)
-- core: 546
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO service_role;


--
-- TOC entry 4721 (class 0 OID 0)
-- core: 442
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO service_role;


--
-- TOC entry 4722 (class 0 OID 0)
-- core: 452
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- TOC entry 4723 (class 0 OID 0)
-- core: 582
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO service_role;


--
-- TOC entry 4724 (class 0 OID 0)
-- core: 580
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO service_role;


--
-- TOC entry 4725 (class 0 OID 0)
-- core: 433
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- TOC entry 4726 (class 0 OID 0)
-- core: 465
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- TOC entry 4727 (class 0 OID 0)
-- core: 505
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- TOC entry 4728 (class 0 OID 0)
-- core: 512
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- TOC entry 4729 (class 0 OID 0)
-- core: 559
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- TOC entry 4730 (class 0 OID 0)
-- core: 588
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- TOC entry 4731 (class 0 OID 0)
-- core: 515
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- TOC entry 4732 (class 0 OID 0)
-- core: 540
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- TOC entry 4733 (class 0 OID 0)
-- core: 455
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- TOC entry 4734 (class 0 OID 0)
-- core: 487
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- TOC entry 4735 (class 0 OID 0)
-- core: 459
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- TOC entry 4736 (class 0 OID 0)
-- core: 484
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- TOC entry 4737 (class 0 OID 0)
-- core: 554
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- TOC entry 4738 (class 0 OID 0)
-- core: 450
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 4739 (class 0 OID 0)
-- core: 566
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 4741 (class 0 OID 0)
-- core: 347
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- TOC entry 4743 (class 0 OID 0)
-- core: 364
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- TOC entry 4746 (class 0 OID 0)
-- core: 355
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- TOC entry 4748 (class 0 OID 0)
-- core: 346
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- TOC entry 4750 (class 0 OID 0)
-- core: 359
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- TOC entry 4752 (class 0 OID 0)
-- core: 358
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- TOC entry 4755 (class 0 OID 0)
-- core: 357
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- TOC entry 4756 (class 0 OID 0)
-- core: 408
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- TOC entry 4757 (class 0 OID 0)
-- core: 386
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- TOC entry 4758 (class 0 OID 0)
-- core: 409
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- TOC entry 4759 (class 0 OID 0)
-- core: 365
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- TOC entry 4761 (class 0 OID 0)
-- core: 345
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- TOC entry 4763 (class 0 OID 0)
-- core: 344
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- TOC entry 4765 (class 0 OID 0)
-- core: 362
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- TOC entry 4767 (class 0 OID 0)
-- core: 363
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- TOC entry 4773 (class 0 OID 0)
-- core: 356
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- TOC entry 4775 (class 0 OID 0)
-- core: 361
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- TOC entry 4778 (class 0 OID 0)
-- core: 360
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- TOC entry 4781 (class 0 OID 0)
-- core: 343
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- TOC entry 4782 (class 0 OID 0)
-- core: 342
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- TOC entry 4783 (class 0 OID 0)
-- core: 341
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- TOC entry 4784 (class 0 OID 0)
-- core: 387
-- Name: TABLE admin_audit; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_audit TO anon;
GRANT ALL ON TABLE public.admin_audit TO authenticated;
GRANT ALL ON TABLE public.admin_audit TO service_role;


--
-- TOC entry 4785 (class 0 OID 0)
-- core: 380
-- Name: TABLE admins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admins TO anon;
GRANT ALL ON TABLE public.admins TO authenticated;
GRANT ALL ON TABLE public.admins TO service_role;


--
-- TOC entry 4786 (class 0 OID 0)
-- core: 384
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;


--
-- TOC entry 4787 (class 0 OID 0)
-- core: 399
-- Name: TABLE comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.comments TO anon;
GRANT ALL ON TABLE public.comments TO authenticated;
GRANT ALL ON TABLE public.comments TO service_role;


--
-- TOC entry 4788 (class 0 OID 0)
-- core: 410
-- Name: TABLE leaderboards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leaderboards TO anon;
GRANT ALL ON TABLE public.leaderboards TO authenticated;
GRANT ALL ON TABLE public.leaderboards TO service_role;


--
-- TOC entry 4789 (class 0 OID 0)
-- core: 406
-- Name: TABLE market_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.market_comments TO anon;
GRANT ALL ON TABLE public.market_comments TO authenticated;
GRANT ALL ON TABLE public.market_comments TO service_role;


--
-- TOC entry 4791 (class 0 OID 0)
-- core: 405
-- Name: SEQUENCE market_comments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.market_comments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.market_comments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.market_comments_id_seq TO service_role;


--
-- TOC entry 4792 (class 0 OID 0)
-- core: 404
-- Name: TABLE market_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.market_history TO anon;
GRANT ALL ON TABLE public.market_history TO authenticated;
GRANT ALL ON TABLE public.market_history TO service_role;


--
-- TOC entry 4794 (class 0 OID 0)
-- core: 403
-- Name: SEQUENCE market_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.market_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.market_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.market_history_id_seq TO service_role;


--
-- TOC entry 4795 (class 0 OID 0)
-- core: 402
-- Name: TABLE market_price_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.market_price_history TO anon;
GRANT ALL ON TABLE public.market_price_history TO authenticated;
GRANT ALL ON TABLE public.market_price_history TO service_role;


--
-- TOC entry 4796 (class 0 OID 0)
-- core: 390
-- Name: TABLE valid_trades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.valid_trades TO anon;
GRANT ALL ON TABLE public.valid_trades TO authenticated;
GRANT ALL ON TABLE public.valid_trades TO service_role;


--
-- TOC entry 4797 (class 0 OID 0)
-- core: 400
-- Name: TABLE v_leaderboard; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_leaderboard TO anon;
GRANT ALL ON TABLE public.v_leaderboard TO authenticated;
GRANT ALL ON TABLE public.v_leaderboard TO service_role;


--
-- TOC entry 4798 (class 0 OID 0)
-- core: 401
-- Name: TABLE mv_leaderboard; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mv_leaderboard TO anon;
GRANT ALL ON TABLE public.mv_leaderboard TO authenticated;
GRANT ALL ON TABLE public.mv_leaderboard TO service_role;


--
-- TOC entry 4800 (class 0 OID 0)
-- core: 377
-- Name: TABLE positions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.positions TO anon;
GRANT ALL ON TABLE public.positions TO authenticated;
GRANT ALL ON TABLE public.positions TO service_role;


--
-- TOC entry 4801 (class 0 OID 0)
-- core: 378
-- Name: TABLE referrals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.referrals TO anon;
GRANT ALL ON TABLE public.referrals TO authenticated;
GRANT ALL ON TABLE public.referrals TO service_role;


--
-- TOC entry 4802 (class 0 OID 0)
-- core: 385
-- Name: TABLE suggestions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.suggestions TO anon;
GRANT ALL ON TABLE public.suggestions TO authenticated;
GRANT ALL ON TABLE public.suggestions TO service_role;


--
-- TOC entry 4803 (class 0 OID 0)
-- core: 414
-- Name: TABLE tester_whitelist; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tester_whitelist TO anon;
GRANT ALL ON TABLE public.tester_whitelist TO authenticated;
GRANT ALL ON TABLE public.tester_whitelist TO service_role;


--
-- TOC entry 4804 (class 0 OID 0)
-- core: 411
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- TOC entry 4805 (class 0 OID 0)
-- core: 407
-- Name: TABLE v_latest_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_latest_history TO anon;
GRANT ALL ON TABLE public.v_latest_history TO authenticated;
GRANT ALL ON TABLE public.v_latest_history TO service_role;


--
-- TOC entry 4806 (class 0 OID 0)
-- core: 415
-- Name: TABLE v_market_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_market_snapshots TO anon;
GRANT ALL ON TABLE public.v_market_snapshots TO authenticated;
GRANT ALL ON TABLE public.v_market_snapshots TO service_role;


--
-- TOC entry 4807 (class 0 OID 0)
-- core: 392
-- Name: TABLE v_market_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_market_stats TO anon;
GRANT ALL ON TABLE public.v_market_stats TO authenticated;
GRANT ALL ON TABLE public.v_market_stats TO service_role;


--
-- TOC entry 4808 (class 0 OID 0)
-- core: 383
-- Name: TABLE v_market_stats_v2; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_market_stats_v2 TO anon;
GRANT ALL ON TABLE public.v_market_stats_v2 TO authenticated;
GRANT ALL ON TABLE public.v_market_stats_v2 TO service_role;


--
-- TOC entry 4809 (class 0 OID 0)
-- core: 413
-- Name: TABLE v_market_volumes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_market_volumes TO anon;
GRANT ALL ON TABLE public.v_market_volumes TO authenticated;
GRANT ALL ON TABLE public.v_market_volumes TO service_role;


--
-- TOC entry 4810 (class 0 OID 0)
-- core: 412
-- Name: TABLE v_portfolio_open_markets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_portfolio_open_markets TO anon;
GRANT ALL ON TABLE public.v_portfolio_open_markets TO authenticated;
GRANT ALL ON TABLE public.v_portfolio_open_markets TO service_role;


--
-- TOC entry 4811 (class 0 OID 0)
-- core: 391
-- Name: TABLE v_portfolio_totals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_portfolio_totals TO anon;
GRANT ALL ON TABLE public.v_portfolio_totals TO authenticated;
GRANT ALL ON TABLE public.v_portfolio_totals TO service_role;


--
-- TOC entry 4812 (class 0 OID 0)
-- core: 393
-- Name: TABLE v_portfolio_unclaimed; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_portfolio_unclaimed TO anon;
GRANT ALL ON TABLE public.v_portfolio_unclaimed TO authenticated;
GRANT ALL ON TABLE public.v_portfolio_unclaimed TO service_role;


--
-- TOC entry 4813 (class 0 OID 0)
-- core: 374
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- TOC entry 4814 (class 0 OID 0)
-- core: 388
-- Name: TABLE messages_2025_09_06; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_06 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_06 TO dashboard_user;


--
-- TOC entry 4815 (class 0 OID 0)
-- core: 389
-- Name: TABLE messages_2025_09_07; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_07 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_07 TO dashboard_user;


--
-- TOC entry 4816 (class 0 OID 0)
-- core: 394
-- Name: TABLE messages_2025_09_08; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_08 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_08 TO dashboard_user;


--
-- TOC entry 4817 (class 0 OID 0)
-- core: 395
-- Name: TABLE messages_2025_09_09; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_09 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_09 TO dashboard_user;


--
-- TOC entry 4818 (class 0 OID 0)
-- core: 396
-- Name: TABLE messages_2025_09_10; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_10 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_10 TO dashboard_user;


--
-- TOC entry 4819 (class 0 OID 0)
-- core: 397
-- Name: TABLE messages_2025_09_11; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_11 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_11 TO dashboard_user;


--
-- TOC entry 4820 (class 0 OID 0)
-- core: 398
-- Name: TABLE messages_2025_09_12; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_09_12 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_09_12 TO dashboard_user;


--
-- TOC entry 4821 (class 0 OID 0)
-- core: 366
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- TOC entry 4822 (class 0 OID 0)
-- core: 371
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- TOC entry 4823 (class 0 OID 0)
-- core: 370
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- TOC entry 4825 (class 0 OID 0)
-- core: 349
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- TOC entry 4826 (class 0 OID 0)
-- core: 382
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- TOC entry 4828 (class 0 OID 0)
-- core: 350
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- TOC entry 4829 (class 0 OID 0)
-- core: 381
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- TOC entry 4830 (class 0 OID 0)
-- core: 367
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- TOC entry 4831 (class 0 OID 0)
-- core: 368
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- TOC entry 4832 (class 0 OID 0)
-- core: 352
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- TOC entry 4833 (class 0 OID 0)
-- core: 353
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- TOC entry 2677 (class 826 OID 16601)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2678 (class 826 OID 16602)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2676 (class 826 OID 16600)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2687 (class 826 OID 16680)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2686 (class 826 OID 16679)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- TOC entry 2685 (class 826 OID 16678)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2690 (class 826 OID 16635)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2689 (class 826 OID 16634)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2688 (class 826 OID 16633)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2682 (class 826 OID 16615)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2684 (class 826 OID 16614)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2683 (class 826 OID 16613)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2669 (class 826 OID 16488)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2670 (class 826 OID 16489)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2668 (class 826 OID 16487)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2672 (class 826 OID 16491)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2667 (class 826 OID 16486)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2671 (class 826 OID 16490)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2680 (class 826 OID 16605)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2681 (class 826 OID 16606)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2679 (class 826 OID 16604)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2675 (class 826 OID 16543)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2674 (class 826 OID 16542)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2673 (class 826 OID 16541)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 3857 (class 3466 OID 16619)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- TOC entry 3862 (class 3466 OID 16698)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- TOC entry 3856 (class 3466 OID 16617)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- TOC entry 3863 (class 3466 OID 16701)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- TOC entry 3858 (class 3466 OID 16620)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- TOC entry 3859 (class 3466 OID 16621)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- TOC entry 4568 (class 0 OID 77137)
-- core: 401 4580
-- Name: mv_leaderboard; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.mv_leaderboard;


-- Completed on 2025-11-14 21:25:06

--
-- PostgreSQL database dump complete
--

