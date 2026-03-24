/*
 Navicat Premium Data Transfer

 Source Server         : postgres-supabase-predictpix
 Source Server Type    : PostgreSQL
 Source Server Version : 170004 (170004)
 Source Host           : db.xinxaensoubhdomuvptq.supabase.co:5432
 Source Catalog        : postgres
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170004 (170004)
 File Encoding         : 65001

 Date: 31/10/2025 16:43:54
*/


-- ----------------------------
-- Type structure for gtrgm
-- ----------------------------
DROP TYPE IF EXISTS "public"."gtrgm";
CREATE TYPE "public"."gtrgm" (
  INPUT = "public"."gtrgm_in",
  OUTPUT = "public"."gtrgm_out",
  INTERNALLENGTH = VARIABLE,
  CATEGORY = U,
  DELIMITER = ','
);
ALTER TYPE "public"."gtrgm" OWNER TO "supabase_admin";

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
-- Sequence structure for market_trades_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."market_trades_id_seq";
CREATE SEQUENCE "public"."market_trades_id_seq" 
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
-- Records of admin_audit
-- ----------------------------
INSERT INTO "public"."admin_audit" VALUES ('93bac914-7e15-45fc-b26f-d3d835daad55', '2025-09-04 02:11:30.894609+00', 'market.create', '770d2aae-40e3-4673-a09b-a83ff92b4059', '{"category": "Test", "question": "AUDIT: extension-free"}');
INSERT INTO "public"."admin_audit" VALUES ('c538c940-13dd-4c6b-b143-99e193eaaf29', '2025-09-04 02:11:36.29752+00', 'market.resolve', '770d2aae-40e3-4673-a09b-a83ff92b4059', '{"outcome": "yes"}');

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS "public"."admins";
CREATE TABLE "public"."admins" (
  "user_id" uuid NOT NULL
)
;

-- ----------------------------
-- Records of admins
-- ----------------------------

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS "public"."categories";
CREATE TABLE "public"."categories" (
  "name" text COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO "public"."categories" VALUES ('Pi Coin');
INSERT INTO "public"."categories" VALUES ('Tech');
INSERT INTO "public"."categories" VALUES ('Creators');
INSERT INTO "public"."categories" VALUES ('Sports');
INSERT INTO "public"."categories" VALUES ('Politics');
INSERT INTO "public"."categories" VALUES ('Crypto');
INSERT INTO "public"."categories" VALUES ('Entertainment');
INSERT INTO "public"."categories" VALUES ('World');
INSERT INTO "public"."categories" VALUES ('Weather');
INSERT INTO "public"."categories" VALUES ('Other');

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
-- Records of comments
-- ----------------------------
INSERT INTO "public"."comments" VALUES ('de49f603-72d0-4517-ab62-d95d5d38925b', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', NULL, '@AtchesSon', 'from SQL', '2025-09-16 01:39:08.862709+00');

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
-- Records of market_comments
-- ----------------------------
INSERT INTO "public"."market_comments" VALUES (1, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-21 17:07:05.482914+00', 'sanity-user', 'first comment via API');

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
-- Records of market_history
-- ----------------------------
INSERT INTO "public"."market_history" VALUES (1, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-21 16:57:23.942692+00', 0.61, 0.39, 'trade');
INSERT INTO "public"."market_history" VALUES (2, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-23 23:27:07.934222+00', 0.60, 0.40, 'trade');
INSERT INTO "public"."market_history" VALUES (3, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-23 23:27:09.409736+00', 0.60, 0.4, 'trade');
INSERT INTO "public"."market_history" VALUES (6, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-10-05 14:49:25.302853+00', 0.620, 0.380, 'trade');
INSERT INTO "public"."market_history" VALUES (5, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-23 23:40:06.213805+00', 0.610, 0.390, 'trade');

-- ----------------------------
-- Table structure for market_price_history
-- ----------------------------
DROP TABLE IF EXISTS "public"."market_price_history";
CREATE TABLE "public"."market_price_history" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "market_id" uuid NOT NULL,
  "ts" timestamptz(6) NOT NULL DEFAULT now(),
  "yes" float8 NOT NULL,
  "no" float8 NOT NULL,
  "volume_pi" numeric DEFAULT 0
)
;

-- ----------------------------
-- Records of market_price_history
-- ----------------------------

-- ----------------------------
-- Table structure for market_suggestions
-- ----------------------------
DROP TABLE IF EXISTS "public"."market_suggestions";
CREATE TABLE "public"."market_suggestions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "question" text COLLATE "pg_catalog"."default" NOT NULL,
  "category" text COLLATE "pg_catalog"."default" NOT NULL,
  "resolution_criteria" text COLLATE "pg_catalog"."default",
  "resolution_source" text COLLATE "pg_catalog"."default",
  "end_date" date,
  "status" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'new'::text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "details" text COLLATE "pg_catalog"."default",
  "approved_market_id" uuid,
  "user_id" uuid NOT NULL
)
;

-- ----------------------------
-- Records of market_suggestions
-- ----------------------------

-- ----------------------------
-- Table structure for market_trades
-- ----------------------------
DROP TABLE IF EXISTS "public"."market_trades";
CREATE TABLE "public"."market_trades" (
  "id" int8 NOT NULL DEFAULT nextval('market_trades_id_seq'::regclass),
  "market_id" uuid NOT NULL,
  "ts" timestamptz(6) NOT NULL DEFAULT now(),
  "side" text COLLATE "pg_catalog"."default" NOT NULL,
  "amount" numeric NOT NULL,
  "price" numeric NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of market_trades
-- ----------------------------
INSERT INTO "public"."market_trades" VALUES (1, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-21 16:57:23.942692+00', 'yes', 12, 0.61, 'sanity-user');
INSERT INTO "public"."market_trades" VALUES (2, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-23 23:27:07.934222+00', 'yes', 1.0, 0.60, '11111111-1111-1111-1111-111111111111');
INSERT INTO "public"."market_trades" VALUES (4, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-23 23:40:06.213805+00', 'yes', 1.0, 0.60, '11111111-1111-1111-1111-111111111111');
INSERT INTO "public"."market_trades" VALUES (5, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-10-05 14:49:25.302853+00', 'yes', 1, 0.610, 'f3891537-058f-43e6-aad7-2f5bc0ffe606');

-- ----------------------------
-- Table structure for markets
-- ----------------------------
DROP TABLE IF EXISTS "public"."markets";
CREATE TABLE "public"."markets" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
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
  "outcome" text COLLATE "pg_catalog"."default",
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
-- Records of markets
-- ----------------------------
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('2ddc73c2-7646-44ea-91f7-52223248ea80', 'Example market question', 'Sports', NULL, NULL, 'resolved', '2025-09-02 00:40:22.485575+00', '2025-10-02 00:13:52.985414+00', NULL, 'YES if Team X wins by 2025-12-31 23:59 UTC per official league site; otherwise NO.', 'api-admin', 't', '2025-09-06 22:31:36.406318', 'no', 'f', '2025-10-02 00:13:52.985414+00', 'admin test', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('49914da8-a40a-4ef1-a1c4-a1e94a009141', 'TEST create route', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-30 18:30:06.319159+00', '2025-12-31 23:59:00+00', 500, 'opt', 'api-admin', 't', '2025-09-06 22:38:43.507262', 'yes', 'f', NULL, 'admin test 4', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('51659d0a-a3be-4304-b5f4-1257f9a2dc4b', 'TEST: Will CPI MoM be <= 0.2% in Oct 2025?', 'Macro', NULL, 'Standard', 'resolved', '2025-09-04 01:57:19.903255+00', '2025-10-31 23:59:00+00', 250.0, 'YES if BLS CPI-U MoM for Oct 2025 is ≤ 0.2% as published.', 'api-admin', 't', '2025-09-06 22:35:51.003548', 'yes', 'f', NULL, 'admin test 2', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('85eb328a-d772-4b0b-8136-027224c15f07', 'TEST: Will CPI MoM be <= 0.2% in Oct 2025?', 'Macro', NULL, 'Standard', 'resolved', '2025-09-04 01:55:48.287391+00', '2025-10-31 23:59:00+00', 250.0, 'YES if BLS CPI-U MoM for Oct 2025 is ≤ 0.2% as published.', 'api-admin', 't', '2025-09-06 22:36:11.684176', 'yes', 'f', NULL, 'admin test 2', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('11022ae3-638e-464e-887f-a2f5e3b5b649', 'TEST: Will CPI MoM be <= 0.2% in Oct 2025?', 'Macro', NULL, 'Standard', 'resolved', '2025-09-04 01:55:46.538083+00', '2025-10-31 23:59:00+00', 250.0, 'YES if BLS CPI-U MoM for Oct 2025 is ≤ 0.2% as published.', 'api-admin', 't', '2025-09-06 22:37:10.468471', 'no', 'f', NULL, 'admin test 3', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('484dabfe-45f9-4664-9397-ce6fb7e34e9f', 'TEST: ETH > $5k 2025', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-31 21:44:35.673192+00', '2025-12-31 23:59:00+00', 500, NULL, 'api-admin', 't', '2025-09-06 22:56:52.399105', 'yes', 'f', NULL, 'audit verify', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('0c8f3333-1d69-4d4b-863e-7a976fd42db4', 'TEST: Pi Network MAU > 10M by 2026-06-30?', 'Pi', NULL, 'Standard', 'resolved', '2025-08-31 22:32:30.413138+00', '2026-06-30 23:59:00+00', 300, 'Binary: YES if condition met at end date; else NO.', 'app-admin', 't', '2025-09-08 00:00:32.998627', 'yes', 'f', NULL, '', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('e5f7adf5-bb39-41c5-a6c8-d7c25cc875b8', 'AUDIT SMOKE', 'Test', NULL, NULL, 'open', '2025-09-04 02:00:54.562694+00', NULL, NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, 'AUDIT SMOKE', '2025-12-16 03:01:10.93383+00', NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('f501b256-fa4b-43d7-8f51-c1d63b82a6fa', 'AUDIT TEST: one-off', 'Test', NULL, NULL, 'open', '2025-09-04 02:04:02.696546+00', NULL, NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, 'AUDIT TEST: one-off', '2025-12-16 03:01:10.93383+00', NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('91ebdf83-4eeb-4982-ad3d-0188f5f3f27c', 'AUDIT DEMO create', 'Crypto', NULL, NULL, 'open', '2025-09-04 02:08:35.621864+00', NULL, NULL, NULL, NULL, 'f', NULL, NULL, 'f', '2025-12-31 00:00:00+00', NULL, 0, 'Test MVP market', '2025-12-16 03:01:10.93383+00', NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'Will Pi reach 10 million downloads by August 15', 'Pi Coin', NULL, 'Boosted', 'resolved', '2025-08-14 16:20:29.686682+00', '2025-08-14 16:19:00.391+00', 100, NULL, 'Pi Network', 't', '2025-08-24 14:56:36.603312', 'yes', 'f', '2025-08-14 16:19:00.391+00', NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('904e61cd-4faa-4d1c-966d-caf4baded5ce', 'Will Pi mainnet users exceed 10M by 2025-12-31?', NULL, NULL, NULL, 'resolved', '2025-08-28 05:09:17.170389+00', NULL, NULL, NULL, NULL, 't', '2025-08-28 05:12:14.799635', 'yes', 'f', NULL, 'manual test resolve', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('6d7d716e-faf7-42dd-ba19-1aa2f54deae5', 'Will BTC close above $80k on 2025-12-31?', NULL, NULL, NULL, 'resolved', '2025-08-28 05:13:21.253758+00', NULL, NULL, NULL, NULL, 't', '2025-08-28 05:14:19.658416', 'yes', 'f', NULL, 'manual resolve via public path', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('81954cc2-9938-4f1f-b471-157840e2c1eb', 'Will pi close higher than yesterday?', 'Pi Coin', NULL, 'Boosted', 'resolved', '2025-08-25 14:27:02.520213+00', '2025-08-25 14:26:17.72+00', 1000, NULL, 'CoinGecko', 't', '2025-08-30 00:55:07.484308', 'yes', 'f', NULL, 'admin sidecar test', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('f77862cd-c231-4d7f-aee8-a568136a7f89', 'Will Pi hit $1 by July 31', 'PI coin', NULL, 'Standard', 'resolved', '2025-07-31 02:56:10.867+00', '2025-08-01 02:30:00+00', 1000, 'Pi hits $1', 'Coingecko', 't', '2025-08-30 16:26:55.7903', 'yes', 'f', '2025-08-01 02:30:00+00', NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('7e603642-0d7e-4f21-911d-cd88f3020f7e', 'Nasdaq will close higher than 2024', 'Finance', NULL, 'Standard', 'resolved', '2025-08-01 23:17:09.290273+00', '2025-08-01 23:15:25.504+00', 100, NULL, 'Wallstreet Journal', 't', '2025-08-30 16:30:29.335261', 'yes', 'f', '2025-08-01 23:15:25.504+00', NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('8c677e2f-94e6-4b48-97b3-435fd66e2acd', 'Demo via curl', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-30 18:33:11.338713+00', '2025-12-31 23:59:00+00', 500, 'opt', NULL, 't', '2025-08-30 23:56:30.9203', 'yes', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'Will Ryan poop his pants before August 3', 'Trending', NULL, 'Standard', 'resolved', '2025-08-01 00:37:19.454983+00', NULL, 1000, NULL, NULL, 't', '2025-08-30 16:42:53.433097', 'yes', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('6722868b-f749-42fd-a83d-e0eed298a037', 'TEMP: resolution metadata test', 'Test', NULL, 'Standard', 'resolved', '2025-08-31 23:55:56.334694+00', '2025-12-31 23:59:00+00', 0, NULL, NULL, 't', '2025-09-01 00:17:05.788115', 'no', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('fdd3179e-a2e9-4498-92fe-1d7a2281f7bc', 'Will BTC be > $100k on Dec 31, 2025?', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-30 16:56:14.891958+00', '2025-12-31 23:59:00+00', 1000, NULL, NULL, 't', '2025-08-30 17:47:22.659332', 'yes', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('92bd9ad0-6212-4931-b675-227026c739e9', 'TEST: ETH > $5k 2025', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-31 22:12:01.37766+00', '2025-12-31 23:59:00+00', 500, NULL, NULL, 't', '2025-08-31 22:26:21.425877', 'yes', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('f5922404-d292-43be-a104-ad6a9977ea89', 'TEST: BTC > $90k on 2025-12-31?', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-31 22:30:20.160014+00', '2025-12-31 23:59:00+00', 500, 'YES if BTC-USD > 90000 at 2025-12-31 23:59:59 UTC (reputable exchange close); else NO.', NULL, 't', '2025-08-31 22:31:32.334019', 'yes', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('6dce70a3-f7af-408b-98fd-21e8f98f0362', 'TEST: BTC > 5k on 2025-12-31?', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-31 22:32:28.624598+00', '2025-12-31 23:59:00+00', 500, 'Binary: YES if condition met at end date; else NO.', NULL, 't', '2025-08-31 22:33:46.530255', 'no', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('910aae83-089b-4607-86a0-c7b38b2939dc', 'Example market question', 'Sports', NULL, NULL, 'resolved', '2025-09-02 00:40:36.183562+00', '2025-10-02 00:13:52.985414+00', NULL, 'YES if Team X wins by 2025-12-31 23:59 UTC per official league site; otherwise NO.', NULL, 't', '2025-09-04 01:47:09.858179', 'no', 'f', '2025-10-02 00:13:52.985414+00', NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('770d2aae-40e3-4673-a09b-a83ff92b4059', 'AUDIT: extension-free', 'Test', NULL, NULL, 'resolved', '2025-09-04 02:11:29.115826+00', NULL, NULL, NULL, NULL, 't', '2025-09-04 02:11:34.587602', 'yes', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('6fb7af16-946b-443c-b86c-572b93caca9e', 'TEST: ETH > k on 2025-12-31?', 'Crypto', NULL, 'Standard', 'resolved', '2025-08-31 22:32:32.124599+00', '2025-12-31 23:59:00+00', 400, 'Binary: YES if condition met at end date; else NO.', NULL, 't', '2025-09-01 01:46:51.046534', 'no', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('e0e7ce47-1b80-4a3f-a596-ea36613de92c', 'TEMP sanity via psql', 'Test', NULL, NULL, 'resolved', '2025-09-01 00:41:35.755678+00', NULL, NULL, NULL, NULL, 't', '2025-09-01 02:24:29.208923', 'no', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('1e6b1552-550b-4f6e-8d4c-cc179f0c8f86', 'Example market question', 'Sports', NULL, NULL, 'resolved', '2025-09-02 00:34:39.336568+00', '2025-10-02 00:13:52.985414+00', NULL, 'YES if Team X wins by 2025-12-31 23:59 UTC per official league site; otherwise NO.', 'api-admin', 't', '2025-09-05 23:52:48.680378', 'no', 'f', '2025-10-02 00:13:52.985414+00', 'admin override', 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('17d7f53e-a1c6-4b46-9705-929b2622f9f2', 'TEMP sanity via correct router', 'Test', NULL, NULL, 'resolved', '2025-09-01 01:09:50.214643+00', NULL, NULL, NULL, NULL, 't', '2025-09-01 22:47:08.829804', 'no', 'f', NULL, NULL, 0, NULL, NULL, NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('72d9b3ea-452d-4ade-89d9-5d67301fd55d', 'Will BTC > $90k by Dec?', 'Crypto', NULL, NULL, 'open', '2025-09-06 22:13:37.821647+00', NULL, NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, 'Will BTC > $90k by Dec?', '2025-12-16 03:01:10.93383+00', NULL, '[]', '{}', 't', 't', 't');
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome") VALUES ('3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'Will BTC > $90k by Dec?', 'Crypto', NULL, NULL, 'open', '2025-09-06 22:17:18.286598+00', NULL, NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, 'Will BTC > $90k by Dec?', '2025-12-16 03:01:10.93383+00', NULL, '[]', '{}', 't', 't', 't');

-- ----------------------------
-- Table structure for positions
-- ----------------------------
DROP TABLE IF EXISTS "public"."positions";
CREATE TABLE "public"."positions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" uuid,
  "market_id" uuid,
  "side" text COLLATE "pg_catalog"."default",
  "amount" numeric,
  "created_at" timestamptz(6) DEFAULT now(),
  "status" text COLLATE "pg_catalog"."default",
  "user_handle" text COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."positions"."amount" IS 'refresh';

-- ----------------------------
-- Records of positions
-- ----------------------------
INSERT INTO "public"."positions" VALUES ('450a053a-83ad-48ac-a2b6-0fe0ae8bd25d', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 10, '2025-07-31 03:23:29.048891+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('67202bd4-f4e8-4334-b04d-d0a8542f47a8', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:31:09.038878+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('618d10ad-4615-4b28-84d5-8e6ae1f111a9', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:39:59.040669+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('cef1440f-a1d2-45f9-ba0a-3e41eac1a1d2', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:00.396519+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('679f1cc3-63c0-4ded-abf7-635baa2bf3d9', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:03.06454+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('89ea215b-6256-4c8c-b01a-a090b8e3655d', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:05.916258+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('a3ac4d08-c5b2-44c8-93b2-55b8ee64757b', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:08.362249+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('774fcf36-7c2b-4c15-84f5-aa5604c6a903', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:09.043109+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('7154ae85-4df3-41c6-8f17-5b8ba182d7cc', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:09.226702+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('10e0d202-98e8-4026-8af3-cb50d51179ab', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:09.408562+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('10c558b8-e034-4e4b-ad59-186491024274', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:12.685905+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('83f17178-184b-4d6c-a305-4ed49d9475a8', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:13.098417+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('4b469bc8-742c-41f8-aa22-baa2e5850240', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:40:13.351468+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('f2a9b777-4b91-455a-b6cd-4494a5afd11d', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:42:50.739968+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('46a76f2e-83b1-4291-94e5-13a0269cb340', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:44:31.57379+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('abef3020-e226-4b9a-a81b-8b84e2a08082', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 03:44:32.030633+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('46bb1a64-7f5c-41f6-aa46-1ac5810abf27', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 04:32:58.065965+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('da7fc4c3-3d20-4689-9b5d-00e7c8f748a0', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 04:33:03.300873+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('2962ecd7-4198-429c-bdab-4a9d2de9661c', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 04:33:06.118376+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('9afab716-d4c8-4105-9a9c-62a57721d4f5', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 04:33:11.202825+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('d080ca9a-f80d-48df-bfdd-8618df890f34', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 04:33:17.129935+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('7764fe40-6922-4d48-a695-769b839d927d', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-07-31 04:40:07.41338+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('d11a71ea-0705-4f7c-88ad-dd8bc4c6eea1', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 0, '2025-07-31 04:40:27.754158+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('eca47eae-7e62-41f2-aab3-ea6b06cfce7b', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 0, '2025-07-31 04:40:32.490184+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('11b4c02d-afc2-4f70-9bdb-41c47594ea6c', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 50, '2025-07-31 04:40:57.418907+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('ed3f299a-c48a-436f-9cf6-835af63a904f', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 50, '2025-07-31 04:56:21.615675+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('4cfa6cdc-e4c2-42d4-95c6-96dc42f2f812', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 50, '2025-07-31 04:56:21.615663+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('c7c3d9a8-8c87-4e14-ab52-9ddaf631200d', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 50, '2025-07-31 04:56:21.826839+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('27397921-6981-4c10-b41e-91c0b543c281', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 50, '2025-07-31 04:56:22.013324+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('6a07ff47-e1d0-4176-9346-c1d6d2d75940', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 50, '2025-07-31 04:56:25.152882+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('77541586-3afe-4687-b351-d1d5e0d1c8ea', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-08-01 00:32:37.694284+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('bbccd236-8748-4371-8291-1eec68cbd321', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-08-01 00:32:56.266472+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('bb3eb04c-dea4-4367-8600-9bb78452da8f', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-08-01 00:35:40.039347+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('5e3f3f47-e436-43ff-934f-7dfa7919f697', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'yes', 20, '2025-08-01 00:35:53.696118+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('905b3f3f-c117-4fd0-8fa7-daf2fe7be629', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 20, '2025-08-01 01:52:35.347754+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('13b4c801-ea19-445d-ab71-dfdfd570fa49', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 30, '2025-08-01 02:28:37.793132+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('71e416eb-2048-4dc3-b6ac-dd8d29763e6b', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 30, '2025-08-01 02:28:42.18306+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('4f81cb60-dad2-4081-9bf9-f36cb6e91f53', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 30, '2025-08-01 02:32:51.629653+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('acbed006-6cf3-4d9e-b527-01ab5b416415', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 20, '2025-08-01 02:33:04.305501+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('9a412e7c-6412-4b55-88da-ac010f3409e7', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 204, '2025-08-01 02:33:24.105532+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('730751ea-e0d6-4ce7-9831-bbad3f9e7ba6', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 20, '2025-08-01 02:46:08.374404+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('76e7b733-34ea-465d-a1e8-38cb8b4f08e0', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 10, '2025-08-01 03:16:33.367893+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('815f919c-251d-4a40-bcb6-2ae24dfcf61b', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 10, '2025-08-01 03:27:23.217847+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('48bb4ece-29de-4f17-b056-440f71057e34', NULL, 'f77862cd-c231-4d7f-aee8-a568136a7f89', 'no', 10, '2025-08-01 04:19:33.894253+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('d74103bd-ef68-4db2-9824-e53e04c10894', NULL, '7e603642-0d7e-4f21-911d-cd88f3020f7e', 'yes', 333, '2025-08-01 23:18:06.600754+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('fa95521d-db16-4be5-a814-86c1e07e73cc', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 66, '2025-08-01 23:18:22.835974+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('eee8222e-dbdb-4351-9a16-29d501348fa8', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 9000000, '2025-08-01 23:20:55.553068+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('f1bb41af-e915-4e81-a8ce-9c85b3922187', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 9000000, '2025-08-01 23:20:56.270131+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('e7b16c7e-a72d-48e3-8cb4-6cbed87ce1bd', NULL, '7e603642-0d7e-4f21-911d-cd88f3020f7e', 'yes', 100, '2025-08-14 16:16:29.06338+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('3e9cfe7c-a4c1-4117-83d3-54502cf2900e', NULL, '7e603642-0d7e-4f21-911d-cd88f3020f7e', 'no', 500, '2025-08-14 16:16:35.032332+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('b7628c57-6475-4baa-9245-c25be74c0f3d', NULL, '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 100, '2025-08-14 16:18:22.708701+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('4b5cd4c7-0886-4b98-ac80-2b4885758c2e', '38b86098-af5c-45fc-8b7b-b4d2bc2ca682', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'yes', 5, '2025-08-18 22:45:02.900906+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('71a07e7e-72d9-4d99-8836-711a1f9a3d95', '38b86098-af5c-45fc-8b7b-b4d2bc2ca682', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'yes', 0.5, '2025-08-19 00:38:10.035088+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('6fa74c5c-8aac-4699-af5d-9fd1c053bc4e', '49b19763-90d0-4990-b63b-dca945db892c', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'yes', 1, '2025-08-21 01:32:20.091029+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('f575145c-1de6-4f96-ba37-780186d1916f', '9b287f8d-4727-451f-84d9-505ec9edd213', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'yes', 1, '2025-08-21 01:34:36.220561+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('e7f8b3c6-aa9e-45f6-9fa7-f3b282a194a4', '3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'yes', 10, '2025-08-24 14:54:31.709231+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('1bbf2a6e-30eb-4ab2-a814-060369a4b48f', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 10, '2025-08-26 03:46:08.423969+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('4e97d540-94a5-477b-9839-491952d1c4b7', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 20, '2025-08-26 03:50:35.572906+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('8ede6d5c-b373-4786-bb65-4958289564ca', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-26 03:57:34.439936+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('14ef5378-2575-42ed-abfd-fea170938760', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'no', 100, '2025-08-26 03:58:56.533954+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('c328f6dd-45c3-44c4-9a2c-eb31f8e08f94', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-26 04:09:34.065897+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('5e2a269f-edb1-4fd8-9014-725363d11f8e', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'no', 1000, '2025-08-26 04:12:00.59874+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('b2a2eaea-72b3-4055-92b3-406a166a534f', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 10, '2025-08-26 22:26:55.589245+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('8b223035-c698-492f-ba7c-167226029e17', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 500, '2025-08-26 22:29:02.765594+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('6c5326ca-6480-4d15-9309-93e71bf23f11', 'b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-26 22:36:55.865787+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('56ac0d15-103f-4018-981b-c33d117dc455', '31f7b10f-00ef-48e7-8972-4b89a7fdc776', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-26 22:38:18.072752+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('ffcc9f09-2446-4379-9c95-866f902e701a', '31f7b10f-00ef-48e7-8972-4b89a7fdc776', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 1, '2025-08-26 22:42:50.947698+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('a716e173-9b8f-4f4b-85b6-82a72411a7d2', '31f7b10f-00ef-48e7-8972-4b89a7fdc776', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'no', 1, '2025-08-26 22:43:26.647264+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('004eb1f2-722f-41ec-afe3-3d75fd230581', '31f7b10f-00ef-48e7-8972-4b89a7fdc776', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'no', 100, '2025-08-26 23:19:57.076949+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('56efa214-e3fa-4c8c-a2ae-dc0cb4f9ef2b', '31f7b10f-00ef-48e7-8972-4b89a7fdc776', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'no', 1000, '2025-08-26 23:29:27.447502+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('a4a8394a-4650-489b-b173-d9c26d649483', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-27 01:04:21.468872+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('ef6ab484-9594-4166-8bc9-e52842c7647b', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'no', 500, '2025-08-27 01:05:27.454291+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('3485ea36-7237-4646-b184-805a970db200', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 10, '2025-08-27 01:15:35.495344+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('1a3da133-d7ae-4f38-a1f8-70790c3adf70', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 30, '2025-08-27 01:24:03.379881+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('ba7c0c12-db51-4873-8d78-cd401b508dbc', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 500, '2025-08-27 01:24:30.278783+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('9a513f8e-f662-4bc5-8667-f501bf21fedf', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 50, '2025-08-27 01:29:40.995261+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('083e5adb-a9cb-42d9-9949-9af25f39fe19', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 50, '2025-08-27 01:30:41.61011+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('c384749e-1e65-430a-a0ee-5aedc3704925', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-27 01:37:07.849225+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('5ce6b11d-f84b-4214-8a18-6b55f948546c', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 100, '2025-08-27 02:28:21.732999+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('f2fdb3aa-fc75-49ab-88bd-9bbec26aced7', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 500, '2025-08-27 02:53:58.771712+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('263dd5ff-ab1e-433d-9cef-31e898476231', '00000000-0000-0000-0000-000000000000', '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 100, '2025-08-27 03:34:55.005857+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('38d57f22-a4a3-48f8-8a03-3dc2e629fe1c', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'no', 50, '2025-08-27 03:40:14.310287+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('ae245c0f-bb3c-48b6-b1e6-fc579d05fbde', '00000000-0000-0000-0000-000000000000', '3c1dc1b6-8e98-4d6a-a103-af644b100a14', 'yes', 1000000, '2025-08-27 03:51:46.780899+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('e08c9035-d871-43a6-ad99-e019d4853172', '00000000-0000-0000-0000-000000000000', '81954cc2-9938-4f1f-b471-157840e2c1eb', 'yes', 50, '2025-08-27 23:07:59.065671+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('4043d01a-09ad-4661-85bb-8122b53cb6e6', '00000000-0000-0000-0000-000000000000', '6d7d716e-faf7-42dd-ba19-1aa2f54deae5', 'yes', 30, '2025-08-28 05:46:10.766+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('d86baff3-7db9-4bac-9e56-3d7bbf1f7e7a', '8647eeb1-6635-45b5-9b44-24f15485d9d9', '484dabfe-45f9-4664-9397-ce6fb7e34e9f', 'yes', 5, '2025-09-06 22:44:41.170594+00', 'sold', NULL);
INSERT INTO "public"."positions" VALUES ('3e1ff7ca-42ea-4bee-9108-61ba31299085', '82a1db16-3282-50ef-b977-d60ccf71417a', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 3.0, '2025-09-06 23:05:20.887142+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('50bfaa2a-ce85-4d34-bdf2-b7ff3ce64767', '82a1db16-3282-50ef-b977-d60ccf71417a', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1.0, '2025-09-06 23:15:01.076169+00', 'sold', NULL);
INSERT INTO "public"."positions" VALUES ('e4783e07-9a30-445c-bcb8-b1462f9012a9', 'ca745c47-3ee1-57c9-8e16-2040c0c1790f', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 20.0, '2025-09-08 00:38:22.786945+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('ec70d2ef-99b3-439b-a6a2-c56d158d6437', 'ca745c47-3ee1-57c9-8e16-2040c0c1790f', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 20.0, '2025-09-08 00:46:49.032855+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('91eeb5db-7ce1-4ebc-8e11-b26fbbc5a166', 'ca745c47-3ee1-57c9-8e16-2040c0c1790f', '72d9b3ea-452d-4ade-89d9-5d67301fd55d', 'yes', 200.0, '2025-09-08 00:47:24.525904+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('78b9a611-a3d9-49e3-bf7e-007901707372', '652f83e5-865f-4330-9dfe-c50d20b1c0c7', '91ebdf83-4eeb-4982-ad3d-0188f5f3f27c', 'yes', 5.0, '2025-09-18 00:46:35.090875+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('588537be-e2f3-4d8b-9415-864f2787b291', '652f83e5-865f-4330-9dfe-c50d20b1c0c7', '91ebdf83-4eeb-4982-ad3d-0188f5f3f27c', 'yes', 5.0, '2025-09-18 01:00:57.008538+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('6c15bf4f-f5e9-4c45-8711-cc247eb58619', '11111111-1111-1111-1111-111111111111', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1.0, '2025-09-23 02:31:22.437372+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('8fca0021-eb35-4800-bdca-441a8430db00', '11111111-1111-1111-1111-111111111111', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1.0, '2025-09-23 02:43:42.894686+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('86126092-cefe-43b6-b137-ff871809e9c4', '11111111-1111-1111-1111-111111111111', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1.0, '2025-09-23 23:14:25.901533+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('d977b81d-0c45-49e6-8b1a-be6daf6d73c4', '11111111-1111-1111-1111-111111111111', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1.0, '2025-09-23 23:14:27.823113+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('a218a471-06f6-45ea-bf1b-2510c8a02a1a', '11111111-1111-1111-1111-111111111111', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'no', 1.0, '2025-09-23 23:17:52.412554+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('e4d3caf2-3fcd-432b-8110-a853fd1bc16e', '11111111-1111-1111-1111-111111111111', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1.0, '2025-09-23 23:40:06.213805+00', NULL, NULL);
INSERT INTO "public"."positions" VALUES ('542c1557-e91e-4460-8bcb-b8dba2512f87', 'f3891537-058f-43e6-aad7-2f5bc0ffe606', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', 'yes', 1, '2025-10-05 14:49:25.302853+00', NULL, NULL);

-- ----------------------------
-- Table structure for referrals
-- ----------------------------
DROP TABLE IF EXISTS "public"."referrals";
CREATE TABLE "public"."referrals" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "referrer_id" uuid,
  "referred_id" uuid,
  "created_at" timestamptz(6) DEFAULT now(),
  "reward_earned" bool DEFAULT false
)
;

-- ----------------------------
-- Records of referrals
-- ----------------------------

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
-- Records of suggestions
-- ----------------------------
INSERT INTO "public"."suggestions" VALUES ('f486c9d6-869f-4efa-b683-924ad822bfcb', NULL, 'Example market question', 'Sports', 'YES if Team X wins by 2025-12-31 23:59 UTC per official league site; otherwise NO.', 'One-sentence context of the market.', '2025-10-02 00:13:52.985414+00', 'pending', NULL, '2025-09-02 00:13:54.26898+00', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for tester_whitelist
-- ----------------------------
DROP TABLE IF EXISTS "public"."tester_whitelist";
CREATE TABLE "public"."tester_whitelist" (
  "username" text COLLATE "pg_catalog"."default" NOT NULL,
  "added_at" timestamptz(6) NOT NULL DEFAULT now(),
  "note" text COLLATE "pg_catalog"."default",
  "handle_norm" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of tester_whitelist
-- ----------------------------
INSERT INTO "public"."tester_whitelist" VALUES ('@atchesson', '2025-08-31 20:50:49.982307+00', 'owner', 'atchesson');
INSERT INTO "public"."tester_whitelist" VALUES ('@rson959', '2025-08-31 20:50:49.982307+00', 'brother', 'rson959');
INSERT INTO "public"."tester_whitelist" VALUES ('@Atcheson', '2025-09-04 22:49:56.314466+00', 'owner', 'atcheson');

-- ----------------------------
-- Table structure for testers
-- ----------------------------
DROP TABLE IF EXISTS "public"."testers";
CREATE TABLE "public"."testers" (
  "username" text COLLATE "pg_catalog"."default" NOT NULL,
  "role" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'user'::text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "handle" text COLLATE "pg_catalog"."default",
  "id" uuid DEFAULT gen_random_uuid()
)
;

-- ----------------------------
-- Records of testers
-- ----------------------------
INSERT INTO "public"."testers" VALUES ('@rson959', 'user', '2025-09-04 00:07:26.309084+00', '@rson959', '78ad3fb2-435b-47c8-af51-81b3d79800c5');
INSERT INTO "public"."testers" VALUES ('@atchesson', 'user', '2025-08-28 00:07:42.468685+00', '@atchesson', '652f83e5-865f-4330-9dfe-c50d20b1c0c7');

-- ----------------------------
-- Table structure for trades
-- ----------------------------
DROP TABLE IF EXISTS "public"."trades";
CREATE TABLE "public"."trades" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
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
  "kind" text COLLATE "pg_catalog"."default" DEFAULT 'buy'::text
)
;

-- ----------------------------
-- Records of trades
-- ----------------------------
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind") VALUES ('3de5fca3-111b-41b6-b6d7-5f8a7887ca80', '3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'payout', 'yes', 10, '2025-08-24 15:04:29.524545+00', 0, 'f', 'buy');
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind") VALUES ('c8e031bc-6ed9-442e-a2b5-02f485d2437e', '3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', '7e603642-0d7e-4f21-911d-cd88f3020f7e', 'buy', 'yes', 10, '2025-08-24 15:15:08.514263+00', 0.200000, 'f', 'buy');
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind") VALUES ('7522d3f5-cec6-4ec7-93c7-282339209ca9', '3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', '7e603642-0d7e-4f21-911d-cd88f3020f7e', 'sell', 'yes', 10, '2025-08-24 15:17:45.900765+00', 0.200000, 'f', 'buy');
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind") VALUES ('2e879b69-d520-49be-8b33-e6ade93068b2', '3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', '77934a4a-2ba4-4dda-b03c-64cd2ae0d874', 'sell', 'yes', 10, '2025-08-24 15:01:38.942175+00', 0, 'f', 'buy');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "pi_username" text COLLATE "pg_catalog"."default",
  "created_at" timestamptz(6) DEFAULT now(),
  "referral_code" text COLLATE "pg_catalog"."default",
  "referred_by" text COLLATE "pg_catalog"."default",
  "tutorial_completed" bool DEFAULT false,
  "handle_norm" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES ('38b86098-af5c-45fc-8b7b-b4d2bc2ca682', NULL, '2025-08-18 22:43:56.96465+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('49b19763-90d0-4990-b63b-dca945db892c', NULL, '2025-08-21 01:32:20.091029+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('9b287f8d-4727-451f-84d9-505ec9edd213', NULL, '2025-08-21 01:34:36.220561+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', NULL, '2025-08-24 14:54:31.709231+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('7d1cdffa-71de-4521-be0b-6ad612bd0e43', NULL, '2025-08-24 17:58:17.691248+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('81fbea82-71d7-4261-923e-08afe0b41257', NULL, '2025-08-24 17:58:17.691248+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('00000000-0000-0000-0000-000000000000', NULL, '2025-08-27 01:04:21.468872+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('9e18c8ab-ae7a-4d81-ac9f-36b228ee6ded', '@', '2025-08-28 01:55:06.740102+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('31f7b10f-00ef-48e7-8972-4b89a7fdc776', 'andy', '2025-08-26 02:33:43.4153+00', NULL, NULL, 'f', 'andy');
INSERT INTO "public"."users" VALUES ('b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', 'AtchesSon', '2025-08-26 03:45:53.451336+00', NULL, NULL, 'f', 'atchesson');
INSERT INTO "public"."users" VALUES ('6961cc7f-38ac-45ab-8256-00483252a6ef', '@admin', '2025-08-28 00:33:25.232849+00', NULL, NULL, 'f', 'admin');
INSERT INTO "public"."users" VALUES ('4165145e-bb70-4248-a9b6-ee05a151cb51', '@AtchesSon', '2025-08-28 00:33:37.745834+00', NULL, NULL, 'f', 'atchesson');
INSERT INTO "public"."users" VALUES ('c6b4c472-39a2-46cf-a93f-9c6151b4c563', '@AtchesSon ', '2025-08-28 00:40:45.378349+00', NULL, NULL, 'f', 'atchesson');
INSERT INTO "public"."users" VALUES ('3bb86098-a5fc-45fc-8b7b-b4d2bc2ca682', '@Atcheson', '2025-09-04 22:49:56.314466+00', NULL, NULL, 'f', 'atcheson');
INSERT INTO "public"."users" VALUES ('8647eeb1-6635-45b5-9b44-24f15485d9d9', NULL, '2025-09-06 22:44:41.170594+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('82a1db16-3282-50ef-b977-d60ccf71417a', NULL, '2025-09-06 23:05:20.887142+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('ca745c47-3ee1-57c9-8e16-2040c0c1790f', NULL, '2025-09-08 00:38:22.786945+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('52f1097f-e429-4387-aa32-df691e72e27d', NULL, '2025-09-17 23:33:59.656405+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('5549774d-1de6-4cf0-b2dd-7049022dba56', NULL, '2025-09-17 23:37:17.51241+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('652f83e5-865f-4330-9dfe-c50d20b1c0c7', NULL, '2025-09-17 23:48:30.669639+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('11111111-1111-1111-1111-111111111111', NULL, '2025-09-23 02:31:22.437372+00', NULL, NULL, 'f', NULL);
INSERT INTO "public"."users" VALUES ('f3891537-058f-43e6-aad7-2f5bc0ffe606', NULL, '2025-10-05 14:49:25.302853+00', NULL, NULL, 'f', 'cli-1759675166');

-- ----------------------------
-- Function structure for _clamp
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."_clamp"("val" numeric, "lo" numeric, "hi" numeric);
CREATE OR REPLACE FUNCTION "public"."_clamp"("val" numeric, "lo" numeric, "hi" numeric)
  RETURNS "pg_catalog"."numeric" AS $BODY$
  SELECT GREATEST(lo, LEAST(hi, val))
$BODY$
  LANGUAGE sql IMMUTABLE
  COST 100;

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
-- Function structure for claim_payout
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."claim_payout"("p_market_id" uuid);
CREATE OR REPLACE FUNCTION "public"."claim_payout"("p_market_id" uuid)
  RETURNS TABLE("market_id" uuid, "total_distributed" numeric) AS $BODY$
declare
  v_outcome text;
  v_total_yes numeric(18,6);
  v_total_no  numeric(18,6);
  v_pool      numeric(18,6);
  v_total_win numeric(18,6);
begin
  -- Must exist & be resolved
  select resolved_outcome
    into v_outcome
  from public.markets
  where id = p_market_id
  for update;

  if v_outcome is null then
    raise exception 'claim_payout: market % not found or not resolved', p_market_id;
  end if;

  if v_outcome not in ('yes','no') then
    insert into public.market_payouts (market_id, total_distributed)
    values (p_market_id, 0)
    on conflict (market_id) do nothing;

    return query select p_market_id, 0::numeric(18,6);
    return;
  end if;

  -- Idempotent
  if exists (select 1 from public.market_payouts where market_id = p_market_id) then
    return query
      select market_id, total_distributed from public.market_payouts where market_id = p_market_id;
    return;
  end if;

  -- Totals
  select coalesce(sum(amount),0) into v_total_yes from public.positions where market_id = p_market_id and side = 'yes';
  select coalesce(sum(amount),0) into v_total_no  from public.positions where market_id = p_market_id and side = 'no';

  v_pool := coalesce(v_total_yes,0) + coalesce(v_total_no,0);
  v_total_win := case when v_outcome = 'yes' then v_total_yes else v_total_no end;

  if v_total_win is null or v_total_win <= 0 then
    insert into public.market_payouts (market_id, total_distributed)
    values (p_market_id, 0);
    return query select p_market_id, 0::numeric(18,6);
    return;
  end if;

  with winners as (
    select user_id, amount
    from public.positions
    where market_id = p_market_id and side = v_outcome
  ),
  payouts as (
    select
      w.user_id,
      round( (w.amount / v_total_win) * v_pool, 6) as credit
    from winners w
  ),
  upsert_balances as (
    insert into public.balances (user_id, balance)
    select p.user_id, p.credit
    from payouts p
    on conflict (user_id) do update
      set balance = public.balances.balance + excluded.balance
    returning user_id, balance
  ),
  write_tx as (
    insert into public.transactions (user_id, market_id, amount, kind)
    select p.user_id, p_market_id, p.credit, 'payout'
    from payouts p
    returning amount
  )
  insert into public.market_payouts (market_id, total_distributed)
  select p_market_id, coalesce(sum(amount),0)
  from write_tx
  returning market_id, total_distributed
  into market_id, total_distributed;

  return next;
end;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;

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
DROP FUNCTION IF EXISTS "public"."get_or_create_user_by_pi"("p_username" text);
CREATE OR REPLACE FUNCTION "public"."get_or_create_user_by_pi"("p_username" text)
  RETURNS "public"."users" AS $BODY$
declare
  u public.users;
begin
  -- try find (case-insensitive)
  select * into u
  from public.users
  where lower(pi_username) = lower(p_username)
  limit 1;

  if not found then
    insert into public.users (pi_username)
    values (p_username)
    returning * into u;
  end if;

  return u;
end;
$BODY$
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  COST 100;

-- ----------------------------
-- Function structure for gin_extract_query_trgm
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gin_extract_query_trgm"(text, internal, int2, internal, internal, internal, internal);
CREATE OR REPLACE FUNCTION "public"."gin_extract_query_trgm"(text, internal, int2, internal, internal, internal, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gin_extract_query_trgm'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gin_extract_value_trgm
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gin_extract_value_trgm"(text, internal);
CREATE OR REPLACE FUNCTION "public"."gin_extract_value_trgm"(text, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gin_extract_value_trgm'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gin_trgm_consistent
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gin_trgm_consistent"(internal, int2, text, int4, internal, internal, internal, internal);
CREATE OR REPLACE FUNCTION "public"."gin_trgm_consistent"(internal, int2, text, int4, internal, internal, internal, internal)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'gin_trgm_consistent'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gin_trgm_triconsistent
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gin_trgm_triconsistent"(internal, int2, text, int4, internal, internal, internal);
CREATE OR REPLACE FUNCTION "public"."gin_trgm_triconsistent"(internal, int2, text, int4, internal, internal, internal)
  RETURNS "pg_catalog"."char" AS '$libdir/pg_trgm', 'gin_trgm_triconsistent'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_compress
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_compress"(internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_compress"(internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_compress'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_consistent
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_consistent"(internal, text, int2, oid, internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_consistent"(internal, text, int2, oid, internal)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'gtrgm_consistent'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_decompress
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_decompress"(internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_decompress"(internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_decompress'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_distance
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_distance"(internal, text, int2, oid, internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_distance"(internal, text, int2, oid, internal)
  RETURNS "pg_catalog"."float8" AS '$libdir/pg_trgm', 'gtrgm_distance'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_in
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_in"(cstring);
CREATE OR REPLACE FUNCTION "public"."gtrgm_in"(cstring)
  RETURNS "public"."gtrgm" AS '$libdir/pg_trgm', 'gtrgm_in'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_options
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_options"(internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_options"(internal)
  RETURNS "pg_catalog"."void" AS '$libdir/pg_trgm', 'gtrgm_options'
  LANGUAGE c IMMUTABLE
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_out
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_out"("public"."gtrgm");
CREATE OR REPLACE FUNCTION "public"."gtrgm_out"("public"."gtrgm")
  RETURNS "pg_catalog"."cstring" AS '$libdir/pg_trgm', 'gtrgm_out'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_penalty
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_penalty"(internal, internal, internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_penalty"(internal, internal, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_penalty'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_picksplit
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_picksplit"(internal, internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_picksplit"(internal, internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_picksplit'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_same
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", internal)
  RETURNS "pg_catalog"."internal" AS '$libdir/pg_trgm', 'gtrgm_same'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for gtrgm_union
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."gtrgm_union"(internal, internal);
CREATE OR REPLACE FUNCTION "public"."gtrgm_union"(internal, internal)
  RETURNS "public"."gtrgm" AS '$libdir/pg_trgm', 'gtrgm_union'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

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
-- Function structure for leaderboard_rollup
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."leaderboard_rollup"("p_limit" int4, "p_offset" int4);
CREATE OR REPLACE FUNCTION "public"."leaderboard_rollup"("p_limit" int4=50, "p_offset" int4=0)
  RETURNS TABLE("user_id" uuid, "username" text, "volume" numeric, "success_pct" int4) AS $BODY$
  select user_id, username, volume, success_pct
  from public.mv_leaderboard
  order by volume desc
  limit coalesce(p_limit, 50)
  offset coalesce(p_offset, 0);
$BODY$
  LANGUAGE sql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

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
-- Function structure for portfolio_closed_latest5
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."portfolio_closed_latest5"();
CREATE OR REPLACE FUNCTION "public"."portfolio_closed_latest5"()
  RETURNS TABLE("market_id" uuid, "market_title" text, "outcome" text, "active_side" text, "active_exposure_pi" numeric, "updated_at" timestamptz) AS $BODY$
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
$BODY$
  LANGUAGE sql VOLATILE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for portfolio_open_latest5
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."portfolio_open_latest5"();
CREATE OR REPLACE FUNCTION "public"."portfolio_open_latest5"()
  RETURNS TABLE("market_id" uuid, "market_title" text, "active_side" text, "active_exposure_pi" numeric, "updated_at" timestamptz) AS $BODY$
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
$BODY$
  LANGUAGE sql VOLATILE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for portfolio_totals_me
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."portfolio_totals_me"();
CREATE OR REPLACE FUNCTION "public"."portfolio_totals_me"()
  RETURNS TABLE("user_id" uuid, "buys_gross_pi" numeric, "buys_fee_pi" numeric, "buys_net_pi" numeric, "sells_gross_pi" numeric, "sells_fee_pi" numeric, "sells_net_pi" numeric, "payouts_gross_pi" numeric, "payouts_net_pi" numeric, "total_fees_pi" numeric, "net_result_pi" numeric, "current_net_exposure_pi" numeric) AS $BODY$
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
$BODY$
  LANGUAGE sql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for portfolio_unclaimed
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."portfolio_unclaimed"();
CREATE OR REPLACE FUNCTION "public"."portfolio_unclaimed"()
  RETURNS TABLE("market_id" uuid, "market_title" text, "outcome" text, "active_side" text, "active_exposure_pi" numeric, "claimable" bool, "reason" text, "updated_at" timestamptz) AS $BODY$
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
$BODY$
  LANGUAGE sql VOLATILE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

-- ----------------------------
-- Function structure for positions_after_insert
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."positions_after_insert"();
CREATE OR REPLACE FUNCTION "public"."positions_after_insert"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
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
  INSERT INTO market_trades (market_id, ts, side, amount, price, user_id)
  VALUES (NEW.market_id, COALESCE(NEW.created_at, now()), NEW.side, NEW.amount, px, NEW.user_id);

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
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for refresh_mv_leaderboard
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."refresh_mv_leaderboard"();
CREATE OR REPLACE FUNCTION "public"."refresh_mv_leaderboard"()
  RETURNS "pg_catalog"."void" AS $BODY$
  refresh materialized view concurrently public.mv_leaderboard;
$BODY$
  LANGUAGE sql VOLATILE SECURITY DEFINER
  COST 100
  SET "search_path"="public";

-- ----------------------------
-- Function structure for sell_position
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."sell_position"("p_position_id" uuid, "p_user_id" uuid);
CREATE OR REPLACE FUNCTION "public"."sell_position"("p_position_id" uuid, "p_user_id" uuid=NULL::uuid)
  RETURNS "public"."trades" AS $BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for set_limit
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."set_limit"(float4);
CREATE OR REPLACE FUNCTION "public"."set_limit"(float4)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'set_limit'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- Function structure for show_limit
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."show_limit"();
CREATE OR REPLACE FUNCTION "public"."show_limit"()
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'show_limit'
  LANGUAGE c STABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for show_trgm
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."show_trgm"(text);
CREATE OR REPLACE FUNCTION "public"."show_trgm"(text)
  RETURNS "pg_catalog"."_text" AS '$libdir/pg_trgm', 'show_trgm'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for similarity
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."similarity"(text, text);
CREATE OR REPLACE FUNCTION "public"."similarity"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'similarity'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for similarity_dist
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."similarity_dist"(text, text);
CREATE OR REPLACE FUNCTION "public"."similarity_dist"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'similarity_dist'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for similarity_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."similarity_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."similarity_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'similarity_op'
  LANGUAGE c STABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for strict_word_similarity
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."strict_word_similarity"(text, text);
CREATE OR REPLACE FUNCTION "public"."strict_word_similarity"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'strict_word_similarity'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for strict_word_similarity_commutator_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_commutator_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."strict_word_similarity_commutator_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'strict_word_similarity_commutator_op'
  LANGUAGE c STABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for strict_word_similarity_dist_commutator_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_dist_commutator_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."strict_word_similarity_dist_commutator_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'strict_word_similarity_dist_commutator_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for strict_word_similarity_dist_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_dist_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."strict_word_similarity_dist_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'strict_word_similarity_dist_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for strict_word_similarity_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."strict_word_similarity_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."strict_word_similarity_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'strict_word_similarity_op'
  LANGUAGE c STABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for testers_username_normalize_trg_fn
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."testers_username_normalize_trg_fn"();
CREATE OR REPLACE FUNCTION "public"."testers_username_normalize_trg_fn"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := '@' || lower(regexp_replace(NEW.username, '^[[:space:]]*@?', ''));
  END IF;
  RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for trade_sell_full
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."trade_sell_full"("p_market_id" uuid);
CREATE OR REPLACE FUNCTION "public"."trade_sell_full"("p_market_id" uuid)
  RETURNS TABLE("id" uuid, "user_id" uuid, "market_id" uuid, "type" text, "side" text, "pi_amount" numeric, "fee_pi" numeric, "net_pi" numeric, "created_at" timestamptz) AS $BODY$
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
$BODY$
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  COST 100
  ROWS 1000
  SET "search_path"="public";

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
-- Function structure for trg_trades_to_history
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."trg_trades_to_history"();
CREATE OR REPLACE FUNCTION "public"."trg_trades_to_history"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
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
-- Function structure for word_similarity
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."word_similarity"(text, text);
CREATE OR REPLACE FUNCTION "public"."word_similarity"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'word_similarity'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for word_similarity_commutator_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."word_similarity_commutator_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."word_similarity_commutator_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'word_similarity_commutator_op'
  LANGUAGE c STABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for word_similarity_dist_commutator_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."word_similarity_dist_commutator_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."word_similarity_dist_commutator_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'word_similarity_dist_commutator_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for word_similarity_dist_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."word_similarity_dist_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."word_similarity_dist_op"(text, text)
  RETURNS "pg_catalog"."float4" AS '$libdir/pg_trgm', 'word_similarity_dist_op'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for word_similarity_op
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."word_similarity_op"(text, text);
CREATE OR REPLACE FUNCTION "public"."word_similarity_op"(text, text)
  RETURNS "pg_catalog"."bool" AS '$libdir/pg_trgm', 'word_similarity_op'
  LANGUAGE c STABLE STRICT
  COST 1;

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
    invalid
   FROM trades t
  WHERE COALESCE(invalid, false) = false;

-- ----------------------------
-- View structure for v_portfolio_totals
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_portfolio_totals";
CREATE VIEW "public"."v_portfolio_totals" AS  SELECT u.id AS user_id,
    COALESCE(sum(vt.pi_amount), 0::numeric) AS total_pi,
    COALESCE(sum(vt.fee_pi), 0::numeric) AS total_fees
   FROM users u
     LEFT JOIN valid_trades vt ON vt.user_id = u.id
  GROUP BY u.id;

-- ----------------------------
-- View structure for v_portfolio_unclaimed
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_portfolio_unclaimed";
CREATE VIEW "public"."v_portfolio_unclaimed" AS  SELECT u.id AS user_id,
    m.id AS market_id,
    m.question,
    m.outcome,
    sum(vt.pi_amount) AS unclaimed_pi
   FROM users u
     JOIN valid_trades vt ON vt.user_id = u.id
     JOIN markets m ON m.id = vt.market_id
  WHERE m.status = 'resolved'::text AND NOT m.resolved
  GROUP BY u.id, m.id, m.question, m.outcome;

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
    p.side,
    p.amount,
    p.amount AS pi_amount,
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
-- View structure for v_leaderboard
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_leaderboard";
CREATE VIEW "public"."v_leaderboard" AS  SELECT vt.user_id,
    COALESCE(u.pi_username, '@'::text || "left"(vt.user_id::text, 8)) AS username,
    sum(vt.pi_amount) AS volume,
    COALESCE(round(100::numeric * avg(
        CASE
            WHEN m.resolved IS TRUE AND m.outcome IS NOT NULL THEN
            CASE
                WHEN m.outcome = vt.side THEN 1.0
                ELSE 0.0
            END
            ELSE NULL::numeric
        END))::integer, 0) AS success_pct
   FROM valid_trades vt
     LEFT JOIN markets m ON m.id = vt.market_id
     LEFT JOIN users u ON u.id = vt.user_id
  GROUP BY vt.user_id, u.pi_username;

-- ----------------------------
-- View structure for market_snapshots
-- ----------------------------
DROP VIEW IF EXISTS "public"."market_snapshots";
CREATE VIEW "public"."market_snapshots" AS  WITH lh AS (
         SELECT DISTINCT ON (h.market_id) h.market_id,
            h.ts AS updated_at,
            h.implied_yes
           FROM market_history h
          ORDER BY h.market_id, h.ts DESC
        ), vol AS (
         SELECT mt.market_id,
            sum(mt.amount) AS total_volume,
            sum(mt.amount) FILTER (WHERE mt.ts > (now() - '24:00:00'::interval)) AS volume_24h
           FROM market_trades mt
          GROUP BY mt.market_id
        )
 SELECT m.id,
    m.title,
    m.created_at,
    m.end_date,
    m.status,
    COALESCE(lh.updated_at, m.created_at) AS updated_at,
    COALESCE(lh.implied_yes, 0.50) AS yes,
    1::numeric - COALESCE(lh.implied_yes, 0.50) AS no,
    round(COALESCE(lh.implied_yes, 0.50) * 100::numeric)::integer AS yes_pct,
    100 - round(COALESCE(lh.implied_yes, 0.50) * 100::numeric)::integer AS no_pct,
    COALESCE(vol.total_volume, 0::numeric) AS total_volume,
    COALESCE(vol.volume_24h, 0::numeric) AS volume_24h
   FROM markets m
     LEFT JOIN lh ON lh.market_id = m.id
     LEFT JOIN vol ON vol.market_id = m.id
  WHERE m.status = ANY (ARRAY['open'::text, 'pending'::text, 'resolved'::text]);

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
-- View structure for v_market_stats
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_market_stats";
CREATE VIEW "public"."v_market_stats" AS  SELECT m.id AS market_id,
    m.question,
    sum(
        CASE
            WHEN vt.side = 'yes'::text THEN vt.pi_amount
            ELSE 0::numeric
        END) AS yes_volume,
    sum(
        CASE
            WHEN vt.side = 'no'::text THEN vt.pi_amount
            ELSE 0::numeric
        END) AS no_volume
   FROM markets m
     LEFT JOIN valid_trades vt ON vt.market_id = m.id
  GROUP BY m.id, m.question;

-- ----------------------------
-- View structure for v_market_stats_v2
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_market_stats_v2";
CREATE VIEW "public"."v_market_stats_v2" AS  SELECT market_id,
    sum(
        CASE
            WHEN side = 'yes'::text THEN amount
            ELSE 0::numeric
        END) AS yes_total,
    sum(
        CASE
            WHEN side = 'no'::text THEN amount
            ELSE 0::numeric
        END) AS no_total,
    count(*) AS trades
   FROM positions
  GROUP BY market_id;

-- ----------------------------
-- View structure for v_market_volumes
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_market_volumes";
CREATE VIEW "public"."v_market_volumes" AS  SELECT market_id,
    sum(amount) AS total_volume,
    sum(amount) FILTER (WHERE ts > (now() - '24:00:00'::interval)) AS volume_24h
   FROM market_trades mt
  GROUP BY market_id;

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
SELECT setval('"public"."market_history_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."market_trades_id_seq"
OWNED BY "public"."market_trades"."id";
SELECT setval('"public"."market_trades_id_seq"', 5, true);

-- ----------------------------
-- Primary Key structure for table admin_audit
-- ----------------------------
ALTER TABLE "public"."admin_audit" ADD CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table admins
-- ----------------------------
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");

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
  "ts" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);

-- ----------------------------
-- Primary Key structure for table market_price_history
-- ----------------------------
ALTER TABLE "public"."market_price_history" ADD CONSTRAINT "market_price_history_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table market_suggestions
-- ----------------------------
CREATE INDEX "idx_market_suggestions_category_trgm" ON "public"."market_suggestions" USING gin (
  "category" COLLATE "pg_catalog"."default" "public"."gin_trgm_ops"
);
CREATE INDEX "idx_market_suggestions_created_at" ON "public"."market_suggestions" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_market_suggestions_question_trgm" ON "public"."market_suggestions" USING gin (
  "question" COLLATE "pg_catalog"."default" "public"."gin_trgm_ops"
);
CREATE INDEX "idx_market_suggestions_status_created" ON "public"."market_suggestions" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);
CREATE INDEX "idx_market_suggestions_user_id" ON "public"."market_suggestions" USING btree (
  "user_id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table market_suggestions
-- ----------------------------
ALTER TABLE "public"."market_suggestions" ADD CONSTRAINT "market_suggestions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table market_trades
-- ----------------------------
CREATE INDEX "idx_trades_market_ts" ON "public"."market_trades" USING btree (
  "market_id" "pg_catalog"."uuid_ops" ASC NULLS LAST,
  "ts" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
);

-- ----------------------------
-- Checks structure for table market_trades
-- ----------------------------
ALTER TABLE "public"."market_trades" ADD CONSTRAINT "market_trades_amount_check" CHECK (amount > 0::numeric);
ALTER TABLE "public"."market_trades" ADD CONSTRAINT "market_trades_price_check" CHECK (price >= 0::numeric AND price <= 1::numeric);
ALTER TABLE "public"."market_trades" ADD CONSTRAINT "market_trades_side_check" CHECK (side = ANY (ARRAY['yes'::text, 'no'::text]));

-- ----------------------------
-- Primary Key structure for table market_trades
-- ----------------------------
ALTER TABLE "public"."market_trades" ADD CONSTRAINT "market_trades_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table markets
-- ----------------------------
CREATE INDEX "idx_markets_closes_at" ON "public"."markets" USING btree (
  "closes_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_markets_unresolved_created" ON "public"."markets" USING btree (
  "created_at" "pg_catalog"."timestamptz_ops" DESC NULLS FIRST
) WHERE COALESCE(resolved, false) = false OR outcome IS NULL;

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
-- Checks structure for table suggestions
-- ----------------------------
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

-- ----------------------------
-- Primary Key structure for table suggestions
-- ----------------------------
ALTER TABLE "public"."suggestions" ADD CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table tester_whitelist
-- ----------------------------
CREATE UNIQUE INDEX "idx_tester_whitelist_username_unique" ON "public"."tester_whitelist" USING btree (
  lower(username) COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_wl_handle_norm" ON "public"."tester_whitelist" USING btree (
  "handle_norm" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table tester_whitelist
-- ----------------------------
ALTER TABLE "public"."tester_whitelist" ADD CONSTRAINT "tester_whitelist_handle_norm_uniq" UNIQUE ("handle_norm");
ALTER TABLE "public"."tester_whitelist" ADD CONSTRAINT "tester_whitelist_username_uniq" UNIQUE ("username");

-- ----------------------------
-- Primary Key structure for table tester_whitelist
-- ----------------------------
ALTER TABLE "public"."tester_whitelist" ADD CONSTRAINT "tester_whitelist_pkey" PRIMARY KEY ("username");

-- ----------------------------
-- Indexes structure for table testers
-- ----------------------------
CREATE UNIQUE INDEX "testers_handle_lower_uidx" ON "public"."testers" USING btree (
  lower(handle) COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
) WHERE handle IS NOT NULL;
CREATE UNIQUE INDEX "testers_handle_norm_unique" ON "public"."testers" USING btree (
  lower(regexp_replace(handle, '^\s*@'::text, ''::text)) COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "testers_username_lower_uidx" ON "public"."testers" USING btree (
  lower(username) COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Triggers structure for table testers
-- ----------------------------
CREATE TRIGGER "testers_username_normalize_trg" BEFORE INSERT OR UPDATE ON "public"."testers"
FOR EACH ROW
EXECUTE PROCEDURE "public"."testers_username_normalize_trg_fn"();

-- ----------------------------
-- Checks structure for table testers
-- ----------------------------
ALTER TABLE "public"."testers" ADD CONSTRAINT "testers_username_must_start_with_at" CHECK (username ~ '^@'::text);

-- ----------------------------
-- Primary Key structure for table testers
-- ----------------------------
ALTER TABLE "public"."testers" ADD CONSTRAINT "testers_pkey" PRIMARY KEY ("username");

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
-- Indexes structure for table users
-- ----------------------------
CREATE INDEX "idx_users_handle_norm" ON "public"."users" USING btree (
  "handle_norm" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "users_pi_username_unique_ci" ON "public"."users" USING btree (
  lower(pi_username) COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
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
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table market_price_history
-- ----------------------------
ALTER TABLE "public"."market_price_history" ADD CONSTRAINT "market_price_history_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table market_suggestions
-- ----------------------------
ALTER TABLE "public"."market_suggestions" ADD CONSTRAINT "market_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

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
