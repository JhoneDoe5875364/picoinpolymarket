/*
 Navicat Premium Data Transfer

 Source Server         : PostgreSQL
 Source Server Type    : PostgreSQL
 Source Server Version : 170005 (170005)
 Source Host           : localhost:5432
 Source Catalog        : predictpix
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170005 (170005)
 File Encoding         : 65001

 Date: 29/12/2025 18:44:52
*/


-- ----------------------------
-- Sequence structure for attestations_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."attestations_id_seq";
CREATE SEQUENCE "public"."attestations_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for compliance_logs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."compliance_logs_id_seq";
CREATE SEQUENCE "public"."compliance_logs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for market_comments_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."market_comments_id_seq";
CREATE SEQUENCE "public"."market_comments_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for market_history_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."market_history_id_seq";
CREATE SEQUENCE "public"."market_history_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for admin_audit
-- ----------------------------
DROP TABLE IF EXISTS "public"."admin_audit";
CREATE TABLE "public"."admin_audit" (
  "id" uuid NOT NULL,
  "at" timestamptz(6) NOT NULL DEFAULT now(),
  "action" text COLLATE "pg_catalog"."default" NOT NULL,
  "target_id" uuid,
  "details" jsonb NOT NULL DEFAULT '{}'::jsonb
)
;

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS "public"."admins";
CREATE TABLE "public"."admins" (
  "user_id" uuid NOT NULL
)
;

-- ----------------------------
-- Table structure for attestations
-- ----------------------------
DROP TABLE IF EXISTS "public"."attestations";
CREATE TABLE "public"."attestations" (
  "id" int4 NOT NULL DEFAULT nextval('attestations_id_seq'::regclass),
  "user_id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "ip" varchar(45) COLLATE "pg_catalog"."default" NOT NULL,
  "region_code" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "state_code" varchar(10) COLLATE "pg_catalog"."default",
  "attestation_version" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "timestamp" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS "public"."categories";
CREATE TABLE "public"."categories" (
  "name" text COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS "public"."comments";
CREATE TABLE "public"."comments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "market_id" uuid NOT NULL,
  "user_id" uuid,
  "username" text COLLATE "pg_catalog"."default",
  "body" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for compliance_logs
-- ----------------------------
DROP TABLE IF EXISTS "public"."compliance_logs";
CREATE TABLE "public"."compliance_logs" (
  "id" int4 NOT NULL DEFAULT nextval('compliance_logs_id_seq'::regclass),
  "user_id" varchar(255) COLLATE "pg_catalog"."default",
  "ip" varchar(45) COLLATE "pg_catalog"."default" NOT NULL,
  "region_code" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "state_code" varchar(10) COLLATE "pg_catalog"."default",
  "tier" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "category_key" varchar(255) COLLATE "pg_catalog"."default",
  "action_type" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "result" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "reason" text COLLATE "pg_catalog"."default",
  "timestamp" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for market_comments
-- ----------------------------
DROP TABLE IF EXISTS "public"."market_comments";
CREATE TABLE "public"."market_comments" (
  "id" int8 NOT NULL DEFAULT nextval('market_comments_id_seq'::regclass),
  "market_id" uuid NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "author_id" text COLLATE "pg_catalog"."default",
  "body" text COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for market_history
-- ----------------------------
DROP TABLE IF EXISTS "public"."market_history";
CREATE TABLE "public"."market_history" (
  "id" int8 NOT NULL DEFAULT nextval('market_history_id_seq'::regclass),
  "market_id" uuid NOT NULL,
  "ts" timestamptz(6) NOT NULL DEFAULT now(),
  "implied_yes" numeric NOT NULL,
  "implied_no" numeric NOT NULL,
  "source" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'snapshot'::text
)
;

-- ----------------------------
-- Table structure for market_price_history
-- ----------------------------
DROP TABLE IF EXISTS "public"."market_price_history";
CREATE TABLE "public"."market_price_history" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "market_id" uuid NOT NULL,
  "ts_date" date NOT NULL DEFAULT now(),
  "yes_pct" float8 NOT NULL,
  "no_pct" float8 NOT NULL,
  "volume_pi" numeric DEFAULT 0
)
;

-- ----------------------------
-- Table structure for markets
-- ----------------------------
DROP TABLE IF EXISTS "public"."markets";
CREATE TABLE "public"."markets" (
  "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "question" text COLLATE "pg_catalog"."default" NOT NULL,
  "category" text COLLATE "pg_catalog"."default",
  "creator_id" uuid,
  "tier" text COLLATE "pg_catalog"."default",
  "status" text COLLATE "pg_catalog"."default" DEFAULT 'open'::text,
  "created_at" timestamptz(6) DEFAULT now(),
  "end_date" timestamptz(6),
  "liquidity" numeric,
  "resolution_criteria" text COLLATE "pg_catalog"."default",
  "resolution_source" text COLLATE "pg_catalog"."default",
  "resolved" bool NOT NULL DEFAULT false,
  "resolved_at" timestamp(6),
  "resolved_outcome" text COLLATE "pg_catalog"."default",
  "is_archived" bool DEFAULT false,
  "closes_at" timestamptz(6),
  "outcome_reason" text COLLATE "pg_catalog"."default",
  "title" text COLLATE "pg_catalog"."default" GENERATED ALWAYS AS (
question
) STORED,
  "seed_total" numeric DEFAULT 0,
  "description" text COLLATE "pg_catalog"."default",
  "close_at" timestamptz(6),
  "rules" text COLLATE "pg_catalog"."default",
  "sources" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "tags" text[] COLLATE "pg_catalog"."default" NOT NULL DEFAULT '{}'::text[],
  "checklist_resolution_clarity" bool NOT NULL DEFAULT true,
  "checklist_restricted_topics" bool NOT NULL DEFAULT true,
  "checklist_verifiable_outcome" bool NOT NULL DEFAULT true
)
;

-- ----------------------------
-- Table structure for positions
-- ----------------------------
DROP TABLE IF EXISTS "public"."positions";
CREATE TABLE "public"."positions" (
  "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id" uuid,
  "market_id" uuid,
  "side" text COLLATE "pg_catalog"."default",
  "amount" numeric,
  "created_at" timestamptz(6) DEFAULT now(),
  "status" text COLLATE "pg_catalog"."default",
  "user_handle" text COLLATE "pg_catalog"."default",
  "pi_amount" numeric(255,0)
)
;
COMMENT ON COLUMN "public"."positions"."amount" IS 'refresh';

-- ----------------------------
-- Table structure for referrals
-- ----------------------------
DROP TABLE IF EXISTS "public"."referrals";
CREATE TABLE "public"."referrals" (
  "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "referrer_id" uuid,
  "referred_id" uuid,
  "created_at" timestamptz(6) DEFAULT now(),
  "reward_earned" bool DEFAULT false
)
;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS "public"."roles";
CREATE TABLE "public"."roles" (
  "id" int4 NOT NULL,
  "role" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for suggestions
-- ----------------------------
DROP TABLE IF EXISTS "public"."suggestions";
CREATE TABLE "public"."suggestions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "title" text COLLATE "pg_catalog"."default" NOT NULL,
  "category" text COLLATE "pg_catalog"."default" NOT NULL,
  "resolution_criteria" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "end_time" timestamptz(6) NOT NULL,
  "status" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'pending'::text,
  "reject_reason" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "approved_at" timestamptz(6),
  "approved_by" uuid,
  "submitted_by" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for trades
-- ----------------------------
DROP TABLE IF EXISTS "public"."trades";
CREATE TABLE "public"."trades" (
  "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id" uuid,
  "market_id" uuid,
  "type" text COLLATE "pg_catalog"."default",
  "side" text COLLATE "pg_catalog"."default",
  "pi_amount" numeric,
  "created_at" timestamptz(6) DEFAULT now(),
  "fee_pi" numeric NOT NULL DEFAULT 0,
  "net_pi" numeric GENERATED ALWAYS AS (
(pi_amount - fee_pi)
) STORED,
  "invalid" bool NOT NULL DEFAULT false,
  "kind" text COLLATE "pg_catalog"."default" DEFAULT 'buy'::text,
  "amount" numeric(255,0)
)
;

-- ----------------------------
-- Table structure for transactions
-- ----------------------------
DROP TABLE IF EXISTS "public"."transactions";
CREATE TABLE "public"."transactions" (
  "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "user_id" uuid NOT NULL,
  "market_id" uuid,
  "amount" numeric(255,0),
  "type" varchar(255) COLLATE "pg_catalog"."default",
  "status" varchar(255) COLLATE "pg_catalog"."default",
  "details" varchar(255) COLLATE "pg_catalog"."default",
  "date" date,
  "pi_amount" numeric
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "pi_username" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT now(),
  "referral_code" text COLLATE "pg_catalog"."default",
  "referred_by" text COLLATE "pg_catalog"."default",
  "tutorial_completed" bool DEFAULT false,
  "handle_norm" text COLLATE "pg_catalog"."default",
  "status" varchar(255) COLLATE "pg_catalog"."default",
  "balance" numeric NOT NULL DEFAULT 0,
  "role_id" int4 NOT NULL DEFAULT 3
)
;

-- ----------------------------
-- Function structure for _require_admin
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."_require_admin"();
CREATE OR REPLACE FUNCTION "public"."_require_admin"()
  RETURNS "pg_catalog"."void" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  SET "search_path"="public";

-- ----------------------------
-- Function structure for admin_add
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."admin_add"("p_user" uuid);
CREATE OR REPLACE FUNCTION "public"."admin_add"("p_user" uuid)
  RETURNS TABLE("user_id" uuid) AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for admin_create_market
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."admin_create_market"("p_question" text, "p_category" text, "p_tier" text, "p_end_date" timestamptz, "p_closes_at" timestamptz, "p_liquidity" numeric, "p_resolution_criteria" text, "p_resolution_source" text);
CREATE OR REPLACE FUNCTION "public"."admin_create_market"("p_question" text, "p_category" text=NULL::text, "p_tier" text=NULL::text, "p_end_date" timestamptz=NULL::timestamp with time zone, "p_closes_at" timestamptz=NULL::timestamp with time zone, "p_liquidity" numeric=0, "p_resolution_criteria" text=NULL::text, "p_resolution_source" text=NULL::text)
  RETURNS "public"."markets" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  SET "search_path"="public";

-- ----------------------------
-- Function structure for admin_list
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."admin_list"();
CREATE OR REPLACE FUNCTION "public"."admin_list"()
  RETURNS TABLE("user_id" uuid) AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for admin_remove
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."admin_remove"("p_user" uuid);
CREATE OR REPLACE FUNCTION "public"."admin_remove"("p_user" uuid)
  RETURNS "pg_catalog"."bool" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  SET "search_path"="public";

-- ----------------------------
-- Function structure for admin_resolve_market
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."admin_resolve_market"("p_market_id" uuid, "p_outcome" text, "p_auto_payout" bool);
CREATE OR REPLACE FUNCTION "public"."admin_resolve_market"("p_market_id" uuid, "p_outcome" text, "p_auto_payout" bool=false)
  RETURNS TABLE("market_id" uuid, "outcome" text, "resolved" bool, "resolved_at" timestamptz, "winners" int4, "pot_pi" numeric, "payouts_created" int4) AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for comments_insert_rpc
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."comments_insert_rpc"("p_market_id" uuid, "p_author" text, "p_body" text);
CREATE OR REPLACE FUNCTION "public"."comments_insert_rpc"("p_market_id" uuid, "p_author" text, "p_body" text)
  RETURNS "pg_catalog"."jsonb" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  COST 100
  SET "search_path"="public";

-- ----------------------------
-- Function structure for ensure_user_for_position
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."ensure_user_for_position"();
CREATE OR REPLACE FUNCTION "public"."ensure_user_for_position"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  INSERT INTO public.users (id) VALUES (NEW.user_id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for get_or_create_user_by_pi
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."get_or_create_user_by_pi"("p_user_id" uuid, "p_username" text);
CREATE OR REPLACE FUNCTION "public"."get_or_create_user_by_pi"("p_user_id" uuid, "p_username" text)
  RETURNS "public"."users" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  COST 100;

-- ----------------------------
-- Function structure for is_admin
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."is_admin"("uid" uuid);
CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" uuid)
  RETURNS "pg_catalog"."bool" AS $BODY$
  select exists (select 1 from public.admins a where a.user_id = uid)
$BODY$
  LANGUAGE sql STABLE
  COST 100;

-- ----------------------------
-- Function structure for market_stats
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."market_stats"("p_market_id" uuid);
CREATE OR REPLACE FUNCTION "public"."market_stats"("p_market_id" uuid)
  RETURNS TABLE("total_volume" numeric, "yes_total" numeric, "no_total" numeric, "implied_pct" numeric, "volume_24h" numeric) AS $BODY$
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
$BODY$
  LANGUAGE sql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for norm_handle
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."norm_handle"("txt" text);
CREATE OR REPLACE FUNCTION "public"."norm_handle"("txt" text)
  RETURNS "pg_catalog"."text" AS $BODY$
  SELECT NULLIF(regexp_replace(lower(btrim(coalesce($1,''))), '^[[:space:]@]+', ''), '');
$BODY$
  LANGUAGE sql IMMUTABLE
  COST 100;

-- ----------------------------
-- Function structure for positions_after_insert
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."positions_after_insert"();
CREATE OR REPLACE FUNCTION "public"."positions_after_insert"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
DECLARE
  prev_yes numeric;
  prev_no  numeric;
	prev_yes_volume numeric;
	prev_no_volume numeric;
  new_yes  numeric;
  new_no   numeric;
  new_yes_pct  numeric;
  new_no_pct   numeric;
	new_yes_volume numeric;
	new_no_volume numeric;
	volume	 numeric;
BEGIN
	
	-- Calculate new_yes and new_no
	SELECT yes_volume, no_volume
	INTO prev_yes_volume, prev_no_volume
	FROM v_market_snapshots
	WHERE id = NEW.market_id;
	
	IF NEW.side = 'yes' THEN
		new_yes_volume := prev_yes_volume + NEW.pi_amount;
		new_no_volume := prev_no_volume;
	ELSE
		new_yes_volume := prev_yes_volume;
		new_no_volume := prev_no_volume + NEW.pi_amount;
	END IF;
	
	volume := new_yes_volume + new_no_volume;
	new_yes := (new_yes_volume + 50) / (volume + 50 + 50);
	new_no := (new_no_volume + 50) / (volume + 50 + 50);
	new_yes_pct := new_yes * 100;
	new_no_pct := new_no * 100;

  -- Record trade with non-NULL price
  INSERT INTO trades (market_id, created_at, "type", side, amount, pi_amount, user_id)
  VALUES (NEW.market_id, COALESCE(NEW.created_at, now()), 'buy', NEW.side, NEW.amount, NEW.pi_amount, NEW.user_id);

  -- Append history
  INSERT INTO market_history (market_id, ts, implied_yes, implied_no, source)
  VALUES (NEW.market_id, COALESCE(NEW.created_at, now()), new_yes, new_no, 'trade');
	
	-- Append price history
	INSERT INTO market_price_history (market_id, ts_date, yes_pct, no_pct, volume_pi)
	VALUES (NEW.market_id, CURRENT_DATE, new_yes_pct, new_no_pct, volume)
	ON CONFLICT ON CONSTRAINT unique_market_date
	DO UPDATE SET
			market_id = EXCLUDED.market_id,
			ts_date   = CURRENT_DATE,
			yes_pct = new_yes_pct,
			no_pct = new_no_pct,
			volume_pi = volume;
	RETURN NEW;
	
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for trades_apply_fee
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."trades_apply_fee"();
CREATE OR REPLACE FUNCTION "public"."trades_apply_fee"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for trades_autovalidate
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."trades_autovalidate"();
CREATE OR REPLACE FUNCTION "public"."trades_autovalidate"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for users_autofill_handle_norm
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."users_autofill_handle_norm"();
CREATE OR REPLACE FUNCTION "public"."users_autofill_handle_norm"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- View structure for v_latest_history
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_latest_history";
CREATE VIEW "public"."v_latest_history" AS  SELECT DISTINCT ON (market_id) market_id,
    ts AS updated_at,
    implied_yes,
    implied_no
   FROM market_history h
  ORDER BY market_id, ts DESC;

-- ----------------------------
-- View structure for v_market_volumes
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_market_volumes";
CREATE VIEW "public"."v_market_volumes" AS  SELECT market_id,
    sum(pi_amount) AS total_volume,
    sum(pi_amount) FILTER (WHERE created_at > (now() - '24:00:00'::interval)) AS volume_24h
   FROM trades mt
  GROUP BY market_id;

-- ----------------------------
-- View structure for v_market_snapshots
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_market_snapshots";
CREATE VIEW "public"."v_market_snapshots" AS  WITH vol AS (
         SELECT mt.market_id,
            COALESCE(sum(mt.pi_amount), 0::numeric) AS total_volume,
            COALESCE(sum(mt.pi_amount) FILTER (WHERE mt.created_at > (now() - '24:00:00'::interval)), 0::numeric) AS volume_24h,
            COALESCE(sum(mt.pi_amount) FILTER (WHERE mt.side = 'yes'::text), 0::numeric) AS yes_volume,
            COALESCE(sum(mt.pi_amount) FILTER (WHERE mt.side = 'no'::text), 0::numeric) AS no_volume
           FROM trades mt
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
    COALESCE(vol.total_volume, 0::numeric) AS total_volume,
    COALESCE(vol.volume_24h, 0::numeric) AS volume_24h,
    COALESCE(vol.yes_volume, 0::numeric) AS yes_volume,
    COALESCE(vol.no_volume, 0::numeric) AS no_volume,
        CASE
            WHEN vol.total_volume > 0::numeric THEN round((vol.yes_volume + 50::numeric) * 100::numeric / (vol.total_volume + 50::numeric + 50::numeric))
            ELSE 50::numeric
        END AS yes_pct,
        CASE
            WHEN vol.total_volume > 0::numeric THEN round((vol.no_volume + 50::numeric) * 100::numeric / (vol.total_volume + 50::numeric + 50::numeric))
            ELSE 50::numeric
        END AS no_pct
   FROM markets m
     LEFT JOIN vol ON vol.market_id = m.id
  WHERE m.status = ANY (ARRAY['open'::text, 'pending'::text, 'resolved'::text]);

-- ----------------------------
-- View structure for v_portfolio_open_markets
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_portfolio_open_markets";
CREATE VIEW "public"."v_portfolio_open_markets" AS  SELECT p.market_id AS id,
    p.market_id,
    p.id AS position_id,
    p.user_id,
    m.title,
    m.title AS market_title,
    COALESCE(m.status, 'open'::text) AS status,
    m.resolved_outcome,
    p.side,
    p.amount,
    p.pi_amount,
    p.created_at,
    COALESCE(a.yes, 0::numeric) AS yes,
    COALESCE(a.no, 0::numeric) AS no
   FROM positions p
     JOIN markets m ON m.id = p.market_id
     LEFT JOIN ( SELECT positions.market_id,
            sum(
                CASE
                    WHEN positions.side = 'yes'::text THEN positions.amount
                    ELSE 0::numeric
                END) AS yes,
            sum(
                CASE
                    WHEN positions.side = 'no'::text THEN positions.amount
                    ELSE 0::numeric
                END) AS no
           FROM positions
          GROUP BY positions.market_id) a ON a.market_id = p.market_id
  WHERE p.status IS NULL OR (p.status = ANY (ARRAY['open'::text, 'pending'::text]));

-- ----------------------------
-- View structure for valid_trades
-- ----------------------------
DROP VIEW IF EXISTS "public"."valid_trades";
CREATE VIEW "public"."valid_trades" AS  SELECT id,
    user_id,
    market_id,
    type,
    side,
    pi_amount,
    created_at,
    fee_pi,
    net_pi,
    invalid,
    kind,
    amount
   FROM trades t
  WHERE COALESCE(invalid, false) = false;

-- ----------------------------
-- View structure for v_leaderboard
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_leaderboard";
CREATE VIEW "public"."v_leaderboard" AS  SELECT vt.user_id,
    COALESCE(u.pi_username, '@'::text || "left"(vt.user_id::text, 8)) AS username,
    sum(vt.pi_amount) AS volume,
    COALESCE(round(100::numeric * avg(
        CASE
            WHEN m.resolved IS TRUE AND m.resolved_outcome IS NOT NULL THEN
            CASE
                WHEN m.resolved_outcome = vt.side THEN 1.0
                ELSE 0.0
            END
            ELSE NULL::numeric
        END))::integer, 0) AS success_pct
   FROM valid_trades vt
     LEFT JOIN markets m ON m.id = vt.market_id
     LEFT JOIN users u ON u.id = vt.user_id
  GROUP BY vt.user_id, u.pi_username;

-- ----------------------------
-- View structure for v_portfolio_unclaimed
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_portfolio_unclaimed";
CREATE VIEW "public"."v_portfolio_unclaimed" AS  SELECT u.id AS user_id,
    m.id AS market_id,
    m.question,
    m.resolved_outcome AS outcome,
    sum(vt.amount) AS unclaimed_pi
   FROM users u
     JOIN valid_trades vt ON vt.user_id = u.id
     JOIN markets m ON m.id = vt.market_id
  WHERE m.status = 'resolved'::text AND m.resolved AND vt.side = m.resolved_outcome
  GROUP BY u.id, m.id, m.question, m.resolved_outcome;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."attestations_id_seq"
OWNED BY "public"."attestations"."id";
SELECT setval('"public"."attestations_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."compliance_logs_id_seq"
OWNED BY "public"."compliance_logs"."id";
SELECT setval('"public"."compliance_logs_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."market_comments_id_seq"
OWNED BY "public"."market_comments"."id";
SELECT setval('"public"."market_comments_id_seq"', 1, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."market_history_id_seq"
OWNED BY "public"."market_history"."id";
SELECT setval('"public"."market_history_id_seq"', 117, true);

-- ----------------------------
-- Primary Key structure for table admin_audit
-- ----------------------------
ALTER TABLE "public"."admin_audit" ADD CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table admins
-- ----------------------------
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");

-- ----------------------------
-- Indexes structure for table attestations
-- ----------------------------
CREATE INDEX "idx_attestations_timestamp" ON "public"."attestations" USING btree (
  "timestamp" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_attestations_user_id" ON "public"."attestations" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table attestations
-- ----------------------------
ALTER TABLE "public"."attestations" ADD CONSTRAINT "attestations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table categories
-- ----------------------------
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("name");

-- ----------------------------
-- Indexes structure for table comments
-- ----------------------------
CREATE INDEX "comments_market_created_idx" ON "public"."comments" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);

-- ----------------------------
-- Checks structure for table comments
-- ----------------------------
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_body_check" CHECK (length(TRIM(BOTH FROM body)) >= 1 AND length(TRIM(BOTH FROM body)) <= 2000);

-- ----------------------------
-- Primary Key structure for table comments
-- ----------------------------
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table compliance_logs
-- ----------------------------
CREATE INDEX "idx_compliance_logs_ip" ON "public"."compliance_logs" USING btree (
  "ip" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_compliance_logs_region_code" ON "public"."compliance_logs" USING btree (
  "region_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_compliance_logs_timestamp" ON "public"."compliance_logs" USING btree (
  "timestamp" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_compliance_logs_user_id" ON "public"."compliance_logs" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table compliance_logs
-- ----------------------------
ALTER TABLE "public"."compliance_logs" ADD CONSTRAINT "compliance_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table market_comments
-- ----------------------------
CREATE INDEX "idx_comments_market_ts" ON "public"."market_comments" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);

-- ----------------------------
-- Primary Key structure for table market_comments
-- ----------------------------
ALTER TABLE "public"."market_comments" ADD CONSTRAINT "market_comments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table market_history
-- ----------------------------
CREATE INDEX "idx_history_market_ts" ON "public"."market_history" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "ts" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);
CREATE UNIQUE INDEX "ux_market_history_market_ts" ON "public"."market_history" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "ts" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table market_history
-- ----------------------------
ALTER TABLE "public"."market_history" ADD CONSTRAINT "market_history_implied_no_check" CHECK (implied_no >= 0::numeric AND implied_no <= 1::numeric);
ALTER TABLE "public"."market_history" ADD CONSTRAINT "market_history_implied_yes_check" CHECK (implied_yes >= 0::numeric AND implied_yes <= 1::numeric);

-- ----------------------------
-- Primary Key structure for table market_history
-- ----------------------------
ALTER TABLE "public"."market_history" ADD CONSTRAINT "market_history_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table market_price_history
-- ----------------------------
CREATE INDEX "mph_market_ts_idx" ON "public"."market_price_history" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "ts_date" "pg_catalog"."date_ops" DESC NULLS FIRST
);

-- ----------------------------
-- Uniques structure for table market_price_history
-- ----------------------------
ALTER TABLE "public"."market_price_history" ADD CONSTRAINT "unique_market_date" UNIQUE ("market_id", "ts_date");

-- ----------------------------
-- Primary Key structure for table market_price_history
-- ----------------------------
ALTER TABLE "public"."market_price_history" ADD CONSTRAINT "market_price_history_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table markets
-- ----------------------------
CREATE INDEX "idx_markets_closes_at" ON "public"."markets" USING btree (
  "closes_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_markets_unresolved_created" ON "public"."markets" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
) WHERE COALESCE(resolved, false) = false OR resolved_outcome IS NULL;

-- ----------------------------
-- Primary Key structure for table markets
-- ----------------------------
ALTER TABLE "public"."markets" ADD CONSTRAINT "markets_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table positions
-- ----------------------------
CREATE INDEX "idx_positions_market" ON "public"."positions" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_positions_market_id" ON "public"."positions" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "idx_positions_market_side" ON "public"."positions" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "side" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_positions_market_time" ON "public"."positions" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_positions_user" ON "public"."positions" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table positions
-- ----------------------------
CREATE TRIGGER "positions_ensure_user" BEFORE INSERT ON "public"."positions"
FOR EACH ROW
EXECUTE PROCEDURE "public"."ensure_user_for_position"();
CREATE TRIGGER "trg_positions_after_insert" AFTER INSERT ON "public"."positions"
FOR EACH ROW
EXECUTE PROCEDURE "public"."positions_after_insert"();

-- ----------------------------
-- Checks structure for table positions
-- ----------------------------
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_side_check" CHECK (side = ANY (ARRAY['yes'::text, 'no'::text]));

-- ----------------------------
-- Primary Key structure for table positions
-- ----------------------------
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table referrals
-- ----------------------------
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table roles
-- ----------------------------
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Checks structure for table suggestions
-- ----------------------------
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

-- ----------------------------
-- Primary Key structure for table suggestions
-- ----------------------------
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table trades
-- ----------------------------
CREATE UNIQUE INDEX "trades_unique_payout_per_user_market" ON "public"."trades" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE type = 'payout'::text;
CREATE UNIQUE INDEX "uq_trades_payout_once" ON "public"."trades" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE type = 'payout'::text;
CREATE UNIQUE INDEX "ux_trades_unique_payout" ON "public"."trades" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
) WHERE type = 'payout'::text;

-- ----------------------------
-- Triggers structure for table trades
-- ----------------------------
CREATE TRIGGER "trg_trades_apply_fee" BEFORE INSERT OR UPDATE OF "type", "pi_amount" ON "public"."trades"
FOR EACH ROW
EXECUTE PROCEDURE "public"."trades_apply_fee"();
CREATE TRIGGER "trg_trades_autovalidate_ins" BEFORE INSERT ON "public"."trades"
FOR EACH ROW
EXECUTE PROCEDURE "public"."trades_autovalidate"();
CREATE TRIGGER "trg_trades_autovalidate_upd" BEFORE UPDATE OF "user_id" ON "public"."trades"
FOR EACH ROW
EXECUTE PROCEDURE "public"."trades_autovalidate"();

-- ----------------------------
-- Checks structure for table trades
-- ----------------------------
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_kind_check" CHECK (kind = ANY (ARRAY['buy'::text, 'sell'::text, 'refund'::text]));
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_side_check" CHECK (side = ANY (ARRAY['yes'::text, 'no'::text]));
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_type_check" CHECK (type = ANY (ARRAY['buy'::text, 'sell'::text, 'payout'::text]));

-- ----------------------------
-- Primary Key structure for table trades
-- ----------------------------
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table transactions
-- ----------------------------
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE INDEX "idx_users_handle_norm" ON "public"."users" USING btree (
  "handle_norm" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table users
-- ----------------------------
CREATE TRIGGER "trg_users_autofill_ins" BEFORE INSERT ON "public"."users"
FOR EACH ROW
EXECUTE PROCEDURE "public"."users_autofill_handle_norm"();
CREATE TRIGGER "trg_users_autofill_upd" BEFORE UPDATE OF "pi_username" ON "public"."users"
FOR EACH ROW
EXECUTE PROCEDURE "public"."users_autofill_handle_norm"();

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_referral_code_key" UNIQUE ("referral_code");

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table admins
-- ----------------------------
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table market_price_history
-- ----------------------------
ALTER TABLE "public"."market_price_history" ADD CONSTRAINT "market_price_history_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table markets
-- ----------------------------
ALTER TABLE "public"."markets" ADD CONSTRAINT "markets_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table positions
-- ----------------------------
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table referrals
-- ----------------------------
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table suggestions
-- ----------------------------
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_category_fkey" FOREIGN KEY ("category") REFERENCES "public"."categories" ("name") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table trades
-- ----------------------------
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
