--
-- PostgreSQL database dump
--

\restrict TRcPQMFqhZtGOrU0F2CFj1p6mUM9QkMvCMzRCUVUIhKRHXgYu6YTO8aficg0l23

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION pg_cron; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: ambiente_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ambiente_enum AS ENUM (
    'producao',
    'homologacao'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user',
    'super_admin'
);


--
-- Name: erp_ambiente; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.erp_ambiente AS ENUM (
    'producao',
    'homologacao'
);


--
-- Name: erp_status_conexao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.erp_status_conexao AS ENUM (
    'conectado',
    'desconectado',
    'erro'
);


--
-- Name: erp_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.erp_tipo AS ENUM (
    'totvs_protheus',
    'sankhya',
    'dominio',
    'alterdata',
    'contabilista',
    'outro'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'pendente',
    'pago',
    'atrasado'
);


--
-- Name: nfse_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nfse_status_enum AS ENUM (
    'rascunho',
    'enviando',
    'autorizada',
    'rejeitada',
    'cancelada'
);


--
-- Name: open_banking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.open_banking_status AS ENUM (
    'ativo',
    'expirado',
    'revogado',
    'erro'
);


--
-- Name: open_banking_tipo_transacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.open_banking_tipo_transacao AS ENUM (
    'entrada',
    'saida'
);


--
-- Name: regime_tributario_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.regime_tributario_enum AS ENUM (
    'simples_nacional',
    'lucro_presumido',
    'lucro_real'
);


--
-- Name: shift_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.shift_type AS ENUM (
    'manha',
    'tarde',
    'integral'
);


--
-- Name: status_sincronizacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_sincronizacao AS ENUM (
    'pendente',
    'processando',
    'sucesso',
    'parcial',
    'erro'
);


--
-- Name: tenant_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tenant_status AS ENUM (
    'ativo',
    'bloqueado',
    'cancelado'
);


--
-- Name: tipo_debito_credito; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_debito_credito AS ENUM (
    'debito',
    'credito'
);


--
-- Name: tipo_lancamento_contabil; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_lancamento_contabil AS ENUM (
    'receita',
    'despesa',
    'transferencia',
    'imposto',
    'folha'
);


--
-- Name: tipo_operacao_sinc; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_operacao_sinc AS ENUM (
    'exportar_contas_pagar',
    'exportar_contas_receber',
    'exportar_caixa',
    'importar_lancamentos',
    'importar_saldo',
    'conciliar'
);


--
-- Name: tomador_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tomador_tipo_enum AS ENUM (
    'cpf',
    'cnpj'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
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


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
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


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
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


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
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


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
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


--
-- Name: admin_ativar_assinatura(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_ativar_assinatura(p_target_user_id uuid, p_dias integer DEFAULT 30) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  UPDATE public.assinaturas_mecanico
  SET
    status = 'ativo',
    assinatura_inicio = COALESCE(assinatura_inicio, now()),
    assinatura_vencimento = now() + (p_dias || ' days')::interval,
    proxima_cobranca = now() + (p_dias || ' days')::interval,
    ultimo_pagamento_id = COALESCE(ultimo_pagamento_id, 'admin_manual_' || now()::text)
  WHERE user_id = p_target_user_id;
END;
$$;


--
-- Name: admin_bloquear_assinatura(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_bloquear_assinatura(p_target_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  UPDATE public.assinaturas_mecanico
  SET
    status = 'vencido',
    assinatura_vencimento = now()
  WHERE user_id = p_target_user_id;
END;
$$;


--
-- Name: admin_listar_usuarios(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_listar_usuarios() RETURNS TABLE(user_id uuid, email text, nome text, status text, role text, trial_fim timestamp with time zone, assinatura_vencimento timestamp with time zone, proxima_cobranca timestamp with time zone, dias_restantes numeric, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  RETURN QUERY
  SELECT
    a.user_id,
    u.email::TEXT,
    (u.raw_user_meta_data->>'full_name')::TEXT AS nome,
    a.status,
    a.role,
    a.trial_fim,
    a.assinatura_vencimento,
    a.proxima_cobranca,
    CASE
      WHEN a.status = 'trial' THEN EXTRACT(DAY FROM (a.trial_fim - now()))
      WHEN a.status = 'ativo' THEN EXTRACT(DAY FROM (a.assinatura_vencimento - now()))
      ELSE 0
    END,
    a.created_at
  FROM public.assinaturas_mecanico a
  LEFT JOIN auth.users u ON a.user_id = u.id
  ORDER BY a.created_at DESC;
END;
$$;


--
-- Name: admin_renovar_trial(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_renovar_trial(p_target_user_id uuid, p_dias integer DEFAULT 5) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  UPDATE public.assinaturas_mecanico
  SET
    status = 'trial',
    trial_fim = now() + (p_dias || ' days')::interval
  WHERE user_id = p_target_user_id;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: assinaturas_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assinaturas_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'trial'::text NOT NULL,
    trial_inicio timestamp with time zone DEFAULT now() NOT NULL,
    trial_fim timestamp with time zone DEFAULT (now() + '5 days'::interval) NOT NULL,
    assinatura_inicio timestamp with time zone,
    assinatura_vencimento timestamp with time zone,
    valor_mensal numeric(10,2) DEFAULT 79.90 NOT NULL,
    ultimo_pagamento_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    proxima_cobranca timestamp with time zone,
    role text DEFAULT 'user'::text NOT NULL,
    CONSTRAINT assinaturas_mecanico_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text])))
);


--
-- Name: v_assinaturas_resumo_mecanico; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_assinaturas_resumo_mecanico AS
 SELECT a.id,
    a.user_id,
    u.email AS usuario_email,
    (u.raw_user_meta_data ->> 'full_name'::text) AS usuario_nome,
    a.status,
    a.role,
    a.trial_inicio,
    a.trial_fim,
    a.assinatura_inicio,
    a.assinatura_vencimento,
    a.proxima_cobranca,
    a.valor_mensal,
        CASE
            WHEN (a.status = 'trial'::text) THEN EXTRACT(day FROM (a.trial_fim - now()))
            WHEN (a.status = 'ativo'::text) THEN EXTRACT(day FROM (a.assinatura_vencimento - now()))
            ELSE (0)::numeric
        END AS dias_restantes,
    a.created_at,
    a.updated_at
   FROM (public.assinaturas_mecanico a
     LEFT JOIN auth.users u ON ((a.user_id = u.id)));


--
-- Name: admin_ver_assinaturas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_ver_assinaturas() RETURNS SETOF public.v_assinaturas_resumo_mecanico
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;
  RETURN QUERY SELECT * FROM public.v_assinaturas_resumo_mecanico;
END;
$$;


--
-- Name: atualizar_saldo_banco_conciliacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_saldo_banco_conciliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se conciliou um lançamento, atualizar status
    IF NEW.conciliado = true AND OLD.conciliado = false THEN
        -- Atualizar timestamp de conciliação
        NEW.data_conciliacao := NOW();
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: atualizar_status_conta_receber(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_status_conta_receber() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Atualizar status para vencido se passou a data e ainda está pendente
  IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'vencido';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: atualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: audit_transacoes_cartao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_transacoes_cartao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Extrair empresa_id
    v_empresa_id := COALESCE(NEW.empresa_id, OLD.empresa_id);

    INSERT INTO auditoria_transacoes_cartao (
        user_id,
        empresa_id,
        tabela,
        operacao,
        registro_id,
        dados_antigos,
        dados_novos
    ) VALUES (
        auth.uid(),
        v_empresa_id,
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN
            jsonb_build_object(
                'status', OLD.status,
                'valor_liquido', OLD.valor_liquido,
                'conciliado_com', OLD.conciliado_com,
                'numero_cartao_mascara', OLD.numero_cartao_mascara
            )
        ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN
            jsonb_build_object(
                'status', NEW.status,
                'valor_liquido', NEW.valor_liquido,
                'conciliado_com', NEW.conciliado_com,
                'numero_cartao_mascara', NEW.numero_cartao_mascara
            )
        ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_trigger_func() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_record_id text;
BEGIN
  -- Get user_id from the record
  IF TG_OP = 'DELETE' THEN
    v_user_id := (OLD).user_id;
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_record_id := (OLD).id::text;
  ELSIF TG_OP = 'INSERT' THEN
    v_user_id := (NEW).user_id;
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_record_id := (NEW).id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := (NEW).user_id;
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_record_id := (NEW).id::text;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (v_user_id, TG_OP, TG_TABLE_NAME, v_record_id, v_old, v_new);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: buscar_candidatos_cartao(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_candidatos_cartao(p_transacao_id uuid, p_empresa_id uuid) RETURNS TABLE(candidato_id uuid, candidato_tipo text, descricao text, valor numeric, data date, score numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_transacao RECORD;
    v_config JSONB;
    v_tolerancia_valor NUMERIC;
    v_tolerancia_dias INTEGER;
BEGIN
    -- Buscar dados da transação
    SELECT * INTO v_transacao FROM transacoes_cartao WHERE id = p_transacao_id;

    IF v_transacao IS NULL THEN
        RETURN;
    END IF;

    -- Buscar configurações
    SELECT criterios_conciliacao INTO v_config
    FROM configuracoes_cartao
    WHERE empresa_id = p_empresa_id;

    v_tolerancia_valor := COALESCE((v_config->>'tolerancia_valor')::NUMERIC, 0.50);
    v_tolerancia_dias := COALESCE((v_config->>'tolerancia_dias')::INTEGER, 2);

    -- Retornar contas a receber
    RETURN QUERY
    SELECT
        cr.id as candidato_id,
        'conta_receber'::TEXT as candidato_tipo,
        cr.descricao,
        cr.valor,
        COALESCE(cr.data_recebimento, cr.data_vencimento)::DATE as data,
        (
            -- Score baseado em valor líquido (50%)
            CASE
                WHEN ABS(cr.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
                WHEN ABS(cr.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
                ELSE 10
            END +
            -- Score baseado em data (30%)
            CASE
                WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_transacao.data_pagamento THEN 30
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
                ELSE 0
            END +
            -- Score baseado em tipo (sempre 10 para contas a receber)
            10
        )::NUMERIC as score
    FROM contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
        AND cr.status IN ('pendente', 'recebido')
        AND COALESCE(cr.data_recebimento, cr.data_vencimento) BETWEEN
            (v_transacao.data_pagamento - INTERVAL '3 days')::DATE
            AND (v_transacao.data_pagamento + INTERVAL '3 days')::DATE
        AND ABS(cr.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 5)
        AND cr.id NOT IN (
            SELECT conciliado_com FROM transacoes_cartao
            WHERE conciliado_com IS NOT NULL AND status = 'conciliado'
        )
    HAVING (
        CASE
            WHEN ABS(cr.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
            WHEN ABS(cr.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
            ELSE 10
        END +
        CASE
            WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_transacao.data_pagamento THEN 30
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
            ELSE 0
        END +
        10
    ) >= 40
    ORDER BY score DESC, ABS(cr.valor - v_transacao.valor_liquido) ASC
    LIMIT 10;

    -- Retornar lançamentos
    RETURN QUERY
    SELECT
        l.id as candidato_id,
        'lancamento'::TEXT as candidato_tipo,
        l.descricao,
        l.valor,
        l.data_lancamento::DATE as data,
        (
            CASE
                WHEN ABS(l.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
                WHEN ABS(l.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
                ELSE 10
            END +
            CASE
                WHEN l.data_lancamento = v_transacao.data_pagamento THEN 30
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
                ELSE 0
            END +
            CASE WHEN l.tipo = 'receita' THEN 10 ELSE 5 END
        )::NUMERIC as score
    FROM lancamentos_caixa l
    WHERE l.empresa_id = p_empresa_id
        AND l.data_lancamento BETWEEN
            (v_transacao.data_pagamento - INTERVAL '3 days')::DATE
            AND (v_transacao.data_pagamento + INTERVAL '3 days')::DATE
        AND ABS(l.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 5)
        AND l.id NOT IN (
            SELECT conciliado_com FROM transacoes_cartao
            WHERE conciliado_com IS NOT NULL AND status = 'conciliado'
        )
    HAVING (
        CASE
            WHEN ABS(l.valor - v_transacao.valor_liquido) < v_tolerancia_valor THEN 50
            WHEN ABS(l.valor - v_transacao.valor_liquido) < (v_tolerancia_valor * 2) THEN 30
            ELSE 10
        END +
        CASE
            WHEN l.data_lancamento = v_transacao.data_pagamento THEN 30
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_transacao.data_pagamento))) <= v_tolerancia_dias THEN 10
            ELSE 0
        END +
        CASE WHEN l.tipo = 'receita' THEN 10 ELSE 5 END
    ) >= 40
    ORDER BY score DESC, ABS(l.valor - v_transacao.valor_liquido) ASC
    LIMIT 10;
END;
$$;


--
-- Name: FUNCTION buscar_candidatos_cartao(p_transacao_id uuid, p_empresa_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_candidatos_cartao(p_transacao_id uuid, p_empresa_id uuid) IS 'Busca candidatos para conciliação de cartão com algoritmo de scoring. Agente: @agente-financeiro';


--
-- Name: buscar_candidatos_conciliacao(uuid, uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_candidatos_conciliacao(p_extrato_id uuid, p_empresa_id uuid, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date) RETURNS TABLE(candidato_id uuid, candidato_tipo text, descricao text, valor numeric, data date, score numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_extrato RECORD;
    v_data_range INT := 3; -- dias de tolerância
BEGIN
    -- Buscar dados do extrato
    SELECT * INTO v_extrato FROM extrato_bancario WHERE id = p_extrato_id;

    IF v_extrato IS NULL THEN
        RETURN;
    END IF;

    -- Definir range de datas
    IF p_data_inicio IS NULL THEN
        p_data_inicio := v_extrato.data_transacao - INTERVAL '3 days';
    END IF;
    IF p_data_fim IS NULL THEN
        p_data_fim := v_extrato.data_transacao + INTERVAL '3 days';
    END IF;

    -- Retornar lançamentos
    RETURN QUERY
    SELECT
        l.id as candidato_id,
        'lancamento'::TEXT as candidato_tipo,
        l.descricao,
        l.valor,
        l.data_lancamento::DATE as data,
        (
            -- Score baseado em valor (40%)
            CASE
                WHEN ABS(l.valor - v_extrato.valor) < 0.01 THEN 40
                WHEN ABS(l.valor - v_extrato.valor) < 1.0 THEN 25
                ELSE 0
            END +
            -- Score baseado em data (30%)
            CASE
                WHEN l.data_lancamento = v_extrato.data_transacao THEN 30
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 3 THEN 10
                ELSE 0
            END +
            -- Score baseado em tipo (10%)
            CASE WHEN l.tipo = v_extrato.tipo THEN 10 ELSE 0 END
        )::NUMERIC as score
    FROM lancamentos_caixa l
    WHERE l.empresa_id = p_empresa_id
        AND l.data_lancamento BETWEEN p_data_inicio AND p_data_fim
        AND l.tipo = v_extrato.tipo
        AND (
            ABS(l.valor - v_extrato.valor) < 0.01
            OR ABS(l.valor - v_extrato.valor) < 1.0
        )
        AND l.id NOT IN (
            SELECT lancamento_id FROM extrato_bancario
            WHERE lancamento_id IS NOT NULL AND conciliado = true
        )
    HAVING (
        CASE
            WHEN ABS(l.valor - v_extrato.valor) < 0.01 THEN 40
            WHEN ABS(l.valor - v_extrato.valor) < 1.0 THEN 25
            ELSE 0
        END +
        CASE
            WHEN l.data_lancamento = v_extrato.data_transacao THEN 30
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (l.data_lancamento - v_extrato.data_transacao))) <= 3 THEN 10
            ELSE 0
        END +
        CASE WHEN l.tipo = v_extrato.tipo THEN 10 ELSE 0 END
    ) >= 50
    ORDER BY score DESC
    LIMIT 10;

    -- Retornar contas a pagar
    RETURN QUERY
    SELECT
        cp.id as candidato_id,
        'conta_pagar'::TEXT as candidato_tipo,
        cp.descricao,
        cp.valor,
        COALESCE(cp.data_pagamento, cp.data_vencimento)::DATE as data,
        (
            CASE
                WHEN ABS(cp.valor - v_extrato.valor) < 0.01 THEN 40
                WHEN ABS(cp.valor - v_extrato.valor) < 1.0 THEN 25
                ELSE 0
            END +
            CASE
                WHEN COALESCE(cp.data_pagamento, cp.data_vencimento) = v_extrato.data_transacao THEN 30
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
                ELSE 0
            END +
            10 -- tipo sempre match para contas a pagar (saida)
        )::NUMERIC as score
    FROM contas_pagar cp
    WHERE cp.empresa_id = p_empresa_id
        AND cp.status IN ('pendente', 'pago')
        AND COALESCE(cp.data_pagamento, cp.data_vencimento) BETWEEN p_data_inicio AND p_data_fim
        AND v_extrato.tipo = 'saida'
        AND (
            ABS(cp.valor - v_extrato.valor) < 0.01
            OR ABS(cp.valor - v_extrato.valor) < 1.0
        )
        AND cp.id NOT IN (
            SELECT conta_pagar_id FROM extrato_bancario
            WHERE conta_pagar_id IS NOT NULL AND conciliado = true
        )
    HAVING (
        CASE
            WHEN ABS(cp.valor - v_extrato.valor) < 0.01 THEN 40
            WHEN ABS(cp.valor - v_extrato.valor) < 1.0 THEN 25
            ELSE 0
        END +
        CASE
            WHEN COALESCE(cp.data_pagamento, cp.data_vencimento) = v_extrato.data_transacao THEN 30
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cp.data_pagamento, cp.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
            ELSE 0
        END +
        10
    ) >= 50
    ORDER BY score DESC
    LIMIT 10;

    -- Retornar contas a receber
    RETURN QUERY
    SELECT
        cr.id as candidato_id,
        'conta_receber'::TEXT as candidato_tipo,
        cr.descricao,
        cr.valor,
        COALESCE(cr.data_recebimento, cr.data_vencimento)::DATE as data,
        (
            CASE
                WHEN ABS(cr.valor - v_extrato.valor) < 0.01 THEN 40
                WHEN ABS(cr.valor - v_extrato.valor) < 1.0 THEN 25
                ELSE 0
            END +
            CASE
                WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_extrato.data_transacao THEN 30
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
                WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
                ELSE 0
            END +
            10 -- tipo sempre match para contas a receber (entrada)
        )::NUMERIC as score
    FROM contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
        AND cr.status IN ('pendente', 'recebido')
        AND COALESCE(cr.data_recebimento, cr.data_vencimento) BETWEEN p_data_inicio AND p_data_fim
        AND v_extrato.tipo = 'entrada'
        AND (
            ABS(cr.valor - v_extrato.valor) < 0.01
            OR ABS(cr.valor - v_extrato.valor) < 1.0
        )
        AND cr.id NOT IN (
            SELECT conta_receber_id FROM extrato_bancario
            WHERE conta_receber_id IS NOT NULL AND conciliado = true
        )
    HAVING (
        CASE
            WHEN ABS(cr.valor - v_extrato.valor) < 0.01 THEN 40
            WHEN ABS(cr.valor - v_extrato.valor) < 1.0 THEN 25
            ELSE 0
        END +
        CASE
            WHEN COALESCE(cr.data_recebimento, cr.data_vencimento) = v_extrato.data_transacao THEN 30
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 1 THEN 20
            WHEN ABS(EXTRACT(DAY FROM (COALESCE(cr.data_recebimento, cr.data_vencimento) - v_extrato.data_transacao))) <= 3 THEN 10
            ELSE 0
        END +
        10
    ) >= 50
    ORDER BY score DESC
    LIMIT 10;
END;
$$;


--
-- Name: FUNCTION buscar_candidatos_conciliacao(p_extrato_id uuid, p_empresa_id uuid, p_data_inicio date, p_data_fim date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_candidatos_conciliacao(p_extrato_id uuid, p_empresa_id uuid, p_data_inicio date, p_data_fim date) IS 'Busca candidatos para conciliação com algoritmo de scoring. Agente: @agente-supabase';


--
-- Name: buscar_conta_plano(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscar_conta_plano(p_user_id uuid, p_empresa_id uuid, p_codigo text) RETURNS TABLE(id uuid, codigo_conta text, descricao text, tipo_conta text, natureza text, nivel integer, permite_lancamento boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.id,
        pc.codigo_conta,
        pc.descricao,
        pc.tipo_conta,
        pc.natureza,
        pc.nivel,
        pc.permite_lancamento
    FROM public.plano_contas pc
    WHERE pc.user_id = p_user_id
    AND (p_empresa_id IS NULL OR pc.empresa_id = p_empresa_id)
    AND pc.ativo = true
    AND (pc.codigo_conta = p_codigo OR pc.codigo_conta LIKE p_codigo || '%')
    ORDER BY pc.codigo_conta
    LIMIT 20;
END;
$$;


--
-- Name: FUNCTION buscar_conta_plano(p_user_id uuid, p_empresa_id uuid, p_codigo text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.buscar_conta_plano(p_user_id uuid, p_empresa_id uuid, p_codigo text) IS 'Busca contas no plano de contas por código com autocomplete';


--
-- Name: calcular_valor_liquido_cartao(numeric, character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_valor_liquido_cartao(p_valor_bruto numeric, p_bandeira character varying, p_empresa_id uuid) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_taxa NUMERIC;
BEGIN
    SELECT CASE p_bandeira
        WHEN 'visa' THEN taxa_visa
        WHEN 'mastercard' THEN taxa_mastercard
        WHEN 'elo' THEN taxa_elo
        WHEN 'amex' THEN taxa_amex
        WHEN 'hipercard' THEN taxa_hipercard
        ELSE taxa_outros
    END INTO v_taxa
    FROM configuracoes_cartao
    WHERE empresa_id = p_empresa_id;

    IF v_taxa IS NULL THEN
        v_taxa := 0.025; -- Taxa padrão 2.5%
    END IF;

    RETURN p_valor_bruto * (1 - v_taxa);
END;
$$;


--
-- Name: calcular_valores_nfse(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_valores_nfse() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_emitente RECORD;
BEGIN
    -- Obtém alíquota do emitente se não informada
    IF NEW.servico_aliquota IS NULL THEN
        SELECT aliquota_iss INTO NEW.servico_aliquota
        FROM nfs_e_emitentes
        WHERE id = NEW.emitente_id;
    END IF;

    -- Calcula base de cálculo
    NEW.servico_base_calculo := NEW.servico_valor - COALESCE(NEW.servico_deducoes, 0);

    -- Calcula ISS
    IF NEW.servico_iss_retido THEN
        NEW.servico_valor_iss := ROUND(NEW.servico_base_calculo * NEW.servico_aliquota / 100, 2);
    ELSE
        NEW.servico_valor_iss := 0;
    END IF;

    -- Calcula valor líquido
    NEW.servico_valor_liquido := NEW.servico_base_calculo
        - NEW.servico_valor_iss
        - COALESCE(NEW.retencoes_pis, 0)
        - COALESCE(NEW.retencoes_cofins, 0)
        - COALESCE(NEW.retencoes_inss, 0)
        - COALESCE(NEW.retencoes_ir, 0)
        - COALESCE(NEW.retencoes_csll, 0);

    RETURN NEW;
END;
$$;


--
-- Name: check_invoice_overdue(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_invoice_overdue() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'atrasado';
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: check_upload_rate_limit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_upload_rate_limit(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT * INTO v_record FROM rate_limit_uploads WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO rate_limit_uploads (user_id, count, reset_at)
        VALUES (p_user_id, 1, NOW() + INTERVAL '1 hour');
        RETURN TRUE;
    END IF;

    IF NOW() > v_record.reset_at THEN
        UPDATE rate_limit_uploads
        SET count = 1, reset_at = NOW() + INTERVAL '1 hour'
        WHERE user_id = p_user_id;
        RETURN TRUE;
    END IF;

    IF v_record.count >= 100 THEN
        RETURN FALSE;
    END IF;

    UPDATE rate_limit_uploads
    SET count = count + 1
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$;


--
-- Name: FUNCTION check_upload_rate_limit(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_upload_rate_limit(p_user_id uuid) IS 'Verifica e atualiza rate limiting para uploads (máx 100/hora)';


--
-- Name: conciliar_lancamento(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.conciliar_lancamento(p_lancamento_importado_id uuid, p_lancamento_caixa_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.contabilidade_lancamentos_importados
    SET
        conciliado = true,
        lancamento_financeiro_vinculado_id = p_lancamento_caixa_id
    WHERE id = p_lancamento_importado_id
      AND user_id = auth.uid();  -- Garantir RLS

    RETURN FOUND;
END;
$$;


--
-- Name: FUNCTION conciliar_lancamento(p_lancamento_importado_id uuid, p_lancamento_caixa_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.conciliar_lancamento(p_lancamento_importado_id uuid, p_lancamento_caixa_id uuid) IS 'Vincula um lancamento importado a um lancamento de caixa interno';


--
-- Name: create_invoice_for_new_student(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_invoice_for_new_student() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  ref_month date;
  due date;
BEGIN
  IF NEW.monthly_fee IS NULL OR NEW.monthly_fee <= 0 OR NEW.active = false THEN
    RETURN NEW;
  END IF;

  ref_month := date_trunc('month', CURRENT_DATE)::date;
  due := (date_trunc('month', CURRENT_DATE) + interval '9 days')::date;

  INSERT INTO public.invoices (student_id, reference_month, amount, due_date, status)
  VALUES (NEW.id, ref_month, NEW.monthly_fee, due, 'pendente')
  ON CONFLICT (student_id, reference_month) DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: create_trial_on_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_trial_on_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_trials (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;


--
-- Name: criar_assinatura_trial(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_assinatura_trial() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.assinaturas_mecanico (user_id, status, trial_inicio, trial_fim)
  VALUES (NEW.id, 'trial', now(), now() + interval '5 days')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;


--
-- Name: criar_comissao_os_concluida(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_comissao_os_concluida() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_percentual NUMERIC(5,2);
BEGIN
  -- Só processa quando o status muda para 'concluida'
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN
    -- Só cria comissão se houver funcionário vinculado
    IF NEW.funcionario_id IS NOT NULL THEN
      -- Busca percentual do funcionário (padrão 0 se nulo)
      SELECT COALESCE(comissao_percent, 0) INTO v_percentual
      FROM public.funcionarios_mecanico
      WHERE id = NEW.funcionario_id;

      -- Só insere se houver total_servicos > 0
      IF NEW.total_servicos > 0 THEN
        INSERT INTO public.comissoes_mecanico (
          user_id,
          funcionario_id,
          os_id,
          valor_total_servicos,
          percentual,
          valor_comissao
        ) VALUES (
          NEW.user_id,
          NEW.funcionario_id,
          NEW.id,
          NEW.total_servicos,
          v_percentual,
          ROUND(NEW.total_servicos * (v_percentual / 100), 2)
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: criar_empresa_padrao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_empresa_padrao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.empresas_mecanico (user_id, nome_fantasia)
  VALUES (NEW.user_id, 'Minha Oficina')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;


--
-- Name: criar_plano_contas_padrao(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_plano_contas_padrao(p_user_id uuid, p_empresa_id uuid DEFAULT NULL::uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER := 0;
    v_temp INTEGER;
BEGIN
    -- ATIVO (1)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '1', NULL, 1, 'sintetica', 'ativa', 'ATIVO', false),
    (p_user_id, p_empresa_id, '1.1', '1', 2, 'sintetica', 'ativa', 'Ativo Circulante', false),
    (p_user_id, p_empresa_id, '1.1.01', '1.1', 3, 'sintetica', 'ativa', 'Caixa e Equivalentes', false),
    (p_user_id, p_empresa_id, '1.1.01.0001', '1.1.01', 4, 'analitica', 'ativa', 'Caixa Geral', true),
    (p_user_id, p_empresa_id, '1.1.01.0002', '1.1.01', 4, 'analitica', 'ativa', 'Bancos Conta Movimento', true),
    (p_user_id, p_empresa_id, '1.1.02', '1.1', 3, 'sintetica', 'ativa', 'Contas a Receber', false),
    (p_user_id, p_empresa_id, '1.1.02.0001', '1.1.02', 4, 'analitica', 'ativa', 'Clientes', true),
    (p_user_id, p_empresa_id, '1.1.03', '1.1', 3, 'sintetica', 'ativa', 'Estoques', false),
    (p_user_id, p_empresa_id, '1.1.03.0001', '1.1.03', 4, 'analitica', 'ativa', 'Mercadorias', true),
    (p_user_id, p_empresa_id, '1.2', '1', 2, 'sintetica', 'ativa', 'Ativo Não Circulante', false),
    (p_user_id, p_empresa_id, '1.2.04', '1.2', 3, 'sintetica', 'ativa', 'Imobilizado', false),
    (p_user_id, p_empresa_id, '1.2.04.0001', '1.2.04', 4, 'analitica', 'ativa', 'Móveis e Utensílios', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    -- PASSIVO (2)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '2', NULL, 1, 'sintetica', 'passiva', 'PASSIVO', false),
    (p_user_id, p_empresa_id, '2.1', '2', 2, 'sintetica', 'passiva', 'Passivo Circulante', false),
    (p_user_id, p_empresa_id, '2.1.01', '2.1', 3, 'sintetica', 'passiva', 'Fornecedores', false),
    (p_user_id, p_empresa_id, '2.1.01.0001', '2.1.01', 4, 'analitica', 'passiva', 'Fornecedores Nacionais', true),
    (p_user_id, p_empresa_id, '2.1.03', '2.1', 3, 'sintetica', 'passiva', 'Obrigações Fiscais', false),
    (p_user_id, p_empresa_id, '2.1.03.0001', '2.1.03', 4, 'analitica', 'passiva', 'Impostos a Pagar', true),
    (p_user_id, p_empresa_id, '2.1.03.0002', '2.1.03', 4, 'analitica', 'passiva', 'ISS a Recolher', true),
    (p_user_id, p_empresa_id, '2.1.04', '2.1', 3, 'sintetica', 'passiva', 'Obrigações Trabalhistas', false),
    (p_user_id, p_empresa_id, '2.1.04.0001', '2.1.04', 4, 'analitica', 'passiva', 'Salários a Pagar', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    -- RECEITAS (3)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '3', NULL, 1, 'sintetica', 'receita', 'RECEITAS', false),
    (p_user_id, p_empresa_id, '3.1', '3', 2, 'sintetica', 'receita', 'Receitas Operacionais', false),
    (p_user_id, p_empresa_id, '3.1.01', '3.1', 3, 'sintetica', 'receita', 'Vendas', false),
    (p_user_id, p_empresa_id, '3.1.01.0001', '3.1.01', 4, 'analitica', 'receita', 'Vendas de Mercadorias', true),
    (p_user_id, p_empresa_id, '3.1.02', '3.1', 3, 'sintetica', 'receita', 'Serviços', false),
    (p_user_id, p_empresa_id, '3.1.02.0001', '3.1.02', 4, 'analitica', 'receita', 'Serviços Prestados', true),
    (p_user_id, p_empresa_id, '3.1.02.0002', '3.1.02', 4, 'analitica', 'receita', 'Consultoria', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    -- DESPESAS (4)
    INSERT INTO public.plano_contas (user_id, empresa_id, codigo_conta, codigo_pai, nivel, tipo_conta, natureza, descricao, permite_lancamento) VALUES
    (p_user_id, p_empresa_id, '4', NULL, 1, 'sintetica', 'despesa', 'DESPESAS', false),
    (p_user_id, p_empresa_id, '4.1', '4', 2, 'sintetica', 'despesa', 'Despesas Operacionais', false),
    (p_user_id, p_empresa_id, '4.1.01', '4.1', 3, 'sintetica', 'despesa', 'Pessoal', false),
    (p_user_id, p_empresa_id, '4.1.01.0001', '4.1.01', 4, 'analitica', 'despesa', 'Salários', true),
    (p_user_id, p_empresa_id, '4.1.01.0002', '4.1.01', 4, 'analitica', 'despesa', 'Encargos Sociais', true),
    (p_user_id, p_empresa_id, '4.1.02', '4.1', 3, 'sintetica', 'despesa', 'Despesas Administrativas', false),
    (p_user_id, p_empresa_id, '4.1.02.0001', '4.1.02', 4, 'analitica', 'despesa', 'Aluguel', true),
    (p_user_id, p_empresa_id, '4.1.02.0002', '4.1.02', 4, 'analitica', 'despesa', 'Energia', true),
    (p_user_id, p_empresa_id, '4.1.02.0003', '4.1.02', 4, 'analitica', 'despesa', 'Telefone', true);
    GET DIAGNOSTICS v_temp = ROW_COUNT;
    v_count := v_count + v_temp;

    RETURN v_count;
END;
$$;


--
-- Name: FUNCTION criar_plano_contas_padrao(p_user_id uuid, p_empresa_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.criar_plano_contas_padrao(p_user_id uuid, p_empresa_id uuid) IS 'Cria plano de contas padrão simplificado para o usuário';


--
-- Name: dashboard_funcionario_mecanico(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_funcionario_mecanico(p_user_id uuid, p_funcionario_id uuid) RETURNS TABLE(metric text, valor numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_os_mes INT;
  v_os_concluidas INT;
  v_comissao_acumulada NUMERIC;
BEGIN
  -- OS atribuídas no mês atual
  SELECT COUNT(*) INTO v_os_mes
  FROM public.ordens_servico_mecanico
  WHERE user_id = p_user_id
    AND funcionario_id = p_funcionario_id
    AND EXTRACT(MONTH FROM data_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM data_entrada) = EXTRACT(YEAR FROM CURRENT_DATE);

  -- OS concluídas
  SELECT COUNT(*) INTO v_os_concluidas
  FROM public.ordens_servico_mecanico
  WHERE user_id = p_user_id
    AND funcionario_id = p_funcionario_id
    AND status = 'concluida';

  -- Comissão acumulada (pendente + paga)
  SELECT COALESCE(SUM(valor_comissao), 0) INTO v_comissao_acumulada
  FROM public.comissoes_mecanico
  WHERE user_id = p_user_id
    AND funcionario_id = p_funcionario_id;

  RETURN QUERY
  SELECT 'os_mes'::TEXT, v_os_mes::NUMERIC
  UNION ALL
  SELECT 'os_concluidas'::TEXT, v_os_concluidas::NUMERIC
  UNION ALL
  SELECT 'comissao_acumulada'::TEXT, v_comissao_acumulada;
END;
$$;


--
-- Name: dashboard_funcionario_os_por_mes(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_funcionario_os_por_mes(p_user_id uuid, p_funcionario_id uuid, p_meses integer DEFAULT 6) RETURNS TABLE(mes text, ano integer, total_os integer, concluidas integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', os.data_entrada), 'Mon')::TEXT AS mes,
    EXTRACT(YEAR FROM os.data_entrada)::INT AS ano,
    COUNT(*)::INT AS total_os,
    COUNT(*) FILTER (WHERE os.status = 'concluida')::INT AS concluidas
  FROM public.ordens_servico_mecanico os
  WHERE os.user_id = p_user_id
    AND os.funcionario_id = p_funcionario_id
    AND os.data_entrada >= DATE_TRUNC('month', CURRENT_DATE - (p_meses || ' months')::INTERVAL)
  GROUP BY DATE_TRUNC('month', os.data_entrada)
  ORDER BY DATE_TRUNC('month', os.data_entrada);
END;
$$;


--
-- Name: finalizar_sincronizacao(uuid, public.status_sincronizacao, integer, integer, integer, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.finalizar_sincronizacao(p_sinc_id uuid, p_status public.status_sincronizacao, p_total_registros integer DEFAULT 0, p_registros_sucesso integer DEFAULT 0, p_registros_erro integer DEFAULT 0, p_resposta_erp jsonb DEFAULT NULL::jsonb, p_erros_detalhados jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE public.contabilidade_sincronizacao
    SET
        status = p_status,
        total_registros = p_total_registros,
        registros_sucesso = p_registros_sucesso,
        registros_erro = p_registros_erro,
        resposta_erp = p_resposta_erp,
        erros_detalhados = p_erros_detalhados,
        finalizado_em = now()
    WHERE id = p_sinc_id;
END;
$$;


--
-- Name: FUNCTION finalizar_sincronizacao(p_sinc_id uuid, p_status public.status_sincronizacao, p_total_registros integer, p_registros_sucesso integer, p_registros_erro integer, p_resposta_erp jsonb, p_erros_detalhados jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.finalizar_sincronizacao(p_sinc_id uuid, p_status public.status_sincronizacao, p_total_registros integer, p_registros_sucesso integer, p_registros_erro integer, p_resposta_erp jsonb, p_erros_detalhados jsonb) IS 'Finaliza uma sincronizacao com os resultados';


--
-- Name: gerar_mensagem_cobranca(text, numeric, date, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_mensagem_cobranca(p_cliente_nome text, p_valor numeric, p_data_vencimento date, p_dias_atraso integer, p_tipo text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
DECLARE
  v_mensagem TEXT;
  v_valor_fmt TEXT;
  v_data_fmt TEXT;
BEGIN
  v_valor_fmt := 'R$ ' || TO_CHAR(p_valor, 'FM999G999G999D99');
  v_data_fmt := TO_CHAR(p_data_vencimento, 'DD/MM/YYYY');

  CASE p_tipo
    WHEN 'lembrete' THEN
      IF p_dias_atraso < 0 THEN
        v_mensagem := format(
          'Olá %s, seu pagamento de %s vence em %s dia(s) (%s). Evite multas e mantenha seu crédito em dia!',
          p_cliente_nome, v_valor_fmt, ABS(p_dias_atraso), v_data_fmt
        );
      ELSE
        v_mensagem := format(
          'Olá %s, seu pagamento de %s vence hoje (%s). Regularize agora e evite multas!',
          p_cliente_nome, v_valor_fmt, v_data_fmt
        );
      END IF;

    WHEN 'cobranca' THEN
      v_mensagem := format(
        'Prezado %s, identificamos que sua fatura de %s, vencida em %s, está em atraso há %s dia(s). Solicitamos a regularização para evitar bloqueio.',
        p_cliente_nome, v_valor_fmt, v_data_fmt, p_dias_atraso
      );

    WHEN 'urgente' THEN
      v_mensagem := format(
        'URGENTE: %s, sua dívida de %s (venc. %s) está em atraso há %s dias. Entre em contato imediatamente para negociar e evitar protesto.',
        p_cliente_nome, v_valor_fmt, v_data_fmt, p_dias_atraso
      );

    WHEN 'bloqueio' THEN
      v_mensagem := format(
        '%s, seu cadastro será bloqueado devido à dívida de %s em atraso há %s dias. Entre em contato URGENTE para regularização.',
        p_cliente_nome, v_valor_fmt, p_dias_atraso
      );

    ELSE
      v_mensagem := format('Prezado %s, regularize seu pagamento de %s.', p_cliente_nome, v_valor_fmt);
  END CASE;

  RETURN v_mensagem;
END;
$_$;


--
-- Name: FUNCTION gerar_mensagem_cobranca(p_cliente_nome text, p_valor numeric, p_data_vencimento date, p_dias_atraso integer, p_tipo text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_mensagem_cobranca(p_cliente_nome text, p_valor numeric, p_data_vencimento date, p_dias_atraso integer, p_tipo text) IS 'Gera mensagem personalizada de cobrança. Agente: @agente-supabase';


--
-- Name: get_conciliacao_stats(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_conciliacao_stats(p_empresa_id uuid, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_stats JSON;
BEGIN
    IF p_data_inicio IS NULL THEN
        p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_data_fim IS NULL THEN
        p_data_fim := CURRENT_DATE;
    END IF;

    SELECT json_build_object(
        'total_extrato', COUNT(*),
        'conciliados', COUNT(*) FILTER (WHERE conciliado = true),
        'pendentes', COUNT(*) FILTER (WHERE conciliado = false),
        'taxa_conciliacao', ROUND(
            COUNT(*) FILTER (WHERE conciliado = true)::NUMERIC /
            NULLIF(COUNT(*), 0) * 100,
            2
        ),
        'entradas', json_build_object(
            'total', COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0),
            'conciliadas', COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada' AND conciliado = true), 0)
        ),
        'saidas', json_build_object(
            'total', COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0),
            'conciliadas', COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida' AND conciliado = true), 0)
        ),
        'por_banco', (
            SELECT json_agg(json_build_object(
                'banco_id', banco_cartao_id,
                'banco_nome', bc.nome,
                'total', COUNT(*),
                'conciliados', COUNT(*) FILTER (WHERE conciliado = true)
            ))
            FROM extrato_bancario eb
            LEFT JOIN bancos_cartoes bc ON bc.id = eb.banco_cartao_id
            WHERE eb.empresa_id = p_empresa_id
                AND eb.data_transacao BETWEEN p_data_inicio AND p_data_fim
            GROUP BY banco_cartao_id, bc.nome
        )
    ) INTO v_stats
    FROM extrato_bancario
    WHERE empresa_id = p_empresa_id
        AND data_transacao BETWEEN p_data_inicio AND p_data_fim;

    RETURN COALESCE(v_stats, '{}'::JSON);
END;
$$;


--
-- Name: FUNCTION get_conciliacao_stats(p_empresa_id uuid, p_data_inicio date, p_data_fim date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_conciliacao_stats(p_empresa_id uuid, p_data_inicio date, p_data_fim date) IS 'Retorna estatísticas de conciliação em formato JSON. Agente: @agente-supabase';


--
-- Name: get_contas_cobranca_pendentes(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_contas_cobranca_pendentes(p_user_id uuid, p_dias_atraso_min integer DEFAULT 0, p_dias_atraso_max integer DEFAULT 365) RETURNS TABLE(conta_id uuid, cliente_nome text, cliente_email text, valor numeric, data_vencimento date, dias_atraso integer, tipo_sugerido text, prioridade integer, score_cliente integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id as conta_id,
    c.nome as cliente_nome,
    c.email as cliente_email,
    cr.valor,
    cr.data_vencimento,
    GREATEST(0, CURRENT_DATE - cr.data_vencimento)::INT as dias_atraso,
    CASE
      WHEN cr.data_vencimento > CURRENT_DATE THEN 'lembrete'
      WHEN cr.data_vencimento = CURRENT_DATE THEN 'lembrete'
      WHEN CURRENT_DATE - cr.data_vencimento <= 5 THEN 'cobranca'
      WHEN CURRENT_DATE - cr.data_vencimento <= 15 THEN 'urgente'
      ELSE 'bloqueio'
    END::TEXT as tipo_sugerido,
    CASE
      WHEN cr.data_vencimento > CURRENT_DATE THEN 1
      WHEN cr.data_vencimento = CURRENT_DATE THEN 2
      WHEN CURRENT_DATE - cr.data_vencimento <= 5 THEN 3
      WHEN CURRENT_DATE - cr.data_vencimento <= 15 THEN 4
      ELSE 5
    END::INT as prioridade,
    COALESCE(
      (SELECT
        CASE
          WHEN COUNT(*) FILTER (WHERE status = 'recebido')::NUMERIC / NULLIF(COUNT(*), 0) * 100 > 80 THEN 80
          WHEN COUNT(*) FILTER (WHERE status = 'recebido')::NUMERIC / NULLIF(COUNT(*), 0) * 100 > 50 THEN 50
          ELSE 20
        END::INT
      FROM contas_receber cr2
      WHERE cr2.cliente_id = cr.cliente_id
    ), 50)::INT as score_cliente
  FROM contas_receber cr
  JOIN clientes c ON c.id = cr.cliente_id
  WHERE cr.user_id = p_user_id
    AND cr.status IN ('pendente', 'vencido')
    AND cr.data_vencimento >= CURRENT_DATE - p_dias_atraso_max
    AND cr.data_vencimento <= CURRENT_DATE + 7
    AND NOT EXISTS (
      SELECT 1 FROM cobranca_historico ch
      WHERE ch.conta_receber_id = cr.id
        AND ch.created_at > CURRENT_DATE - INTERVAL '3 days'
        AND ch.tipo IN ('lembrete', 'cobranca', 'urgente', 'bloqueio')
    )
  ORDER BY prioridade DESC, cr.data_vencimento ASC;
END;
$$;


--
-- Name: FUNCTION get_contas_cobranca_pendentes(p_user_id uuid, p_dias_atraso_min integer, p_dias_atraso_max integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_contas_cobranca_pendentes(p_user_id uuid, p_dias_atraso_min integer, p_dias_atraso_max integer) IS 'Retorna contas que precisam de cobrança com score e prioridade. Agente: @agente-supabase';


--
-- Name: get_empresa_padrao(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_empresa_padrao(p_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select empresa_id from public.usuario_empresas
  where user_id = p_user_id
  order by created_at asc
  limit 1;
$$;


--
-- Name: get_regua_cobranca_stats(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_regua_cobranca_stats(p_user_id uuid, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSON;
BEGIN
  IF p_data_inicio IS NULL THEN
    p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  IF p_data_fim IS NULL THEN
    p_data_fim := CURRENT_DATE;
  END IF;

  SELECT json_build_object(
    'total_devedores', COUNT(DISTINCT cr.cliente_id),
    'valor_vencido', COALESCE(SUM(cr.valor) FILTER (WHERE cr.status = 'vencido'), 0),
    'valor_pendente', COALESCE(SUM(cr.valor) FILTER (WHERE cr.status = 'pendente'), 0),
    'contas_vencidas', COUNT(*) FILTER (WHERE cr.status = 'vencido'),
    'contas_pendentes', COUNT(*) FILTER (WHERE cr.status = 'pendente'),
    'taxa_recuperacao', ROUND(
      COUNT(*) FILTER (WHERE cr.status = 'recebido')::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE cr.status IN ('recebido', 'vencido', 'pendente')), 0) * 100,
      2
    ),
    'cobrancas_enviadas', (
      SELECT COUNT(*) FROM cobranca_historico ch
      WHERE ch.user_id = p_user_id
        AND ch.created_at BETWEEN p_data_inicio AND p_data_fim
    ),
    'cobrancas_respondidas', (
      SELECT COUNT(*) FROM cobranca_historico ch
      WHERE ch.user_id = p_user_id
        AND ch.created_at BETWEEN p_data_inicio AND p_data_fim
        AND ch.status = 'respondido'
    ),
    'inadimplentes_criticos', (
      SELECT COUNT(DISTINCT cr2.cliente_id)
      FROM contas_receber cr2
      WHERE cr2.user_id = p_user_id
        AND cr2.status = 'vencido'
        AND cr2.data_vencimento < CURRENT_DATE - INTERVAL '30 days'
    ),
    'por_faixa_atraso', json_build_object(
      'ate_5_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento <= 5),
      '6_a_15_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento BETWEEN 6 AND 15),
      '16_a_30_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento BETWEEN 16 AND 30),
      'mais_30_dias', COUNT(*) FILTER (WHERE cr.status = 'vencido' AND CURRENT_DATE - cr.data_vencimento > 30)
    ),
    'por_canal', (
      SELECT json_agg(json_build_object(
        'canal', canal,
        'total', COUNT(*),
        'sucesso', COUNT(*) FILTER (WHERE status = 'respondido')
      ))
      FROM cobranca_historico ch
      WHERE ch.user_id = p_user_id
        AND ch.created_at BETWEEN p_data_inicio AND p_data_fim
      GROUP BY canal
    )
  ) INTO v_result
  FROM contas_receber cr
  WHERE cr.user_id = p_user_id
    AND cr.data_vencimento BETWEEN p_data_inicio AND p_data_fim + INTERVAL '30 days';

  RETURN COALESCE(v_result, '{}'::JSON);
END;
$$;


--
-- Name: FUNCTION get_regua_cobranca_stats(p_user_id uuid, p_data_inicio date, p_data_fim date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_regua_cobranca_stats(p_user_id uuid, p_data_inicio date, p_data_fim date) IS 'Estatísticas de performance da régua de cobrança. Agente: @agente-supabase';


--
-- Name: get_stats_cartao(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_stats_cartao(p_empresa_id uuid, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_stats JSON;
BEGIN
    IF p_data_inicio IS NULL THEN
        p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_data_fim IS NULL THEN
        p_data_fim := CURRENT_DATE;
    END IF;

    SELECT json_build_object(
        'total_transacoes', COUNT(*),
        'conciliados', COUNT(*) FILTER (WHERE status = 'conciliado'),
        'pendentes', COUNT(*) FILTER (WHERE status = 'pendente'),
        'divergentes', COUNT(*) FILTER (WHERE status = 'divergente'),
        'chargebacks', COUNT(*) FILTER (WHERE status = 'chargeback'),
        'taxa_conciliacao', ROUND(
            COUNT(*) FILTER (WHERE status = 'conciliado')::NUMERIC /
            NULLIF(COUNT(*), 0) * 100,
            2
        ),
        'valor_bruto_total', COALESCE(SUM(valor_bruto), 0),
        'valor_taxas_total', COALESCE(SUM(valor_taxa), 0),
        'valor_liquido_total', COALESCE(SUM(valor_liquido), 0),
        'por_bandeira', (
            SELECT json_agg(json_build_object(
                'bandeira', bandeira,
                'total', COUNT(*),
                'conciliados', COUNT(*) FILTER (WHERE status = 'conciliado'),
                'valor_total', COALESCE(SUM(valor_bruto), 0)
            ))
            FROM transacoes_cartao
            WHERE empresa_id = p_empresa_id
                AND data_transacao BETWEEN p_data_inicio AND p_data_fim
            GROUP BY bandeira
        )
    ) INTO v_stats
    FROM transacoes_cartao
    WHERE empresa_id = p_empresa_id
        AND data_transacao BETWEEN p_data_inicio AND p_data_fim;

    RETURN COALESCE(v_stats, '{}'::JSON);
END;
$$;


--
-- Name: FUNCTION get_stats_cartao(p_empresa_id uuid, p_data_inicio date, p_data_fim date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_stats_cartao(p_empresa_id uuid, p_data_inicio date, p_data_fim date) IS 'Retorna estatísticas de conciliação de cartões em formato JSON. Agente: @agente-analytics';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_count int;
  assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca impede o cadastro do usuario por falha em tabelas auxiliares.
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: historico_veiculo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.historico_veiculo(p_veiculo_id uuid) RETURNS TABLE(veiculo_id uuid, placa text, os_id uuid, numero integer, data_entrada timestamp with time zone, km_entrada integer, status text, itens jsonb, total numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS veiculo_id,
    v.placa,
    os.id AS os_id,
    os.numero,
    os.data_entrada,
    os.km_entrada,
    os.status,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'tipo', oi.tipo,
          'descricao', oi.descricao,
          'quantidade', oi.quantidade,
          'preco_unitario', oi.preco_unitario,
          'subtotal', oi.subtotal
        ) ORDER BY oi.tipo, oi.descricao
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::jsonb
    ) AS itens,
    os.total
  FROM public.veiculos_mecanico v
  INNER JOIN public.ordens_servico_mecanico os ON os.veiculo_id = v.id
  LEFT JOIN public.os_itens_mecanico oi ON oi.os_id = os.id
  WHERE v.id = p_veiculo_id
    AND v.user_id = auth.uid()
  GROUP BY v.id, v.placa, os.id, os.numero, os.data_entrada, os.km_entrada, os.status, os.total
  ORDER BY os.data_entrada DESC;
END;
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.assinaturas_mecanico
  WHERE user_id = p_user_id;
  RETURN v_role = 'admin';
END;
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;


--
-- Name: limpar_rascunhos_antigos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpar_rascunhos_antigos() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_removidos INTEGER;
BEGIN
    DELETE FROM nfs_e_rascunhos
    WHERE ultimo_autosave < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS v_removidos = ROW_COUNT;
    RETURN v_removidos;
END;
$$;


--
-- Name: mascarar_cnpj(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mascarar_cnpj(p_cnpj text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_cnpj_limpo TEXT;
BEGIN
    -- Remove caracteres não numéricos
    v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');

    -- Valida se tem 14 dígitos
    IF LENGTH(v_cnpj_limpo) != 14 THEN
        RETURN 'CNPJ INVÁLIDO';
    END IF;

    -- Mascara: ***.XXX.XXX/XX** (mostra apenas dígitos 4-11)
    RETURN '***.' ||
           SUBSTRING(v_cnpj_limpo, 3, 3) || '.' ||
           SUBSTRING(v_cnpj_limpo, 6, 3) || '/' ||
           SUBSTRING(v_cnpj_limpo, 9, 2) || '**';
END;
$$;


--
-- Name: FUNCTION mascarar_cnpj(p_cnpj text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.mascarar_cnpj(p_cnpj text) IS 'Mascara CNPJ exibindo apenas dígitos centrais: ***.XXX.XXX/XX**';


--
-- Name: mascarar_conta(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mascarar_conta(numero text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT '****' || RIGHT(numero, 4);
$$;


--
-- Name: mascarar_cpf(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mascarar_cpf(p_cpf text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_cpf_limpo TEXT;
BEGIN
    v_cpf_limpo := regexp_replace(p_cpf, '[^0-9]', '', 'g');

    IF LENGTH(v_cpf_limpo) != 11 THEN
        RETURN 'CPF INVÁLIDO';
    END IF;

    RETURN '***.' ||
           SUBSTRING(v_cpf_limpo, 4, 3) || '.' ||
           SUBSTRING(v_cpf_limpo, 7, 2) || '-**';
END;
$$;


--
-- Name: mascarar_credenciais(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mascarar_credenciais(p_credencial text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_len INTEGER;
BEGIN
    IF p_credencial IS NULL OR length(p_credencial) <= 8 THEN
        RETURN '****';
    END IF;

    v_len := length(p_credencial);
    RETURN substring(p_credencial, 1, 4) || '****' || substring(p_credencial, v_len - 3, 4);
END;
$$;


--
-- Name: FUNCTION mascarar_credenciais(p_credencial text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.mascarar_credenciais(p_credencial text) IS 'Mascara credenciais para exibicao (ex: API keys, tokens)';


--
-- Name: mask_card_number(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mask_card_number(card_number text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    IF card_number IS NULL OR LENGTH(card_number) < 4 THEN
        RETURN card_number;
    END IF;
    RETURN '****' || RIGHT(card_number, 4);
END;
$$;


--
-- Name: FUNCTION mask_card_number(card_number text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.mask_card_number(card_number text) IS 'Mascara número de cartão mostrando apenas os últimos 4 dígitos';


--
-- Name: notificar_assinaturas_proximo_vencimento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notificar_assinaturas_proximo_vencimento() RETURNS TABLE(user_id uuid, email text, dias_restantes integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.user_id,
    u.email,
    CASE
      WHEN a.status = 'ativo' THEN EXTRACT(DAY FROM (a.assinatura_vencimento - now()))::INT
      WHEN a.status = 'trial' THEN EXTRACT(DAY FROM (a.trial_fim - now()))::INT
      ELSE 0
    END as dias_restantes
  FROM public.assinaturas_mecanico a
  JOIN auth.users u ON a.user_id = u.id
  WHERE a.status IN ('ativo', 'trial')
    AND (
      (a.status = 'ativo' AND a.assinatura_vencimento BETWEEN now() AND now() + interval '3 days')
      OR (a.status = 'trial' AND a.trial_fim BETWEEN now() AND now() + interval '3 days')
    );
END;
$$;


--
-- Name: obter_mapeamento_contas(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_mapeamento_contas(p_config_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_object_agg(
        cm.categoria_id::text || '_' || cm.tipo_lancamento::text,
        jsonb_build_object(
            'conta_contabil', cm.conta_contabil_erp,
            'centro_custo', cm.centro_custo_erp,
            'historico', cm.historico_padrao
        )
    )
    INTO v_result
    FROM public.contabilidade_mapeamento_contas cm
    WHERE cm.config_id = p_config_id
      AND cm.ativo = true;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;


--
-- Name: FUNCTION obter_mapeamento_contas(p_config_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_mapeamento_contas(p_config_id uuid) IS 'Retorna mapa de categorias para contas contabeis do ERP em formato JSONB';


--
-- Name: obter_proximo_numero_nota(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_proximo_numero_nota(p_emitente_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_proximo_numero INTEGER;
BEGIN
    -- Bloqueia a linha e obtém o número atual
    SELECT proximo_numero_nota INTO v_proximo_numero
    FROM nfs_e_emitentes
    WHERE id = p_emitente_id
    FOR UPDATE;

    IF v_proximo_numero IS NULL THEN
        RAISE EXCEPTION 'Emitente não encontrado: %', p_emitente_id;
    END IF;

    -- Incrementa o contador
    UPDATE nfs_e_emitentes
    SET proximo_numero_nota = proximo_numero_nota + 1,
        updated_at = NOW()
    WHERE id = p_emitente_id;

    RETURN v_proximo_numero;
END;
$$;


--
-- Name: FUNCTION obter_proximo_numero_nota(p_emitente_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_proximo_numero_nota(p_emitente_id uuid) IS 'Retorna e incrementa o próximo número de nota fiscal para um emitente';


--
-- Name: obter_ultima_sincronizacao(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_ultima_sincronizacao(p_config_id uuid, p_tipo_operacao text DEFAULT NULL::text) RETURNS TABLE(id uuid, tipo_operacao public.tipo_operacao_sinc, status public.status_sincronizacao, periodo_inicio date, periodo_fim date, total_registros integer, registros_sucesso integer, registros_erro integer, finalizado_em timestamp with time zone, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.tipo_operacao,
        cs.status,
        cs.periodo_inicio,
        cs.periodo_fim,
        cs.total_registros,
        cs.registros_sucesso,
        cs.registros_erro,
        cs.finalizado_em,
        cs.created_at
    FROM public.contabilidade_sincronizacao cs
    WHERE cs.config_id = p_config_id
      AND (p_tipo_operacao IS NULL OR cs.tipo_operacao::text = p_tipo_operacao)
    ORDER BY cs.created_at DESC
    LIMIT 1;
END;
$$;


--
-- Name: FUNCTION obter_ultima_sincronizacao(p_config_id uuid, p_tipo_operacao text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_ultima_sincronizacao(p_config_id uuid, p_tipo_operacao text) IS 'Retorna a ultima sincronizacao de uma configuracao, opcionalmente filtrada por tipo';


--
-- Name: open_banking_consent_expirado(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.open_banking_consent_expirado(integracao_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  expira_em timestamptz;
BEGIN
  SELECT consent_expires_at INTO expira_em
  FROM public.open_banking_integracoes
  WHERE id = integracao_uuid;

  RETURN expira_em IS NULL OR expira_em <= now();
END;
$$;


--
-- Name: open_banking_registrar_log(uuid, uuid, character varying, character varying, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.open_banking_registrar_log(p_integracao_id uuid, p_user_id uuid, p_operacao character varying, p_status character varying, p_mensagem text DEFAULT NULL::text, p_detalhes jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.open_banking_logs (
    integracao_id,
    user_id,
    operacao,
    status,
    mensagem,
    detalhes
  ) VALUES (
    p_integracao_id,
    p_user_id,
    p_operacao,
    p_status,
    p_mensagem,
    p_detalhes
  );
END;
$$;


--
-- Name: open_banking_token_expirado(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.open_banking_token_expirado(integracao_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  expira_em timestamptz;
BEGIN
  SELECT token_expires_at INTO expira_em
  FROM public.open_banking_integracoes
  WHERE id = integracao_uuid;

  RETURN expira_em IS NULL OR expira_em <= now() + interval '5 minutes';
END;
$$;


--
-- Name: FUNCTION open_banking_token_expirado(integracao_uuid uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.open_banking_token_expirado(integracao_uuid uuid) IS 'Verifica se o token de uma integracao esta expirado ou prestes a expirar (5 minutos de margem)';


--
-- Name: refresh_card_dashboard(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_card_dashboard(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_empresa_id uuid;
  v_ano_atual int := extract(year from now());
  v_aliquota_cbs numeric;
  v_aliquota_ibs numeric;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM card_transacoes_brutas
    WHERE user_id = p_user_id LIMIT 1;

  SELECT aliquota_cbs, aliquota_ibs INTO v_aliquota_cbs, v_aliquota_ibs
    FROM card_aliquotas_reforma
    WHERE ano = v_ano_atual
    LIMIT 1;

  IF v_aliquota_cbs IS NULL THEN
    v_aliquota_cbs := 0;
    v_aliquota_ibs := 0;
  END IF;

  INSERT INTO card_dashboard_cache (
    user_id, empresa_id,
    total_bruto, total_liquido, total_taxas, total_transacoes,
    pendentes, conferidas, divergentes, chargebacks,
    split_cbs, split_ibs, split_liquido_projetado,
    atualizado_em
  )
  SELECT
    p_user_id, v_empresa_id,
    COALESCE(SUM(valor_bruto), 0),
    COALESCE(SUM(valor_liquido), 0),
    COALESCE(SUM(valor_taxa), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE status_auditoria = 'pendente'),
    COUNT(*) FILTER (WHERE status_auditoria = 'ok'),
    COUNT(*) FILTER (WHERE status_auditoria = 'divergente'),
    COUNT(*) FILTER (WHERE status_auditoria = 'chargeback'),
    COALESCE(SUM(valor_bruto * v_aliquota_cbs), 0),
    COALESCE(SUM(valor_bruto * v_aliquota_ibs), 0),
    COALESCE(SUM(valor_bruto - valor_bruto * taxa_mdr - valor_bruto * v_aliquota_cbs - valor_bruto * v_aliquota_ibs), 0),
    now()
  FROM card_transacoes_brutas
  WHERE user_id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_bruto = EXCLUDED.total_bruto,
    total_liquido = EXCLUDED.total_liquido,
    total_taxas = EXCLUDED.total_taxas,
    total_transacoes = EXCLUDED.total_transacoes,
    pendentes = EXCLUDED.pendentes,
    conferidas = EXCLUDED.conferidas,
    divergentes = EXCLUDED.divergentes,
    chargebacks = EXCLUDED.chargebacks,
    split_cbs = EXCLUDED.split_cbs,
    split_ibs = EXCLUDED.split_ibs,
    split_liquido_projetado = EXCLUDED.split_liquido_projetado,
    atualizado_em = now();
END;
$$;


--
-- Name: registrar_sincronizacao(uuid, uuid, public.tipo_operacao_sinc, date, date, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_sincronizacao(p_config_id uuid, p_user_id uuid, p_tipo_operacao public.tipo_operacao_sinc, p_periodo_inicio date, p_periodo_fim date, p_iniciado_por uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_sinc_id UUID;
BEGIN
    INSERT INTO public.contabilidade_sincronizacao (
        config_id,
        user_id,
        tipo_operacao,
        status,
        periodo_inicio,
        periodo_fim,
        iniciado_em,
        iniciado_por
    ) VALUES (
        p_config_id,
        p_user_id,
        p_tipo_operacao,
        'processando',
        p_periodo_inicio,
        p_periodo_fim,
        now(),
        COALESCE(p_iniciado_por, p_user_id)
    )
    RETURNING id INTO v_sinc_id;

    -- Atualizar ultima sincronizacao na config
    UPDATE public.contabilidade_erp_config
    SET ultima_sincronizacao = now(),
        status_conexao = 'conectado'
    WHERE id = p_config_id;

    RETURN v_sinc_id;
END;
$$;


--
-- Name: FUNCTION registrar_sincronizacao(p_config_id uuid, p_user_id uuid, p_tipo_operacao public.tipo_operacao_sinc, p_periodo_inicio date, p_periodo_fim date, p_iniciado_por uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.registrar_sincronizacao(p_config_id uuid, p_user_id uuid, p_tipo_operacao public.tipo_operacao_sinc, p_periodo_inicio date, p_periodo_fim date, p_iniciado_por uuid) IS 'Inicia uma nova sincronizacao e retorna o ID';


--
-- Name: relatorio_clientes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.relatorio_clientes(p_user_id uuid) RETURNS TABLE(cliente_id uuid, nome text, total_os integer, ticket_medio numeric, total_gasto numeric, ultima_visita text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS cliente_id,
    c.nome,
    COUNT(os.id)::INT AS total_os,
    COALESCE(AVG(os.total), 0)::NUMERIC AS ticket_medio,
    COALESCE(SUM(os.total), 0)::NUMERIC AS total_gasto,
    MAX(os.data_entrada)::TEXT AS ultima_visita
  FROM public.clientes_mecanico c
  LEFT JOIN public.ordens_servico_mecanico os
    ON os.cliente_id = c.id
    AND os.user_id = p_user_id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.nome
  ORDER BY ticket_medio DESC;
END;
$$;


--
-- Name: relatorio_estoque_abc(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.relatorio_estoque_abc(p_user_id uuid) RETURNS TABLE(peca_id uuid, codigo text, nome text, quantidade integer, preco_venda numeric, valor_total numeric, percentual numeric, percentual_acumulado numeric, classe text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      p.id AS peca_id,
      p.codigo,
      p.nome,
      p.quantidade::INT,
      p.preco_venda,
      (p.quantidade * p.preco_venda)::NUMERIC AS valor_total,
      (p.quantidade * p.preco_venda) / NULLIF(SUM(p.quantidade * p.preco_venda) OVER (), 0) * 100 AS percentual
    FROM public.pecas_mecanico p
    WHERE p.user_id = p_user_id
  ),
  acumulado AS (
    SELECT
      r.*,
      SUM(r.percentual) OVER (ORDER BY r.valor_total DESC) AS percentual_acumulado
    FROM ranked r
  )
  SELECT
    a.peca_id,
    a.codigo,
    a.nome,
    a.quantidade,
    a.preco_venda,
    a.valor_total,
    a.percentual,
    a.percentual_acumulado,
    CASE
      WHEN a.percentual_acumulado <= 80 THEN 'A'
      WHEN a.percentual_acumulado <= 95 THEN 'B'
      ELSE 'C'
    END::TEXT AS classe
  FROM acumulado a
  ORDER BY a.valor_total DESC;
END;
$$;


--
-- Name: relatorio_financeiro_categorias(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.relatorio_financeiro_categorias(p_user_id uuid, p_ano integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer, p_mes integer DEFAULT NULL::integer) RETURNS TABLE(tipo text, categoria text, total numeric, quantidade integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.tipo,
    COALESCE(f.categoria, 'Sem categoria')::TEXT AS categoria,
    SUM(f.valor)::NUMERIC AS total,
    COUNT(*)::INT AS quantidade
  FROM public.financeiro_mecanico f
  WHERE f.user_id = p_user_id
    AND EXTRACT(YEAR FROM f.data_vencimento) = p_ano
    AND (p_mes IS NULL OR EXTRACT(MONTH FROM f.data_vencimento) = p_mes)
    AND f.pago = true
  GROUP BY f.tipo, COALESCE(f.categoria, 'Sem categoria')
  ORDER BY total DESC;
END;
$$;


--
-- Name: relatorio_financeiro_mensal(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.relatorio_financeiro_mensal(p_user_id uuid, p_ano integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer) RETURNS TABLE(mes integer, nome_mes text, total_receitas numeric, total_despesas numeric, saldo numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH meses AS (
    SELECT generate_series(1, 12) AS mes
  ),
  agregado AS (
    SELECT
      EXTRACT(MONTH FROM f.data_vencimento)::INT AS mes,
      SUM(f.valor) FILTER (WHERE f.tipo = 'receita' AND f.pago = true) AS receitas,
      SUM(f.valor) FILTER (WHERE f.tipo = 'despesa' AND f.pago = true) AS despesas
    FROM public.financeiro_mecanico f
    WHERE f.user_id = p_user_id
      AND EXTRACT(YEAR FROM f.data_vencimento) = p_ano
    GROUP BY EXTRACT(MONTH FROM f.data_vencimento)
  )
  SELECT
    m.mes,
    TO_CHAR(TO_DATE(m.mes::TEXT, 'MM'), 'Mon')::TEXT AS nome_mes,
    COALESCE(a.receitas, 0)::NUMERIC AS total_receitas,
    COALESCE(a.despesas, 0)::NUMERIC AS total_despesas,
    (COALESCE(a.receitas, 0) - COALESCE(a.despesas, 0))::NUMERIC AS saldo
  FROM meses m
  LEFT JOIN agregado a ON a.mes = m.mes
  ORDER BY m.mes;
END;
$$;


--
-- Name: renovar_assinatura(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.renovar_assinatura(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.assinaturas_mecanico
  SET
    status = 'ativo',
    assinatura_inicio = COALESCE(assinatura_inicio, now()),
    assinatura_vencimento = now() + interval '30 days',
    proxima_cobranca = now() + interval '30 days',
    ultimo_pagamento_id = COALESCE(ultimo_pagamento_id, 'manual_' || now()::text)
  WHERE user_id = p_user_id;
END;
$$;


--
-- Name: seed_default_categories(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seed_default_categories(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only seed if user has no categories yet
  IF EXISTS (SELECT 1 FROM public.categorias WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, descricao) VALUES
    -- RECEITAS
    (p_user_id, '1.1 Receita com Serviços', 'receita', 'Receitas operacionais com prestação de serviços'),
    (p_user_id, '1.2 Receita com Vendas', 'receita', 'Receitas operacionais com vendas de produtos'),
    (p_user_id, '1.3 Receitas Financeiras', 'receita', 'Juros, rendimentos e aplicações financeiras'),
    (p_user_id, '1.4 Outras Receitas Operacionais', 'receita', 'Demais receitas operacionais'),
    (p_user_id, '1.5 Receitas não Operacionais', 'receita', 'Receitas extraordinárias e não operacionais'),

    -- DEDUÇÕES
    (p_user_id, '2.1 Impostos sobre Vendas', 'despesa', 'ISS, ICMS, PIS, COFINS e outros tributos sobre faturamento'),
    (p_user_id, '2.2 Outras Deduções', 'despesa', 'Devoluções, descontos concedidos e abatimentos'),

    -- CUSTOS VARIÁVEIS
    (p_user_id, '2.4 Custo de Mercadoria Vendida (CMV)', 'despesa', 'Custos diretos das mercadorias vendidas'),
    (p_user_id, '2.5 Custo de Serviço Prestado (CSP)', 'despesa', 'Custos diretos dos serviços prestados'),

    -- GASTOS COM PESSOAL
    (p_user_id, '2.3 Salários e Encargos', 'despesa', 'Folha de pagamento, FGTS, INSS, férias, 13º'),
    (p_user_id, '2.31 Benefícios', 'despesa', 'Vale transporte, vale alimentação, plano de saúde'),
    (p_user_id, '2.32 Pró-labore', 'despesa', 'Retirada dos sócios'),

    -- GASTOS COM MARKETING
    (p_user_id, '3.1 Marketing e Publicidade', 'despesa', 'Anúncios, campanhas, mídia digital e impressa'),
    (p_user_id, '3.12 Eventos e Patrocínios', 'despesa', 'Feiras, congressos e patrocínios'),

    -- GASTOS COM OCUPAÇÃO
    (p_user_id, '3.3 Aluguel', 'despesa', 'Aluguel de imóvel e condomínio'),
    (p_user_id, '3.33 Energia e Água', 'despesa', 'Contas de energia elétrica e água'),
    (p_user_id, '3.34 Internet e Telefone', 'despesa', 'Telecomunicações e internet'),
    (p_user_id, '3.35 Manutenção e Reparos', 'despesa', 'Manutenção predial e de equipamentos'),

    -- SERVIÇOS DE TERCEIROS
    (p_user_id, '3.30 Contabilidade', 'despesa', 'Serviços contábeis e assessoria fiscal'),
    (p_user_id, '3.31 Serviços de TI', 'despesa', 'Softwares, hospedagem e suporte técnico'),
    (p_user_id, '3.32 Consultoria e Assessoria', 'despesa', 'Consultorias diversas e assessoria jurídica'),

    -- MATERIAL DE ESCRITÓRIO
    (p_user_id, '3.311 Material de Escritório', 'despesa', 'Papelaria, suprimentos e materiais diversos'),

    -- GASTOS NÃO OPERACIONAIS
    (p_user_id, '3.4 Despesas Financeiras', 'despesa', 'Juros, tarifas bancárias, IOF e multas'),
    (p_user_id, '3.5 Depreciação e Amortização', 'despesa', 'Depreciação de ativos e amortização'),
    (p_user_id, '4.1 Perdas e Baixas', 'despesa', 'Perdas com inadimplência e baixas de ativos'),
    (p_user_id, '5.1 Outras Despesas não Operacionais', 'despesa', 'Despesas extraordinárias'),

    -- IR E CSLL
    (p_user_id, '2.107 Imposto de Renda', 'despesa', 'IRPJ - Imposto de Renda Pessoa Jurídica'),
    (p_user_id, '2.108 CSLL', 'despesa', 'Contribuição Social sobre o Lucro Líquido');
END;
$$;


--
-- Name: set_orcamento_numero(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_orcamento_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO NEW.numero
    FROM public.orcamentos_mecanico
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_os_numero(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_os_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO NEW.numero
    FROM public.ordens_servico_mecanico
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


--
-- Name: sincronizar_categorias_plano_contas(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sincronizar_categorias_plano_contas(p_user_id uuid, p_empresa_id uuid DEFAULT NULL::uuid) RETURNS SETOF jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_categoria RECORD;
  v_plano RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Para cada categoria sem vínculo, tentar encontrar conta analítica correspondente
  FOR v_categoria IN
    SELECT id, nome, tipo
    FROM public.categorias
    WHERE user_id = p_user_id
      AND plano_conta_id IS NULL
      AND ativo = true
  LOOP
    -- Buscar conta analítica que melhor corresponda pelo prefixo numérico do nome da categoria
    SELECT id, codigo_conta, descricao INTO v_plano
    FROM public.plano_contas
    WHERE user_id = p_user_id
      AND permite_lancamento = true
      AND ativo = true
      AND (
        -- Match por prefixo numérico (ex: "1.1 Receita com Serviços" -> código que começa com padrão similar)
        descricao ILIKE '%' || regexp_replace(v_categoria.nome, '^[0-9.]+ ', '') || '%'
        OR regexp_replace(v_categoria.nome, '^[0-9.]+ ', '') ILIKE '%' || descricao || '%'
      )
    ORDER BY
      CASE
        WHEN v_categoria.tipo = 'receita' AND natureza = 'receita' THEN 0
        WHEN v_categoria.tipo = 'despesa' AND natureza = 'despesa' THEN 0
        ELSE 1
      END,
      nivel DESC
    LIMIT 1;

    IF v_plano.id IS NOT NULL THEN
      UPDATE public.categorias
      SET plano_conta_id = v_plano.id, updated_at = now()
      WHERE id = v_categoria.id;

      v_count := v_count + 1;

      RETURN NEXT jsonb_build_object(
        'categoria_id', v_categoria.id,
        'categoria_nome', v_categoria.nome,
        'plano_conta_id', v_plano.id,
        'plano_conta_codigo', v_plano.codigo_conta,
        'plano_conta_descricao', v_plano.descricao
      );
    END IF;
  END LOOP;

  RETURN;
END;
$$;


--
-- Name: sugerir_conta_contabil(uuid, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sugerir_conta_contabil(p_user_id uuid, p_empresa_id uuid, p_categoria_id uuid, p_tipo_lancamento text) RETURNS TABLE(plano_conta_id uuid, codigo_conta text, descricao text, historico_padrao text, centro_custo text, confianca integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.plano_conta_id,
        pc.codigo_conta,
        pc.descricao,
        mc.historico_padrao,
        mc.centro_custo,
        CASE
            WHEN mc.ativo AND mc.automatico THEN 100
            WHEN mc.ativo THEN 80
            ELSE 50
        END::INTEGER as confianca
    FROM public.mapeamento_contabil mc
    JOIN public.plano_contas pc ON mc.plano_conta_id = pc.id
    WHERE mc.user_id = p_user_id
    AND (p_empresa_id IS NULL OR mc.empresa_id = p_empresa_id)
    AND mc.categoria_id = p_categoria_id
    AND mc.tipo_lancamento = p_tipo_lancamento
    AND mc.ativo = true
    ORDER BY confianca DESC
    LIMIT 1;
END;
$$;


--
-- Name: FUNCTION sugerir_conta_contabil(p_user_id uuid, p_empresa_id uuid, p_categoria_id uuid, p_tipo_lancamento text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sugerir_conta_contabil(p_user_id uuid, p_empresa_id uuid, p_categoria_id uuid, p_tipo_lancamento text) IS 'Sugere conta contábil baseada no mapeamento da categoria';


--
-- Name: sync_notas_fiscais_columns(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_notas_fiscais_columns() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.cliente_nome IS NULL AND NEW.cliente_razao_social IS NOT NULL THEN
    NEW.cliente_nome := NEW.cliente_razao_social;
  END IF;
  IF NEW.cliente_razao_social IS NULL AND NEW.cliente_nome IS NOT NULL THEN
    NEW.cliente_razao_social := NEW.cliente_nome;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_refresh_card_dashboard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_refresh_card_dashboard() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    PERFORM refresh_card_dashboard(COALESCE(NEW.user_id, OLD.user_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_certificado_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_certificado_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_nfse_rascunhos_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_nfse_rascunhos_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_plano_contas_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_plano_contas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validar_campos_obrigatorios(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_campos_obrigatorios(p_nota_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_nota RECORD;
    v_erros JSONB := '[]'::jsonb;
BEGIN
    -- Obtém a nota
    SELECT * INTO v_nota
    FROM nfs_e_notas
    WHERE id = p_nota_id;

    IF v_nota IS NULL THEN
        RETURN jsonb_build_object(
            'valido', false,
            'erros', '[{"campo": "nota", "mensagem": "Nota não encontrada"}]'::jsonb
        );
    END IF;

    -- Validações de campos obrigatórios
    IF v_nota.tomador_documento IS NULL OR v_nota.tomador_documento = '' THEN
        v_erros := v_erros || '{"campo": "tomador_documento", "mensagem": "Documento do tomador é obrigatório"}'::jsonb;
    END IF;

    IF v_nota.tomador_razao_social IS NULL OR v_nota.tomador_razao_social = '' THEN
        v_erros := v_erros || '{"campo": "tomador_razao_social", "mensagem": "Razão social do tomador é obrigatória"}'::jsonb;
    END IF;

    IF v_nota.servico_descricao IS NULL OR v_nota.servico_descricao = '' THEN
        v_erros := v_erros || '{"campo": "servico_descricao", "mensagem": "Descrição do serviço é obrigatória"}'::jsonb;
    END IF;

    IF v_nota.servico_valor IS NULL OR v_nota.servico_valor <= 0 THEN
        v_erros := v_erros || '{"campo": "servico_valor", "mensagem": "Valor do serviço deve ser maior que zero"}'::jsonb;
    END IF;

    IF v_nota.competencia IS NULL THEN
        v_erros := v_erros || '{"campo": "competencia", "mensagem": "Competência é obrigatória"}'::jsonb;
    END IF;

    -- Validação do endereço do tomador (se preenchido)
    IF v_nota.tomador_endereco IS NOT NULL AND v_nota.tomador_endereco != '{}'::jsonb THEN
        IF NOT (v_nota.tomador_endereco ? 'logradouro' AND
                v_nota.tomador_endereco ? 'numero' AND
                v_nota.tomador_endereco ? 'bairro' AND
                v_nota.tomador_endereco ? 'cidade' AND
                v_nota.tomador_endereco ? 'uf') THEN
            v_erros := v_erros || '{"campo": "tomador_endereco", "mensagem": "Endereço do tomador incompleto"}'::jsonb;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'valido', jsonb_array_length(v_erros) = 0,
        'erros', v_erros
    );
END;
$$;


--
-- Name: FUNCTION validar_campos_obrigatorios(p_nota_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_campos_obrigatorios(p_nota_id uuid) IS 'Valida campos obrigatórios de uma nota fiscal antes do envio';


--
-- Name: validar_configuracao_erp(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_configuracao_erp(p_config_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_config RECORD;
    v_erros TEXT[] := ARRAY[]::TEXT[];
    v_result JSONB;
    v_has_mapping BOOLEAN;
BEGIN
    -- Buscar configuracao
    SELECT * INTO v_config
    FROM public.contabilidade_erp_config
    WHERE id = p_config_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valido', false,
            'erros', ARRAY['Configuracao nao encontrada']
        );
    END IF;

    -- Validar campos obrigatorios
    IF v_config.api_url IS NULL OR v_config.api_url = '' THEN
        v_erros := array_append(v_erros, 'URL da API nao configurada');
    END IF;

    -- Validacoes especificas por tipo de ERP
    CASE v_config.erp_tipo
        WHEN 'totvs_protheus' THEN
            IF v_config.usuario IS NULL OR v_config.usuario = '' THEN
                v_erros := array_append(v_erros, 'Usuario TOTVS nao configurado');
            END IF;
            IF v_config.codigo_empresa_erp IS NULL OR v_config.codigo_empresa_erp = '' THEN
                v_erros := array_append(v_erros, 'Codigo da empresa TOTVS nao configurado');
            END IF;

        WHEN 'sankhya' THEN
            IF v_config.api_key IS NULL THEN
                v_erros := array_append(v_erros, 'API Key Sankhya nao configurada');
            END IF;

        WHEN 'dominio' THEN
            IF v_config.usuario IS NULL OR v_config.usuario = '' THEN
                v_erros := array_append(v_erros, 'Usuario Dominio nao configurado');
            END IF;
            IF v_config.senha IS NULL THEN
                v_erros := array_append(v_erros, 'Senha Dominio nao configurada');
            END IF;

        WHEN 'alterdata' THEN
            IF v_config.token_acesso IS NULL THEN
                v_erros := array_append(v_erros, 'Token de acesso Alterdata nao configurado');
            END IF;

        ELSE
            -- ERP tipo 'outro' ou nao mapeado
            NULL;
    END CASE;

    -- Verificar se existe pelo menos um mapeamento de contas
    SELECT EXISTS (
        SELECT 1 FROM public.contabilidade_mapeamento_contas
        WHERE config_id = p_config_id AND ativo = true
    ) INTO v_has_mapping;

    IF NOT v_has_mapping THEN
        v_erros := array_append(v_erros, 'Nenhum mapeamento de contas configurado');
    END IF;

    -- Montar resultado
    v_result := jsonb_build_object(
        'valido', array_length(v_erros, 1) IS NULL OR array_length(v_erros, 1) = 0,
        'erros', v_erros,
        'config_id', p_config_id,
        'erp_tipo', v_config.erp_tipo,
        'possui_mapeamento', v_has_mapping
    );

    RETURN v_result;
END;
$$;


--
-- Name: FUNCTION validar_configuracao_erp(p_config_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_configuracao_erp(p_config_id uuid) IS 'Valida se uma configuracao de ERP esta completa para uso';


--
-- Name: validar_vinculo_categoria_plano(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_vinculo_categoria_plano() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_plano_natureza TEXT;
    v_categoria_tipo TEXT;
BEGIN
    -- Se não há vínculo, permite
    IF NEW.plano_conta_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Buscar natureza do plano de contas
    SELECT natureza INTO v_plano_natureza
    FROM public.plano_contas
    WHERE id = NEW.plano_conta_id;

    -- Verificar compatibilidade
    IF NEW.tipo = 'receita' AND v_plano_natureza != 'receita' THEN
        RAISE EXCEPTION 'Categorias de receita devem ser vinculadas a contas de receita (natureza: receita)';
    END IF;

    IF NEW.tipo = 'despesa' AND v_plano_natureza NOT IN ('despesa', 'ativa') THEN
        RAISE EXCEPTION 'Categorias de despesa devem ser vinculadas a contas de despesa ou ativo (ex: caixa/banco)';
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: veiculos_revisao_proxima(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.veiculos_revisao_proxima() RETURNS TABLE(id uuid, placa text, marca text, modelo text, ano integer, cor text, km_atual integer, km_proxima_revisao integer, data_proxima_revisao date, cliente_nome text, alerta text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.placa,
    v.marca,
    v.modelo,
    v.ano,
    v.cor,
    v.km_atual,
    v.km_proxima_revisao,
    v.data_proxima_revisao,
    c.nome AS cliente_nome,
    CASE
      WHEN v.data_proxima_revisao IS NOT NULL AND v.data_proxima_revisao <= (CURRENT_DATE + INTERVAL '7 days')
        THEN 'revisao_data'
      WHEN v.km_proxima_revisao IS NOT NULL AND v.km_atual IS NOT NULL AND v.km_atual >= (v.km_proxima_revisao - 500)
        THEN 'revisao_km'
      ELSE NULL
    END::TEXT AS alerta
  FROM public.veiculos_mecanico v
  LEFT JOIN public.clientes_mecanico c ON c.id = v.cliente_id
  WHERE v.user_id = auth.uid()
    AND (
      (v.data_proxima_revisao IS NOT NULL AND v.data_proxima_revisao <= (CURRENT_DATE + INTERVAL '7 days'))
      OR
      (v.km_proxima_revisao IS NOT NULL AND v.km_atual IS NOT NULL AND v.km_atual >= (v.km_proxima_revisao - 500))
    )
  ORDER BY v.data_proxima_revisao ASC NULLS LAST, v.km_proxima_revisao ASC NULLS LAST;
END;
$$;


--
-- Name: verificar_assinatura_ativa(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_assinatura_ativa(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
  v_trial_fim TIMESTAMPTZ;
  v_assinatura_vencimento TIMESTAMPTZ;
BEGIN
  SELECT status, trial_fim, assinatura_vencimento
  INTO v_status, v_trial_fim, v_assinatura_vencimento
  FROM public.assinaturas_mecanico
  WHERE user_id = p_user_id;

  IF v_status IS NULL THEN
    RETURN false;
  END IF;

  IF v_status = 'ativo' AND v_assinatura_vencimento > now() THEN
    RETURN true;
  END IF;

  IF v_status = 'trial' AND v_trial_fim > now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;


--
-- Name: verificar_assinaturas_vencidas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_assinaturas_vencidas() RETURNS TABLE(user_id uuid, email text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  UPDATE public.assinaturas_mecanico a
  SET status = 'vencido',
      updated_at = now()
  FROM auth.users u
  WHERE a.user_id = u.id
    AND a.status IN ('ativo', 'trial')
    AND (
      (a.status = 'ativo' AND a.assinatura_vencimento < now())
      OR (a.status = 'trial' AND a.trial_fim < now())
    )
  RETURNING a.user_id, u.email;
END;
$$;


--
-- Name: verificar_ou_criar_plano_padrao(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_ou_criar_plano_padrao(p_user_id uuid, p_empresa_id uuid DEFAULT NULL::uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar se já existe plano de contas para o usuário
  SELECT count(*) INTO v_count
  FROM public.plano_contas
  WHERE user_id = p_user_id;

  -- Se não existir, criar o plano padrão
  IF v_count = 0 THEN
    RETURN public.criar_plano_contas_padrao(p_user_id, p_empresa_id);
  END IF;

  RETURN 0;
END;
$$;


--
-- Name: FUNCTION verificar_ou_criar_plano_padrao(p_user_id uuid, p_empresa_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_ou_criar_plano_padrao(p_user_id uuid, p_empresa_id uuid) IS 'Verifica se existe plano de contas, se não existir cria um plano padrão simplificado';


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
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
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
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


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
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


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cliente_id uuid,
    veiculo_id uuid,
    funcionario_id uuid,
    titulo text NOT NULL,
    descricao text,
    data_hora timestamp with time zone NOT NULL,
    duracao_min integer DEFAULT 60,
    status text DEFAULT 'agendado'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agendamentos_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamentos_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cliente_id uuid,
    veiculo_id uuid,
    funcionario_id uuid,
    titulo text NOT NULL,
    descricao text,
    data_hora timestamp with time zone NOT NULL,
    duracao_min integer DEFAULT 60,
    status text DEFAULT 'agendado'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_agendamentos_mecanico_status CHECK ((status = ANY (ARRAY['agendado'::text, 'concluido'::text, 'cancelado'::text])))
);


--
-- Name: anexos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anexos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conta_pagar_id uuid,
    conta_receber_id uuid,
    nome_arquivo text NOT NULL,
    storage_path text NOT NULL,
    tipo_arquivo text,
    tamanho bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: aplicacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aplicacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    peca_id uuid NOT NULL,
    marca_moto text DEFAULT ''::text NOT NULL,
    modelo_moto text DEFAULT ''::text NOT NULL,
    ano text DEFAULT ''::text
);


--
-- Name: assinaturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assinaturas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    plano text DEFAULT 'mensal'::text NOT NULL,
    valor numeric DEFAULT 399.90 NOT NULL,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    metodo_pagamento text,
    pagarme_order_id text,
    pagarme_charge_id text,
    pagarme_customer_id text,
    pix_qr_code text,
    pix_qr_code_url text,
    boleto_url text,
    boleto_barcode text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assinaturas_oficina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assinaturas_oficina (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'trial'::text,
    trial_ends_at timestamp with time zone,
    next_payment_at timestamp with time zone,
    mercado_pago_payment_id text,
    mercado_pago_preference_id text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assinaturas_oficina_status_check CHECK ((status = ANY (ARRAY['trial'::text, 'ativo'::text, 'pendente'::text, 'expirado'::text, 'cancelado'::text])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auditoria_transacoes_cartao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria_transacoes_cartao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    empresa_id uuid,
    tabela text NOT NULL,
    operacao text NOT NULL,
    registro_id uuid,
    dados_antigos jsonb,
    dados_novos jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT auditoria_transacoes_cartao_operacao_check CHECK ((operacao = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: TABLE auditoria_transacoes_cartao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auditoria_transacoes_cartao IS 'Log de auditoria para rastreamento de alterações em transações de cartão. Agente: @agente-seguranca';


--
-- Name: bancos_cartoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bancos_cartoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text DEFAULT 'banco'::text NOT NULL,
    nome text NOT NULL,
    banco text,
    agencia text,
    conta text,
    bandeira text,
    limite numeric DEFAULT 0,
    saldo_inicial numeric DEFAULT 0,
    ativo boolean DEFAULT true NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid
);


--
-- Name: budget_planning_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_planning_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    plano_conta_id uuid NOT NULL,
    fiscal_year integer NOT NULL,
    "values" jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: card_aliquotas_reforma; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_aliquotas_reforma (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ano integer NOT NULL,
    aliquota_cbs numeric(8,6) DEFAULT 0 NOT NULL,
    aliquota_ibs numeric(8,6) DEFAULT 0 NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: card_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    acao text NOT NULL,
    entidade text NOT NULL,
    entidade_id uuid,
    detalhes jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: card_dashboard_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_dashboard_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    total_bruto numeric(15,2) DEFAULT 0,
    total_liquido numeric(15,2) DEFAULT 0,
    total_taxas numeric(15,2) DEFAULT 0,
    total_transacoes integer DEFAULT 0,
    pendentes integer DEFAULT 0,
    conferidas integer DEFAULT 0,
    divergentes integer DEFAULT 0,
    chargebacks integer DEFAULT 0,
    por_adquirente jsonb DEFAULT '{}'::jsonb,
    por_bandeira jsonb DEFAULT '{}'::jsonb,
    split_cbs numeric(15,2) DEFAULT 0,
    split_ibs numeric(15,2) DEFAULT 0,
    split_liquido_projetado numeric(15,2) DEFAULT 0,
    cashflow_previsto jsonb DEFAULT '[]'::jsonb,
    atualizado_em timestamp with time zone DEFAULT now()
);


--
-- Name: card_importacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_importacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    adquirente text NOT NULL,
    tipo_arquivo text DEFAULT 'csv'::text NOT NULL,
    nome_arquivo text NOT NULL,
    tamanho_arquivo integer,
    total_linhas integer DEFAULT 0,
    total_importadas integer DEFAULT 0,
    total_erros integer DEFAULT 0,
    erros jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'processando'::text,
    processado_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: card_relatorios_gerados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_relatorios_gerados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    tipo_relatorio text NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    filtros jsonb DEFAULT '{}'::jsonb,
    total_transacoes integer DEFAULT 0,
    total_bruto numeric(15,2) DEFAULT 0,
    total_liquido numeric(15,2) DEFAULT 0,
    total_divergencias integer DEFAULT 0,
    nome_arquivo text,
    tamanho_bytes integer,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: card_report_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_report_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    nome_relatorio text NOT NULL,
    tipo_relatorio text DEFAULT 'mensal'::text NOT NULL,
    incluir_graficos boolean DEFAULT true,
    incluir_detalhamento_parcelas boolean DEFAULT false,
    periodo_padrao_dias integer DEFAULT 30,
    logo_empresa boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);


--
-- Name: card_simulacoes_salvas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_simulacoes_salvas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    nome text NOT NULL,
    valor_bruto numeric(15,2) NOT NULL,
    taxa_mdr numeric(8,6) NOT NULL,
    aliquota_cbs numeric(8,6) NOT NULL,
    aliquota_ibs numeric(8,6) NOT NULL,
    ano_referencia integer NOT NULL,
    valor_mdr numeric(15,2),
    valor_cbs numeric(15,2),
    valor_ibs numeric(15,2),
    valor_liquido numeric(15,2),
    observacoes text,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: card_split_simulacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_split_simulacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    transacao_id uuid,
    valor_bruto numeric(15,2) DEFAULT 0 NOT NULL,
    valor_mdr numeric(15,2) DEFAULT 0 NOT NULL,
    valor_cbs numeric(15,2) DEFAULT 0 NOT NULL,
    valor_ibs numeric(15,2) DEFAULT 0 NOT NULL,
    valor_liquido_empresa numeric(15,2) DEFAULT 0 NOT NULL,
    aliquota_cbs numeric(8,6) DEFAULT 0 NOT NULL,
    aliquota_ibs numeric(8,6) DEFAULT 0 NOT NULL,
    ano_referencia integer DEFAULT 2026 NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: card_transacoes_brutas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_transacoes_brutas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    banco_cartao_id uuid,
    adquirente text DEFAULT 'outras'::text NOT NULL,
    bandeira text,
    nsu text,
    autorizacao text,
    data_venda date NOT NULL,
    data_prevista_recebimento date,
    data_recebimento date,
    tipo_transacao text DEFAULT 'credito_a_vista'::text NOT NULL,
    parcelas integer DEFAULT 1 NOT NULL,
    parcela_atual integer DEFAULT 1 NOT NULL,
    valor_bruto numeric(15,2) DEFAULT 0 NOT NULL,
    taxa_mdr numeric(8,6) DEFAULT 0 NOT NULL,
    valor_taxa numeric(15,2) DEFAULT 0 NOT NULL,
    valor_liquido numeric(15,2) DEFAULT 0 NOT NULL,
    status_auditoria text DEFAULT 'pendente'::text NOT NULL,
    conciliado boolean DEFAULT false NOT NULL,
    arquivo_origem text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tipo_arquivo text DEFAULT 'csv'::text,
    empresa_id uuid,
    valor_extrato_bancario numeric(15,2),
    data_conciliacao timestamp with time zone,
    score_conciliacao numeric(5,2)
);


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    descricao text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    plano_conta_id uuid,
    empresa_id uuid,
    CONSTRAINT categorias_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text])))
);


--
-- Name: COLUMN categorias.plano_conta_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.categorias.plano_conta_id IS 'Vínculo automático com plano de contas contábil';


--
-- Name: certificados_nfse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificados_nfse (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    arquivo_path text,
    valido_ate date,
    cnpj text,
    emissor text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    arquivo_pfx text,
    senha text,
    razao_social text,
    inscricao_municipal text,
    endereco jsonb DEFAULT '{}'::jsonb,
    codigo_municipio text DEFAULT '3550308'::text,
    uf text DEFAULT 'SP'::text,
    cep text,
    numero text,
    bairro text
);

ALTER TABLE ONLY public.certificados_nfse FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE certificados_nfse; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.certificados_nfse IS 'Tabela de certificados digitais A1 para emissão de NFS-e';


--
-- Name: COLUMN certificados_nfse.arquivo_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.certificados_nfse.arquivo_path IS 'Caminho do arquivo no Supabase Storage';


--
-- Name: COLUMN certificados_nfse.cnpj; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.certificados_nfse.cnpj IS 'CNPJ do titular do certificado';


--
-- Name: COLUMN certificados_nfse.emissor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.certificados_nfse.emissor IS 'Autoridade Certificadora emissora';


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    nome text NOT NULL,
    documento text,
    email text,
    telefone text,
    endereco text,
    cidade text,
    estado text,
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    bairro text,
    cep text,
    numero text,
    complemento text,
    cnae text,
    natureza_juridica text
);


--
-- Name: clientes_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    telefone text,
    email text,
    documento text,
    endereco text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clientes_oficina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes_oficina (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    nome text NOT NULL,
    telefone text,
    email text,
    documento text,
    endereco text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    doc text,
    tel text,
    moto text DEFAULT ''::text
);

ALTER TABLE ONLY public.clientes_oficina FORCE ROW LEVEL SECURITY;


--
-- Name: cobranca_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cobranca_historico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conta_receber_id uuid,
    cliente_nome text,
    cliente_email text,
    tipo text NOT NULL,
    canal text DEFAULT 'email'::text NOT NULL,
    mensagem text,
    status text DEFAULT 'enviado'::text NOT NULL,
    valor numeric,
    data_vencimento date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid
);


--
-- Name: comissoes_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    os_id uuid NOT NULL,
    valor_total_servicos numeric(12,2) NOT NULL,
    percentual numeric(5,2) NOT NULL,
    valor_comissao numeric(12,2) NOT NULL,
    pago boolean DEFAULT false NOT NULL,
    data_pagamento date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: configuracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    razao_social text DEFAULT 'MotoPeças Pro Ltda'::text,
    cnpj text DEFAULT '12.345.678/0001-99'::text,
    endereco text DEFAULT 'Av. das Motos, 1500 - São Paulo/SP'::text,
    alerta_estoque boolean DEFAULT true,
    cupom_fiscal boolean DEFAULT true,
    backup_diario boolean DEFAULT true,
    comissao_vendedor boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    chave_pix text DEFAULT ''::text
);

ALTER TABLE ONLY public.configuracoes FORCE ROW LEVEL SECURITY;


--
-- Name: configuracoes_cartao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes_cartao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    user_id uuid,
    taxa_visa numeric(5,4) DEFAULT 0.0199,
    taxa_mastercard numeric(5,4) DEFAULT 0.0199,
    taxa_elo numeric(5,4) DEFAULT 0.0229,
    taxa_amex numeric(5,4) DEFAULT 0.0299,
    taxa_hipercard numeric(5,4) DEFAULT 0.0250,
    taxa_outros numeric(5,4) DEFAULT 0.0250,
    prazo_credito_dias integer DEFAULT 30,
    prazo_debito_dias integer DEFAULT 1,
    prazo_parcelado_dias integer DEFAULT 30,
    criterios_conciliacao jsonb DEFAULT '{"peso_nsu": 0.10, "peso_data": 0.30, "peso_valor": 0.50, "peso_bandeira": 0.10, "tolerancia_dias": 2, "tolerancia_valor": 0.50}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE configuracoes_cartao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.configuracoes_cartao IS 'Configurações de taxas e critérios de conciliação por empresa. Agente: @agente-supabase';


--
-- Name: contabilidade_erp_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contabilidade_erp_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    erp_tipo public.erp_tipo NOT NULL,
    nome_configuracao character varying(100) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ambiente public.erp_ambiente DEFAULT 'homologacao'::public.erp_ambiente NOT NULL,
    api_url text,
    api_key bytea,
    api_secret bytea,
    usuario character varying(100),
    senha bytea,
    token_acesso bytea,
    token_refresh bytea,
    token_expira_em timestamp with time zone,
    codigo_empresa_erp character varying(50),
    codigo_filial character varying(50),
    configuracoes_extras jsonb DEFAULT '{}'::jsonb,
    ultima_sincronizacao timestamp with time zone,
    status_conexao public.erp_status_conexao DEFAULT 'desconectado'::public.erp_status_conexao,
    error_log jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE contabilidade_erp_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contabilidade_erp_config IS 'Configuracoes de integracao com ERPs contabeis';


--
-- Name: COLUMN contabilidade_erp_config.api_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_erp_config.api_key IS 'Chave de API criptografada (pgsodium)';


--
-- Name: COLUMN contabilidade_erp_config.api_secret; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_erp_config.api_secret IS 'Secret de API criptografado (pgsodium)';


--
-- Name: COLUMN contabilidade_erp_config.senha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_erp_config.senha IS 'Senha criptografada (pgsodium)';


--
-- Name: COLUMN contabilidade_erp_config.token_acesso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_erp_config.token_acesso IS 'Token OAuth criptografado (pgsodium)';


--
-- Name: COLUMN contabilidade_erp_config.token_refresh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_erp_config.token_refresh IS 'Refresh token criptografado (pgsodium)';


--
-- Name: contabilidade_lancamentos_importados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contabilidade_lancamentos_importados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sincronizacao_id uuid NOT NULL,
    config_id uuid NOT NULL,
    user_id uuid NOT NULL,
    lancamento_erp_id character varying(255) NOT NULL,
    data_lancamento date NOT NULL,
    data_competencia date NOT NULL,
    tipo public.tipo_debito_credito NOT NULL,
    conta_contabil character varying(50) NOT NULL,
    historico text,
    valor numeric(15,2) NOT NULL,
    centro_custo character varying(50),
    documento character varying(100),
    conciliado boolean DEFAULT false NOT NULL,
    lancamento_financeiro_vinculado_id uuid,
    dados_originais jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_valor_positivo CHECK ((valor > (0)::numeric))
);


--
-- Name: TABLE contabilidade_lancamentos_importados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contabilidade_lancamentos_importados IS 'Lancamentos contabeis importados do ERP';


--
-- Name: COLUMN contabilidade_lancamentos_importados.lancamento_erp_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_lancamentos_importados.lancamento_erp_id IS 'ID do lancamento no sistema ERP de origem';


--
-- Name: COLUMN contabilidade_lancamentos_importados.dados_originais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_lancamentos_importados.dados_originais IS 'Dados brutos recebidos do ERP (preservado para auditoria)';


--
-- Name: contabilidade_mapeamento_contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contabilidade_mapeamento_contas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    config_id uuid NOT NULL,
    tipo_lancamento public.tipo_lancamento_contabil NOT NULL,
    categoria_id uuid,
    conta_contabil_erp character varying(50) NOT NULL,
    historico_padrao text,
    centro_custo_erp character varying(50),
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE contabilidade_mapeamento_contas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contabilidade_mapeamento_contas IS 'Mapeamento entre categorias do sistema e contas contabeis do ERP';


--
-- Name: COLUMN contabilidade_mapeamento_contas.conta_contabil_erp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_mapeamento_contas.conta_contabil_erp IS 'Codigo da conta contabil no ERP (ex: 1.1.01.001)';


--
-- Name: COLUMN contabilidade_mapeamento_contas.centro_custo_erp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_mapeamento_contas.centro_custo_erp IS 'Codigo do centro de custo no ERP (opcional)';


--
-- Name: contabilidade_sincronizacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contabilidade_sincronizacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid NOT NULL,
    user_id uuid NOT NULL,
    tipo_operacao public.tipo_operacao_sinc NOT NULL,
    status public.status_sincronizacao DEFAULT 'pendente'::public.status_sincronizacao NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    total_registros integer DEFAULT 0,
    registros_sucesso integer DEFAULT 0,
    registros_erro integer DEFAULT 0,
    dados_exportados jsonb,
    resposta_erp jsonb,
    erros_detalhados jsonb,
    iniciado_em timestamp with time zone,
    finalizado_em timestamp with time zone,
    iniciado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_contadores_validos CHECK (((registros_sucesso + registros_erro) <= total_registros)),
    CONSTRAINT chk_periodo_valido CHECK ((periodo_fim >= periodo_inicio))
);


--
-- Name: TABLE contabilidade_sincronizacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contabilidade_sincronizacao IS 'Registro de operacoes de sincronizacao com ERPs contabeis';


--
-- Name: COLUMN contabilidade_sincronizacao.dados_exportados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_sincronizacao.dados_exportados IS 'Snapshot dos dados enviados ao ERP (JSONB)';


--
-- Name: COLUMN contabilidade_sincronizacao.resposta_erp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_sincronizacao.resposta_erp IS 'Resposta completa recebida do ERP (JSONB)';


--
-- Name: COLUMN contabilidade_sincronizacao.erros_detalhados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contabilidade_sincronizacao.erros_detalhados IS 'Lista de erros com detalhes (JSONB)';


--
-- Name: contador_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contador_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome_contador text,
    email_contador text NOT NULL,
    escritorio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contador_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contador_documentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome_arquivo text NOT NULL,
    storage_path text NOT NULL,
    tipo_arquivo text,
    tamanho bigint,
    mes_referencia integer,
    ano_referencia integer,
    enviado boolean DEFAULT false NOT NULL,
    enviado_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_pagar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    fornecedor_id uuid,
    categoria_id uuid,
    descricao text NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_emissao date DEFAULT CURRENT_DATE NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    status text DEFAULT 'pendente'::text NOT NULL,
    documento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recorrente boolean DEFAULT false NOT NULL,
    frequencia text,
    data_fim_recorrencia date,
    forma_pagamento text,
    banco_cartao_id uuid,
    empresa_id uuid,
    CONSTRAINT contas_pagar_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text])))
);


--
-- Name: contas_receber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_receber (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cliente_id uuid,
    categoria_id uuid,
    descricao text NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_emissao date DEFAULT CURRENT_DATE NOT NULL,
    data_vencimento date NOT NULL,
    data_recebimento date,
    status text DEFAULT 'pendente'::text NOT NULL,
    documento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recorrente boolean DEFAULT false NOT NULL,
    frequencia text,
    data_fim_recorrencia date,
    forma_pagamento text,
    banco_cartao_id uuid,
    empresa_id uuid,
    CONSTRAINT contas_receber_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'recebido'::text, 'vencido'::text, 'cancelado'::text])))
);


--
-- Name: empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    razao_social text,
    nome_fantasia text,
    cnpj text,
    inscricao_estadual text,
    inscricao_municipal text,
    telefone text,
    email text,
    website text,
    cep text,
    endereco text,
    numero text,
    complemento text,
    bairro text,
    cidade text,
    estado text,
    logo_url text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    razao_social text NOT NULL,
    nome_fantasia text,
    cnpj text NOT NULL,
    inscricao_estadual text,
    inscricao_municipal text,
    segmento text,
    endereco_cep text,
    endereco_logradouro text,
    endereco_numero text,
    endereco_complemento text,
    endereco_bairro text,
    endereco_cidade text,
    endereco_uf text,
    telefone text,
    email text,
    logo_url text,
    certificado_digital_a1_path text,
    certificado_digital_senha text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    website text,
    observacoes text
);


--
-- Name: empresas_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    razao_social text,
    nome_fantasia text,
    cnpj text,
    endereco text,
    telefone text,
    chave_pix text,
    alerta_estoque_baixo boolean DEFAULT true NOT NULL,
    cupom_fiscal_automatico boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: extrato_bancario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extrato_bancario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    banco_cartao_id uuid,
    data_transacao date NOT NULL,
    descricao text NOT NULL,
    valor numeric NOT NULL,
    tipo text DEFAULT 'entrada'::text NOT NULL,
    fitid text,
    conciliado boolean DEFAULT false NOT NULL,
    lancamento_id uuid,
    conta_receber_id uuid,
    conta_pagar_id uuid,
    origem text DEFAULT 'ofx'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parcelas integer DEFAULT 1,
    parcela_atual integer DEFAULT 1,
    empresa_id uuid,
    status_conciliacao text DEFAULT 'pendente'::text,
    CONSTRAINT extrato_bancario_status_conciliacao_check CHECK ((status_conciliacao = ANY (ARRAY['pendente'::text, 'aguardando_extrato'::text, 'em_conciliacao'::text, 'conciliado'::text, 'divergente'::text])))
);


--
-- Name: COLUMN extrato_bancario.status_conciliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.extrato_bancario.status_conciliacao IS 'pendente = importado do OFX; aguardando_extrato = espelho de conta a pagar/receber; em_conciliacao = em processo de match; conciliado = confirmado; divergente = sem correspondente';


--
-- Name: fechamentos_mensais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fechamentos_mensais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mes integer NOT NULL,
    ano integer DEFAULT 2026 NOT NULL,
    receita_total numeric DEFAULT 0 NOT NULL,
    despesa_total numeric DEFAULT 0 NOT NULL,
    custos_diretos numeric DEFAULT 0 NOT NULL,
    despesas_operacionais numeric DEFAULT 0 NOT NULL,
    lucro_bruto numeric DEFAULT 0 NOT NULL,
    lucro_liquido numeric DEFAULT 0 NOT NULL,
    saldo_inicial numeric DEFAULT 0 NOT NULL,
    saldo_final numeric DEFAULT 0 NOT NULL,
    contas_receber_pendentes numeric DEFAULT 0 NOT NULL,
    contas_pagar_pendentes numeric DEFAULT 0 NOT NULL,
    observacoes text,
    status text DEFAULT 'rascunho'::text NOT NULL,
    fechado_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid
);


--
-- Name: financeiro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financeiro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    categoria text,
    descricao text NOT NULL,
    valor numeric(12,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    pago boolean DEFAULT false NOT NULL,
    os_id uuid,
    forma_pagamento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: financeiro_lancamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financeiro_lancamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    descricao text DEFAULT ''::text NOT NULL,
    categoria text DEFAULT ''::text,
    valor numeric(12,2) DEFAULT 0 NOT NULL,
    vencimento date,
    status text DEFAULT 'pendente'::text,
    observacoes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    CONSTRAINT financeiro_lancamentos_status_check CHECK ((status = ANY (ARRAY['pago'::text, 'pendente'::text, 'vencido'::text]))),
    CONSTRAINT financeiro_lancamentos_tipo_check CHECK ((tipo = ANY (ARRAY['receber'::text, 'pagar'::text])))
);

ALTER TABLE ONLY public.financeiro_lancamentos FORCE ROW LEVEL SECURITY;


--
-- Name: financeiro_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financeiro_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    categoria text,
    descricao text NOT NULL,
    valor numeric(12,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    pago boolean DEFAULT false NOT NULL,
    os_id uuid,
    forma_pagamento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_financeiro_mecanico_tipo CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text])))
);


--
-- Name: fornecedor_catalogo_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedor_catalogo_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    fornecedor_id uuid NOT NULL,
    codigo text NOT NULL,
    nome text NOT NULL,
    descricao text,
    preco numeric(12,2),
    marca text,
    categoria text,
    ultima_atualizacao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    nome text NOT NULL,
    documento text,
    email text,
    telefone text,
    endereco text,
    cidade text,
    estado text,
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    bairro text,
    cep text,
    numero text,
    complemento text,
    cnae text,
    natureza_juridica text
);


--
-- Name: fornecedores_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    cnpj text,
    telefone text,
    email text,
    website text,
    api_endpoint text,
    api_key text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fornecedores_oficina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores_oficina (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cnpj text,
    contato text DEFAULT ''::text,
    categoria text DEFAULT ''::text,
    limite numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid
);

ALTER TABLE ONLY public.fornecedores_oficina FORCE ROW LEVEL SECURITY;


--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcionarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    cargo text,
    telefone text,
    email text,
    comissao_percent numeric(5,2) DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: funcionarios_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcionarios_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text NOT NULL,
    cargo text,
    telefone text,
    email text,
    comissao_percent numeric(5,2) DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    reference_month date NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    status public.invoice_status DEFAULT 'pendente'::public.invoice_status NOT NULL,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lancamentos_caixa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lancamentos_caixa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    categoria_id uuid,
    descricao text NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_lancamento date DEFAULT CURRENT_DATE NOT NULL,
    conta_receber_id uuid,
    conta_pagar_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    CONSTRAINT lancamentos_caixa_tipo_check CHECK ((tipo = ANY (ARRAY['entrada'::text, 'saida'::text])))
);


--
-- Name: leads_diagnostico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads_diagnostico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    telefone text NOT NULL,
    empresa text NOT NULL,
    cnpj text,
    faturamento_mensal text,
    num_funcionarios text,
    principal_dor text,
    origem text DEFAULT 'site'::text NOT NULL,
    status text DEFAULT 'novo'::text NOT NULL,
    observacoes_internas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: licencas_software; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licencas_software (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo_cliente text DEFAULT 'escritorio'::text NOT NULL,
    razao_social text NOT NULL,
    nome_fantasia text,
    cnpj text,
    email text,
    telefone text,
    contato_nome text,
    plano text DEFAULT 'profissional'::text NOT NULL,
    valor_mensal numeric DEFAULT 399.90 NOT NULL,
    desconto_percentual numeric DEFAULT 0,
    data_inicio date DEFAULT CURRENT_DATE NOT NULL,
    data_fim date,
    status text DEFAULT 'ativa'::text NOT NULL,
    chave_licenca text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text) NOT NULL,
    max_usuarios integer DEFAULT 5 NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    quantidade_licencas integer DEFAULT 1 NOT NULL,
    configuracao_extra jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: COLUMN licencas_software.quantidade_licencas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.licencas_software.quantidade_licencas IS 'Quantidade de licenças vendidas para o cliente (útil para escritórios e BPOs com múltiplas unidades)';


--
-- Name: mapeamento_contabil; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mapeamento_contabil (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    categoria_id uuid,
    tipo_lancamento text NOT NULL,
    plano_conta_id uuid NOT NULL,
    historico_padrao text,
    centro_custo text,
    regra_condicional jsonb,
    ativo boolean DEFAULT true NOT NULL,
    automatico boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mapeamento_contabil_tipo_lancamento_check CHECK ((tipo_lancamento = ANY (ARRAY['despesa'::text, 'receita'::text, 'transferencia'::text])))
);


--
-- Name: metas_orcamentarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metas_orcamentarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    categoria_id uuid,
    mes integer NOT NULL,
    ano integer DEFAULT 2026 NOT NULL,
    valor_orcado numeric DEFAULT 0 NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid,
    CONSTRAINT metas_orcamentarias_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: moto_aplicacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moto_aplicacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    peca_id uuid NOT NULL,
    marca_moto text DEFAULT ''::text NOT NULL,
    modelo_moto text DEFAULT ''::text NOT NULL,
    ano text DEFAULT ''::text
);


--
-- Name: moto_pecas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moto_pecas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nome text NOT NULL,
    categoria text DEFAULT 'Geral'::text NOT NULL,
    marca text DEFAULT ''::text NOT NULL,
    estoque integer DEFAULT 0 NOT NULL,
    estoque_min integer DEFAULT 0 NOT NULL,
    preco_custo numeric(12,2) DEFAULT 0 NOT NULL,
    preco_venda numeric(12,2) DEFAULT 0 NOT NULL,
    localizacao text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid
);

ALTER TABLE ONLY public.moto_pecas FORCE ROW LEVEL SECURITY;


--
-- Name: nfs_e_emitentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfs_e_emitentes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    cnpj_emitente character varying(14) NOT NULL,
    inscricao_municipal character varying(20),
    razao_social character varying(150) NOT NULL,
    nome_fantasia character varying(60),
    endereco jsonb DEFAULT '{}'::jsonb NOT NULL,
    certificado_digital text,
    senha_certificado text,
    ambiente public.ambiente_enum DEFAULT 'homologacao'::public.ambiente_enum NOT NULL,
    proximo_numero_nota integer DEFAULT 1 NOT NULL,
    serie_nota character varying(3) DEFAULT '1'::character varying NOT NULL,
    regime_tributario public.regime_tributario_enum DEFAULT 'simples_nacional'::public.regime_tributario_enum NOT NULL,
    aliquota_iss numeric(5,2) DEFAULT 2.00 NOT NULL,
    item_lista_servicos character varying(5),
    cnae character varying(7),
    codigo_tributacao_municipio character varying(20),
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_aliquota_iss CHECK (((aliquota_iss >= (0)::numeric) AND (aliquota_iss <= (100)::numeric))),
    CONSTRAINT chk_cnpj_emitente CHECK (((cnpj_emitente)::text ~ '^[0-9]{14}$'::text)),
    CONSTRAINT chk_proximo_numero_nota CHECK ((proximo_numero_nota > 0)),
    CONSTRAINT nfs_e_emitentes_endereco_check CHECK (((jsonb_typeof(endereco) = 'object'::text) AND (endereco ? 'logradouro'::text) AND (endereco ? 'numero'::text) AND (endereco ? 'bairro'::text) AND (endereco ? 'cidade'::text) AND (endereco ? 'uf'::text) AND (endereco ? 'cep'::text)))
);


--
-- Name: TABLE nfs_e_emitentes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nfs_e_emitentes IS 'Configuração de emitentes de NFS-e por empresa - integração Prefeitura SP';


--
-- Name: COLUMN nfs_e_emitentes.endereco; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_emitentes.endereco IS 'JSON: {logradouro, numero, complemento, bairro, cidade, uf, cep}';


--
-- Name: COLUMN nfs_e_emitentes.certificado_digital; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_emitentes.certificado_digital IS 'Certificado PKCS12 criptografado via pgsodium';


--
-- Name: COLUMN nfs_e_emitentes.senha_certificado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_emitentes.senha_certificado IS 'Senha do certificado criptografada via pgsodium';


--
-- Name: nfs_e_notas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfs_e_notas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    emitente_id uuid NOT NULL,
    empresa_id uuid NOT NULL,
    numero_nota integer NOT NULL,
    serie character varying(3) DEFAULT '1'::character varying NOT NULL,
    data_emissao timestamp with time zone DEFAULT now() NOT NULL,
    competencia date NOT NULL,
    status public.nfse_status_enum DEFAULT 'rascunho'::public.nfse_status_enum NOT NULL,
    protocolo_autorizacao character varying(50),
    codigo_verificacao character varying(50),
    link_pdf text,
    link_xml text,
    tomador_tipo public.tomador_tipo_enum NOT NULL,
    tomador_documento character varying(14) NOT NULL,
    tomador_razao_social character varying(150),
    tomador_endereco jsonb DEFAULT '{}'::jsonb,
    tomador_email character varying(100),
    servico_descricao text NOT NULL,
    servico_valor numeric(15,2) NOT NULL,
    servico_deducoes numeric(15,2) DEFAULT 0.00 NOT NULL,
    servico_base_calculo numeric(15,2) NOT NULL,
    servico_aliquota numeric(5,2) NOT NULL,
    servico_iss_retido boolean DEFAULT false NOT NULL,
    servico_valor_iss numeric(15,2) NOT NULL,
    servico_valor_liquido numeric(15,2) NOT NULL,
    retencoes_pis numeric(15,2) DEFAULT 0.00 NOT NULL,
    retencoes_cofins numeric(15,2) DEFAULT 0.00 NOT NULL,
    retencoes_inss numeric(15,2) DEFAULT 0.00 NOT NULL,
    retencoes_ir numeric(15,2) DEFAULT 0.00 NOT NULL,
    retencoes_csll numeric(15,2) DEFAULT 0.00 NOT NULL,
    mensagem_fiscal text,
    rascunho boolean DEFAULT true NOT NULL,
    enviada_prefeitura_em timestamp with time zone,
    cancelada_em timestamp with time zone,
    motivo_cancelamento text,
    error_log jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_competencia CHECK ((competencia <= (CURRENT_DATE + '1 mon'::interval))),
    CONSTRAINT chk_servico_valor CHECK ((servico_valor >= (0)::numeric)),
    CONSTRAINT chk_tomador_documento CHECK ((((tomador_tipo = 'cpf'::public.tomador_tipo_enum) AND ((tomador_documento)::text ~ '^[0-9]{11}$'::text)) OR ((tomador_tipo = 'cnpj'::public.tomador_tipo_enum) AND ((tomador_documento)::text ~ '^[0-9]{14}$'::text))))
);


--
-- Name: TABLE nfs_e_notas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nfs_e_notas IS 'Notas fiscais de serviço eletrônicas emitidas - Prefeitura SP';


--
-- Name: COLUMN nfs_e_notas.protocolo_autorizacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_notas.protocolo_autorizacao IS 'Protocolo de autorização retornado pela prefeitura';


--
-- Name: COLUMN nfs_e_notas.codigo_verificacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_notas.codigo_verificacao IS 'Código para consulta pública na prefeitura';


--
-- Name: COLUMN nfs_e_notas.error_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_notas.error_log IS 'JSON com erros de processamento: {codigo, mensagem, timestamp, raw_response}';


--
-- Name: nfs_e_rascunhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfs_e_rascunhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    user_id uuid NOT NULL,
    dados jsonb DEFAULT '{}'::jsonb NOT NULL,
    ultimo_autosave timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE nfs_e_rascunhos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nfs_e_rascunhos IS 'Rascunhos de notas fiscais com autosave';


--
-- Name: COLUMN nfs_e_rascunhos.dados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.nfs_e_rascunhos.dados IS 'JSON com snapshot de todos os campos do formulário de emissão';


--
-- Name: nfse_cron_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfse_cron_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    notas_processadas integer DEFAULT 0,
    notas_autorizadas integer DEFAULT 0,
    notas_rejeitadas integer DEFAULT 0,
    erros integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.nfse_cron_logs FORCE ROW LEVEL SECURITY;


--
-- Name: nfse_rascunhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfse_rascunhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    dados jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: nfse_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfse_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nota_id uuid,
    user_id uuid NOT NULL,
    status text NOT NULL,
    mensagem text,
    detalhes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.nfse_sync_logs FORCE ROW LEVEL SECURITY;


--
-- Name: notas_fiscais_servico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notas_fiscais_servico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'rascunho'::text,
    numero_nota text,
    serie text,
    tipo_rps text DEFAULT 'RPS'::text,
    cliente_tipo_documento text DEFAULT 'CNPJ'::text,
    cliente_cnpj_cpf text,
    cliente_razao_social text,
    cliente_nome_fantasia text,
    cliente_email text,
    cliente_telefone text,
    cliente_endereco text,
    cliente_numero text,
    cliente_complemento text,
    cliente_bairro text,
    cliente_cidade text,
    cliente_estado text,
    cliente_cep text,
    cliente_ibge text,
    servico_descricao text,
    servico_codigo text,
    servico_cnae text,
    servico_codigo_tributacao text,
    servico_discriminacao text,
    servico_item_lista_servico text,
    valor_servico numeric(15,2) DEFAULT 0,
    valor_deducoes numeric(15,2) DEFAULT 0,
    valor_iss numeric(15,2) DEFAULT 0,
    valor_liquido numeric(15,2) DEFAULT 0,
    base_calculo numeric(15,2) DEFAULT 0,
    aliquota_iss numeric(6,4) DEFAULT 0,
    iss_retido boolean DEFAULT false,
    retencao_pis numeric(15,2) DEFAULT 0,
    retencao_cofins numeric(15,2) DEFAULT 0,
    retencao_inss numeric(15,2) DEFAULT 0,
    retencao_ir numeric(15,2) DEFAULT 0,
    retencao_csll numeric(15,2) DEFAULT 0,
    aliquota_pis numeric(6,4) DEFAULT 0,
    aliquota_cofins numeric(6,4) DEFAULT 0,
    aliquota_inss numeric(6,4) DEFAULT 0,
    aliquota_ir numeric(6,4) DEFAULT 0,
    aliquota_csll numeric(6,4) DEFAULT 0,
    data_competencia date,
    data_emissao timestamp with time zone,
    natureza_operacao integer DEFAULT 1,
    regime_tributario integer DEFAULT 1,
    municipio_prestacao integer,
    certificado_id uuid,
    xml_envio text,
    xml_retorno text,
    numero_rps text,
    link_pdf text,
    link_xml text,
    protocolo text,
    codigo_verificacao text,
    link_nfse text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cliente_nome text,
    cnae text,
    codigo_tributacao text,
    data_autorizacao timestamp with time zone,
    motivo_cancelamento text,
    mensagem_erro text,
    cnpj_prestador text,
    inscricao_municipal text,
    nfeio_id text,
    nfeio_status text,
    CONSTRAINT notas_fiscais_servico_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'enviando'::text, 'autorizada'::text, 'rejeitada'::text, 'cancelada'::text, 'erro'::text])))
);


--
-- Name: TABLE notas_fiscais_servico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notas_fiscais_servico IS 'Notas fiscais de serviço eletrônicas (NFS-e)';


--
-- Name: COLUMN notas_fiscais_servico.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notas_fiscais_servico.status IS 'rascunho, enviando, autorizada, rejeitada, cancelada, erro';


--
-- Name: COLUMN notas_fiscais_servico.natureza_operacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notas_fiscais_servico.natureza_operacao IS '1-Tributação normal, 2-IMMune, 3-Extemporânea, etc';


--
-- Name: COLUMN notas_fiscais_servico.regime_tributario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notas_fiscais_servico.regime_tributario IS '1-Simples nacional, 2-Lucro presumido, 3-Lucro real, 4-Outros';


--
-- Name: COLUMN notas_fiscais_servico.cnpj_prestador; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notas_fiscais_servico.cnpj_prestador IS 'CNPJ do prestador (copiado do certificado na emissão)';


--
-- Name: COLUMN notas_fiscais_servico.inscricao_municipal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notas_fiscais_servico.inscricao_municipal IS 'Inscrição municipal do prestador (copiada do certificado na emissão)';


--
-- Name: notificacoes_admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes_admin (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    mensagem text,
    tipo text DEFAULT 'pagamento'::text NOT NULL,
    lida boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: obd2_leituras_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obd2_leituras_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    veiculo_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    leituras jsonb DEFAULT '[]'::jsonb,
    dtcs jsonb DEFAULT '[]'::jsonb,
    simulado boolean DEFAULT false,
    observacao text
);


--
-- Name: open_banking_bancos_suportados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.open_banking_bancos_suportados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(10) NOT NULL,
    nome character varying(100) NOT NULL,
    nome_completo character varying(255),
    cnpj character varying(18),
    api_base_url text NOT NULL,
    api_version character varying(20) DEFAULT 'v1'::character varying,
    auth_url text NOT NULL,
    token_url text NOT NULL,
    client_id_required boolean DEFAULT true,
    client_secret_required boolean DEFAULT true,
    pkce_required boolean DEFAULT true,
    scopes_padrao text[] DEFAULT ARRAY['accounts'::text, 'payments'::text],
    ativo boolean DEFAULT true NOT NULL,
    participante_open_banking boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE open_banking_bancos_suportados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.open_banking_bancos_suportados IS 'Cadastro de bancos suportados pelo sistema Open Banking';


--
-- Name: open_banking_extratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.open_banking_extratos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    integracao_id uuid NOT NULL,
    transacao_id character varying(255) NOT NULL,
    transacao_id_externo character varying(255),
    data_transacao date NOT NULL,
    data_lancamento timestamp with time zone DEFAULT now() NOT NULL,
    hora_transacao time without time zone,
    descricao text NOT NULL,
    descricao_original text,
    valor numeric(15,2) NOT NULL,
    tipo public.open_banking_tipo_transacao NOT NULL,
    categoria_banco character varying(100),
    subcategoria_banco character varying(100),
    codigo_mcc character varying(4),
    nome_estabelecimento character varying(255),
    cidade_transacao character varying(100),
    conta_numero_snapshot character varying(20),
    agencia_snapshot character varying(20),
    saldo_apos_transacao numeric(15,2),
    comprovante_url text,
    comprovante_storage_path text,
    conciliado boolean DEFAULT false NOT NULL,
    conciliado_at timestamp with time zone,
    conciliado_por uuid,
    lancamento_vinculado_id uuid,
    conta_receber_vinculada_id uuid,
    conta_pagar_vinculada_id uuid,
    importado_por uuid,
    importado_via character varying(50) DEFAULT 'open_banking'::character varying,
    ignorado boolean DEFAULT false NOT NULL,
    ignorado_por uuid,
    ignorado_at timestamp with time zone,
    ignorado_motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT data_transacao_valida CHECK ((data_transacao <= (CURRENT_DATE + '1 day'::interval))),
    CONSTRAINT valor_nao_zero CHECK ((valor <> (0)::numeric))
);


--
-- Name: TABLE open_banking_extratos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.open_banking_extratos IS 'Transacoes bancarias importadas via Open Banking';


--
-- Name: COLUMN open_banking_extratos.transacao_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.open_banking_extratos.transacao_id IS 'ID unico da transacao fornecido pelo banco';


--
-- Name: COLUMN open_banking_extratos.lancamento_vinculado_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.open_banking_extratos.lancamento_vinculado_id IS 'Vinculo com lancamento interno do sistema';


--
-- Name: open_banking_integracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.open_banking_integracoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    banco_codigo character varying(10) NOT NULL,
    banco_nome character varying(100) NOT NULL,
    banco_logo_url text,
    access_token_encrypted bytea,
    refresh_token_encrypted bytea,
    token_expires_at timestamp with time zone,
    consent_id character varying(255),
    consent_expires_at timestamp with time zone,
    status public.open_banking_status DEFAULT 'ativo'::public.open_banking_status NOT NULL,
    ultimo_erro text,
    ultimo_erro_at timestamp with time zone,
    conta_numero character varying(20),
    conta_tipo character varying(50),
    agencia character varying(20),
    ultima_sincronizacao timestamp with time zone,
    proxima_sincronizacao timestamp with time zone,
    auto_sync boolean DEFAULT true NOT NULL,
    sync_interval_minutes integer DEFAULT 60 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    revoked_by uuid,
    CONSTRAINT valid_banco_codigo CHECK (((banco_codigo)::text ~ '^[0-9]+$'::text)),
    CONSTRAINT valid_sync_interval CHECK (((sync_interval_minutes >= 15) AND (sync_interval_minutes <= 1440)))
);


--
-- Name: TABLE open_banking_integracoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.open_banking_integracoes IS 'Integracoes Open Banking com instituicoes financeiras';


--
-- Name: COLUMN open_banking_integracoes.access_token_encrypted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.open_banking_integracoes.access_token_encrypted IS 'Token de acesso OAuth2 criptografado (nao armazenar em texto plano!)';


--
-- Name: COLUMN open_banking_integracoes.refresh_token_encrypted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.open_banking_integracoes.refresh_token_encrypted IS 'Token de refresh OAuth2 criptografado (nao armazenar em texto plano!)';


--
-- Name: COLUMN open_banking_integracoes.conta_numero; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.open_banking_integracoes.conta_numero IS 'Numero da conta mascarado (ex: ****1234)';


--
-- Name: open_banking_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.open_banking_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    integracao_id uuid,
    user_id uuid,
    operacao character varying(100) NOT NULL,
    status character varying(50) NOT NULL,
    mensagem text,
    detalhes jsonb,
    request_path character varying(255),
    http_status integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE open_banking_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.open_banking_logs IS 'Log de operacoes Open Banking para auditoria e debug';


--
-- Name: orcamento_itens_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orcamento_itens_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    orcamento_id uuid NOT NULL,
    tipo text NOT NULL,
    peca_id uuid,
    descricao text NOT NULL,
    quantidade numeric(12,2) DEFAULT 1 NOT NULL,
    preco_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_orcamento_itens_mecanico_tipo CHECK ((tipo = ANY (ARRAY['peca'::text, 'servico'::text])))
);


--
-- Name: orcamentos_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orcamentos_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    numero integer NOT NULL,
    cliente_id uuid NOT NULL,
    veiculo_id uuid NOT NULL,
    funcionario_id uuid,
    status text DEFAULT 'pendente'::text NOT NULL,
    descricao_problema text,
    diagnostico text,
    km_entrada integer,
    data_criacao timestamp with time zone DEFAULT now() NOT NULL,
    data_validade timestamp with time zone,
    desconto numeric(12,2) DEFAULT 0 NOT NULL,
    total_pecas numeric(12,2) DEFAULT 0 NOT NULL,
    total_servicos numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_orcamentos_mecanico_status CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'convertido'::text])))
);


--
-- Name: ordem_servico_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordem_servico_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ordem_id uuid NOT NULL,
    peca_id uuid,
    descricao text DEFAULT ''::text NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    preco_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.ordem_servico_itens FORCE ROW LEVEL SECURITY;


--
-- Name: ordens_servico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordens_servico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text,
    cliente_id uuid,
    cliente_nome text DEFAULT ''::text NOT NULL,
    moto text DEFAULT ''::text,
    placa text DEFAULT ''::text,
    servico_descricao text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'em_andamento'::text,
    mao_de_obra numeric(12,2) DEFAULT 0 NOT NULL,
    valor_total numeric(12,2) DEFAULT 0 NOT NULL,
    observacoes text DEFAULT ''::text,
    abertura timestamp with time zone DEFAULT now(),
    previsao_entrega date,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    CONSTRAINT ordens_servico_status_check CHECK ((status = ANY (ARRAY['em_andamento'::text, 'aguardando_peca'::text, 'concluida'::text, 'cancelada'::text])))
);

ALTER TABLE ONLY public.ordens_servico FORCE ROW LEVEL SECURITY;


--
-- Name: ordens_servico_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordens_servico_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    numero integer NOT NULL,
    cliente_id uuid NOT NULL,
    veiculo_id uuid NOT NULL,
    funcionario_id uuid,
    status text DEFAULT 'aberta'::text NOT NULL,
    descricao_problema text,
    diagnostico text,
    km_entrada integer,
    data_entrada timestamp with time zone DEFAULT now() NOT NULL,
    data_prevista timestamp with time zone,
    data_conclusao timestamp with time zone,
    desconto numeric(12,2) DEFAULT 0 NOT NULL,
    total_pecas numeric(12,2) DEFAULT 0 NOT NULL,
    total_servicos numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    pago boolean DEFAULT false NOT NULL,
    forma_pagamento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ordens_servico_mecanico_status CHECK ((status = ANY (ARRAY['aberta'::text, 'em_andamento'::text, 'aguardando_pecas'::text, 'concluida'::text, 'cancelada'::text])))
);


--
-- Name: os_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.os_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    os_id uuid NOT NULL,
    tipo text NOT NULL,
    peca_id uuid,
    descricao text NOT NULL,
    quantidade numeric(12,2) DEFAULT 1 NOT NULL,
    preco_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: os_itens_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.os_itens_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    os_id uuid NOT NULL,
    tipo text NOT NULL,
    peca_id uuid,
    descricao text NOT NULL,
    quantidade numeric(12,2) DEFAULT 1 NOT NULL,
    preco_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    garantia_dias integer DEFAULT 0,
    garantia_data_vencimento date,
    tem_garantia boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_os_itens_mecanico_tipo CHECK ((tipo = ANY (ARRAY['peca'::text, 'servico'::text])))
);


--
-- Name: payment_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    student_id uuid NOT NULL,
    student_name text NOT NULL,
    guardian_name text NOT NULL,
    guardian_phone text NOT NULL,
    amount numeric NOT NULL,
    due_date date NOT NULL,
    reference_month date NOT NULL,
    reminder_type text NOT NULL,
    days_offset integer NOT NULL,
    message text NOT NULL,
    whatsapp_url text NOT NULL,
    sent boolean DEFAULT false NOT NULL,
    sent_at timestamp with time zone,
    generated_for_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pecas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pecas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    codigo text,
    nome text NOT NULL,
    descricao text,
    preco_custo numeric(12,2) DEFAULT 0,
    preco_venda numeric(12,2) DEFAULT 0 NOT NULL,
    quantidade integer DEFAULT 0 NOT NULL,
    estoque_minimo integer DEFAULT 1 NOT NULL,
    unidade text DEFAULT 'un'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    categoria text DEFAULT 'Geral'::text NOT NULL,
    marca text DEFAULT ''::text NOT NULL,
    estoque_min integer DEFAULT 0 NOT NULL,
    localizacao text DEFAULT ''::text
);


--
-- Name: pecas_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pecas_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    codigo text,
    nome text NOT NULL,
    descricao text,
    preco_custo numeric(12,2) DEFAULT 0,
    preco_venda numeric(12,2) DEFAULT 0 NOT NULL,
    quantidade integer DEFAULT 0 NOT NULL,
    estoque_minimo integer DEFAULT 1 NOT NULL,
    unidade text DEFAULT 'un'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    garantia_padrao_dias integer DEFAULT 90
);


--
-- Name: plano_contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plano_contas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    codigo_conta text NOT NULL,
    codigo_pai text,
    nivel integer DEFAULT 1 NOT NULL,
    tipo_conta text DEFAULT 'sintetica'::text NOT NULL,
    natureza text DEFAULT 'ativa'::text NOT NULL,
    descricao text NOT NULL,
    descricao_reduzida text,
    ativo boolean DEFAULT true NOT NULL,
    permite_lancamento boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE plano_contas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.plano_contas IS 'Plano de contas contábil';


--
-- Name: COLUMN plano_contas.codigo_conta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plano_contas.codigo_conta IS 'Código hierárquico (ex: 1.1.01.0001)';


--
-- Name: COLUMN plano_contas.tipo_conta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plano_contas.tipo_conta IS 'sintetica (grupo) ou analitica (conta movimento)';


--
-- Name: COLUMN plano_contas.natureza; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plano_contas.natureza IS 'ativa, passiva, receita, despesa';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_limit_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limit_uploads (
    user_id uuid NOT NULL,
    count integer DEFAULT 0,
    reset_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval)
);


--
-- Name: regua_cobranca; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regua_cobranca (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nome text DEFAULT 'Régua Padrão'::text NOT NULL,
    dias_antes_1 integer DEFAULT 3,
    dias_antes_2 integer DEFAULT 1,
    dias_no_vencimento boolean DEFAULT true,
    dias_apos_1 integer DEFAULT 3,
    dias_apos_2 integer DEFAULT 7,
    dias_apos_3 integer DEFAULT 15,
    canal text DEFAULT 'email'::text NOT NULL,
    mensagem_antes text DEFAULT 'Prezado(a) cliente, informamos que sua fatura no valor de {valor} vence em {dias} dia(s), no dia {data_vencimento}. Agradecemos a atenção.'::text,
    mensagem_vencimento text DEFAULT 'Prezado(a) cliente, informamos que sua fatura no valor de {valor} vence hoje, dia {data_vencimento}. Agradecemos a atenção.'::text,
    mensagem_apos text DEFAULT 'Prezado(a) cliente, identificamos que sua fatura no valor de {valor}, com vencimento em {data_vencimento}, encontra-se em atraso há {dias} dia(s). Solicitamos a regularização.'::text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid
);


--
-- Name: regua_cobranca_automacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regua_cobranca_automacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid,
    enviar_lembretes boolean DEFAULT true,
    dias_antes_lembrete_1 integer DEFAULT 3,
    dias_antes_lembrete_2 integer DEFAULT 1,
    enviar_dia_vencimento boolean DEFAULT true,
    dias_apos_cobranca_1 integer DEFAULT 3,
    dias_apos_cobranca_2 integer DEFAULT 7,
    dias_apos_cobranca_3 integer DEFAULT 15,
    dias_bloqueio integer DEFAULT 30,
    canal_padrao text DEFAULT 'email'::text,
    usar_whatsapp boolean DEFAULT false,
    usar_sms boolean DEFAULT false,
    horario_envio_inicio time without time zone DEFAULT '08:00:00'::time without time zone,
    horario_envio_fim time without time zone DEFAULT '18:00:00'::time without time zone,
    dias_semana_envio integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    mensagem_lembrete text DEFAULT 'Olá {cliente}, seu pagamento de {valor} vence em {dias} dia(s).'::text,
    mensagem_vencimento text DEFAULT 'Olá {cliente}, seu pagamento de {valor} vence hoje!'::text,
    mensagem_cobranca text DEFAULT 'Prezado {cliente}, sua fatura de {valor} venceu há {dias} dias. Regularize agora.'::text,
    mensagem_urgente text DEFAULT 'URGENTE: {cliente}, dívida de {valor} em atraso há {dias} dias. Entre em contato!'::text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE regua_cobranca_automacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.regua_cobranca_automacao IS 'Configurações de automação da régua de cobrança. Agente: @agente-supabase';


--
-- Name: routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    shift public.shift_type DEFAULT 'manha'::public.shift_type NOT NULL,
    vehicle_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    birth_date date,
    school text NOT NULL,
    grade text,
    pickup_address text NOT NULL,
    guardian_id uuid,
    guardian_name text NOT NULL,
    guardian_phone text NOT NULL,
    route_id uuid,
    monthly_fee numeric(10,2) DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reference_month date NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plan_name text DEFAULT 'mensal'::text NOT NULL,
    monthly_amount numeric(10,2) DEFAULT 0 NOT NULL,
    started_at date DEFAULT CURRENT_DATE NOT NULL,
    next_due_date date DEFAULT ((CURRENT_DATE + '30 days'::interval))::date NOT NULL,
    block_after_days integer DEFAULT 15 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    contact_email text,
    contact_phone text,
    status public.tenant_status DEFAULT 'ativo'::public.tenant_status NOT NULL,
    blocked_at timestamp with time zone,
    blocked_reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transacoes_cartao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transacoes_cartao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    user_id uuid,
    data_transacao date NOT NULL,
    data_pagamento date,
    bandeira character varying(20) NOT NULL,
    valor_bruto numeric(15,2) NOT NULL,
    taxa_percentual numeric(5,4) DEFAULT 0,
    valor_taxa numeric(15,2) DEFAULT 0,
    valor_liquido numeric(15,2) NOT NULL,
    numero_cartao_mascara character varying(4),
    nsu character varying(50),
    codigo_autorizacao character varying(20),
    tipo_transacao character varying(20) DEFAULT 'credito'::character varying,
    numero_parcelas integer DEFAULT 1,
    parcela_atual integer DEFAULT 1,
    status character varying(20) DEFAULT 'pendente'::character varying,
    conciliado_com uuid,
    conciliado_tipo character varying(20),
    conciliado_em timestamp with time zone,
    score_conciliacao numeric(5,2),
    linha_extrato text,
    arquivo_origem character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT transacoes_cartao_bandeira_check CHECK (((bandeira)::text = ANY ((ARRAY['visa'::character varying, 'mastercard'::character varying, 'elo'::character varying, 'amex'::character varying, 'hipercard'::character varying, 'diners'::character varying, 'discover'::character varying, 'jcb'::character varying, 'outros'::character varying])::text[]))),
    CONSTRAINT transacoes_cartao_conciliado_tipo_check CHECK (((conciliado_tipo)::text = ANY ((ARRAY['conta_receber'::character varying, 'lancamento'::character varying])::text[]))),
    CONSTRAINT transacoes_cartao_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'conciliado'::character varying, 'divergente'::character varying, 'chargeback'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT transacoes_cartao_tipo_transacao_check CHECK (((tipo_transacao)::text = ANY ((ARRAY['credito'::character varying, 'debito'::character varying, 'parcelado'::character varying])::text[])))
);


--
-- Name: TABLE transacoes_cartao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.transacoes_cartao IS 'Transações de cartão importadas das operadoras para conciliação. Agente: @agente-supabase';


--
-- Name: transferencias_contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transferencias_contas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conta_origem_id uuid,
    conta_destino_id uuid,
    valor numeric NOT NULL,
    data_transferencia date DEFAULT CURRENT_DATE NOT NULL,
    descricao text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_trials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_trials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    trial_start timestamp with time zone DEFAULT now() NOT NULL,
    trial_end timestamp with time zone DEFAULT (now() + '5 days'::interval) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usuario_empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_empresas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    empresa_id uuid NOT NULL,
    role text DEFAULT 'operador'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT usuario_empresas_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'operador'::text, 'visualizador'::text])))
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    email text NOT NULL,
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    role text DEFAULT 'user'::text NOT NULL
);


--
-- Name: v_categorias_com_plano; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_categorias_com_plano AS
 SELECT c.id,
    c.user_id,
    c.nome,
    c.tipo,
    c.descricao,
    c.ativo,
    c.created_at,
    c.updated_at,
    c.plano_conta_id,
    pc.codigo_conta AS plano_codigo,
    pc.descricao AS plano_descricao,
    pc.natureza AS plano_natureza,
        CASE
            WHEN (pc.id IS NOT NULL) THEN true
            ELSE false
        END AS vinculado
   FROM (public.categorias c
     LEFT JOIN public.plano_contas pc ON ((c.plano_conta_id = pc.id)))
  WHERE (c.ativo = true);


--
-- Name: VIEW v_categorias_com_plano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_categorias_com_plano IS 'View com categorias e informações do plano de contas vinculado';


--
-- Name: v_contabilidade_lancamentos_pendentes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_contabilidade_lancamentos_pendentes AS
 SELECT cli.id,
    cli.sincronizacao_id,
    cli.config_id,
    cli.user_id,
    cli.lancamento_erp_id,
    cli.data_lancamento,
    cli.data_competencia,
    cli.tipo,
    cli.conta_contabil,
    cli.historico,
    cli.valor,
    cli.centro_custo,
    cli.documento,
    cli.conciliado,
    cli.lancamento_financeiro_vinculado_id,
    cli.dados_originais,
    cli.created_at,
    cli.updated_at,
    cec.nome_configuracao,
    cec.erp_tipo
   FROM (public.contabilidade_lancamentos_importados cli
     JOIN public.contabilidade_erp_config cec ON ((cec.id = cli.config_id)))
  WHERE ((cli.conciliado = false) AND (cli.user_id = auth.uid()));


--
-- Name: VIEW v_contabilidade_lancamentos_pendentes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_contabilidade_lancamentos_pendentes IS 'Lancamentos importados pendentes de conciliacao';


--
-- Name: v_contabilidade_sincronizacao_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_contabilidade_sincronizacao_resumo AS
 SELECT cec.id AS config_id,
    cec.nome_configuracao,
    cec.erp_tipo,
    cec.status_conexao,
    cec.ultima_sincronizacao,
    count(cs.id) AS total_sincronizacoes,
    count(cs.id) FILTER (WHERE (cs.status = 'sucesso'::public.status_sincronizacao)) AS sincronizacoes_sucesso,
    count(cs.id) FILTER (WHERE (cs.status = 'erro'::public.status_sincronizacao)) AS sincronizacoes_erro,
    max(cs.created_at) AS ultima_tentativa,
    COALESCE(sum(cs.registros_sucesso), (0)::bigint) AS total_registros_processados
   FROM (public.contabilidade_erp_config cec
     LEFT JOIN public.contabilidade_sincronizacao cs ON ((cs.config_id = cec.id)))
  WHERE (cec.user_id = auth.uid())
  GROUP BY cec.id, cec.nome_configuracao, cec.erp_tipo, cec.status_conexao, cec.ultima_sincronizacao;


--
-- Name: VIEW v_contabilidade_sincronizacao_resumo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_contabilidade_sincronizacao_resumo IS 'Resumo de sincronizacoes por configuracao (sem dados sensiveis)';


--
-- Name: v_garantias_ativas_mecanico; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_garantias_ativas_mecanico AS
 SELECT oi.id AS item_id,
    oi.os_id,
    os.numero AS os_numero,
    oi.descricao,
    oi.tipo,
    oi.garantia_dias,
    oi.garantia_data_vencimento,
    oi.tem_garantia,
    os.cliente_id,
    os.veiculo_id,
    os.user_id,
    os.data_entrada,
    os.data_conclusao
   FROM (public.os_itens_mecanico oi
     JOIN public.ordens_servico_mecanico os ON ((os.id = oi.os_id)))
  WHERE ((oi.tem_garantia = true) AND (os.user_id = auth.uid()));


--
-- Name: veiculos_mecanico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.veiculos_mecanico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    placa text NOT NULL,
    marca text,
    modelo text,
    ano integer,
    cor text,
    km_atual integer DEFAULT 0,
    km_proxima_revisao integer,
    data_proxima_revisao date,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: v_historico_veiculo_mecanico; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_historico_veiculo_mecanico WITH (security_invoker='true') AS
 SELECT v.id AS veiculo_id,
    v.placa,
    v.marca,
    v.modelo,
    v.ano,
    v.cor,
    v.km_atual,
    v.km_proxima_revisao,
    v.data_proxima_revisao,
    v.cliente_id,
    c.nome AS cliente_nome,
    os.id AS os_id,
    os.numero,
    os.data_entrada,
    os.km_entrada,
    os.status,
    os.total,
    COALESCE(jsonb_agg(jsonb_build_object('id', oi.id, 'tipo', oi.tipo, 'descricao', oi.descricao, 'quantidade', oi.quantidade, 'preco_unitario', oi.preco_unitario, 'subtotal', oi.subtotal) ORDER BY oi.tipo, oi.descricao) FILTER (WHERE (oi.id IS NOT NULL)), '[]'::jsonb) AS itens
   FROM (((public.veiculos_mecanico v
     LEFT JOIN public.clientes_mecanico c ON ((c.id = v.cliente_id)))
     LEFT JOIN public.ordens_servico_mecanico os ON ((os.veiculo_id = v.id)))
     LEFT JOIN public.os_itens_mecanico oi ON ((oi.os_id = os.id)))
  GROUP BY v.id, v.placa, v.marca, v.modelo, v.ano, v.cor, v.km_atual, v.km_proxima_revisao, v.data_proxima_revisao, v.cliente_id, c.nome, os.id, os.numero, os.data_entrada, os.km_entrada, os.status, os.total;


--
-- Name: v_open_banking_conciliacao_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_open_banking_conciliacao_resumo AS
 SELECT integracao_id,
    count(*) AS total_transacoes,
    count(*) FILTER (WHERE (conciliado = true)) AS conciliadas,
    count(*) FILTER (WHERE ((conciliado = false) AND (ignorado = false))) AS pendentes,
    count(*) FILTER (WHERE (ignorado = true)) AS ignoradas,
    sum(valor) FILTER (WHERE (tipo = 'entrada'::public.open_banking_tipo_transacao)) AS total_entradas,
    sum(valor) FILTER (WHERE (tipo = 'saida'::public.open_banking_tipo_transacao)) AS total_saidas
   FROM public.open_banking_extratos
  GROUP BY integracao_id;


--
-- Name: v_open_banking_extratos_completo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_open_banking_extratos_completo AS
 SELECT e.id,
    e.integracao_id,
    e.transacao_id,
    e.transacao_id_externo,
    e.data_transacao,
    e.data_lancamento,
    e.hora_transacao,
    e.descricao,
    e.descricao_original,
    e.valor,
    e.tipo,
    e.categoria_banco,
    e.subcategoria_banco,
    e.codigo_mcc,
    e.nome_estabelecimento,
    e.cidade_transacao,
    e.conta_numero_snapshot,
    e.agencia_snapshot,
    e.saldo_apos_transacao,
    e.comprovante_url,
    e.comprovante_storage_path,
    e.conciliado,
    e.conciliado_at,
    e.conciliado_por,
    e.lancamento_vinculado_id,
    e.conta_receber_vinculada_id,
    e.conta_pagar_vinculada_id,
    e.importado_por,
    e.importado_via,
    e.ignorado,
    e.ignorado_por,
    e.ignorado_at,
    e.ignorado_motivo,
    e.created_at,
    e.updated_at,
    i.banco_codigo,
    i.banco_nome,
    i.agencia AS integracao_agencia,
    i.conta_numero AS integracao_conta
   FROM (public.open_banking_extratos e
     JOIN public.open_banking_integracoes i ON ((i.id = e.integracao_id)));


--
-- Name: VIEW v_open_banking_extratos_completo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_open_banking_extratos_completo IS 'View de extratos com dados da integracao (tokens ocultos)';


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plate text NOT NULL,
    model text NOT NULL,
    year integer,
    capacity integer DEFAULT 15 NOT NULL,
    driver_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: veiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.veiculos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    placa text NOT NULL,
    marca text,
    modelo text,
    ano integer,
    cor text,
    km_atual integer DEFAULT 0,
    km_proxima_revisao integer,
    data_proxima_revisao date,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: venda_itens_oficina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venda_itens_oficina (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venda_id uuid NOT NULL,
    peca_id uuid NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    preco_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.venda_itens_oficina FORCE ROW LEVEL SECURITY;


--
-- Name: vendas_oficina; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendas_oficina (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text,
    cliente_id uuid,
    vendedor text DEFAULT ''::text,
    forma_pagamento text DEFAULT 'dinheiro'::text,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    desconto numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'finalizada'::text,
    data timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    CONSTRAINT vendas_oficina_forma_pagamento_check CHECK ((forma_pagamento = ANY (ARRAY['dinheiro'::text, 'cartao'::text, 'pix'::text, 'boleto'::text, 'prazo'::text]))),
    CONSTRAINT vendas_oficina_status_check CHECK ((status = ANY (ARRAY['finalizada'::text, 'cancelada'::text, 'pendente'::text])))
);

ALTER TABLE ONLY public.vendas_oficina FORCE ROW LEVEL SECURITY;


--
-- Name: view_transacoes_cartao_segura; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_transacoes_cartao_segura AS
 SELECT id,
    empresa_id,
    data_transacao,
    data_pagamento,
    bandeira,
    valor_bruto,
    taxa_percentual,
    valor_taxa,
    valor_liquido,
    numero_cartao_mascara,
    nsu,
    codigo_autorizacao,
    tipo_transacao,
    numero_parcelas,
    parcela_atual,
    status,
    conciliado_com,
    conciliado_tipo,
    conciliado_em,
    score_conciliacao,
    created_at,
    updated_at
   FROM public.transacoes_cartao;


--
-- Name: whatsapp_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reminder_type text NOT NULL,
    label text NOT NULL,
    template text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
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


--
-- Name: messages_2026_05_18; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_05_19; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_19 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_05_20; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_20 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_05_21; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_21 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_05_22; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_05_23; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_23 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2026_05_24; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2026_05_24 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
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


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
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
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
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
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
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


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: messages_2026_05_18; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_18 FOR VALUES FROM ('2026-05-18 00:00:00') TO ('2026-05-19 00:00:00');


--
-- Name: messages_2026_05_19; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_19 FOR VALUES FROM ('2026-05-19 00:00:00') TO ('2026-05-20 00:00:00');


--
-- Name: messages_2026_05_20; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_20 FOR VALUES FROM ('2026-05-20 00:00:00') TO ('2026-05-21 00:00:00');


--
-- Name: messages_2026_05_21; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_21 FOR VALUES FROM ('2026-05-21 00:00:00') TO ('2026-05-22 00:00:00');


--
-- Name: messages_2026_05_22; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_22 FOR VALUES FROM ('2026-05-22 00:00:00') TO ('2026-05-23 00:00:00');


--
-- Name: messages_2026_05_23; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_23 FOR VALUES FROM ('2026-05-23 00:00:00') TO ('2026-05-24 00:00:00');


--
-- Name: messages_2026_05_24; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2026_05_24 FOR VALUES FROM ('2026-05-24 00:00:00') TO ('2026-05-25 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: agendamentos_mecanico agendamentos_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos_mecanico
    ADD CONSTRAINT agendamentos_mecanico_pkey PRIMARY KEY (id);


--
-- Name: agendamentos agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_pkey PRIMARY KEY (id);


--
-- Name: anexos anexos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT anexos_pkey PRIMARY KEY (id);


--
-- Name: aplicacoes aplicacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aplicacoes
    ADD CONSTRAINT aplicacoes_pkey PRIMARY KEY (id);


--
-- Name: assinaturas_mecanico assinaturas_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_mecanico
    ADD CONSTRAINT assinaturas_mecanico_pkey PRIMARY KEY (id);


--
-- Name: assinaturas_oficina assinaturas_oficina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_oficina
    ADD CONSTRAINT assinaturas_oficina_pkey PRIMARY KEY (id);


--
-- Name: assinaturas assinaturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas
    ADD CONSTRAINT assinaturas_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auditoria_transacoes_cartao auditoria_transacoes_cartao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_transacoes_cartao
    ADD CONSTRAINT auditoria_transacoes_cartao_pkey PRIMARY KEY (id);


--
-- Name: bancos_cartoes bancos_cartoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bancos_cartoes
    ADD CONSTRAINT bancos_cartoes_pkey PRIMARY KEY (id);


--
-- Name: budget_planning_lines budget_planning_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_planning_lines
    ADD CONSTRAINT budget_planning_lines_pkey PRIMARY KEY (id);


--
-- Name: budget_planning_lines budget_planning_lines_plano_conta_id_fiscal_year_empresa_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_planning_lines
    ADD CONSTRAINT budget_planning_lines_plano_conta_id_fiscal_year_empresa_id_key UNIQUE (plano_conta_id, fiscal_year, empresa_id, user_id);


--
-- Name: card_aliquotas_reforma card_aliquotas_reforma_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_aliquotas_reforma
    ADD CONSTRAINT card_aliquotas_reforma_ano_key UNIQUE (ano);


--
-- Name: card_aliquotas_reforma card_aliquotas_reforma_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_aliquotas_reforma
    ADD CONSTRAINT card_aliquotas_reforma_pkey PRIMARY KEY (id);


--
-- Name: card_audit_logs card_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_audit_logs
    ADD CONSTRAINT card_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: card_dashboard_cache card_dashboard_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_dashboard_cache
    ADD CONSTRAINT card_dashboard_cache_pkey PRIMARY KEY (id);


--
-- Name: card_dashboard_cache card_dashboard_cache_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_dashboard_cache
    ADD CONSTRAINT card_dashboard_cache_user_id_key UNIQUE (user_id);


--
-- Name: card_importacoes card_importacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_importacoes
    ADD CONSTRAINT card_importacoes_pkey PRIMARY KEY (id);


--
-- Name: card_relatorios_gerados card_relatorios_gerados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relatorios_gerados
    ADD CONSTRAINT card_relatorios_gerados_pkey PRIMARY KEY (id);


--
-- Name: card_report_config card_report_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_report_config
    ADD CONSTRAINT card_report_config_pkey PRIMARY KEY (id);


--
-- Name: card_report_config card_report_config_user_id_nome_relatorio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_report_config
    ADD CONSTRAINT card_report_config_user_id_nome_relatorio_key UNIQUE (user_id, nome_relatorio);


--
-- Name: card_simulacoes_salvas card_simulacoes_salvas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_simulacoes_salvas
    ADD CONSTRAINT card_simulacoes_salvas_pkey PRIMARY KEY (id);


--
-- Name: card_split_simulacoes card_split_simulacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_split_simulacoes
    ADD CONSTRAINT card_split_simulacoes_pkey PRIMARY KEY (id);


--
-- Name: card_transacoes_brutas card_transacoes_brutas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_transacoes_brutas
    ADD CONSTRAINT card_transacoes_brutas_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: certificados_nfse certificados_nfse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificados_nfse
    ADD CONSTRAINT certificados_nfse_pkey PRIMARY KEY (id);


--
-- Name: clientes_mecanico clientes_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_mecanico
    ADD CONSTRAINT clientes_mecanico_pkey PRIMARY KEY (id);


--
-- Name: clientes_oficina clientes_oficina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_oficina
    ADD CONSTRAINT clientes_oficina_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cobranca_historico cobranca_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobranca_historico
    ADD CONSTRAINT cobranca_historico_pkey PRIMARY KEY (id);


--
-- Name: comissoes_mecanico comissoes_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_mecanico
    ADD CONSTRAINT comissoes_mecanico_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_cartao configuracoes_cartao_empresa_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_cartao
    ADD CONSTRAINT configuracoes_cartao_empresa_id_key UNIQUE (empresa_id);


--
-- Name: configuracoes_cartao configuracoes_cartao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_cartao
    ADD CONSTRAINT configuracoes_cartao_pkey PRIMARY KEY (id);


--
-- Name: configuracoes configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_pkey PRIMARY KEY (id);


--
-- Name: contabilidade_erp_config contabilidade_erp_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_erp_config
    ADD CONSTRAINT contabilidade_erp_config_pkey PRIMARY KEY (id);


--
-- Name: contabilidade_lancamentos_importados contabilidade_lancamentos_importados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_lancamentos_importados
    ADD CONSTRAINT contabilidade_lancamentos_importados_pkey PRIMARY KEY (id);


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_mapeamento_contas
    ADD CONSTRAINT contabilidade_mapeamento_contas_pkey PRIMARY KEY (id);


--
-- Name: contabilidade_sincronizacao contabilidade_sincronizacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_sincronizacao
    ADD CONSTRAINT contabilidade_sincronizacao_pkey PRIMARY KEY (id);


--
-- Name: contador_config contador_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contador_config
    ADD CONSTRAINT contador_config_pkey PRIMARY KEY (id);


--
-- Name: contador_config contador_config_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contador_config
    ADD CONSTRAINT contador_config_user_id_key UNIQUE (user_id);


--
-- Name: contador_documentos contador_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contador_documentos
    ADD CONSTRAINT contador_documentos_pkey PRIMARY KEY (id);


--
-- Name: contas_pagar contas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_pkey PRIMARY KEY (id);


--
-- Name: contas_receber contas_receber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_pkey PRIMARY KEY (id);


--
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id);


--
-- Name: empresa empresa_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_user_id_key UNIQUE (user_id);


--
-- Name: empresas empresas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_cnpj_key UNIQUE (cnpj);


--
-- Name: empresas_mecanico empresas_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_mecanico
    ADD CONSTRAINT empresas_mecanico_pkey PRIMARY KEY (id);


--
-- Name: empresas_mecanico empresas_mecanico_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_mecanico
    ADD CONSTRAINT empresas_mecanico_user_id_unique UNIQUE (user_id);


--
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- Name: extrato_bancario extrato_bancario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extrato_bancario
    ADD CONSTRAINT extrato_bancario_pkey PRIMARY KEY (id);


--
-- Name: fechamentos_mensais fechamentos_mensais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_pkey PRIMARY KEY (id);


--
-- Name: fechamentos_mensais fechamentos_mensais_user_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_user_id_mes_ano_key UNIQUE (user_id, mes, ano);


--
-- Name: financeiro_lancamentos financeiro_lancamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro_lancamentos
    ADD CONSTRAINT financeiro_lancamentos_pkey PRIMARY KEY (id);


--
-- Name: financeiro_mecanico financeiro_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro_mecanico
    ADD CONSTRAINT financeiro_mecanico_pkey PRIMARY KEY (id);


--
-- Name: financeiro financeiro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_pkey PRIMARY KEY (id);


--
-- Name: fornecedor_catalogo_mecanico fornecedor_catalogo_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedor_catalogo_mecanico
    ADD CONSTRAINT fornecedor_catalogo_mecanico_pkey PRIMARY KEY (id);


--
-- Name: fornecedores_mecanico fornecedores_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores_mecanico
    ADD CONSTRAINT fornecedores_mecanico_pkey PRIMARY KEY (id);


--
-- Name: fornecedores_oficina fornecedores_oficina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores_oficina
    ADD CONSTRAINT fornecedores_oficina_pkey PRIMARY KEY (id);


--
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (id);


--
-- Name: funcionarios_mecanico funcionarios_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_mecanico
    ADD CONSTRAINT funcionarios_mecanico_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_student_id_reference_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_id_reference_month_key UNIQUE (student_id, reference_month);


--
-- Name: lancamentos_caixa lancamentos_caixa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_caixa
    ADD CONSTRAINT lancamentos_caixa_pkey PRIMARY KEY (id);


--
-- Name: leads_diagnostico leads_diagnostico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads_diagnostico
    ADD CONSTRAINT leads_diagnostico_pkey PRIMARY KEY (id);


--
-- Name: licencas_software licencas_software_chave_licenca_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_software
    ADD CONSTRAINT licencas_software_chave_licenca_key UNIQUE (chave_licenca);


--
-- Name: licencas_software licencas_software_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_software
    ADD CONSTRAINT licencas_software_pkey PRIMARY KEY (id);


--
-- Name: mapeamento_contabil mapeamento_contabil_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapeamento_contabil
    ADD CONSTRAINT mapeamento_contabil_pkey PRIMARY KEY (id);


--
-- Name: mapeamento_contabil mapeamento_unico; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapeamento_contabil
    ADD CONSTRAINT mapeamento_unico UNIQUE (user_id, empresa_id, categoria_id, tipo_lancamento);


--
-- Name: metas_orcamentarias metas_orcamentarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas_orcamentarias
    ADD CONSTRAINT metas_orcamentarias_pkey PRIMARY KEY (id);


--
-- Name: metas_orcamentarias metas_orcamentarias_user_id_categoria_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas_orcamentarias
    ADD CONSTRAINT metas_orcamentarias_user_id_categoria_id_mes_ano_key UNIQUE (user_id, categoria_id, mes, ano);


--
-- Name: moto_aplicacoes moto_aplicacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moto_aplicacoes
    ADD CONSTRAINT moto_aplicacoes_pkey PRIMARY KEY (id);


--
-- Name: moto_pecas moto_pecas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moto_pecas
    ADD CONSTRAINT moto_pecas_pkey PRIMARY KEY (id);


--
-- Name: nfs_e_emitentes nfs_e_emitentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfs_e_emitentes
    ADD CONSTRAINT nfs_e_emitentes_pkey PRIMARY KEY (id);


--
-- Name: nfs_e_notas nfs_e_notas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfs_e_notas
    ADD CONSTRAINT nfs_e_notas_pkey PRIMARY KEY (id);


--
-- Name: nfs_e_rascunhos nfs_e_rascunhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfs_e_rascunhos
    ADD CONSTRAINT nfs_e_rascunhos_pkey PRIMARY KEY (id);


--
-- Name: nfse_cron_logs nfse_cron_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_cron_logs
    ADD CONSTRAINT nfse_cron_logs_pkey PRIMARY KEY (id);


--
-- Name: nfse_rascunhos nfse_rascunhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_rascunhos
    ADD CONSTRAINT nfse_rascunhos_pkey PRIMARY KEY (id);


--
-- Name: nfse_sync_logs nfse_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_sync_logs
    ADD CONSTRAINT nfse_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: notas_fiscais_servico notas_fiscais_servico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_fiscais_servico
    ADD CONSTRAINT notas_fiscais_servico_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_admin notificacoes_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_pkey PRIMARY KEY (id);


--
-- Name: obd2_leituras_mecanico obd2_leituras_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obd2_leituras_mecanico
    ADD CONSTRAINT obd2_leituras_mecanico_pkey PRIMARY KEY (id);


--
-- Name: open_banking_bancos_suportados open_banking_bancos_suportados_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_bancos_suportados
    ADD CONSTRAINT open_banking_bancos_suportados_codigo_key UNIQUE (codigo);


--
-- Name: open_banking_bancos_suportados open_banking_bancos_suportados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_bancos_suportados
    ADD CONSTRAINT open_banking_bancos_suportados_pkey PRIMARY KEY (id);


--
-- Name: open_banking_extratos open_banking_extratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_pkey PRIMARY KEY (id);


--
-- Name: open_banking_integracoes open_banking_integracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_integracoes
    ADD CONSTRAINT open_banking_integracoes_pkey PRIMARY KEY (id);


--
-- Name: open_banking_logs open_banking_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_logs
    ADD CONSTRAINT open_banking_logs_pkey PRIMARY KEY (id);


--
-- Name: orcamento_itens_mecanico orcamento_itens_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamento_itens_mecanico
    ADD CONSTRAINT orcamento_itens_mecanico_pkey PRIMARY KEY (id);


--
-- Name: orcamentos_mecanico orcamentos_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos_mecanico
    ADD CONSTRAINT orcamentos_mecanico_pkey PRIMARY KEY (id);


--
-- Name: ordem_servico_itens ordem_servico_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordem_servico_itens
    ADD CONSTRAINT ordem_servico_itens_pkey PRIMARY KEY (id);


--
-- Name: ordens_servico_mecanico ordens_servico_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico_mecanico
    ADD CONSTRAINT ordens_servico_mecanico_pkey PRIMARY KEY (id);


--
-- Name: ordens_servico ordens_servico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico
    ADD CONSTRAINT ordens_servico_pkey PRIMARY KEY (id);


--
-- Name: os_itens_mecanico os_itens_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.os_itens_mecanico
    ADD CONSTRAINT os_itens_mecanico_pkey PRIMARY KEY (id);


--
-- Name: os_itens os_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.os_itens
    ADD CONSTRAINT os_itens_pkey PRIMARY KEY (id);


--
-- Name: payment_reminders payment_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_pkey PRIMARY KEY (id);


--
-- Name: pecas_mecanico pecas_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pecas_mecanico
    ADD CONSTRAINT pecas_mecanico_pkey PRIMARY KEY (id);


--
-- Name: pecas pecas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pecas
    ADD CONSTRAINT pecas_pkey PRIMARY KEY (id);


--
-- Name: plano_contas plano_contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plano_contas
    ADD CONSTRAINT plano_contas_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: rate_limit_uploads rate_limit_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_uploads
    ADD CONSTRAINT rate_limit_uploads_pkey PRIMARY KEY (user_id);


--
-- Name: regua_cobranca_automacao regua_cobranca_automacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regua_cobranca_automacao
    ADD CONSTRAINT regua_cobranca_automacao_pkey PRIMARY KEY (id);


--
-- Name: regua_cobranca_automacao regua_cobranca_automacao_user_id_empresa_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regua_cobranca_automacao
    ADD CONSTRAINT regua_cobranca_automacao_user_id_empresa_id_key UNIQUE (user_id, empresa_id);


--
-- Name: regua_cobranca regua_cobranca_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regua_cobranca
    ADD CONSTRAINT regua_cobranca_pkey PRIMARY KEY (id);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: settings settings_user_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_user_id_key_key UNIQUE (user_id, key);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscription_payments tenant_subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscription_payments
    ADD CONSTRAINT tenant_subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscription_payments tenant_subscription_payments_tenant_id_reference_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscription_payments
    ADD CONSTRAINT tenant_subscription_payments_tenant_id_reference_month_key UNIQUE (tenant_id, reference_month);


--
-- Name: tenant_subscriptions tenant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscriptions tenant_subscriptions_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: transacoes_cartao transacoes_cartao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_cartao
    ADD CONSTRAINT transacoes_cartao_pkey PRIMARY KEY (id);


--
-- Name: transferencias_contas transferencias_contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_contas
    ADD CONSTRAINT transferencias_contas_pkey PRIMARY KEY (id);


--
-- Name: open_banking_extratos unique_transacao_integracao; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT unique_transacao_integracao UNIQUE (integracao_id, transacao_id);


--
-- Name: open_banking_integracoes unique_user_banco_conta; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_integracoes
    ADD CONSTRAINT unique_user_banco_conta UNIQUE (user_id, banco_codigo, conta_numero);


--
-- Name: certificados_nfse unique_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificados_nfse
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);


--
-- Name: nfse_rascunhos uq_nfse_rascunho_usuario; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_rascunhos
    ADD CONSTRAINT uq_nfse_rascunho_usuario UNIQUE (user_id);


--
-- Name: nfs_e_notas uq_numero_nota_emitente; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfs_e_notas
    ADD CONSTRAINT uq_numero_nota_emitente UNIQUE (emitente_id, numero_nota, serie);


--
-- Name: nfs_e_rascunhos uq_rascunho_usuario_empresa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfs_e_rascunhos
    ADD CONSTRAINT uq_rascunho_usuario_empresa UNIQUE (empresa_id, user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_trials user_trials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trials
    ADD CONSTRAINT user_trials_pkey PRIMARY KEY (id);


--
-- Name: user_trials user_trials_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trials
    ADD CONSTRAINT user_trials_user_id_key UNIQUE (user_id);


--
-- Name: usuario_empresas usuario_empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_empresas
    ADD CONSTRAINT usuario_empresas_pkey PRIMARY KEY (id);


--
-- Name: usuario_empresas usuario_empresas_user_id_empresa_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_empresas
    ADD CONSTRAINT usuario_empresas_user_id_empresa_id_key UNIQUE (user_id, empresa_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_plate_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_key UNIQUE (plate);


--
-- Name: veiculos_mecanico veiculos_mecanico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.veiculos_mecanico
    ADD CONSTRAINT veiculos_mecanico_pkey PRIMARY KEY (id);


--
-- Name: veiculos veiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.veiculos
    ADD CONSTRAINT veiculos_pkey PRIMARY KEY (id);


--
-- Name: venda_itens_oficina venda_itens_oficina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venda_itens_oficina
    ADD CONSTRAINT venda_itens_oficina_pkey PRIMARY KEY (id);


--
-- Name: vendas_oficina vendas_oficina_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas_oficina
    ADD CONSTRAINT vendas_oficina_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_templates whatsapp_templates_reminder_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_reminder_type_key UNIQUE (reminder_type);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_18 messages_2026_05_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_18
    ADD CONSTRAINT messages_2026_05_18_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_19 messages_2026_05_19_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_19
    ADD CONSTRAINT messages_2026_05_19_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_20 messages_2026_05_20_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_20
    ADD CONSTRAINT messages_2026_05_20_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_21 messages_2026_05_21_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_21
    ADD CONSTRAINT messages_2026_05_21_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_22 messages_2026_05_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_22
    ADD CONSTRAINT messages_2026_05_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_23 messages_2026_05_23_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_23
    ADD CONSTRAINT messages_2026_05_23_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_05_24 messages_2026_05_24_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2026_05_24
    ADD CONSTRAINT messages_2026_05_24_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: extrato_bancario_fitid_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX extrato_bancario_fitid_user_idx ON public.extrato_bancario USING btree (user_id, fitid) WHERE (fitid IS NOT NULL);


--
-- Name: idx_agend_mecanico_user_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agend_mecanico_user_data ON public.agendamentos_mecanico USING btree (user_id, data_hora);


--
-- Name: idx_agend_user_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agend_user_data ON public.agendamentos USING btree (user_id, data_hora);


--
-- Name: idx_aplicacoes_peca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aplicacoes_peca ON public.aplicacoes USING btree (peca_id);


--
-- Name: idx_assinaturas_oficina_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assinaturas_oficina_user ON public.assinaturas_oficina USING btree (user_id);


--
-- Name: idx_assinaturas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assinaturas_user ON public.assinaturas USING btree (user_id);


--
-- Name: idx_audit_logs_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_table ON public.audit_logs USING btree (table_name, created_at DESC);


--
-- Name: idx_audit_logs_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_auditoria_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_data ON public.auditoria_transacoes_cartao USING btree (created_at);


--
-- Name: idx_auditoria_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_empresa ON public.auditoria_transacoes_cartao USING btree (empresa_id);


--
-- Name: idx_auditoria_operacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_operacao ON public.auditoria_transacoes_cartao USING btree (operacao);


--
-- Name: idx_bancos_cartoes_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bancos_cartoes_user_empresa ON public.bancos_cartoes USING btree (user_id, empresa_id);


--
-- Name: idx_budget_lines_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_lines_empresa ON public.budget_planning_lines USING btree (empresa_id);


--
-- Name: idx_budget_lines_plano_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_lines_plano_conta ON public.budget_planning_lines USING btree (plano_conta_id);


--
-- Name: idx_budget_lines_user_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_lines_user_year ON public.budget_planning_lines USING btree (user_id, fiscal_year);


--
-- Name: idx_card_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_audit_logs_user ON public.card_audit_logs USING btree (user_id);


--
-- Name: idx_card_dashboard_cache_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_dashboard_cache_user ON public.card_dashboard_cache USING btree (user_id);


--
-- Name: idx_card_importacoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_importacoes_user ON public.card_importacoes USING btree (user_id);


--
-- Name: idx_card_relatorios_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_relatorios_user ON public.card_relatorios_gerados USING btree (user_id);


--
-- Name: idx_card_transacoes_adquirente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_transacoes_adquirente ON public.card_transacoes_brutas USING btree (adquirente);


--
-- Name: idx_card_transacoes_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_transacoes_data ON public.card_transacoes_brutas USING btree (data_venda DESC);


--
-- Name: idx_card_transacoes_nsu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_transacoes_nsu ON public.card_transacoes_brutas USING btree (nsu);


--
-- Name: idx_card_transacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_transacoes_status ON public.card_transacoes_brutas USING btree (status_auditoria);


--
-- Name: idx_card_transacoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_transacoes_user ON public.card_transacoes_brutas USING btree (user_id);


--
-- Name: idx_catalogo_busca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_catalogo_busca ON public.fornecedor_catalogo_mecanico USING gin (to_tsvector('portuguese'::regconfig, ((nome || ' '::text) || COALESCE(descricao, ''::text))));


--
-- Name: idx_categorias_plano_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_plano_conta ON public.categorias USING btree (plano_conta_id);


--
-- Name: idx_categorias_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_user ON public.categorias USING btree (user_id);


--
-- Name: idx_categorias_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_user_empresa ON public.categorias USING btree (user_id, empresa_id);


--
-- Name: idx_certificados_nfse_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_nfse_ativo ON public.certificados_nfse USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_certificados_nfse_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificados_nfse_user_id ON public.certificados_nfse USING btree (user_id);


--
-- Name: idx_clientes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_empresa ON public.clientes USING btree (empresa_id);


--
-- Name: idx_clientes_oficina_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_oficina_nome ON public.clientes_oficina USING btree (nome);


--
-- Name: idx_clientes_oficina_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_oficina_user ON public.clientes_oficina USING btree (user_id);


--
-- Name: idx_clientes_oficina_user_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clientes_oficina_user_doc ON public.clientes_oficina USING btree (user_id, doc) WHERE ((doc IS NOT NULL) AND (doc <> ''::text));


--
-- Name: idx_clientes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_user ON public.clientes USING btree (user_id);


--
-- Name: idx_clientes_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_user_empresa ON public.clientes USING btree (user_id, empresa_id);


--
-- Name: idx_cobranca_historico_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cobranca_historico_conta ON public.cobranca_historico USING btree (conta_receber_id);


--
-- Name: idx_cobranca_historico_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cobranca_historico_data ON public.cobranca_historico USING btree (created_at DESC);


--
-- Name: idx_cobranca_historico_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cobranca_historico_tipo ON public.cobranca_historico USING btree (tipo);


--
-- Name: idx_comissoes_mecanico_funcionario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_mecanico_funcionario ON public.comissoes_mecanico USING btree (funcionario_id);


--
-- Name: idx_comissoes_mecanico_os; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_mecanico_os ON public.comissoes_mecanico USING btree (os_id);


--
-- Name: idx_comissoes_mecanico_user_pago; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comissoes_mecanico_user_pago ON public.comissoes_mecanico USING btree (user_id, pago);


--
-- Name: idx_configuracoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracoes_user ON public.configuracoes USING btree (user_id);


--
-- Name: idx_contabilidade_erp_config_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_erp_config_ativo ON public.contabilidade_erp_config USING btree (ativo);


--
-- Name: idx_contabilidade_erp_config_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_erp_config_status ON public.contabilidade_erp_config USING btree (status_conexao);


--
-- Name: idx_contabilidade_erp_config_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_erp_config_tipo ON public.contabilidade_erp_config USING btree (erp_tipo);


--
-- Name: idx_contabilidade_erp_config_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_erp_config_user ON public.contabilidade_erp_config USING btree (user_id);


--
-- Name: idx_contabilidade_lanc_conciliado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_conciliado ON public.contabilidade_lancamentos_importados USING btree (conciliado);


--
-- Name: idx_contabilidade_lanc_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_config ON public.contabilidade_lancamentos_importados USING btree (config_id);


--
-- Name: idx_contabilidade_lanc_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_conta ON public.contabilidade_lancamentos_importados USING btree (conta_contabil);


--
-- Name: idx_contabilidade_lanc_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_data ON public.contabilidade_lancamentos_importados USING btree (data_lancamento);


--
-- Name: idx_contabilidade_lanc_erp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_erp_id ON public.contabilidade_lancamentos_importados USING btree (lancamento_erp_id);


--
-- Name: idx_contabilidade_lanc_sinc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_sinc ON public.contabilidade_lancamentos_importados USING btree (sincronizacao_id);


--
-- Name: idx_contabilidade_lanc_unico; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_contabilidade_lanc_unico ON public.contabilidade_lancamentos_importados USING btree (config_id, lancamento_erp_id);


--
-- Name: idx_contabilidade_lanc_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_user ON public.contabilidade_lancamentos_importados USING btree (user_id);


--
-- Name: idx_contabilidade_lanc_vinculado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_lanc_vinculado ON public.contabilidade_lancamentos_importados USING btree (lancamento_financeiro_vinculado_id);


--
-- Name: idx_contabilidade_mapeamento_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_mapeamento_ativo ON public.contabilidade_mapeamento_contas USING btree (ativo);


--
-- Name: idx_contabilidade_mapeamento_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_mapeamento_categoria ON public.contabilidade_mapeamento_contas USING btree (categoria_id);


--
-- Name: idx_contabilidade_mapeamento_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_mapeamento_config ON public.contabilidade_mapeamento_contas USING btree (config_id);


--
-- Name: idx_contabilidade_mapeamento_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_mapeamento_tipo ON public.contabilidade_mapeamento_contas USING btree (tipo_lancamento);


--
-- Name: idx_contabilidade_mapeamento_unico; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_contabilidade_mapeamento_unico ON public.contabilidade_mapeamento_contas USING btree (config_id, categoria_id, tipo_lancamento) WHERE (categoria_id IS NOT NULL);


--
-- Name: idx_contabilidade_mapeamento_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_mapeamento_user ON public.contabilidade_mapeamento_contas USING btree (user_id);


--
-- Name: idx_contabilidade_sinc_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_sinc_config ON public.contabilidade_sincronizacao USING btree (config_id);


--
-- Name: idx_contabilidade_sinc_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_sinc_created ON public.contabilidade_sincronizacao USING btree (created_at DESC);


--
-- Name: idx_contabilidade_sinc_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_sinc_periodo ON public.contabilidade_sincronizacao USING btree (periodo_inicio, periodo_fim);


--
-- Name: idx_contabilidade_sinc_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_sinc_status ON public.contabilidade_sincronizacao USING btree (status);


--
-- Name: idx_contabilidade_sinc_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_sinc_tipo ON public.contabilidade_sincronizacao USING btree (tipo_operacao);


--
-- Name: idx_contabilidade_sinc_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contabilidade_sinc_user ON public.contabilidade_sincronizacao USING btree (user_id);


--
-- Name: idx_contas_pagar_banco_cartao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_banco_cartao_id ON public.contas_pagar USING btree (banco_cartao_id);


--
-- Name: idx_contas_pagar_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_status ON public.contas_pagar USING btree (status);


--
-- Name: idx_contas_pagar_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_user ON public.contas_pagar USING btree (user_id);


--
-- Name: idx_contas_pagar_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_user_empresa ON public.contas_pagar USING btree (user_id, empresa_id);


--
-- Name: idx_contas_pagar_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar USING btree (data_vencimento);


--
-- Name: idx_contas_receber_banco_cartao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_banco_cartao_id ON public.contas_receber USING btree (banco_cartao_id);


--
-- Name: idx_contas_receber_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_cliente_id ON public.contas_receber USING btree (cliente_id);


--
-- Name: idx_contas_receber_data_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_data_vencimento ON public.contas_receber USING btree (data_vencimento);


--
-- Name: idx_contas_receber_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_status ON public.contas_receber USING btree (status);


--
-- Name: idx_contas_receber_status_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_status_vencimento ON public.contas_receber USING btree (status, data_vencimento) WHERE (status = ANY (ARRAY['pendente'::text, 'vencido'::text]));


--
-- Name: idx_contas_receber_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_user ON public.contas_receber USING btree (user_id);


--
-- Name: idx_contas_receber_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_user_empresa ON public.contas_receber USING btree (user_id, empresa_id);


--
-- Name: idx_contas_receber_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber USING btree (data_vencimento);


--
-- Name: idx_extrato_bancario_banco_cartao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_banco_cartao_id ON public.extrato_bancario USING btree (banco_cartao_id);


--
-- Name: idx_extrato_bancario_composto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_composto ON public.extrato_bancario USING btree (banco_cartao_id, conciliado, data_transacao);


--
-- Name: idx_extrato_bancario_conciliado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_conciliado ON public.extrato_bancario USING btree (conciliado) WHERE (conciliado = false);


--
-- Name: idx_extrato_bancario_data_transacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_data_transacao ON public.extrato_bancario USING btree (data_transacao);


--
-- Name: idx_extrato_bancario_descricao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_descricao ON public.extrato_bancario USING gin (to_tsvector('portuguese'::regconfig, descricao));


--
-- Name: idx_extrato_bancario_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_user_empresa ON public.extrato_bancario USING btree (user_id, empresa_id);


--
-- Name: idx_extrato_bancario_valor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_bancario_valor ON public.extrato_bancario USING btree (valor);


--
-- Name: idx_extrato_matching; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_matching ON public.extrato_bancario USING btree (tipo, valor, data_transacao, conciliado, origem);


--
-- Name: idx_extrato_status_conciliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extrato_status_conciliacao ON public.extrato_bancario USING btree (status_conciliacao);


--
-- Name: idx_fin_mecanico_tipo_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_mecanico_tipo_cat ON public.financeiro_mecanico USING btree (user_id, tipo, categoria, data_vencimento);


--
-- Name: idx_fin_mecanico_user_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_mecanico_user_data ON public.financeiro_mecanico USING btree (user_id, data_vencimento);


--
-- Name: idx_fin_user_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_user_data ON public.financeiro USING btree (user_id, data_vencimento);


--
-- Name: idx_financeiro_lancamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financeiro_lancamentos_status ON public.financeiro_lancamentos USING btree (status);


--
-- Name: idx_financeiro_lancamentos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financeiro_lancamentos_tipo ON public.financeiro_lancamentos USING btree (tipo);


--
-- Name: idx_financeiro_lancamentos_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financeiro_lancamentos_user ON public.financeiro_lancamentos USING btree (user_id);


--
-- Name: idx_financeiro_lancamentos_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financeiro_lancamentos_vencimento ON public.financeiro_lancamentos USING btree (vencimento);


--
-- Name: idx_fornecedores_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_empresa ON public.fornecedores USING btree (empresa_id);


--
-- Name: idx_fornecedores_oficina_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_oficina_nome ON public.fornecedores_oficina USING btree (nome);


--
-- Name: idx_fornecedores_oficina_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_oficina_user ON public.fornecedores_oficina USING btree (user_id);


--
-- Name: idx_fornecedores_oficina_user_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fornecedores_oficina_user_cnpj ON public.fornecedores_oficina USING btree (user_id, cnpj) WHERE ((cnpj IS NOT NULL) AND (cnpj <> ''::text));


--
-- Name: idx_fornecedores_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_user ON public.fornecedores USING btree (user_id);


--
-- Name: idx_fornecedores_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_user_empresa ON public.fornecedores USING btree (user_id, empresa_id);


--
-- Name: idx_lancamentos_caixa_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lancamentos_caixa_data ON public.lancamentos_caixa USING btree (data_lancamento);


--
-- Name: idx_lancamentos_caixa_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lancamentos_caixa_user ON public.lancamentos_caixa USING btree (user_id);


--
-- Name: idx_lancamentos_caixa_user_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lancamentos_caixa_user_empresa ON public.lancamentos_caixa USING btree (user_id, empresa_id);


--
-- Name: idx_lancamentos_caixa_valor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lancamentos_caixa_valor ON public.lancamentos_caixa USING btree (valor);


--
-- Name: idx_leads_diagnostico_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_diagnostico_created ON public.leads_diagnostico USING btree (created_at DESC);


--
-- Name: idx_leads_diagnostico_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_diagnostico_status ON public.leads_diagnostico USING btree (status);


--
-- Name: idx_mapeamento_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mapeamento_categoria ON public.mapeamento_contabil USING btree (categoria_id);


--
-- Name: idx_mapeamento_plano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mapeamento_plano ON public.mapeamento_contabil USING btree (plano_conta_id);


--
-- Name: idx_mapeamento_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mapeamento_user ON public.mapeamento_contabil USING btree (user_id);


--
-- Name: idx_moto_aplicacoes_peca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moto_aplicacoes_peca ON public.moto_aplicacoes USING btree (peca_id);


--
-- Name: idx_moto_pecas_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moto_pecas_categoria ON public.moto_pecas USING btree (categoria);


--
-- Name: idx_moto_pecas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moto_pecas_codigo ON public.moto_pecas USING btree (codigo);


--
-- Name: idx_moto_pecas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moto_pecas_user ON public.moto_pecas USING btree (user_id);


--
-- Name: idx_moto_pecas_user_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_moto_pecas_user_codigo ON public.moto_pecas USING btree (user_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text));


--
-- Name: idx_nfse_cron_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_cron_logs_user ON public.nfse_cron_logs USING btree (user_id);


--
-- Name: idx_nfse_emitentes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_emitentes_ativo ON public.nfs_e_emitentes USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_nfse_emitentes_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_emitentes_cnpj ON public.nfs_e_emitentes USING btree (cnpj_emitente);


--
-- Name: idx_nfse_emitentes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_emitentes_empresa ON public.nfs_e_emitentes USING btree (empresa_id);


--
-- Name: idx_nfse_notas_competencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_competencia ON public.nfs_e_notas USING btree (competencia);


--
-- Name: idx_nfse_notas_data_emissao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_data_emissao ON public.nfs_e_notas USING btree (data_emissao);


--
-- Name: idx_nfse_notas_emitente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_emitente ON public.nfs_e_notas USING btree (emitente_id);


--
-- Name: idx_nfse_notas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_empresa ON public.nfs_e_notas USING btree (empresa_id);


--
-- Name: idx_nfse_notas_enviada_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_enviada_em ON public.nfs_e_notas USING btree (enviada_prefeitura_em);


--
-- Name: idx_nfse_notas_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_numero ON public.nfs_e_notas USING btree (numero_nota);


--
-- Name: idx_nfse_notas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_status ON public.nfs_e_notas USING btree (status);


--
-- Name: idx_nfse_notas_status_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_status_empresa ON public.nfs_e_notas USING btree (empresa_id, status, data_emissao DESC);


--
-- Name: idx_nfse_notas_tomador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_notas_tomador ON public.nfs_e_notas USING btree (tomador_documento);


--
-- Name: idx_nfse_rascunhos_autosave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_rascunhos_autosave ON public.nfs_e_rascunhos USING btree (ultimo_autosave);


--
-- Name: idx_nfse_rascunhos_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_rascunhos_created_at ON public.nfse_rascunhos USING btree (created_at);


--
-- Name: idx_nfse_rascunhos_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_rascunhos_empresa ON public.nfs_e_rascunhos USING btree (empresa_id);


--
-- Name: idx_nfse_rascunhos_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_rascunhos_user_id ON public.nfse_rascunhos USING btree (user_id);


--
-- Name: idx_nfse_rascunhos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_rascunhos_usuario ON public.nfs_e_rascunhos USING btree (user_id);


--
-- Name: idx_nfse_sync_logs_nota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_sync_logs_nota ON public.nfse_sync_logs USING btree (nota_id);


--
-- Name: idx_nfse_sync_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nfse_sync_logs_user ON public.nfse_sync_logs USING btree (user_id);


--
-- Name: idx_notas_fiscais_servico_data_emissao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_servico_data_emissao ON public.notas_fiscais_servico USING btree (data_emissao DESC);


--
-- Name: idx_notas_fiscais_servico_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_servico_status ON public.notas_fiscais_servico USING btree (status);


--
-- Name: idx_notas_fiscais_servico_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_fiscais_servico_user_id ON public.notas_fiscais_servico USING btree (user_id);


--
-- Name: idx_obd2_leituras_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obd2_leituras_created_at ON public.obd2_leituras_mecanico USING btree (created_at);


--
-- Name: idx_obd2_leituras_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obd2_leituras_user_id ON public.obd2_leituras_mecanico USING btree (user_id);


--
-- Name: idx_obd2_leituras_veiculo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obd2_leituras_veiculo_id ON public.obd2_leituras_mecanico USING btree (veiculo_id);


--
-- Name: idx_open_banking_extratos_conciliado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_conciliado ON public.open_banking_extratos USING btree (conciliado);


--
-- Name: idx_open_banking_extratos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_data ON public.open_banking_extratos USING btree (data_transacao);


--
-- Name: idx_open_banking_extratos_integracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_integracao ON public.open_banking_extratos USING btree (integracao_id);


--
-- Name: idx_open_banking_extratos_lancamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_lancamento ON public.open_banking_extratos USING btree (lancamento_vinculado_id);


--
-- Name: idx_open_banking_extratos_nao_conciliados; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_nao_conciliados ON public.open_banking_extratos USING btree (integracao_id, data_transacao) WHERE ((conciliado = false) AND (ignorado = false));


--
-- Name: idx_open_banking_extratos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_tipo ON public.open_banking_extratos USING btree (tipo);


--
-- Name: idx_open_banking_extratos_transacao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_transacao_id ON public.open_banking_extratos USING btree (transacao_id);


--
-- Name: idx_open_banking_extratos_user_integracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_extratos_user_integracao ON public.open_banking_extratos USING btree (integracao_id, data_transacao DESC);


--
-- Name: idx_open_banking_integracoes_banco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_banco ON public.open_banking_integracoes USING btree (banco_codigo);


--
-- Name: idx_open_banking_integracoes_consent_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_consent_expires ON public.open_banking_integracoes USING btree (consent_expires_at);


--
-- Name: idx_open_banking_integracoes_proxima_sync; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_proxima_sync ON public.open_banking_integracoes USING btree (proxima_sincronizacao);


--
-- Name: idx_open_banking_integracoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_status ON public.open_banking_integracoes USING btree (status);


--
-- Name: idx_open_banking_integracoes_token_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_token_expires ON public.open_banking_integracoes USING btree (token_expires_at);


--
-- Name: idx_open_banking_integracoes_ultima_sync; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_ultima_sync ON public.open_banking_integracoes USING btree (ultima_sincronizacao);


--
-- Name: idx_open_banking_integracoes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_integracoes_user ON public.open_banking_integracoes USING btree (user_id);


--
-- Name: idx_open_banking_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_logs_created ON public.open_banking_logs USING btree (created_at DESC);


--
-- Name: idx_open_banking_logs_integracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_logs_integracao ON public.open_banking_logs USING btree (integracao_id);


--
-- Name: idx_open_banking_logs_operacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_logs_operacao ON public.open_banking_logs USING btree (operacao);


--
-- Name: idx_open_banking_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_logs_status ON public.open_banking_logs USING btree (status);


--
-- Name: idx_open_banking_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_open_banking_logs_user ON public.open_banking_logs USING btree (user_id);


--
-- Name: idx_orcamento_itens_mecanico_orcamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamento_itens_mecanico_orcamento ON public.orcamento_itens_mecanico USING btree (orcamento_id);


--
-- Name: idx_orcamentos_mecanico_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamentos_mecanico_user_status ON public.orcamentos_mecanico USING btree (user_id, status);


--
-- Name: idx_ordem_servico_itens_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordem_servico_itens_ordem ON public.ordem_servico_itens USING btree (ordem_id);


--
-- Name: idx_ordens_servico_abertura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordens_servico_abertura ON public.ordens_servico USING btree (abertura);


--
-- Name: idx_ordens_servico_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordens_servico_codigo ON public.ordens_servico USING btree (codigo);


--
-- Name: idx_ordens_servico_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordens_servico_status ON public.ordens_servico USING btree (status);


--
-- Name: idx_ordens_servico_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordens_servico_user ON public.ordens_servico USING btree (user_id);


--
-- Name: idx_ordens_servico_user_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_ordens_servico_user_codigo ON public.ordens_servico USING btree (user_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text));


--
-- Name: idx_os_itens_mecanico_os; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_os_itens_mecanico_os ON public.os_itens_mecanico USING btree (os_id);


--
-- Name: idx_os_itens_os; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_os_itens_os ON public.os_itens USING btree (os_id);


--
-- Name: idx_os_mecanico_func_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_os_mecanico_func_data ON public.ordens_servico_mecanico USING btree (funcionario_id, data_entrada);


--
-- Name: idx_os_mecanico_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_os_mecanico_user_status ON public.ordens_servico_mecanico USING btree (user_id, status);


--
-- Name: idx_os_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_os_user_status ON public.ordens_servico USING btree (user_id, status);


--
-- Name: idx_payment_reminders_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reminders_date ON public.payment_reminders USING btree (generated_for_date);


--
-- Name: idx_payment_reminders_invoice_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reminders_invoice_date ON public.payment_reminders USING btree (invoice_id, generated_for_date);


--
-- Name: idx_pecas_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pecas_categoria ON public.pecas USING btree (categoria);


--
-- Name: idx_pecas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pecas_codigo ON public.pecas USING btree (codigo);


--
-- Name: idx_plano_contas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plano_contas_ativo ON public.plano_contas USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_plano_contas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plano_contas_codigo ON public.plano_contas USING btree (codigo_conta);


--
-- Name: idx_plano_contas_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plano_contas_user_id ON public.plano_contas USING btree (user_id);


--
-- Name: idx_regua_automacao_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regua_automacao_user ON public.regua_cobranca_automacao USING btree (user_id);


--
-- Name: idx_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settings_key ON public.settings USING btree (key);


--
-- Name: idx_transacoes_cartao_bandeira; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_bandeira ON public.transacoes_cartao USING btree (bandeira);


--
-- Name: idx_transacoes_cartao_composto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_composto ON public.transacoes_cartao USING btree (empresa_id, status, data_transacao);


--
-- Name: idx_transacoes_cartao_conciliado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_conciliado ON public.transacoes_cartao USING btree (conciliado_com) WHERE (conciliado_com IS NOT NULL);


--
-- Name: idx_transacoes_cartao_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_data ON public.transacoes_cartao USING btree (data_transacao);


--
-- Name: idx_transacoes_cartao_descricao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_descricao ON public.transacoes_cartao USING gin (to_tsvector('portuguese'::regconfig, COALESCE(linha_extrato, ''::text)));


--
-- Name: idx_transacoes_cartao_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_empresa ON public.transacoes_cartao USING btree (empresa_id);


--
-- Name: idx_transacoes_cartao_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_status ON public.transacoes_cartao USING btree (status);


--
-- Name: idx_transacoes_cartao_valor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transacoes_cartao_valor ON public.transacoes_cartao USING btree (valor_liquido);


--
-- Name: idx_usuario_empresas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_empresas_empresa ON public.usuario_empresas USING btree (empresa_id);


--
-- Name: idx_usuario_empresas_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_empresas_user ON public.usuario_empresas USING btree (user_id);


--
-- Name: idx_veiculos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_veiculos_cliente ON public.veiculos USING btree (cliente_id);


--
-- Name: idx_veiculos_mecanico_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_veiculos_mecanico_cliente ON public.veiculos_mecanico USING btree (cliente_id);


--
-- Name: idx_venda_itens_oficina_venda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_venda_itens_oficina_venda ON public.venda_itens_oficina USING btree (venda_id);


--
-- Name: idx_vendas_oficina_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendas_oficina_cliente ON public.vendas_oficina USING btree (cliente_id);


--
-- Name: idx_vendas_oficina_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendas_oficina_codigo ON public.vendas_oficina USING btree (codigo);


--
-- Name: idx_vendas_oficina_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendas_oficina_data ON public.vendas_oficina USING btree (data);


--
-- Name: idx_vendas_oficina_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendas_oficina_user ON public.vendas_oficina USING btree (user_id);


--
-- Name: idx_vendas_oficina_user_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_vendas_oficina_user_codigo ON public.vendas_oficina USING btree (user_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text));


--
-- Name: invoices_student_month_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoices_student_month_unique ON public.invoices USING btree (student_id, reference_month);


--
-- Name: uniq_reminder_per_invoice_per_day; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_reminder_per_invoice_per_day ON public.payment_reminders USING btree (invoice_id, generated_for_date);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_18_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_18_inserted_at_topic_idx ON realtime.messages_2026_05_18 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_19_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_19_inserted_at_topic_idx ON realtime.messages_2026_05_19 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_20_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_20_inserted_at_topic_idx ON realtime.messages_2026_05_20 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_21_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_21_inserted_at_topic_idx ON realtime.messages_2026_05_21 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_22_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_22_inserted_at_topic_idx ON realtime.messages_2026_05_22 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_23_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_23_inserted_at_topic_idx ON realtime.messages_2026_05_23 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2026_05_24_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2026_05_24_inserted_at_topic_idx ON realtime.messages_2026_05_24 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2026_05_18_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_18_inserted_at_topic_idx;


--
-- Name: messages_2026_05_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_18_pkey;


--
-- Name: messages_2026_05_19_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_19_inserted_at_topic_idx;


--
-- Name: messages_2026_05_19_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_19_pkey;


--
-- Name: messages_2026_05_20_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_20_inserted_at_topic_idx;


--
-- Name: messages_2026_05_20_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_20_pkey;


--
-- Name: messages_2026_05_21_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_21_inserted_at_topic_idx;


--
-- Name: messages_2026_05_21_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_21_pkey;


--
-- Name: messages_2026_05_22_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_22_inserted_at_topic_idx;


--
-- Name: messages_2026_05_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_22_pkey;


--
-- Name: messages_2026_05_23_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_23_inserted_at_topic_idx;


--
-- Name: messages_2026_05_23_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_23_pkey;


--
-- Name: messages_2026_05_24_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_05_24_inserted_at_topic_idx;


--
-- Name: messages_2026_05_24_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_05_24_pkey;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: users on_auth_user_created_trial; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created_trial AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_trial_on_signup();


--
-- Name: users tg_criar_trial_novo_usuario; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER tg_criar_trial_novo_usuario AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.criar_assinatura_trial();


--
-- Name: anexos audit_anexos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_anexos AFTER INSERT OR DELETE OR UPDATE ON public.anexos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: bancos_cartoes audit_bancos_cartoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_bancos_cartoes AFTER INSERT OR DELETE OR UPDATE ON public.bancos_cartoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: categorias audit_categorias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_categorias AFTER INSERT OR DELETE OR UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: clientes audit_clientes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_clientes AFTER INSERT OR DELETE OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: contas_pagar audit_contas_pagar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_contas_pagar AFTER INSERT OR DELETE OR UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: contas_receber audit_contas_receber; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_contas_receber AFTER INSERT OR DELETE OR UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: empresa audit_empresa; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_empresa AFTER INSERT OR DELETE OR UPDATE ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: extrato_bancario audit_extrato_bancario; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_extrato_bancario AFTER INSERT OR DELETE OR UPDATE ON public.extrato_bancario FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: fechamentos_mensais audit_fechamentos_mensais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_fechamentos_mensais AFTER INSERT OR DELETE OR UPDATE ON public.fechamentos_mensais FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: fornecedores audit_fornecedores; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_fornecedores AFTER INSERT OR DELETE OR UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: lancamentos_caixa audit_lancamentos_caixa; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_lancamentos_caixa AFTER INSERT OR DELETE OR UPDATE ON public.lancamentos_caixa FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: metas_orcamentarias audit_metas_orcamentarias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_metas_orcamentarias AFTER INSERT OR DELETE OR UPDATE ON public.metas_orcamentarias FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: card_transacoes_brutas card_transacoes_brutas_cache_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER card_transacoes_brutas_cache_trigger AFTER INSERT OR DELETE OR UPDATE ON public.card_transacoes_brutas FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_card_dashboard();


--
-- Name: leads_diagnostico set_leads_diagnostico_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_leads_diagnostico_updated_at BEFORE UPDATE ON public.leads_diagnostico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notas_fiscais_servico sync_notas_fiscais_columns_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_notas_fiscais_columns_trigger BEFORE INSERT OR UPDATE ON public.notas_fiscais_servico FOR EACH ROW EXECUTE FUNCTION public.sync_notas_fiscais_columns();


--
-- Name: agendamentos_mecanico tg_agendamentos_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_agendamentos_mecanico_upd BEFORE UPDATE ON public.agendamentos_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: assinaturas_mecanico tg_assinaturas_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_assinaturas_mecanico_upd BEFORE UPDATE ON public.assinaturas_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: clientes_mecanico tg_clientes_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_clientes_mecanico_upd BEFORE UPDATE ON public.clientes_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: clientes_oficina tg_clientes_oficina_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_clientes_oficina_upd BEFORE UPDATE ON public.clientes_oficina FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ordens_servico_mecanico tg_criar_comissao_os_concluida; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_criar_comissao_os_concluida AFTER UPDATE OF status ON public.ordens_servico_mecanico FOR EACH ROW EXECUTE FUNCTION public.criar_comissao_os_concluida();


--
-- Name: assinaturas_mecanico tg_criar_empresa_padrao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_criar_empresa_padrao AFTER INSERT ON public.assinaturas_mecanico FOR EACH ROW EXECUTE FUNCTION public.criar_empresa_padrao();


--
-- Name: empresas_mecanico tg_empresas_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_empresas_mecanico_upd BEFORE UPDATE ON public.empresas_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: financeiro_mecanico tg_financeiro_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_financeiro_mecanico_upd BEFORE UPDATE ON public.financeiro_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: fornecedores_mecanico tg_fornecedores_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_fornecedores_mecanico_upd BEFORE UPDATE ON public.fornecedores_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: funcionarios_mecanico tg_funcionarios_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_funcionarios_mecanico_upd BEFORE UPDATE ON public.funcionarios_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orcamento_itens_mecanico tg_orcamento_itens_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_orcamento_itens_mecanico_upd BEFORE UPDATE ON public.orcamento_itens_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orcamentos_mecanico tg_orcamentos_mecanico_numero; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_orcamentos_mecanico_numero BEFORE INSERT ON public.orcamentos_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_orcamento_numero();


--
-- Name: orcamentos_mecanico tg_orcamentos_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_orcamentos_mecanico_upd BEFORE UPDATE ON public.orcamentos_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ordens_servico_mecanico tg_ordens_servico_mecanico_numero; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_ordens_servico_mecanico_numero BEFORE INSERT ON public.ordens_servico_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_os_numero();


--
-- Name: os_itens_mecanico tg_os_itens_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_os_itens_mecanico_upd BEFORE UPDATE ON public.os_itens_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ordens_servico_mecanico tg_os_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_os_mecanico_upd BEFORE UPDATE ON public.ordens_servico_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ordens_servico tg_os_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_os_upd BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pecas_mecanico tg_pecas_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_pecas_mecanico_upd BEFORE UPDATE ON public.pecas_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pecas tg_pecas_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_pecas_upd BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: veiculos_mecanico tg_veiculos_mecanico_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_veiculos_mecanico_upd BEFORE UPDATE ON public.veiculos_mecanico FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: veiculos tg_veiculos_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tg_veiculos_upd BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: budget_planning_lines trg_budget_lines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_budget_lines_updated_at BEFORE UPDATE ON public.budget_planning_lines FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: nfs_e_notas trg_calcular_valores_nfse; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_calcular_valores_nfse BEFORE INSERT OR UPDATE ON public.nfs_e_notas FOR EACH ROW EXECUTE FUNCTION public.calcular_valores_nfse();


--
-- Name: students trg_create_invoice_for_new_student; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_create_invoice_for_new_student AFTER INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.create_invoice_for_new_student();


--
-- Name: empresas trg_empresas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: invoices trg_invoice_overdue; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoice_overdue BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.check_invoice_overdue();


--
-- Name: invoices trg_invoices_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: nfs_e_emitentes trg_nfse_emitentes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nfse_emitentes_updated_at BEFORE UPDATE ON public.nfs_e_emitentes FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: nfs_e_notas trg_nfse_notas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nfse_notas_updated_at BEFORE UPDATE ON public.nfs_e_notas FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: nfs_e_rascunhos trg_nfse_rascunhos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nfse_rascunhos_updated_at BEFORE UPDATE ON public.nfs_e_rascunhos FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: profiles trg_profiles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: routes trg_routes_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_routes_updated BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: students trg_students_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: tenant_subscriptions trg_tenant_subs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tenant_subs_updated_at BEFORE UPDATE ON public.tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: tenants trg_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: vehicles trg_vehicles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: whatsapp_templates trg_whatsapp_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: extrato_bancario trigger_atualizar_conciliacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_conciliacao BEFORE UPDATE ON public.extrato_bancario FOR EACH ROW EXECUTE FUNCTION public.atualizar_saldo_banco_conciliacao();


--
-- Name: configuracoes_cartao trigger_atualizar_configuracoes_cartao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_configuracoes_cartao BEFORE UPDATE ON public.configuracoes_cartao FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: contas_receber trigger_atualizar_status_contas_receber; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_status_contas_receber BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.atualizar_status_conta_receber();


--
-- Name: transacoes_cartao trigger_atualizar_transacoes_cartao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_transacoes_cartao BEFORE UPDATE ON public.transacoes_cartao FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();


--
-- Name: configuracoes_cartao trigger_audit_configuracoes_cartao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_configuracoes_cartao AFTER INSERT OR DELETE OR UPDATE ON public.configuracoes_cartao FOR EACH ROW EXECUTE FUNCTION public.audit_transacoes_cartao();


--
-- Name: transacoes_cartao trigger_audit_transacoes_cartao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_transacoes_cartao AFTER INSERT OR DELETE OR UPDATE ON public.transacoes_cartao FOR EACH ROW EXECUTE FUNCTION public.audit_transacoes_cartao();


--
-- Name: certificados_nfse trigger_update_certificado_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_certificado_updated_at BEFORE UPDATE ON public.certificados_nfse FOR EACH ROW EXECUTE FUNCTION public.update_certificado_updated_at();


--
-- Name: nfse_rascunhos trigger_update_nfse_rascunhos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_nfse_rascunhos_updated_at BEFORE UPDATE ON public.nfse_rascunhos FOR EACH ROW EXECUTE FUNCTION public.update_nfse_rascunhos_updated_at();


--
-- Name: plano_contas trigger_update_plano_contas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_plano_contas_updated_at BEFORE UPDATE ON public.plano_contas FOR EACH ROW EXECUTE FUNCTION public.update_plano_contas_updated_at();


--
-- Name: categorias trigger_validar_vinculo_categoria; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validar_vinculo_categoria BEFORE INSERT OR UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.validar_vinculo_categoria_plano();


--
-- Name: assinaturas update_assinaturas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assinaturas_updated_at BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bancos_cartoes update_bancos_cartoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bancos_cartoes_updated_at BEFORE UPDATE ON public.bancos_cartoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categorias update_categorias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clientes update_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contabilidade_erp_config update_contabilidade_erp_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contabilidade_erp_config_updated_at BEFORE UPDATE ON public.contabilidade_erp_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contabilidade_lancamentos_importados update_contabilidade_lancamentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contabilidade_lancamentos_updated_at BEFORE UPDATE ON public.contabilidade_lancamentos_importados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contabilidade_mapeamento_contas update_contabilidade_mapeamento_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contabilidade_mapeamento_updated_at BEFORE UPDATE ON public.contabilidade_mapeamento_contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contabilidade_sincronizacao update_contabilidade_sincronizacao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contabilidade_sincronizacao_updated_at BEFORE UPDATE ON public.contabilidade_sincronizacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contador_config update_contador_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contador_config_updated_at BEFORE UPDATE ON public.contador_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contador_documentos update_contador_documentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contador_documentos_updated_at BEFORE UPDATE ON public.contador_documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contas_pagar update_contas_pagar_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contas_receber update_contas_receber_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: empresa update_empresa_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_empresa_updated_at BEFORE UPDATE ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fechamentos_mensais update_fechamentos_mensais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fechamentos_mensais_updated_at BEFORE UPDATE ON public.fechamentos_mensais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fornecedores update_fornecedores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lancamentos_caixa update_lancamentos_caixa_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lancamentos_caixa_updated_at BEFORE UPDATE ON public.lancamentos_caixa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: licencas_software update_licencas_software_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_licencas_software_updated_at BEFORE UPDATE ON public.licencas_software FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: mapeamento_contabil update_mapeamento_contabil_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mapeamento_contabil_updated_at BEFORE UPDATE ON public.mapeamento_contabil FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: metas_orcamentarias update_metas_orcamentarias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_metas_orcamentarias_updated_at BEFORE UPDATE ON public.metas_orcamentarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notas_fiscais_servico update_notas_fiscais_servico_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notas_fiscais_servico_updated_at BEFORE UPDATE ON public.notas_fiscais_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: open_banking_bancos_suportados update_open_banking_bancos_suportados_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_open_banking_bancos_suportados_updated_at BEFORE UPDATE ON public.open_banking_bancos_suportados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: open_banking_extratos update_open_banking_extratos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_open_banking_extratos_updated_at BEFORE UPDATE ON public.open_banking_extratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: open_banking_integracoes update_open_banking_integracoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_open_banking_integracoes_updated_at BEFORE UPDATE ON public.open_banking_integracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: regua_cobranca update_regua_cobranca_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_regua_cobranca_updated_at BEFORE UPDATE ON public.regua_cobranca FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transferencias_contas update_transferencias_contas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transferencias_contas_updated_at BEFORE UPDATE ON public.transferencias_contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: agendamentos agendamentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_oficina(id) ON DELETE SET NULL;


--
-- Name: agendamentos agendamentos_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE SET NULL;


--
-- Name: agendamentos_mecanico agendamentos_mecanico_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos_mecanico
    ADD CONSTRAINT agendamentos_mecanico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_mecanico(id) ON DELETE SET NULL;


--
-- Name: agendamentos_mecanico agendamentos_mecanico_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos_mecanico
    ADD CONSTRAINT agendamentos_mecanico_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios_mecanico(id) ON DELETE SET NULL;


--
-- Name: agendamentos_mecanico agendamentos_mecanico_veiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos_mecanico
    ADD CONSTRAINT agendamentos_mecanico_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos_mecanico(id) ON DELETE SET NULL;


--
-- Name: agendamentos agendamentos_veiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) ON DELETE SET NULL;


--
-- Name: anexos anexos_conta_pagar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT anexos_conta_pagar_id_fkey FOREIGN KEY (conta_pagar_id) REFERENCES public.contas_pagar(id) ON DELETE CASCADE;


--
-- Name: anexos anexos_conta_receber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT anexos_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES public.contas_receber(id) ON DELETE CASCADE;


--
-- Name: aplicacoes aplicacoes_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aplicacoes
    ADD CONSTRAINT aplicacoes_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.pecas(id) ON DELETE CASCADE;


--
-- Name: assinaturas_mecanico assinaturas_mecanico_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_mecanico
    ADD CONSTRAINT assinaturas_mecanico_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: assinaturas_oficina assinaturas_oficina_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_oficina
    ADD CONSTRAINT assinaturas_oficina_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: bancos_cartoes bancos_cartoes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bancos_cartoes
    ADD CONSTRAINT bancos_cartoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: budget_planning_lines budget_planning_lines_plano_conta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_planning_lines
    ADD CONSTRAINT budget_planning_lines_plano_conta_id_fkey FOREIGN KEY (plano_conta_id) REFERENCES public.plano_contas(id) ON DELETE CASCADE;


--
-- Name: budget_planning_lines budget_planning_lines_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_planning_lines
    ADD CONSTRAINT budget_planning_lines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_audit_logs card_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_audit_logs
    ADD CONSTRAINT card_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_dashboard_cache card_dashboard_cache_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_dashboard_cache
    ADD CONSTRAINT card_dashboard_cache_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: card_dashboard_cache card_dashboard_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_dashboard_cache
    ADD CONSTRAINT card_dashboard_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_importacoes card_importacoes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_importacoes
    ADD CONSTRAINT card_importacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: card_importacoes card_importacoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_importacoes
    ADD CONSTRAINT card_importacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_relatorios_gerados card_relatorios_gerados_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relatorios_gerados
    ADD CONSTRAINT card_relatorios_gerados_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: card_relatorios_gerados card_relatorios_gerados_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_relatorios_gerados
    ADD CONSTRAINT card_relatorios_gerados_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_report_config card_report_config_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_report_config
    ADD CONSTRAINT card_report_config_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: card_report_config card_report_config_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_report_config
    ADD CONSTRAINT card_report_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_simulacoes_salvas card_simulacoes_salvas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_simulacoes_salvas
    ADD CONSTRAINT card_simulacoes_salvas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: card_simulacoes_salvas card_simulacoes_salvas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_simulacoes_salvas
    ADD CONSTRAINT card_simulacoes_salvas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_split_simulacoes card_split_simulacoes_transacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_split_simulacoes
    ADD CONSTRAINT card_split_simulacoes_transacao_id_fkey FOREIGN KEY (transacao_id) REFERENCES public.card_transacoes_brutas(id) ON DELETE SET NULL;


--
-- Name: card_split_simulacoes card_split_simulacoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_split_simulacoes
    ADD CONSTRAINT card_split_simulacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_transacoes_brutas card_transacoes_brutas_banco_cartao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_transacoes_brutas
    ADD CONSTRAINT card_transacoes_brutas_banco_cartao_id_fkey FOREIGN KEY (banco_cartao_id) REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;


--
-- Name: card_transacoes_brutas card_transacoes_brutas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_transacoes_brutas
    ADD CONSTRAINT card_transacoes_brutas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: card_transacoes_brutas card_transacoes_brutas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_transacoes_brutas
    ADD CONSTRAINT card_transacoes_brutas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: categorias categorias_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: categorias categorias_plano_conta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_plano_conta_id_fkey FOREIGN KEY (plano_conta_id) REFERENCES public.plano_contas(id) ON DELETE SET NULL;


--
-- Name: categorias categorias_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clientes clientes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: clientes clientes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cobranca_historico cobranca_historico_conta_receber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobranca_historico
    ADD CONSTRAINT cobranca_historico_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES public.contas_receber(id) ON DELETE SET NULL;


--
-- Name: cobranca_historico cobranca_historico_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobranca_historico
    ADD CONSTRAINT cobranca_historico_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: comissoes_mecanico comissoes_mecanico_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_mecanico
    ADD CONSTRAINT comissoes_mecanico_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios_mecanico(id) ON DELETE CASCADE;


--
-- Name: comissoes_mecanico comissoes_mecanico_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comissoes_mecanico
    ADD CONSTRAINT comissoes_mecanico_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico_mecanico(id) ON DELETE CASCADE;


--
-- Name: configuracoes_cartao configuracoes_cartao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_cartao
    ADD CONSTRAINT configuracoes_cartao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: configuracoes_cartao configuracoes_cartao_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_cartao
    ADD CONSTRAINT configuracoes_cartao_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: configuracoes configuracoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: contabilidade_erp_config contabilidade_erp_config_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_erp_config
    ADD CONSTRAINT contabilidade_erp_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contabilidade_lancamentos_importados contabilidade_lancamentos_imp_lancamento_financeiro_vincul_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_lancamentos_importados
    ADD CONSTRAINT contabilidade_lancamentos_imp_lancamento_financeiro_vincul_fkey FOREIGN KEY (lancamento_financeiro_vinculado_id) REFERENCES public.lancamentos_caixa(id) ON DELETE SET NULL;


--
-- Name: contabilidade_lancamentos_importados contabilidade_lancamentos_importados_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_lancamentos_importados
    ADD CONSTRAINT contabilidade_lancamentos_importados_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.contabilidade_erp_config(id) ON DELETE CASCADE;


--
-- Name: contabilidade_lancamentos_importados contabilidade_lancamentos_importados_sincronizacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_lancamentos_importados
    ADD CONSTRAINT contabilidade_lancamentos_importados_sincronizacao_id_fkey FOREIGN KEY (sincronizacao_id) REFERENCES public.contabilidade_sincronizacao(id) ON DELETE CASCADE;


--
-- Name: contabilidade_lancamentos_importados contabilidade_lancamentos_importados_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_lancamentos_importados
    ADD CONSTRAINT contabilidade_lancamentos_importados_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_contas_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_mapeamento_contas
    ADD CONSTRAINT contabilidade_mapeamento_contas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_contas_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_mapeamento_contas
    ADD CONSTRAINT contabilidade_mapeamento_contas_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.contabilidade_erp_config(id) ON DELETE CASCADE;


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_contas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_mapeamento_contas
    ADD CONSTRAINT contabilidade_mapeamento_contas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contabilidade_sincronizacao contabilidade_sincronizacao_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_sincronizacao
    ADD CONSTRAINT contabilidade_sincronizacao_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.contabilidade_erp_config(id) ON DELETE CASCADE;


--
-- Name: contabilidade_sincronizacao contabilidade_sincronizacao_iniciado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_sincronizacao
    ADD CONSTRAINT contabilidade_sincronizacao_iniciado_por_fkey FOREIGN KEY (iniciado_por) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: contabilidade_sincronizacao contabilidade_sincronizacao_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contabilidade_sincronizacao
    ADD CONSTRAINT contabilidade_sincronizacao_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contas_pagar contas_pagar_banco_cartao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_banco_cartao_id_fkey FOREIGN KEY (banco_cartao_id) REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;


--
-- Name: contas_pagar contas_pagar_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--
-- Name: contas_pagar contas_pagar_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: contas_pagar contas_pagar_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL;


--
-- Name: contas_pagar contas_pagar_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contas_receber contas_receber_banco_cartao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_banco_cartao_id_fkey FOREIGN KEY (banco_cartao_id) REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;


--
-- Name: contas_receber contas_receber_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--
-- Name: contas_receber contas_receber_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: contas_receber contas_receber_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: contas_receber contas_receber_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: empresas_mecanico empresas_mecanico_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_mecanico
    ADD CONSTRAINT empresas_mecanico_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: extrato_bancario extrato_bancario_banco_cartao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extrato_bancario
    ADD CONSTRAINT extrato_bancario_banco_cartao_id_fkey FOREIGN KEY (banco_cartao_id) REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;


--
-- Name: extrato_bancario extrato_bancario_conta_pagar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extrato_bancario
    ADD CONSTRAINT extrato_bancario_conta_pagar_id_fkey FOREIGN KEY (conta_pagar_id) REFERENCES public.contas_pagar(id) ON DELETE SET NULL;


--
-- Name: extrato_bancario extrato_bancario_conta_receber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extrato_bancario
    ADD CONSTRAINT extrato_bancario_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES public.contas_receber(id) ON DELETE SET NULL;


--
-- Name: extrato_bancario extrato_bancario_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extrato_bancario
    ADD CONSTRAINT extrato_bancario_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: extrato_bancario extrato_bancario_lancamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extrato_bancario
    ADD CONSTRAINT extrato_bancario_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES public.lancamentos_caixa(id) ON DELETE SET NULL;


--
-- Name: fechamentos_mensais fechamentos_mensais_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: financeiro_lancamentos financeiro_lancamentos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro_lancamentos
    ADD CONSTRAINT financeiro_lancamentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: financeiro_mecanico financeiro_mecanico_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiro_mecanico
    ADD CONSTRAINT financeiro_mecanico_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico_mecanico(id) ON DELETE SET NULL;


--
-- Name: fornecedor_catalogo_mecanico fornecedor_catalogo_mecanico_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedor_catalogo_mecanico
    ADD CONSTRAINT fornecedor_catalogo_mecanico_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores_mecanico(id) ON DELETE CASCADE;


--
-- Name: fornecedores fornecedores_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: fornecedores_oficina fornecedores_oficina_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores_oficina
    ADD CONSTRAINT fornecedores_oficina_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: fornecedores fornecedores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: lancamentos_caixa lancamentos_caixa_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_caixa
    ADD CONSTRAINT lancamentos_caixa_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--
-- Name: lancamentos_caixa lancamentos_caixa_conta_pagar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_caixa
    ADD CONSTRAINT lancamentos_caixa_conta_pagar_id_fkey FOREIGN KEY (conta_pagar_id) REFERENCES public.contas_pagar(id) ON DELETE SET NULL;


--
-- Name: lancamentos_caixa lancamentos_caixa_conta_receber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_caixa
    ADD CONSTRAINT lancamentos_caixa_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES public.contas_receber(id) ON DELETE SET NULL;


--
-- Name: lancamentos_caixa lancamentos_caixa_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_caixa
    ADD CONSTRAINT lancamentos_caixa_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: lancamentos_caixa lancamentos_caixa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_caixa
    ADD CONSTRAINT lancamentos_caixa_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mapeamento_contabil mapeamento_contabil_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mapeamento_contabil
    ADD CONSTRAINT mapeamento_contabil_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: metas_orcamentarias metas_orcamentarias_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas_orcamentarias
    ADD CONSTRAINT metas_orcamentarias_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE CASCADE;


--
-- Name: metas_orcamentarias metas_orcamentarias_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas_orcamentarias
    ADD CONSTRAINT metas_orcamentarias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: moto_aplicacoes moto_aplicacoes_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moto_aplicacoes
    ADD CONSTRAINT moto_aplicacoes_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.moto_pecas(id) ON DELETE CASCADE;


--
-- Name: moto_pecas moto_pecas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moto_pecas
    ADD CONSTRAINT moto_pecas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: nfs_e_notas nfs_e_notas_emitente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfs_e_notas
    ADD CONSTRAINT nfs_e_notas_emitente_id_fkey FOREIGN KEY (emitente_id) REFERENCES public.nfs_e_emitentes(id) ON DELETE RESTRICT;


--
-- Name: nfse_cron_logs nfse_cron_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_cron_logs
    ADD CONSTRAINT nfse_cron_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: nfse_rascunhos nfse_rascunhos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_rascunhos
    ADD CONSTRAINT nfse_rascunhos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: nfse_sync_logs nfse_sync_logs_nota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_sync_logs
    ADD CONSTRAINT nfse_sync_logs_nota_id_fkey FOREIGN KEY (nota_id) REFERENCES public.notas_fiscais_servico(id) ON DELETE CASCADE;


--
-- Name: nfse_sync_logs nfse_sync_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfse_sync_logs
    ADD CONSTRAINT nfse_sync_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notas_fiscais_servico notas_fiscais_servico_certificado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_fiscais_servico
    ADD CONSTRAINT notas_fiscais_servico_certificado_id_fkey FOREIGN KEY (certificado_id) REFERENCES public.certificados_nfse(id);


--
-- Name: notas_fiscais_servico notas_fiscais_servico_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_fiscais_servico
    ADD CONSTRAINT notas_fiscais_servico_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: obd2_leituras_mecanico obd2_leituras_mecanico_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obd2_leituras_mecanico
    ADD CONSTRAINT obd2_leituras_mecanico_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: obd2_leituras_mecanico obd2_leituras_mecanico_veiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obd2_leituras_mecanico
    ADD CONSTRAINT obd2_leituras_mecanico_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos_mecanico(id) ON DELETE CASCADE;


--
-- Name: open_banking_extratos open_banking_extratos_conciliado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_conciliado_por_fkey FOREIGN KEY (conciliado_por) REFERENCES auth.users(id);


--
-- Name: open_banking_extratos open_banking_extratos_conta_pagar_vinculada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_conta_pagar_vinculada_id_fkey FOREIGN KEY (conta_pagar_vinculada_id) REFERENCES public.contas_pagar(id) ON DELETE SET NULL;


--
-- Name: open_banking_extratos open_banking_extratos_conta_receber_vinculada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_conta_receber_vinculada_id_fkey FOREIGN KEY (conta_receber_vinculada_id) REFERENCES public.contas_receber(id) ON DELETE SET NULL;


--
-- Name: open_banking_extratos open_banking_extratos_ignorado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_ignorado_por_fkey FOREIGN KEY (ignorado_por) REFERENCES auth.users(id);


--
-- Name: open_banking_extratos open_banking_extratos_importado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_importado_por_fkey FOREIGN KEY (importado_por) REFERENCES auth.users(id);


--
-- Name: open_banking_extratos open_banking_extratos_integracao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_integracao_id_fkey FOREIGN KEY (integracao_id) REFERENCES public.open_banking_integracoes(id) ON DELETE CASCADE;


--
-- Name: open_banking_extratos open_banking_extratos_lancamento_vinculado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_extratos
    ADD CONSTRAINT open_banking_extratos_lancamento_vinculado_id_fkey FOREIGN KEY (lancamento_vinculado_id) REFERENCES public.lancamentos_caixa(id) ON DELETE SET NULL;


--
-- Name: open_banking_integracoes open_banking_integracoes_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_integracoes
    ADD CONSTRAINT open_banking_integracoes_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES auth.users(id);


--
-- Name: open_banking_integracoes open_banking_integracoes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_integracoes
    ADD CONSTRAINT open_banking_integracoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: open_banking_logs open_banking_logs_integracao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_logs
    ADD CONSTRAINT open_banking_logs_integracao_id_fkey FOREIGN KEY (integracao_id) REFERENCES public.open_banking_integracoes(id) ON DELETE SET NULL;


--
-- Name: open_banking_logs open_banking_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.open_banking_logs
    ADD CONSTRAINT open_banking_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: orcamento_itens_mecanico orcamento_itens_mecanico_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamento_itens_mecanico
    ADD CONSTRAINT orcamento_itens_mecanico_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos_mecanico(id) ON DELETE CASCADE;


--
-- Name: orcamento_itens_mecanico orcamento_itens_mecanico_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamento_itens_mecanico
    ADD CONSTRAINT orcamento_itens_mecanico_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.pecas_mecanico(id) ON DELETE SET NULL;


--
-- Name: orcamentos_mecanico orcamentos_mecanico_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos_mecanico
    ADD CONSTRAINT orcamentos_mecanico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_mecanico(id) ON DELETE RESTRICT;


--
-- Name: orcamentos_mecanico orcamentos_mecanico_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos_mecanico
    ADD CONSTRAINT orcamentos_mecanico_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios_mecanico(id) ON DELETE SET NULL;


--
-- Name: orcamentos_mecanico orcamentos_mecanico_veiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos_mecanico
    ADD CONSTRAINT orcamentos_mecanico_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos_mecanico(id) ON DELETE RESTRICT;


--
-- Name: ordem_servico_itens ordem_servico_itens_ordem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordem_servico_itens
    ADD CONSTRAINT ordem_servico_itens_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.ordens_servico(id) ON DELETE CASCADE;


--
-- Name: ordem_servico_itens ordem_servico_itens_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordem_servico_itens
    ADD CONSTRAINT ordem_servico_itens_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.moto_pecas(id);


--
-- Name: ordens_servico ordens_servico_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico
    ADD CONSTRAINT ordens_servico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_oficina(id);


--
-- Name: ordens_servico_mecanico ordens_servico_mecanico_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico_mecanico
    ADD CONSTRAINT ordens_servico_mecanico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_mecanico(id) ON DELETE RESTRICT;


--
-- Name: ordens_servico_mecanico ordens_servico_mecanico_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico_mecanico
    ADD CONSTRAINT ordens_servico_mecanico_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios_mecanico(id) ON DELETE SET NULL;


--
-- Name: ordens_servico_mecanico ordens_servico_mecanico_veiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico_mecanico
    ADD CONSTRAINT ordens_servico_mecanico_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES public.veiculos_mecanico(id) ON DELETE RESTRICT;


--
-- Name: ordens_servico ordens_servico_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico
    ADD CONSTRAINT ordens_servico_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: os_itens_mecanico os_itens_mecanico_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.os_itens_mecanico
    ADD CONSTRAINT os_itens_mecanico_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.ordens_servico_mecanico(id) ON DELETE CASCADE;


--
-- Name: os_itens_mecanico os_itens_mecanico_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.os_itens_mecanico
    ADD CONSTRAINT os_itens_mecanico_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.pecas_mecanico(id) ON DELETE SET NULL;


--
-- Name: os_itens os_itens_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.os_itens
    ADD CONSTRAINT os_itens_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.pecas(id) ON DELETE SET NULL;


--
-- Name: payment_reminders payment_reminders_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: rate_limit_uploads rate_limit_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_uploads
    ADD CONSTRAINT rate_limit_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: regua_cobranca_automacao regua_cobranca_automacao_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regua_cobranca_automacao
    ADD CONSTRAINT regua_cobranca_automacao_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: regua_cobranca regua_cobranca_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regua_cobranca
    ADD CONSTRAINT regua_cobranca_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: routes routes_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;


--
-- Name: students students_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: students students_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE SET NULL;


--
-- Name: tenant_subscription_payments tenant_subscription_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscription_payments
    ADD CONSTRAINT tenant_subscription_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_subscriptions tenant_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: transacoes_cartao transacoes_cartao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_cartao
    ADD CONSTRAINT transacoes_cartao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: transacoes_cartao transacoes_cartao_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_cartao
    ADD CONSTRAINT transacoes_cartao_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: transferencias_contas transferencias_contas_conta_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_contas
    ADD CONSTRAINT transferencias_contas_conta_destino_id_fkey FOREIGN KEY (conta_destino_id) REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;


--
-- Name: transferencias_contas transferencias_contas_conta_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_contas
    ADD CONSTRAINT transferencias_contas_conta_origem_id_fkey FOREIGN KEY (conta_origem_id) REFERENCES public.bancos_cartoes(id) ON DELETE SET NULL;


--
-- Name: transferencias_contas transferencias_contas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_contas
    ADD CONSTRAINT transferencias_contas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: usuario_empresas usuario_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_empresas
    ADD CONSTRAINT usuario_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: usuario_empresas usuario_empresas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_empresas
    ADD CONSTRAINT usuario_empresas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: veiculos veiculos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.veiculos
    ADD CONSTRAINT veiculos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_oficina(id) ON DELETE CASCADE;


--
-- Name: veiculos_mecanico veiculos_mecanico_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.veiculos_mecanico
    ADD CONSTRAINT veiculos_mecanico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_mecanico(id) ON DELETE CASCADE;


--
-- Name: venda_itens_oficina venda_itens_oficina_peca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venda_itens_oficina
    ADD CONSTRAINT venda_itens_oficina_peca_id_fkey FOREIGN KEY (peca_id) REFERENCES public.moto_pecas(id);


--
-- Name: venda_itens_oficina venda_itens_oficina_venda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venda_itens_oficina
    ADD CONSTRAINT venda_itens_oficina_venda_id_fkey FOREIGN KEY (venda_id) REFERENCES public.vendas_oficina(id) ON DELETE CASCADE;


--
-- Name: vendas_oficina vendas_oficina_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas_oficina
    ADD CONSTRAINT vendas_oficina_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes_oficina(id);


--
-- Name: vendas_oficina vendas_oficina_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas_oficina
    ADD CONSTRAINT vendas_oficina_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas Admin pode atualizar empresa vinculada; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode atualizar empresa vinculada" ON public.empresas FOR UPDATE TO authenticated USING ((id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE ((usuario_empresas.user_id = auth.uid()) AND (usuario_empresas.role = 'admin'::text)))));


--
-- Name: empresas Admin pode criar empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode criar empresa" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: leads_diagnostico Admins can delete leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete leads" ON public.leads_diagnostico FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notificacoes_admin Admins can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert notifications" ON public.notificacoes_admin FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assinaturas Admins can insert subscriptions for any user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert subscriptions for any user" ON public.assinaturas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_diagnostico Admins can update leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update leads" ON public.leads_diagnostico FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notificacoes_admin Admins can update notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update notifications" ON public.notificacoes_admin FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assinaturas Admins can update subscriptions for any user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update subscriptions for any user" ON public.assinaturas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads_diagnostico Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads_diagnostico FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notificacoes_admin Admins can view all notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all notifications" ON public.notificacoes_admin FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assinaturas Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.assinaturas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: open_banking_bancos_suportados Admins manage supported banks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage supported banks" ON public.open_banking_bancos_suportados TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: open_banking_integracoes Admins view all integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all integrations" ON public.open_banking_integracoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: open_banking_logs Admins view all logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all logs" ON public.open_banking_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: aplicacoes Allow all aplicacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all aplicacoes" ON public.aplicacoes USING (true) WITH CHECK (true);


--
-- Name: assinaturas Allow all assinaturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all assinaturas" ON public.assinaturas USING (true) WITH CHECK (true);


--
-- Name: assinaturas_oficina Allow all assinaturas_oficina; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all assinaturas_oficina" ON public.assinaturas_oficina USING (true) WITH CHECK (true);


--
-- Name: clientes_oficina Allow all clientes_oficina; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all clientes_oficina" ON public.clientes_oficina USING (true) WITH CHECK (true);


--
-- Name: configuracoes Allow all configuracoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all configuracoes" ON public.configuracoes USING (true) WITH CHECK (true);


--
-- Name: financeiro_lancamentos Allow all financeiro_lancamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all financeiro_lancamentos" ON public.financeiro_lancamentos USING (true) WITH CHECK (true);


--
-- Name: fornecedores_oficina Allow all fornecedores_oficina; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all fornecedores_oficina" ON public.fornecedores_oficina USING (true) WITH CHECK (true);


--
-- Name: clientes Allow all inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all inserts" ON public.clientes FOR INSERT WITH CHECK (true);


--
-- Name: fornecedores Allow all inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all inserts" ON public.fornecedores FOR INSERT WITH CHECK (true);


--
-- Name: moto_aplicacoes Allow all moto_aplicacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all moto_aplicacoes" ON public.moto_aplicacoes USING (true) WITH CHECK (true);


--
-- Name: pecas Allow all pecas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all pecas" ON public.pecas USING (true) WITH CHECK (true);


--
-- Name: usuarios Allow all usuarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all usuarios" ON public.usuarios USING (true) WITH CHECK (true);


--
-- Name: leads_diagnostico Anyone can submit a lead; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit a lead" ON public.leads_diagnostico FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: open_banking_bancos_suportados Authenticated can view supported banks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view supported banks" ON public.open_banking_bancos_suportados FOR SELECT TO authenticated USING ((ativo = true));


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: open_banking_logs Service can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert logs" ON public.open_banking_logs FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: audit_logs System can insert audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: notas_fiscais_servico Users can delete own notas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notas" ON public.notas_fiscais_servico FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notas_fiscais_servico Users can insert own notas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own notas" ON public.notas_fiscais_servico FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: assinaturas Users can insert own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own subscription" ON public.assinaturas FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: nfse_sync_logs Users can insert own sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own sync logs" ON public.nfse_sync_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_trials Users can insert own trial; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own trial" ON public.user_trials FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: clientes Users can insert their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own data" ON public.clientes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: fornecedores Users can insert their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own data" ON public.fornecedores FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: settings Users can manage own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own settings" ON public.settings USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: regua_cobranca_automacao Users can manage their own automacao config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own automacao config" ON public.regua_cobranca_automacao USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: notas_fiscais_servico Users can update own notas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notas" ON public.notas_fiscais_servico FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: assinaturas Users can update own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own subscription" ON public.assinaturas FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: audit_logs Users can view own audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: nfse_cron_logs Users can view own cron logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own cron logs" ON public.nfse_cron_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notas_fiscais_servico Users can view own notas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notas" ON public.notas_fiscais_servico FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: assinaturas Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.assinaturas FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: nfse_sync_logs Users can view own sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sync logs" ON public.nfse_sync_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_trials Users can view own trial; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own trial" ON public.user_trials FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: open_banking_extratos Users delete own extratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own extratos" ON public.open_banking_extratos FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.open_banking_integracoes
  WHERE ((open_banking_integracoes.id = open_banking_extratos.integracao_id) AND (open_banking_integracoes.user_id = auth.uid())))));


--
-- Name: open_banking_integracoes Users delete own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own integrations" ON public.open_banking_integracoes FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: open_banking_extratos Users insert own extratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own extratos" ON public.open_banking_extratos FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.open_banking_integracoes
  WHERE ((open_banking_integracoes.id = open_banking_extratos.integracao_id) AND (open_banking_integracoes.user_id = auth.uid())))));


--
-- Name: open_banking_integracoes Users insert own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own integrations" ON public.open_banking_integracoes FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: anexos Users manage own anexos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own anexos" ON public.anexos TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: bancos_cartoes Users manage own bancos_cartoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own bancos_cartoes" ON public.bancos_cartoes TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: categorias Users manage own categorias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own categorias" ON public.categorias TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: clientes Users manage own clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own clientes" ON public.clientes USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: cobranca_historico Users manage own cobranca_historico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own cobranca_historico" ON public.cobranca_historico TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: contador_config Users manage own contador_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own contador_config" ON public.contador_config TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: contador_documentos Users manage own contador_documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own contador_documentos" ON public.contador_documentos TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: contas_pagar Users manage own contas_pagar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own contas_pagar" ON public.contas_pagar TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: contas_receber Users manage own contas_receber; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own contas_receber" ON public.contas_receber TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: empresa Users manage own empresa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own empresa" ON public.empresa TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: extrato_bancario Users manage own extrato_bancario; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own extrato_bancario" ON public.extrato_bancario TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: fechamentos_mensais Users manage own fechamentos_mensais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own fechamentos_mensais" ON public.fechamentos_mensais TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: fornecedores Users manage own fornecedores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own fornecedores" ON public.fornecedores USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: lancamentos_caixa Users manage own lancamentos_caixa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own lancamentos_caixa" ON public.lancamentos_caixa TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: licencas_software Users manage own licencas_software; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own licencas_software" ON public.licencas_software TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: mapeamento_contabil Users manage own mapeamento_contabil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own mapeamento_contabil" ON public.mapeamento_contabil USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: metas_orcamentarias Users manage own metas_orcamentarias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own metas_orcamentarias" ON public.metas_orcamentarias TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: nfse_rascunhos Users manage own nfse_rascunhos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own nfse_rascunhos" ON public.nfse_rascunhos USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: regua_cobranca Users manage own regua_cobranca; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own regua_cobranca" ON public.regua_cobranca TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: transferencias_contas Users manage own transferencias_contas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own transferencias_contas" ON public.transferencias_contas TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: open_banking_extratos Users update own extratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own extratos" ON public.open_banking_extratos FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.open_banking_integracoes
  WHERE ((open_banking_integracoes.id = open_banking_extratos.integracao_id) AND (open_banking_integracoes.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.open_banking_integracoes
  WHERE ((open_banking_integracoes.id = open_banking_extratos.integracao_id) AND (open_banking_integracoes.user_id = auth.uid())))));


--
-- Name: open_banking_integracoes Users update own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own integrations" ON public.open_banking_integracoes FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: open_banking_extratos Users view own extratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own extratos" ON public.open_banking_extratos FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.open_banking_integracoes
  WHERE ((open_banking_integracoes.id = open_banking_extratos.integracao_id) AND (open_banking_integracoes.user_id = auth.uid())))));


--
-- Name: open_banking_integracoes Users view own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own integrations" ON public.open_banking_integracoes FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: open_banking_logs Users view own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own logs" ON public.open_banking_logs FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.open_banking_integracoes
  WHERE ((open_banking_integracoes.id = open_banking_logs.integracao_id) AND (open_banking_integracoes.user_id = auth.uid()))))));


--
-- Name: usuario_empresas Usuário pode atualizar seus vínculos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário pode atualizar seus vínculos" ON public.usuario_empresas FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: budget_planning_lines Usuário pode gerenciar próprio orçamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário pode gerenciar próprio orçamento" ON public.budget_planning_lines TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: usuario_empresas Usuário pode inserir seus vínculos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário pode inserir seus vínculos" ON public.usuario_empresas FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: usuario_empresas Usuário pode remover seus vínculos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário pode remover seus vínculos" ON public.usuario_empresas FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: empresas Usuário pode ver empresas vinculadas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário pode ver empresas vinculadas" ON public.empresas FOR SELECT TO authenticated USING ((id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: usuario_empresas Usuário pode ver seus vínculos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário pode ver seus vínculos" ON public.usuario_empresas FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: certificados_nfse Usuários podem atualizar seus próprios certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar seus próprios certificados" ON public.certificados_nfse FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: certificados_nfse Usuários podem deletar seus próprios certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem deletar seus próprios certificados" ON public.certificados_nfse FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: certificados_nfse Usuários podem inserir seus próprios certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem inserir seus próprios certificados" ON public.certificados_nfse FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: certificados_nfse Usuários podem ver seus próprios certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver seus próprios certificados" ON public.certificados_nfse FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles admins insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins insert profiles" ON public.profiles FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() = id)));


--
-- Name: invoices admins manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage invoices" ON public.invoices USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: payment_reminders admins manage reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage reminders" ON public.payment_reminders USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles admins manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: routes admins manage routes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage routes" ON public.routes USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: students admins manage students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage students" ON public.students USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: whatsapp_templates admins manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage templates" ON public.whatsapp_templates USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vehicles admins manage vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admins manage vehicles" ON public.vehicles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: agendamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: agendamentos_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agendamentos_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes allow insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "allow insert" ON public.clientes FOR INSERT WITH CHECK (true);


--
-- Name: fornecedores allow insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "allow insert" ON public.fornecedores FOR INSERT WITH CHECK (true);


--
-- Name: anexos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;

--
-- Name: aplicacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.aplicacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: assinaturas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

--
-- Name: assinaturas_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assinaturas_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: assinaturas_oficina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assinaturas_oficina ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: auditoria_transacoes_cartao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auditoria_transacoes_cartao ENABLE ROW LEVEL SECURITY;

--
-- Name: bancos_cartoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bancos_cartoes ENABLE ROW LEVEL SECURITY;

--
-- Name: budget_planning_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.budget_planning_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: card_aliquotas_reforma; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_aliquotas_reforma ENABLE ROW LEVEL SECURITY;

--
-- Name: card_aliquotas_reforma card_aliquotas_reforma_read_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_aliquotas_reforma_read_policy ON public.card_aliquotas_reforma FOR SELECT USING (true);


--
-- Name: card_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: card_audit_logs card_audit_logs_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_audit_logs_user_policy ON public.card_audit_logs USING ((user_id = auth.uid()));


--
-- Name: card_dashboard_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_dashboard_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: card_dashboard_cache card_dashboard_cache_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_dashboard_cache_user_policy ON public.card_dashboard_cache USING ((user_id = auth.uid()));


--
-- Name: card_importacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_importacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: card_importacoes card_importacoes_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_importacoes_user_policy ON public.card_importacoes USING ((user_id = auth.uid()));


--
-- Name: card_relatorios_gerados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_relatorios_gerados ENABLE ROW LEVEL SECURITY;

--
-- Name: card_relatorios_gerados card_relatorios_gerados_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_relatorios_gerados_user_policy ON public.card_relatorios_gerados USING ((user_id = auth.uid()));


--
-- Name: card_report_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_report_config ENABLE ROW LEVEL SECURITY;

--
-- Name: card_report_config card_report_config_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_report_config_user_policy ON public.card_report_config USING ((user_id = auth.uid()));


--
-- Name: card_simulacoes_salvas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_simulacoes_salvas ENABLE ROW LEVEL SECURITY;

--
-- Name: card_simulacoes_salvas card_simulacoes_salvas_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_simulacoes_salvas_user_policy ON public.card_simulacoes_salvas USING ((user_id = auth.uid()));


--
-- Name: card_split_simulacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_split_simulacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: card_split_simulacoes card_split_simulacoes_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_split_simulacoes_user_policy ON public.card_split_simulacoes USING ((user_id = auth.uid()));


--
-- Name: card_transacoes_brutas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_transacoes_brutas ENABLE ROW LEVEL SECURITY;

--
-- Name: card_transacoes_brutas card_transacoes_brutas_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_transacoes_brutas_user_policy ON public.card_transacoes_brutas USING ((user_id = auth.uid()));


--
-- Name: categorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

--
-- Name: certificados_nfse; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificados_nfse ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes_oficina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes_oficina ENABLE ROW LEVEL SECURITY;

--
-- Name: cobranca_historico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cobranca_historico ENABLE ROW LEVEL SECURITY;

--
-- Name: comissoes_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comissoes_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracoes_cartao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracoes_cartao ENABLE ROW LEVEL SECURITY;

--
-- Name: contabilidade_erp_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contabilidade_erp_config ENABLE ROW LEVEL SECURITY;

--
-- Name: contabilidade_erp_config contabilidade_erp_config_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_erp_config_delete_own ON public.contabilidade_erp_config FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_erp_config contabilidade_erp_config_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_erp_config_insert_own ON public.contabilidade_erp_config FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_erp_config contabilidade_erp_config_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_erp_config_select_own ON public.contabilidade_erp_config FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_erp_config contabilidade_erp_config_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_erp_config_update_own ON public.contabilidade_erp_config FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_lancamentos_importados contabilidade_lanc_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_lanc_delete_own ON public.contabilidade_lancamentos_importados FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_lancamentos_importados contabilidade_lanc_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_lanc_insert_own ON public.contabilidade_lancamentos_importados FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_lancamentos_importados contabilidade_lanc_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_lanc_select_own ON public.contabilidade_lancamentos_importados FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_lancamentos_importados contabilidade_lanc_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_lanc_update_own ON public.contabilidade_lancamentos_importados FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_lancamentos_importados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contabilidade_lancamentos_importados ENABLE ROW LEVEL SECURITY;

--
-- Name: contabilidade_mapeamento_contas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contabilidade_mapeamento_contas ENABLE ROW LEVEL SECURITY;

--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_mapeamento_delete_own ON public.contabilidade_mapeamento_contas FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_mapeamento_insert_own ON public.contabilidade_mapeamento_contas FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_mapeamento_select_own ON public.contabilidade_mapeamento_contas FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_mapeamento_contas contabilidade_mapeamento_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_mapeamento_update_own ON public.contabilidade_mapeamento_contas FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_sincronizacao contabilidade_sinc_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_sinc_delete_own ON public.contabilidade_sincronizacao FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_sincronizacao contabilidade_sinc_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_sinc_insert_own ON public.contabilidade_sincronizacao FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_sincronizacao contabilidade_sinc_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_sinc_select_own ON public.contabilidade_sincronizacao FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: contabilidade_sincronizacao contabilidade_sinc_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contabilidade_sinc_update_own ON public.contabilidade_sincronizacao FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: contabilidade_sincronizacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contabilidade_sincronizacao ENABLE ROW LEVEL SECURITY;

--
-- Name: contador_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contador_config ENABLE ROW LEVEL SECURITY;

--
-- Name: contador_documentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contador_documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: contas_pagar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

--
-- Name: contas_receber; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

--
-- Name: certificados_nfse delete_certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_certificados ON public.certificados_nfse FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: plano_contas delete_plano_contas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_plano_contas ON public.plano_contas FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: transacoes_cartao delete_transacoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_transacoes_cartao ON public.transacoes_cartao FOR DELETE USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: routes drivers view own routes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "drivers view own routes" ON public.routes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.vehicles v
  WHERE ((v.id = routes.vehicle_id) AND (v.driver_id = auth.uid())))));


--
-- Name: vehicles drivers view own vehicle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "drivers view own vehicle" ON public.vehicles FOR SELECT USING ((driver_id = auth.uid()));


--
-- Name: students drivers view route students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "drivers view route students" ON public.students FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.routes r
     JOIN public.vehicles v ON ((v.id = r.vehicle_id)))
  WHERE ((r.id = students.route_id) AND (v.driver_id = auth.uid())))));


--
-- Name: empresa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresas_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: extrato_bancario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;

--
-- Name: fechamentos_mensais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

--
-- Name: financeiro; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

--
-- Name: financeiro_lancamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: financeiro_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financeiro_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: fornecedor_catalogo_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fornecedor_catalogo_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: fornecedores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

--
-- Name: fornecedores_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fornecedores_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: fornecedores_oficina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fornecedores_oficina ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funcionarios_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: students guardians view own children; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "guardians view own children" ON public.students FOR SELECT USING ((guardian_id = auth.uid()));


--
-- Name: invoices guardians view own children invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "guardians view own children invoices" ON public.invoices FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = invoices.student_id) AND (s.guardian_id = auth.uid())))));


--
-- Name: certificados_nfse insert_certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_certificados ON public.certificados_nfse FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: configuracoes_cartao insert_configuracoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_configuracoes_cartao ON public.configuracoes_cartao FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid())))));


--
-- Name: plano_contas insert_plano_contas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_plano_contas ON public.plano_contas FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: transacoes_cartao insert_transacoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_transacoes_cartao ON public.transacoes_cartao FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid())))));


--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: lancamentos_caixa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lancamentos_caixa ENABLE ROW LEVEL SECURITY;

--
-- Name: leads_diagnostico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads_diagnostico ENABLE ROW LEVEL SECURITY;

--
-- Name: licencas_software; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licencas_software ENABLE ROW LEVEL SECURITY;

--
-- Name: mapeamento_contabil; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mapeamento_contabil ENABLE ROW LEVEL SECURITY;

--
-- Name: metas_orcamentarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metas_orcamentarias ENABLE ROW LEVEL SECURITY;

--
-- Name: moto_aplicacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moto_aplicacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: moto_pecas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moto_pecas ENABLE ROW LEVEL SECURITY;

--
-- Name: nfs_e_emitentes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfs_e_emitentes ENABLE ROW LEVEL SECURITY;

--
-- Name: nfs_e_notas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfs_e_notas ENABLE ROW LEVEL SECURITY;

--
-- Name: nfs_e_rascunhos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfs_e_rascunhos ENABLE ROW LEVEL SECURITY;

--
-- Name: nfse_cron_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfse_cron_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: nfs_e_emitentes nfse_emitentes_isolamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_emitentes_isolamento ON public.nfs_e_emitentes TO authenticated USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid())))) WITH CHECK ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: nfs_e_emitentes nfse_emitentes_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_emitentes_service ON public.nfs_e_emitentes TO service_role USING (true) WITH CHECK (true);


--
-- Name: nfs_e_notas nfse_notas_isolamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_notas_isolamento ON public.nfs_e_notas TO authenticated USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid())))) WITH CHECK ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: nfs_e_notas nfse_notas_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_notas_service ON public.nfs_e_notas TO service_role USING (true) WITH CHECK (true);


--
-- Name: nfse_rascunhos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfse_rascunhos ENABLE ROW LEVEL SECURITY;

--
-- Name: nfs_e_rascunhos nfse_rascunhos_isolamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_rascunhos_isolamento ON public.nfs_e_rascunhos TO authenticated USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid())))) WITH CHECK ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: nfs_e_rascunhos nfse_rascunhos_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_rascunhos_service ON public.nfs_e_rascunhos TO service_role USING (true) WITH CHECK (true);


--
-- Name: nfs_e_rascunhos nfse_rascunhos_usuario; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nfse_rascunhos_usuario ON public.nfs_e_rascunhos TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: nfse_sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfse_sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: notas_fiscais_servico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notas_fiscais_servico ENABLE ROW LEVEL SECURITY;

--
-- Name: notificacoes_admin; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notificacoes_admin ENABLE ROW LEVEL SECURITY;

--
-- Name: obd2_leituras_mecanico obd2_leituras_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY obd2_leituras_delete_own ON public.obd2_leituras_mecanico FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: obd2_leituras_mecanico obd2_leituras_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY obd2_leituras_insert_own ON public.obd2_leituras_mecanico FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: obd2_leituras_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.obd2_leituras_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: obd2_leituras_mecanico obd2_leituras_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY obd2_leituras_select_own ON public.obd2_leituras_mecanico FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: open_banking_bancos_suportados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.open_banking_bancos_suportados ENABLE ROW LEVEL SECURITY;

--
-- Name: open_banking_extratos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.open_banking_extratos ENABLE ROW LEVEL SECURITY;

--
-- Name: open_banking_integracoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.open_banking_integracoes ENABLE ROW LEVEL SECURITY;

--
-- Name: open_banking_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.open_banking_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: orcamento_itens_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orcamento_itens_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: orcamentos_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orcamentos_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: ordem_servico_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ordem_servico_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: ordens_servico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

--
-- Name: ordens_servico_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ordens_servico_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: os_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.os_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: os_itens_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.os_itens_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: agendamentos own agendamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own agendamentos" ON public.agendamentos USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: agendamentos_mecanico own agendamentos_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own agendamentos_mecanico" ON public.agendamentos_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: assinaturas_mecanico own assinaturas_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own assinaturas_mecanico" ON public.assinaturas_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: clientes_mecanico own clientes_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own clientes_mecanico" ON public.clientes_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: clientes_oficina own clientes_oficina; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own clientes_oficina" ON public.clientes_oficina USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: comissoes_mecanico own comissoes_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own comissoes_mecanico" ON public.comissoes_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: empresas_mecanico own empresas_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own empresas_mecanico" ON public.empresas_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: financeiro own financeiro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own financeiro" ON public.financeiro USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: financeiro_mecanico own financeiro_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own financeiro_mecanico" ON public.financeiro_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: fornecedor_catalogo_mecanico own fornecedor_catalogo_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own fornecedor_catalogo_mecanico" ON public.fornecedor_catalogo_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: fornecedores_mecanico own fornecedores_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own fornecedores_mecanico" ON public.fornecedores_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: funcionarios own funcionarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own funcionarios" ON public.funcionarios USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: funcionarios_mecanico own funcionarios_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own funcionarios_mecanico" ON public.funcionarios_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: orcamento_itens_mecanico own orcamento_itens_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own orcamento_itens_mecanico" ON public.orcamento_itens_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: orcamentos_mecanico own orcamentos_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own orcamentos_mecanico" ON public.orcamentos_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ordens_servico own os; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own os" ON public.ordens_servico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: os_itens own os_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own os_itens" ON public.os_itens USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: os_itens_mecanico own os_itens_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own os_itens_mecanico" ON public.os_itens_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ordens_servico_mecanico own os_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own os_mecanico" ON public.ordens_servico_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: pecas own pecas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pecas" ON public.pecas USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: pecas_mecanico own pecas_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pecas_mecanico" ON public.pecas_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: veiculos own veiculos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own veiculos" ON public.veiculos USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: veiculos_mecanico own veiculos_mecanico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own veiculos_mecanico" ON public.veiculos_mecanico USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: payment_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: pecas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;

--
-- Name: pecas_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pecas_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: plano_contas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: regua_cobranca; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regua_cobranca ENABLE ROW LEVEL SECURITY;

--
-- Name: regua_cobranca_automacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regua_cobranca_automacao ENABLE ROW LEVEL SECURITY;

--
-- Name: routes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

--
-- Name: auditoria_transacoes_cartao select_auditoria_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_auditoria_cartao ON public.auditoria_transacoes_cartao FOR SELECT USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: certificados_nfse select_certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_certificados ON public.certificados_nfse FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: configuracoes_cartao select_configuracoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_configuracoes_cartao ON public.configuracoes_cartao FOR SELECT USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: plano_contas select_plano_contas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_plano_contas ON public.plano_contas FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: transacoes_cartao select_transacoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_transacoes_cartao ON public.transacoes_cartao FOR SELECT USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_subscription_payments super admin manage tenant payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "super admin manage tenant payments" ON public.tenant_subscription_payments TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));


--
-- Name: tenant_subscriptions super admin manage tenant subs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "super admin manage tenant subs" ON public.tenant_subscriptions TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));


--
-- Name: tenants super admin manage tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "super admin manage tenants" ON public.tenants TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));


--
-- Name: tenant_subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: transacoes_cartao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transacoes_cartao ENABLE ROW LEVEL SECURITY;

--
-- Name: transferencias_contas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transferencias_contas ENABLE ROW LEVEL SECURITY;

--
-- Name: certificados_nfse update_certificados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_certificados ON public.certificados_nfse FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: configuracoes_cartao update_configuracoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_configuracoes_cartao ON public.configuracoes_cartao FOR UPDATE USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: plano_contas update_plano_contas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_plano_contas ON public.plano_contas FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: transacoes_cartao update_transacoes_cartao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_transacoes_cartao ON public.transacoes_cartao FOR UPDATE USING ((empresa_id IN ( SELECT usuario_empresas.empresa_id
   FROM public.usuario_empresas
  WHERE (usuario_empresas.user_id = auth.uid()))));


--
-- Name: clientes_oficina user_isolation_clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_clientes ON public.clientes_oficina USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: configuracoes user_isolation_configuracoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_configuracoes ON public.configuracoes USING (((user_id = auth.uid()) OR (user_id IS NULL))) WITH CHECK ((user_id = auth.uid()));


--
-- Name: financeiro_lancamentos user_isolation_financeiro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_financeiro ON public.financeiro_lancamentos USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: fornecedores_oficina user_isolation_fornecedores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_fornecedores ON public.fornecedores_oficina USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: ordem_servico_itens user_isolation_ordem_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_ordem_itens ON public.ordem_servico_itens USING ((ordem_id IN ( SELECT ordens_servico.id
   FROM public.ordens_servico
  WHERE (ordens_servico.user_id = auth.uid())))) WITH CHECK ((ordem_id IN ( SELECT ordens_servico.id
   FROM public.ordens_servico
  WHERE (ordens_servico.user_id = auth.uid()))));


--
-- Name: ordens_servico user_isolation_ordens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_ordens ON public.ordens_servico USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: moto_pecas user_isolation_pecas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_pecas ON public.moto_pecas USING (((user_id = auth.uid()) OR (user_id IS NULL))) WITH CHECK ((user_id = auth.uid()));


--
-- Name: venda_itens_oficina user_isolation_venda_itens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_venda_itens ON public.venda_itens_oficina USING ((venda_id IN ( SELECT vendas_oficina.id
   FROM public.vendas_oficina
  WHERE (vendas_oficina.user_id = auth.uid())))) WITH CHECK ((venda_id IN ( SELECT vendas_oficina.id
   FROM public.vendas_oficina
  WHERE (vendas_oficina.user_id = auth.uid()))));


--
-- Name: vendas_oficina user_isolation_vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_vendas ON public.vendas_oficina USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_trials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles users see own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (((auth.uid() = id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles users view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (((auth.uid() = id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: usuario_empresas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuario_empresas ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: veiculos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

--
-- Name: veiculos_mecanico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.veiculos_mecanico ENABLE ROW LEVEL SECURITY;

--
-- Name: venda_itens_oficina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venda_itens_oficina ENABLE ROW LEVEL SECURITY;

--
-- Name: vendas_oficina; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendas_oficina ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: messages Authenticated users receive own realtime; Type: POLICY; Schema: realtime; Owner: -
--

CREATE POLICY "Authenticated users receive own realtime" ON realtime.messages FOR SELECT TO authenticated USING ((realtime.topic() ~ '^realtime:public:'::text));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Authenticated users can update their own logo; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can update their own logo" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'logos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Authenticated users can upload their own logo; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can upload their own logo" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'logos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Logos are publicly accessible; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Logos are publicly accessible" ON storage.objects FOR SELECT USING ((bucket_id = 'logos'::text));


--
-- Name: objects Users can delete logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete logos" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'logos'::text));


--
-- Name: objects Users can delete own anexos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own anexos" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'anexos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can delete own certificados-nfse; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own certificados-nfse" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'certificados-nfse'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can delete own contador docs; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own contador docs" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'contador-docs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can update logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update logos" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'logos'::text));


--
-- Name: objects Users can update own certificados-nfse; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update own certificados-nfse" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'certificados-nfse'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) WITH CHECK (((bucket_id = 'certificados-nfse'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can update their own attachments; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update their own attachments" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'anexos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can upload certificados-nfse; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload certificados-nfse" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'certificados-nfse'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload contador docs; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload contador docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'contador-docs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can upload logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'logos'::text));


--
-- Name: objects Users can upload own anexos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload own anexos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'anexos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view own anexos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own anexos" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'anexos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view own certificados-nfse; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own certificados-nfse" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'certificados-nfse'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can view own contador docs; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own contador docs" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'contador-docs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: objects licencas_docs_delete_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY licencas_docs_delete_own ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'licencas-documentos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects licencas_docs_insert_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY licencas_docs_insert_own ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'licencas-documentos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects licencas_docs_select_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY licencas_docs_select_own ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'licencas-documentos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects licencas_docs_update_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY licencas_docs_update_own ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'licencas-documentos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime bancos_cartoes; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.bancos_cartoes;


--
-- Name: supabase_realtime categorias; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.categorias;


--
-- Name: supabase_realtime contabilidade_sincronizacao; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.contabilidade_sincronizacao;


--
-- Name: supabase_realtime contas_pagar; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.contas_pagar;


--
-- Name: supabase_realtime contas_receber; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.contas_receber;


--
-- Name: supabase_realtime extrato_bancario; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.extrato_bancario;


--
-- Name: supabase_realtime lancamentos_caixa; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.lancamentos_caixa;


--
-- Name: supabase_realtime notificacoes_admin; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.notificacoes_admin;


--
-- Name: supabase_realtime transferencias_contas; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.transferencias_contas;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict TRcPQMFqhZtGOrU0F2CFj1p6mUM9QkMvCMzRCUVUIhKRHXgYu6YTO8aficg0l23

