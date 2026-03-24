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

 Date: 13/01/2026 15:11:36
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
-- Records of admin_audit
-- ----------------------------
INSERT INTO "public"."admin_audit" VALUES ('93bac914-7e15-45fc-b26f-d3d835daad55', '2025-09-04 11:11:30.894609+09', 'market.create', '770d2aae-40e3-4673-a09b-a83ff92b4059', '{"category": "Test", "question": "AUDIT: extension-free"}');
INSERT INTO "public"."admin_audit" VALUES ('c538c940-13dd-4c6b-b143-99e193eaaf29', '2025-09-04 11:11:36.29752+09', 'market.resolve', '770d2aae-40e3-4673-a09b-a83ff92b4059', '{"outcome": "yes"}');

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
INSERT INTO "public"."admins" VALUES ('754760c0-ec5a-431d-9d9a-5b1ff85a430a');

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
-- Records of attestations
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
INSERT INTO "public"."comments" VALUES ('de49f603-72d0-4517-ab62-d95d5d38925b', '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', NULL, '@AtchesSon', 'from SQL', '2025-09-16 10:39:08.862709+09');

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
-- Records of compliance_logs
-- ----------------------------
INSERT INTO "public"."compliance_logs" VALUES (1, NULL, '127.0.0.1', 'LOCAL', NULL, 'full_block', NULL, 'access_attempt', 'blocked', 'Access blocked for Tier 1 (full_block) region', '2025-12-02 08:05:10.650134');
INSERT INTO "public"."compliance_logs" VALUES (2, NULL, '127.0.0.1', 'LOCAL', NULL, 'full_block', NULL, 'access_attempt', 'blocked', 'Access blocked for Tier 1 (full_block) region', '2025-12-02 08:05:10.987008');
INSERT INTO "public"."compliance_logs" VALUES (3, NULL, '127.0.0.1', 'LOCAL', NULL, 'full_block', NULL, 'access_attempt', 'blocked', 'Access blocked for Tier 1 (full_block) region', '2025-12-02 09:25:45.653269');
INSERT INTO "public"."compliance_logs" VALUES (4, NULL, '127.0.0.1', 'LOCAL', NULL, 'full_block', NULL, 'access_attempt', 'blocked', 'Access blocked for Tier 1 (full_block) region', '2025-12-02 09:25:46.023032');
INSERT INTO "public"."compliance_logs" VALUES (5, NULL, '127.0.0.1', 'LOCAL', NULL, 'full_block', NULL, 'access_attempt', 'blocked', 'Access blocked for Tier 1 (full_block) region', '2025-12-10 06:04:44.755092');
INSERT INTO "public"."compliance_logs" VALUES (6, NULL, '127.0.0.1', 'LOCAL', NULL, 'full_block', NULL, 'access_attempt', 'blocked', 'Access blocked for Tier 1 (full_block) region', '2025-12-10 06:05:06.068279');

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
INSERT INTO "public"."market_comments" VALUES (1, '3a7fb0d1-7619-4e77-a78d-6b2aad6e89ea', '2025-09-22 02:07:05.482914+09', 'sanity-user', 'first comment via API');

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
INSERT INTO "public"."market_history" VALUES (93, '904bb69a-6ad3-4431-8731-4c6b7404be0a', '2025-11-21 10:48:01.671033+09', 0.75000000000000000000, 0.25000000000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (94, '16001e5a-d8bb-454d-bf87-de6879a0dc1f', '2025-11-21 11:32:16.490685+09', 0.75000000000000000000, 0.25000000000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (95, '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', '2025-11-21 11:40:50.210162+09', 0.25000000000000000000, 0.75000000000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (96, '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', '2025-11-21 11:40:55.996547+09', 0.50000000000000000000, 0.50000000000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (97, '87ffce4d-a716-429e-94c0-963e78d9de06', '2025-11-21 11:55:21.690699+09', 0.75000000000000000000, 0.25000000000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (98, '87ffce4d-a716-429e-94c0-963e78d9de06', '2025-11-21 11:55:24.193783+09', 0.50000000000000000000, 0.50000000000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (99, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:10.307596+09', 0.50495049504950495050, 0.49504950495049504950, 'trade');
INSERT INTO "public"."market_history" VALUES (100, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:12.05917+09', 0.50980392156862745098, 0.49019607843137254902, 'trade');
INSERT INTO "public"."market_history" VALUES (101, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:13.215571+09', 0.51456310679611650485, 0.48543689320388349515, 'trade');
INSERT INTO "public"."market_history" VALUES (102, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:13.996085+09', 0.51923076923076923077, 0.48076923076923076923, 'trade');
INSERT INTO "public"."market_history" VALUES (103, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:14.539103+09', 0.52380952380952380952, 0.47619047619047619048, 'trade');
INSERT INTO "public"."market_history" VALUES (104, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:14.971688+09', 0.52830188679245283019, 0.47169811320754716981, 'trade');
INSERT INTO "public"."market_history" VALUES (105, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:15.134942+09', 0.53271028037383177570, 0.46728971962616822430, 'trade');
INSERT INTO "public"."market_history" VALUES (106, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:15.371568+09', 0.53703703703703703704, 0.46296296296296296296, 'trade');
INSERT INTO "public"."market_history" VALUES (107, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:15.571599+09', 0.54128440366972477064, 0.45871559633027522936, 'trade');
INSERT INTO "public"."market_history" VALUES (108, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:15.909919+09', 0.54545454545454545455, 0.45454545454545454545, 'trade');
INSERT INTO "public"."market_history" VALUES (109, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:16.055259+09', 0.54954954954954954955, 0.45045045045045045045, 'trade');
INSERT INTO "public"."market_history" VALUES (110, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:16.264298+09', 0.55357142857142857143, 0.44642857142857142857, 'trade');
INSERT INTO "public"."market_history" VALUES (111, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:16.560515+09', 0.55752212389380530973, 0.44247787610619469027, 'trade');
INSERT INTO "public"."market_history" VALUES (112, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:16.682847+09', 0.56140350877192982456, 0.43859649122807017544, 'trade');
INSERT INTO "public"."market_history" VALUES (113, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:16.87786+09', 0.56521739130434782609, 0.43478260869565217391, 'trade');
INSERT INTO "public"."market_history" VALUES (114, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:17.186367+09', 0.56896551724137931034, 0.43103448275862068966, 'trade');
INSERT INTO "public"."market_history" VALUES (115, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:17.255514+09', 0.57264957264957264957, 0.42735042735042735043, 'trade');
INSERT INTO "public"."market_history" VALUES (116, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16 16:50:17.441574+09', 0.57627118644067796610, 0.42372881355932203390, 'trade');
INSERT INTO "public"."market_history" VALUES (117, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-17 16:33:17.241473+09', 0.60937500000000000000, 0.39062500000000000000, 'trade');
INSERT INTO "public"."market_history" VALUES (118, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2026-01-13 15:06:11.531217+09', 0.67741935483870967742, 0.32258064516129032258, 'trade');
INSERT INTO "public"."market_history" VALUES (119, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2026-01-13 15:08:32.361292+09', 0.67088607594936708861, 0.32911392405063291139, 'trade');
INSERT INTO "public"."market_history" VALUES (120, 'c2031bed-db25-426d-9457-7e2ab2ece872', '2026-01-13 15:09:30.485623+09', 0.65030674846625766871, 0.34969325153374233129, 'trade');

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
-- Records of market_price_history
-- ----------------------------
INSERT INTO "public"."market_price_history" VALUES ('0d5e291d-afe7-4112-92c9-aa3aff41cd2d', '16001e5a-d8bb-454d-bf87-de6879a0dc1f', '2025-11-21', 75, 25, 100);
INSERT INTO "public"."market_price_history" VALUES ('e8fd0e4f-713f-4573-bd68-271444c0963f', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', '2025-11-21', 50, 50, 200);
INSERT INTO "public"."market_price_history" VALUES ('08fcb1ce-da14-4d3c-a865-6a1e2a0a2e6d', '87ffce4d-a716-429e-94c0-963e78d9de06', '2025-11-21', 50, 50, 200);
INSERT INTO "public"."market_price_history" VALUES ('a7745519-c779-4168-b766-382559ec007e', 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-16', 57.6271186440678, 42.3728813559322, 18);
INSERT INTO "public"."market_price_history" VALUES ('b1431d42-58ba-4656-9ce7-0a6f5f750b4d', 'c2031bed-db25-426d-9457-7e2ab2ece872', '2025-12-17', 60.9375, 39.0625, 28);
INSERT INTO "public"."market_price_history" VALUES ('52f1d0c9-abd0-442b-960d-2b4e7abfa467', '904bb69a-6ad3-4431-8731-4c6b7404be0a', '2025-11-21', 75, 25, 100);
INSERT INTO "public"."market_price_history" VALUES ('5ea3daf4-1651-477f-b81c-09f6092c5ded', 'c2031bed-db25-426d-9457-7e2ab2ece872', '2026-01-13', 65.03067484662577, 34.969325153374236, 63);

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
  "checklist_verifiable_outcome" bool NOT NULL DEFAULT true,
  "resolved_by_user_id" uuid,
  "resolved_by_username" varchar(255) COLLATE "pg_catalog"."default",
  "payout_status" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of markets
-- ----------------------------
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('0db07d77-e22a-49a9-a4b8-1e4be9b906fa', '2222222222', 'Crypto', NULL, NULL, 'cancelled', '2025-11-21 11:40:40.226754+09', '2025-11-21 00:00:00+09', NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, '22222222222222222222222', '2025-11-22 00:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('cbe28e50-800f-4226-b12f-c25ed91ea2af', '333333333333', 'Crypto', NULL, NULL, 'cancelled', '2025-11-21 11:46:51.797753+09', '2025-11-21 00:00:00+09', NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, '333333333333333333333333333', '2025-11-22 00:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('87ffce4d-a716-429e-94c0-963e78d9de06', '44444444444444', 'Technology', NULL, NULL, 'resolved', '2025-11-21 11:55:10.632539+09', '2025-11-22 00:00:00+09', NULL, NULL, NULL, 't', '2025-11-21 11:55:45.919457', 'yes', 'f', NULL, NULL, 0, '44444444444444444444444444444', '2025-11-23 00:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('904bb69a-6ad3-4431-8731-4c6b7404be0a', 'Will BTC > $110k by Dec?', 'Crypto', NULL, NULL, 'resolved', '2025-11-10 21:19:03.003094+09', '2025-12-31 09:00:00+09', NULL, NULL, NULL, 't', '2025-11-21 10:48:19.492893', 'yes', NULL, NULL, NULL, 0, 'Bitcoin (BTC) price will surpass $110,000 by December 31, 2025.', '2026-01-01 09:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('16001e5a-d8bb-454d-bf87-de6879a0dc1f', 'Will BTC > $100k by Dec?', 'Pi Coin', NULL, NULL, 'open', '2025-11-21 11:31:56.546303+09', '2025-11-22 00:00:00+09', NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, '1111111111111111111111111111111111', '2025-11-23 00:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('193d6144-e37d-4675-8e42-1b6b198c088a', 'TestSuggest1111', 'Technology', NULL, NULL, 'resolved', '2025-12-16 11:56:39.124558+09', '2025-12-31 00:00:00+09', NULL, NULL, NULL, 't', '2025-12-16 11:57:50.246612', 'yes', 'f', NULL, NULL, 0, 'Test Suggest 111111111111111', '2026-01-01 00:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('c2031bed-db25-426d-9457-7e2ab2ece872', 'Test Market 222', 'Crypto', NULL, NULL, 'open', '2025-12-16 16:30:47.051626+09', '2025-12-24 01:00:00+09', NULL, NULL, NULL, 'f', NULL, NULL, 'f', NULL, NULL, 0, 'Test Market 222222222222222222222222222', '2025-12-25 01:00:00+09', NULL, '[]', '{}', 't', 't', 't', NULL, NULL, NULL);
INSERT INTO "public"."markets" ("id", "question", "category", "creator_id", "tier", "status", "created_at", "end_date", "liquidity", "resolution_criteria", "resolution_source", "resolved", "resolved_at", "resolved_outcome", "is_archived", "closes_at", "outcome_reason", "seed_total", "description", "close_at", "rules", "sources", "tags", "checklist_resolution_clarity", "checklist_restricted_topics", "checklist_verifiable_outcome", "resolved_by_user_id", "resolved_by_username", "payout_status") VALUES ('64c99467-e979-4d29-9070-e3ba231cb5c9', 'TestMarket111', 'Technology', NULL, NULL, 'resolved', '2025-12-16 11:49:51.095066+09', '2025-12-30 00:00:00+09', NULL, NULL, NULL, 't', '2025-12-30 11:29:33.895868', 'yes', 'f', NULL, NULL, 0, 'Test Market 111111111111111111111111111', '2025-12-31 00:00:00+09', NULL, '[]', '{}', 't', 't', 't', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'supertiger0805', 'pending');

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
-- Records of positions
-- ----------------------------
INSERT INTO "public"."positions" VALUES ('b1fe8a4c-b399-4a35-ae5a-1dd3f897d198', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '904bb69a-6ad3-4431-8731-4c6b7404be0a', 'yes', 196.0, '2025-11-21 10:48:01.671033+09', NULL, NULL, 100);
INSERT INTO "public"."positions" VALUES ('54c6847e-bfd9-4244-8a98-4f3cd4f2c130', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '16001e5a-d8bb-454d-bf87-de6879a0dc1f', 'yes', 196.0, '2025-11-21 11:32:16.490685+09', NULL, NULL, 100);
INSERT INTO "public"."positions" VALUES ('9fcd167f-da1d-432e-bc6e-967d041b747e', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 'no', 196.0, '2025-11-21 11:40:50.210162+09', NULL, NULL, 100);
INSERT INTO "public"."positions" VALUES ('a8e61041-f090-4e46-abf8-7e43b9117f67', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 'yes', 392.0, '2025-11-21 11:40:55.996547+09', NULL, NULL, 100);
INSERT INTO "public"."positions" VALUES ('b2e61c40-a7e0-4596-9486-8f54d4c9c444', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '87ffce4d-a716-429e-94c0-963e78d9de06', 'yes', 196.0, '2025-11-21 11:55:21.690699+09', NULL, NULL, 100);
INSERT INTO "public"."positions" VALUES ('0958e6fd-5c0e-44b6-aacf-ab181097625a', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '87ffce4d-a716-429e-94c0-963e78d9de06', 'no', 392.0, '2025-11-21 11:55:24.193783+09', NULL, NULL, 100);
INSERT INTO "public"."positions" VALUES ('591f683d-d27b-412c-a346-08909f844f04', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.96, '2025-12-16 16:50:10.307596+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('e82c46f0-a4cd-45c0-bda6-62a8e05ff522', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.96, '2025-12-16 16:50:12.05917+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('be02da67-321f-4545-8032-9e18a434e54c', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.9215686274509802, '2025-12-16 16:50:13.215571+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('f55b8bed-87fa-44c3-8306-764f0ce39ffe', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.9215686274509802, '2025-12-16 16:50:13.996085+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('e23db20a-e068-4cb2-82ed-fd09ae3da51b', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.8846153846153846, '2025-12-16 16:50:14.539103+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('4fd3e2ab-e84b-40c7-b8ca-134262eec260', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.8846153846153846, '2025-12-16 16:50:14.971688+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('6d8ad39f-48c8-4834-a79c-a5c7100a70cf', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.8490566037735847, '2025-12-16 16:50:15.134942+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('c3646d5a-8bfc-49d6-be3c-13aa6fc1a4db', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.8490566037735847, '2025-12-16 16:50:15.371568+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('461f80c4-659b-47d9-bd27-ed87ef19f17e', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.8148148148148147, '2025-12-16 16:50:15.571599+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('5f7d3451-5205-4f36-8c04-ccae741048fe', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.8148148148148147, '2025-12-16 16:50:15.909919+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('8199c2b0-d4ab-4199-be5d-870f4858a340', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.7818181818181817, '2025-12-16 16:50:16.055259+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('343e2cde-a973-4e80-bcaf-2f65d639b8de', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.7818181818181817, '2025-12-16 16:50:16.264298+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('0ba20974-59b4-4171-8d28-e85f199d0189', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.7818181818181817, '2025-12-16 16:50:16.560515+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('5eaddc63-49a3-4bcd-afe4-1b95b1aa1978', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.7499999999999998, '2025-12-16 16:50:16.682847+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('f00429ea-88c8-4aa6-9cc6-b194ae18ac66', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.7499999999999998, '2025-12-16 16:50:16.87786+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('6770cea8-cc87-4ae3-97de-07a2235cd358', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.719298245614035, '2025-12-16 16:50:17.186367+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('291c935b-e06c-4ca5-9751-c3c6118954c2', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.719298245614035, '2025-12-16 16:50:17.255514+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('2e8407f0-bd53-4e8f-8b3e-c59321827201', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 1.719298245614035, '2025-12-16 16:50:17.441574+09', NULL, NULL, 1);
INSERT INTO "public"."positions" VALUES ('e8e61277-7c75-4a23-9def-c1d4c6bff927', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 16.896551724137932, '2025-12-17 16:33:17.241473+09', NULL, NULL, 10);
INSERT INTO "public"."positions" VALUES ('ad29294b-34a2-4869-ba94-8f3ee1c7d01d', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'yes', 2.9253731343283578, '2026-01-13 15:06:11.531217+09', NULL, NULL, 2);
INSERT INTO "public"."positions" VALUES ('e4f6121f-d91d-4bdb-a0f8-5b06d5aea036', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'no', 6.125, '2026-01-13 15:08:32.361292+09', NULL, NULL, 2);
INSERT INTO "public"."positions" VALUES ('e8be8af7-027e-492c-bf65-4f3c742d4754', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'no', 2.8000000000000003, '2026-01-13 15:09:30.485623+09', NULL, NULL, 1);

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
-- Records of referrals
-- ----------------------------

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
-- Records of roles
-- ----------------------------
INSERT INTO "public"."roles" VALUES (3, 'user');
INSERT INTO "public"."roles" VALUES (2, 'admin');
INSERT INTO "public"."roles" VALUES (1, 'superadmin');

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
INSERT INTO "public"."suggestions" VALUES ('d1936b30-f983-4fe7-8f1e-0099f23bdfb1', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '11111111111111111', 'Pi Coin', ' ', '11111111111111111111111111111111111111', '2025-11-16 00:00:00+09', 'approved', NULL, '2025-11-15 10:51:43.104051+09', NULL, NULL, NULL);
INSERT INTO "public"."suggestions" VALUES ('2a21ff14-0e4f-4180-92e3-cfd87d59cf02', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '132132132131321313132', 'Pi Coin', ' ', '12313213213132132132132132132132', '2025-11-30 00:00:00+09', 'approved', NULL, '2025-11-17 23:34:43.044827+09', NULL, NULL, NULL);
INSERT INTO "public"."suggestions" VALUES ('0541906a-ec9e-411a-809c-989bb919573d', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '11111111111111111111', 'Pi Coin', ' ', '1111111111111111111111111111111111', '2025-11-22 00:00:00+09', 'approved', NULL, '2025-11-21 11:31:45.990342+09', NULL, NULL, NULL);
INSERT INTO "public"."suggestions" VALUES ('abcd3019-d4f4-4e32-8796-dec86fd70a56', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'TestSuggest1111', 'Pi Coin', ' ', 'Test Suggest 111111111111111', '2025-12-31 00:00:00+09', 'approved', NULL, '2025-12-16 11:55:29.048311+09', NULL, NULL, NULL);

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
-- Records of trades
-- ----------------------------
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('31165473-c0b9-4fec-9570-e7f2905f1235', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 10, '2025-12-17 16:33:17.241473+09', 0.200000, 't', 'buy', 17);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('aa16cb19-7137-4be9-b2c5-280715b6dda3', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '904bb69a-6ad3-4431-8731-4c6b7404be0a', 'buy', 'yes', 100, '2025-11-21 10:48:01.671033+09', 2.000000, 't', 'buy', 196);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('bfbad87e-4b92-4636-9ae9-03972f851ae5', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '16001e5a-d8bb-454d-bf87-de6879a0dc1f', 'buy', 'yes', 100, '2025-11-21 11:32:16.490685+09', 2.000000, 't', 'buy', 196);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('c924aad7-4fd2-4611-b604-fb3a11db3039', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 'buy', 'no', 100, '2025-11-21 11:40:50.210162+09', 2.000000, 't', 'buy', 196);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('1d25bff8-b44f-4a96-abc6-8de3cd8bb769', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 'buy', 'yes', 100, '2025-11-21 11:40:55.996547+09', 2.000000, 't', 'buy', 392);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('46efbbe6-9593-4a31-a8d1-16fd814d198b', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '87ffce4d-a716-429e-94c0-963e78d9de06', 'buy', 'yes', 100, '2025-11-21 11:55:21.690699+09', 2.000000, 't', 'buy', 196);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('55d55ed2-a42c-456d-9c02-ed5aad0b1947', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '87ffce4d-a716-429e-94c0-963e78d9de06', 'buy', 'no', 100, '2025-11-21 11:55:24.193783+09', 2.000000, 't', 'buy', 392);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('675d2ffe-6b45-40b4-9940-eb298ad019f2', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:10.307596+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('1bd0fb41-149d-4e36-8d8e-394751beaf59', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:12.05917+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('6b401c4d-d004-47fc-b7a3-bc3044ef1f11', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:13.215571+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('1bcf0d34-6fdc-49fa-a313-ad4d064de076', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:13.996085+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('577dfafd-3edf-4be6-b642-9712925622ac', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:14.539103+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('0a9fd0ae-614a-418a-b11f-a7588cac2107', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:14.971688+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('862f77b3-2e2e-44ac-b5e4-a4831fc9397d', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:15.134942+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('97a9e2de-08d8-4676-838b-8fd485ffd844', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:15.371568+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('2f91a7c6-fb16-40a1-8677-a1b7e9b9bd79', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:15.571599+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('3ba7dde5-38a8-4926-9fc0-dd2e2a36bba3', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:15.909919+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('f0f104f3-0080-43e6-a9ad-77c067845bc8', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:16.055259+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('6618ed42-a612-4fdb-9e36-9afd642df302', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:16.264298+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('45f79bb7-d06e-4d64-84a3-5f423209e946', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:16.560515+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('e26589ac-1b47-46ee-bde2-dd9034f544ae', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:16.682847+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('2af7e6d5-4c9e-4a75-8aa4-09c56ba27bd7', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:16.87786+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('96995ec8-ccd6-4bb1-9ad7-9e3f8b3cb759', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:17.186367+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('f10e3909-ec7d-4c72-b893-cc65568b2937', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:17.255514+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('0c7ff2cb-4ec6-474d-b9c1-11a0da59c666', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 1, '2025-12-16 16:50:17.441574+09', 0.020000, 't', 'buy', 2);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('364a642b-a17a-4659-85c5-19cca9b440e1', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'yes', 2, '2026-01-13 15:06:11.531217+09', 0.040000, 'f', 'buy', 3);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('0cd89f9c-ad92-4442-9b69-c13384e331c5', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'no', 2, '2026-01-13 15:08:32.361292+09', 0.040000, 'f', 'buy', 6);
INSERT INTO "public"."trades" ("id", "user_id", "market_id", "type", "side", "pi_amount", "created_at", "fee_pi", "invalid", "kind", "amount") VALUES ('0ea033ce-61d6-4e6e-bc34-0ce7b84db441', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 'buy', 'no', 1, '2026-01-13 15:09:30.485623+09', 0.020000, 'f', 'buy', 3);

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
-- Records of transactions
-- ----------------------------
INSERT INTO "public"."transactions" VALUES ('ef1806af-7d54-4cb0-b0e1-356c0da73528', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '16001e5a-d8bb-454d-bf87-de6879a0dc1f', 196, 'refund', 'completed', 'Refund due to cancellation', '2025-11-21', 196);
INSERT INTO "public"."transactions" VALUES ('231d90b9-61f1-4333-b324-554d03bc2187', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 196, 'prediction-no', 'completed', '2222222222', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('1938e864-3ef9-4e0b-829f-5d322d34c6c9', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 392, 'prediction-yes', 'completed', '2222222222', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('0f42f0c2-9f34-4ec8-8d3d-0bea60ea1949', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '0db07d77-e22a-49a9-a4b8-1e4be9b906fa', 588, 'refund', 'completed', 'Refund due to cancellation', '2025-11-21', 588.0);
INSERT INTO "public"."transactions" VALUES ('754760c0-ec5a-431d-9d9a-5b1ff85a430a', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '484dabfe-45f9-4664-9397-ce6fb7e34e9f', 2000, 'deposit', 'completed', 'Initial account deposit', '2025-11-10', 2000);
INSERT INTO "public"."transactions" VALUES ('540bfa82-99c6-4943-b491-1232c135729b', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '87ffce4d-a716-429e-94c0-963e78d9de06', 196, 'prediction-yes', 'completed', '44444444444444', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('2d57c887-1030-4815-9182-c9ac0a47d9cc', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '87ffce4d-a716-429e-94c0-963e78d9de06', 392, 'prediction-no', 'completed', '44444444444444', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('e7904bbb-e500-4042-b577-3c5cc9e0d553', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', NULL, 196, 'claim-payouts', 'completed', 'Claim All Payouts', '2025-11-21', 196);
INSERT INTO "public"."transactions" VALUES ('c367b888-a88b-4074-969c-fcbfce323bb8', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('380b2ce0-afa1-4143-9d7f-0121c81a4837', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('c0c50de4-7d4e-468d-b28c-ee45438889e6', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '904bb69a-6ad3-4431-8731-4c6b7404be0a', 196, 'prediction-yes', 'completed', 'Will BTC > $110k by Dec?', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('2143a419-6d17-41c4-8353-2f795fd97963', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '904bb69a-6ad3-4431-8731-4c6b7404be0a', 65, 'prediction-yes', 'completed', 'Will BTC > $110k by Dec?', '2025-11-21', -50);
INSERT INTO "public"."transactions" VALUES ('c26d427f-4622-4304-bcb8-e7b4e87131fd', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '904bb69a-6ad3-4431-8731-4c6b7404be0a', 588, 'prediction-no', 'completed', 'Will BTC > $110k by Dec?', '2025-11-21', -120);
INSERT INTO "public"."transactions" VALUES ('64364387-eba5-43f9-8d61-c36740f395ed', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '904bb69a-6ad3-4431-8731-4c6b7404be0a', 196, 'prediction-yes', 'completed', 'Will BTC > $110k by Dec?', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('711f35cb-f689-4dba-9951-61b5ab42889f', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', NULL, 196, 'claim-payouts', 'completed', 'Claim All Payouts', '2025-11-21', 196);
INSERT INTO "public"."transactions" VALUES ('b1ca8955-4bc5-4a89-9b8f-0fbe0374398e', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', '16001e5a-d8bb-454d-bf87-de6879a0dc1f', 196, 'prediction-yes', 'completed', '11111111111111111111', '2025-11-21', -100);
INSERT INTO "public"."transactions" VALUES ('3ed29947-ae08-4972-bef3-f41c01b8436c', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('08e058d9-3feb-499f-9752-26353e179a14', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('83f646fd-7d9a-4607-8adc-704ee788cd63', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('af4fd4d5-ede8-4585-b900-e1e69b2cda76', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('c0e44953-853a-47bc-9195-3e4ad17ea063', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('da5a6265-0fa9-42d5-a27d-14cbd0749a23', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('0354a486-6906-40cb-a877-2ec05e1a9653', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('8593b63a-c5d3-471f-ba29-0b51633062fa', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('a10c4d9d-5b0d-4043-a05e-15271e4712f3', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('facf5b40-b9e7-4c77-a159-d2b28b9a8765', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('14fe51bd-a699-408b-b3a7-ac5cb169aac8', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('5f8d1efa-3f1e-468a-9289-0b2b4951f0b3', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('fa1902b4-7f1d-454e-9a18-6fb86fda7d2d', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('85add75e-66fc-4fdf-800e-de89614d8fc9', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('0bdd0bc5-f59d-432f-9ad5-8ddf34a78ed4', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('5dd84c32-a694-4924-9151-2e2325ce3ced', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 2, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-16', -1);
INSERT INTO "public"."transactions" VALUES ('a000754b-0b7a-443d-b91a-58257076ec48', '754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'c2031bed-db25-426d-9457-7e2ab2ece872', 17, 'prediction-yes', 'completed', 'Test Market 222', '2025-12-17', -10.0);
INSERT INTO "public"."transactions" VALUES ('ec344029-0ed7-428d-80c2-78dfd7780d78', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 3, 'prediction-yes', 'completed', 'Test Market 222', '2026-01-13', -2.0);
INSERT INTO "public"."transactions" VALUES ('a39fc80c-fa99-44c7-91e6-0c01fa313f78', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 6, 'prediction-no', 'completed', 'Test Market 222', '2026-01-13', -2.0);
INSERT INTO "public"."transactions" VALUES ('a2b88252-dd51-4976-a152-7f1c127c3f55', 'e002ec34-1e30-4007-97df-9493b1833eea', 'c2031bed-db25-426d-9457-7e2ab2ece872', 3, 'prediction-no', 'completed', 'Test Market 222', '2026-01-13', -1.0);

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
  "status" varchar(255) COLLATE "pg_catalog"."default",
  "balance" numeric NOT NULL DEFAULT 0,
  "role_id" int4 NOT NULL DEFAULT 3
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES ('8647eeb1-6635-45b5-9b44-24f15485d9d9', 'test1', '2025-09-07 07:44:41.170594+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('82a1db16-3282-50ef-b977-d60ccf71417a', 'test2', '2025-09-07 08:05:20.887142+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('ca745c47-3ee1-57c9-8e16-2040c0c1790f', 'test3', '2025-09-08 09:38:22.786945+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('652f83e5-865f-4330-9dfe-c50d20b1c0c7', 'test4', '2025-09-18 08:48:30.669639+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('9b287f8d-4727-451f-84d9-505ec9edd213', 'test6', '2025-08-21 10:34:36.220561+09', NULL, NULL, 'suspended', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('3b8b6098-a5fc-45fc-8b7b-b4d2bc2ca682', 'test7', '2025-08-24 23:54:31.709231+09', NULL, NULL, 'suspended', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('38b86098-af5c-45fc-8b7b-b4d2bc2ca682', 'test8', '2025-08-19 07:43:56.96465+09', NULL, NULL, 'banned', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('49b19763-90d0-4990-b63b-dca945db892c', 'test9', '2025-08-21 10:32:20.091029+09', NULL, NULL, 'banned', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('b8cfd6ac-a619-4e6a-bbf7-3006d6e4aa19', 'AtchesSon', '2025-08-26 12:45:53.451336+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('6961cc7f-38ac-45ab-8256-00483252a6ef', '@admin', '2025-08-28 09:33:25.232849+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('4165145e-bb70-4248-a9b6-ee05a151cb51', '@AtchesSon', '2025-08-28 09:33:37.745834+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('c6b4c472-39a2-46cf-a93f-9c6151b4c563', '@AtchesSon ', '2025-08-28 09:40:45.378349+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('3bb86098-a5fc-45fc-8b7b-b4d2bc2ca682', '@Atcheson', '2025-09-05 07:49:56.314466+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('31f7b10f-00ef-48e7-8972-4b89a7fdc776', 'andy', '2025-08-26 11:33:43.4153+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('f3891537-058f-43e6-aad7-2f5bc0ffe606', 'test5', '2025-10-05 23:49:25.302853+09', NULL, NULL, 'active', 3094.0, 3);
INSERT INTO "public"."users" VALUES ('754760c0-ec5a-431d-9d9a-5b1ff85a430a', 'supertiger0805', '2025-11-10 16:01:54.091148+09', NULL, NULL, 'active', 3072.0, 1);
INSERT INTO "public"."users" VALUES ('e002ec34-1e30-4007-97df-9493b1833eea', 'supertiger0805', '2026-01-09 10:22:47.307593+09', NULL, NULL, 'active', 0, 1);

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
-- View structure for v_market_snapshots
-- ----------------------------
DROP VIEW IF EXISTS "public"."v_market_snapshots";
CREATE VIEW "public"."v_market_snapshots" AS  WITH vol AS (
         SELECT mt.market_id,
            COALESCE(sum(mt.pi_amount), 0::numeric) AS total_pi,
            COALESCE(sum(mt.pi_amount) FILTER (WHERE mt.created_at > (now() - '24:00:00'::interval)), 0::numeric) AS pi_24h,
            COALESCE(sum(mt.pi_amount) FILTER (WHERE mt.side = 'yes'::text), 0::numeric) AS yes_pi,
            COALESCE(sum(mt.pi_amount) FILTER (WHERE mt.side = 'no'::text), 0::numeric) AS no_pi,
            COALESCE(sum(mt.amount), 0::numeric) AS total_volume,
            COALESCE(sum(mt.amount) FILTER (WHERE mt.created_at > (now() - '24:00:00'::interval)), 0::numeric) AS volume_24h,
            COALESCE(sum(mt.amount) FILTER (WHERE mt.side = 'yes'::text), 0::numeric) AS yes_volume,
            COALESCE(sum(mt.amount) FILTER (WHERE mt.side = 'no'::text), 0::numeric) AS no_volume,
            count(DISTINCT mt.user_id) AS total_participants
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
    COALESCE(vol.total_pi, 0::numeric) AS total_pi,
    COALESCE(vol.pi_24h, 0::numeric) AS pi_24h,
    COALESCE(vol.yes_pi, 0::numeric) AS yes_pi,
    COALESCE(vol.no_pi, 0::numeric) AS no_pi,
    COALESCE(vol.total_volume, 0::numeric) AS total_volume,
    COALESCE(vol.volume_24h, 0::numeric) AS volume_24h,
    COALESCE(vol.yes_volume, 0::numeric) AS yes_volume,
    COALESCE(vol.no_volume, 0::numeric) AS no_volume,
    COALESCE(vol.total_participants, 0::bigint) AS total_participants,
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
SELECT setval('"public"."market_history_id_seq"', 120, true);

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
