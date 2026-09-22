-- =====================================================================
-- INNOVEXA — SCHEMA ALIGNMENT MIGRATION (CORRECTED)
-- All FK references are TEXT REFERENCES because projects/community/etc.
-- use TEXT IDs (UUID-shaped strings stored as TEXT, not PG native UUID).
-- Safe for re-run: uses IF NOT EXISTS / DO blocks where possible.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTRA COLUMNS FOR EXISTING TABLE: public.profiles
--    Frontend uses: id, full_name, avatar_url, bio, organization,
--    onboarding_completed, created_at, updated_at, email, role, points,
--    website_url, headline, interests, skills, preferred_domains,
--    credits, reputation_score, reputation_tier
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='name') THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='organization') THEN
    ALTER TABLE public.profiles ADD COLUMN organization TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='headline') THEN
    ALTER TABLE public.profiles ADD COLUMN headline TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='points') THEN
    ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'innovator';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='website_url') THEN
    ALTER TABLE public.profiles ADD COLUMN website_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='interests') THEN
    ALTER TABLE public.profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='skills') THEN
    ALTER TABLE public.profiles ADD COLUMN skills TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='preferred_domains') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_domains TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='credits') THEN
    ALTER TABLE public.profiles ADD COLUMN credits INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='reputation_score') THEN
    ALTER TABLE public.profiles ADD COLUMN reputation_score INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='reputation_tier') THEN
    ALTER TABLE public.profiles ADD COLUMN reputation_tier TEXT DEFAULT 'NEW INNOVATOR';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. EXTRA COLUMNS FOR EXISTING TABLE: public.projects
--    Frontend expects 40+ fields; deployed only has ~10.
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='short_description') THEN
    ALTER TABLE public.projects ADD COLUMN short_description TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='problem_statement') THEN
    ALTER TABLE public.projects ADD COLUMN problem_statement TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='proposed_solution') THEN
    ALTER TABLE public.projects ADD COLUMN proposed_solution TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='target_users') THEN
    ALTER TABLE public.projects ADD COLUMN target_users TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='website_url') THEN
    ALTER TABLE public.projects ADD COLUMN website_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='demo_url') THEN
    ALTER TABLE public.projects ADD COLUMN demo_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='github_url') THEN
    ALTER TABLE public.projects ADD COLUMN github_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='app_store_url') THEN
    ALTER TABLE public.projects ADD COLUMN app_store_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='play_store_url') THEN
    ALTER TABLE public.projects ADD COLUMN play_store_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='valid_reviews_count') THEN
    ALTER TABLE public.projects ADD COLUMN valid_reviews_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='upvotes_count') THEN
    ALTER TABLE public.projects ADD COLUMN upvotes_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='downvotes_count') THEN
    ALTER TABLE public.projects ADD COLUMN downvotes_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='dislikes_count') THEN
    ALTER TABLE public.projects ADD COLUMN dislikes_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='comments_count') THEN
    ALTER TABLE public.projects ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='follows_count') THEN
    ALTER TABLE public.projects ADD COLUMN follows_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='published_at') THEN
    ALTER TABLE public.projects ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='project_stage') THEN
    ALTER TABLE public.projects ADD COLUMN project_stage TEXT DEFAULT 'idea';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='creation_type') THEN
    ALTER TABLE public.projects ADD COLUMN creation_type TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='innovation_type') THEN
    ALTER TABLE public.projects ADD COLUMN innovation_type TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='development_stage') THEN
    ALTER TABLE public.projects ADD COLUMN development_stage TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='launch_status') THEN
    ALTER TABLE public.projects ADD COLUMN launch_status TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='category_name') THEN
    ALTER TABLE public.projects ADD COLUMN category_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='has_live_product') THEN
    ALTER TABLE public.projects ADD COLUMN has_live_product BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='next_community_action') THEN
    ALTER TABLE public.projects ADD COLUMN next_community_action TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='version') THEN
    ALTER TABLE public.projects ADD COLUMN version TEXT DEFAULT '0.1';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='validation_target') THEN
    ALTER TABLE public.projects ADD COLUMN validation_target TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='creator_name') THEN
    ALTER TABLE public.projects ADD COLUMN creator_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='creator_avatar') THEN
    ALTER TABLE public.projects ADD COLUMN creator_avatar TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='tags') THEN
    ALTER TABLE public.projects ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='features') THEN
    ALTER TABLE public.projects ADD COLUMN features TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='images') THEN
    ALTER TABLE public.projects ADD COLUMN images TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. EXTRA COLUMNS FOR EXISTING TABLE: public.reviews
--    NOTE: Frontend uses user_id (not reviewer_id) as FK to profiles/auth.
--    Keep user_id, add all enrichment columns.
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='title') THEN
    ALTER TABLE public.reviews ADD COLUMN title TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='reviewer_name') THEN
    ALTER TABLE public.reviews ADD COLUMN reviewer_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='reviewer_avatar') THEN
    ALTER TABLE public.reviews ADD COLUMN reviewer_avatar TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='helpful_count') THEN
    ALTER TABLE public.reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='review_status') THEN
    ALTER TABLE public.reviews ADD COLUMN review_status TEXT DEFAULT 'PENDING';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='overall_feedback') THEN
    ALTER TABLE public.reviews ADD COLUMN overall_feedback TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='suggestion') THEN
    ALTER TABLE public.reviews ADD COLUMN suggestion TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='problem_relevance') THEN
    ALTER TABLE public.reviews ADD COLUMN problem_relevance TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='updated_at') THEN
    ALTER TABLE public.reviews ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. EXTRA COLUMNS FOR EXISTING TABLE: public.notifications
--    NOTE: project_id/related_project_id/actor_id/sender_id are TEXT
--    (not UUID) because referenced tables use TEXT IDs.
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='title') THEN
    ALTER TABLE public.notifications ADD COLUMN title TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='project_id') THEN
    ALTER TABLE public.notifications ADD COLUMN project_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='related_project_id') THEN
    ALTER TABLE public.notifications ADD COLUMN related_project_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='related_message_id') THEN
    ALTER TABLE public.notifications ADD COLUMN related_message_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='actor_id') THEN
    ALTER TABLE public.notifications ADD COLUMN actor_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='sender_id') THEN
    ALTER TABLE public.notifications ADD COLUMN sender_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='read_at') THEN
    ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='data') THEN
    ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. EXTRA COLUMNS FOR EXISTING TABLE: public.messages
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='conversation_id') THEN
    ALTER TABLE public.messages ADD COLUMN conversation_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='thread_id') THEN
    ALTER TABLE public.messages ADD COLUMN thread_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='parent_id') THEN
    ALTER TABLE public.messages ADD COLUMN parent_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='read_at') THEN
    ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='message_type') THEN
    ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'message';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 6. EXTRA COLUMNS FOR EXISTING TABLE: public.community_posts
--    getCommunityPosts() filters by category_id, post_type.
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='post_type') THEN
    ALTER TABLE public.community_posts ADD COLUMN post_type TEXT DEFAULT 'discussion';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='type') THEN
    ALTER TABLE public.community_posts ADD COLUMN type TEXT DEFAULT 'discussion';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='title') THEN
    ALTER TABLE public.community_posts ADD COLUMN title TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='category') THEN
    ALTER TABLE public.community_posts ADD COLUMN category TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='category_id') THEN
    ALTER TABLE public.community_posts ADD COLUMN category_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='project_id') THEN
    ALTER TABLE public.community_posts ADD COLUMN project_id TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='tags') THEN
    ALTER TABLE public.community_posts ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='upvotes_count') THEN
    ALTER TABLE public.community_posts ADD COLUMN upvotes_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='downvotes_count') THEN
    ALTER TABLE public.community_posts ADD COLUMN downvotes_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='comments_count') THEN
    ALTER TABLE public.community_posts ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='is_published') THEN
    ALTER TABLE public.community_posts ADD COLUMN is_published BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='author_name') THEN
    ALTER TABLE public.community_posts ADD COLUMN author_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='author_avatar') THEN
    ALTER TABLE public.community_posts ADD COLUMN author_avatar TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='updated_at') THEN
    ALTER TABLE public.community_posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- =====================================================================
-- 7. NEW MISSING TABLES
-- ALL FK references are TEXT (NOT UUID) because parent tables (projects,
-- community_posts, etc.) store IDs as TEXT (UUID-shaped strings).
-- =====================================================================

-- 7A. project_follows
CREATE TABLE IF NOT EXISTS public.project_follows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 7B. votes (generic upvote/downvote table for reviews/comments/posts)
CREATE TABLE IF NOT EXISTS public.votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  target_type TEXT NOT NULL,            -- 'review' | 'discussion' | 'resource' | 'comment'
  target_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,              -- 'upvote' | 'downvote'
  user_name TEXT,
  user_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id)
);

-- 7C. community_comments
CREATE TABLE IF NOT EXISTS public.community_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  parent_comment_id TEXT,
  content TEXT NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  upvotes_count INTEGER DEFAULT 0,
  downvotes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7D. community_resources
CREATE TABLE IF NOT EXISTS public.community_resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT,
  resource_type TEXT,                    -- 'article' | 'tool' | 'video' | 'template' | 'other'
  category_id TEXT,
  category_name TEXT,
  tags TEXT[] DEFAULT '{}',
  author_name TEXT,
  author_avatar TEXT,
  upvotes_count INTEGER DEFAULT 0,
  downvotes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7E. external_innovations
CREATE TABLE IF NOT EXISTS public.external_innovations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  source_name TEXT,
  source_domain TEXT,
  source_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_external BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7F. external_sources
CREATE TABLE IF NOT EXISTS public.external_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  url TEXT,
  source_type TEXT,                      -- 'rss' | 'api' | 'scrape' | 'manual'
  category TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7G. user_interests (AuthContext L155-170 uses this)
CREATE TABLE IF NOT EXISTS public.user_interests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

-- 7H. resource_bookmarks (StorageService references this)
CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_type TEXT DEFAULT 'resource',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id, resource_type)
);

-- =====================================================================
-- 8. RLS POLICIES (idempotent where possible)
-- For new tables we enable RLS and install sensible default policies.
-- =====================================================================

DO $$ BEGIN
  ALTER TABLE public.project_follows ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.external_innovations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.external_sources ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =====================================================================
-- 9. DEFAULT PERMISSIVE POLICIES (broadly allow authenticated ops;
--    production can tighten later. Critical: tables are accessible.)
-- =====================================================================

-- project_follows policies
DO $$ BEGIN
  DROP POLICY IF EXISTS project_follows_select_policy ON public.project_follows;
  CREATE POLICY project_follows_select_policy ON public.project_follows
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS project_follows_insert_policy ON public.project_follows;
  CREATE POLICY project_follows_insert_policy ON public.project_follows
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS project_follows_delete_policy ON public.project_follows;
  CREATE POLICY project_follows_delete_policy ON public.project_follows
    FOR DELETE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- votes policies
DO $$ BEGIN
  DROP POLICY IF EXISTS votes_select_policy ON public.votes;
  CREATE POLICY votes_select_policy ON public.votes FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS votes_insert_policy ON public.votes;
  CREATE POLICY votes_insert_policy ON public.votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS votes_update_policy ON public.votes;
  CREATE POLICY votes_update_policy ON public.votes
    FOR UPDATE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS votes_delete_policy ON public.votes;
  CREATE POLICY votes_delete_policy ON public.votes
    FOR DELETE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- community_comments policies
DO $$ BEGIN
  DROP POLICY IF EXISTS community_comments_select_policy ON public.community_comments;
  CREATE POLICY community_comments_select_policy ON public.community_comments
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS community_comments_insert_policy ON public.community_comments;
  CREATE POLICY community_comments_insert_policy ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS community_comments_update_policy ON public.community_comments;
  CREATE POLICY community_comments_update_policy ON public.community_comments
    FOR UPDATE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS community_comments_delete_policy ON public.community_comments;
  CREATE POLICY community_comments_delete_policy ON public.community_comments
    FOR DELETE USING (auth.uid()::text = user_id OR is_deleted = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- community_resources policies
DO $$ BEGIN
  DROP POLICY IF EXISTS community_resources_select_policy ON public.community_resources;
  CREATE POLICY community_resources_select_policy ON public.community_resources
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS community_resources_insert_policy ON public.community_resources;
  CREATE POLICY community_resources_insert_policy ON public.community_resources
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS community_resources_update_policy ON public.community_resources;
  CREATE POLICY community_resources_update_policy ON public.community_resources
    FOR UPDATE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS community_resources_delete_policy ON public.community_resources;
  CREATE POLICY community_resources_delete_policy ON public.community_resources
    FOR DELETE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- external_innovations: read-only to all (admin-only writes)
DO $$ BEGIN
  DROP POLICY IF EXISTS external_innovations_select_policy ON public.external_innovations;
  CREATE POLICY external_innovations_select_policy ON public.external_innovations
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- external_sources: read-only to all
DO $$ BEGIN
  DROP POLICY IF EXISTS external_sources_select_policy ON public.external_sources;
  CREATE POLICY external_sources_select_policy ON public.external_sources
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- user_interests policies
DO $$ BEGIN
  DROP POLICY IF EXISTS user_interests_select_policy ON public.user_interests;
  CREATE POLICY user_interests_select_policy ON public.user_interests
    FOR SELECT USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS user_interests_insert_policy ON public.user_interests;
  CREATE POLICY user_interests_insert_policy ON public.user_interests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS user_interests_delete_policy ON public.user_interests;
  CREATE POLICY user_interests_delete_policy ON public.user_interests
    FOR DELETE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- resource_bookmarks policies
DO $$ BEGIN
  DROP POLICY IF EXISTS resource_bookmarks_select_policy ON public.resource_bookmarks;
  CREATE POLICY resource_bookmarks_select_policy ON public.resource_bookmarks
    FOR SELECT USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS resource_bookmarks_insert_policy ON public.resource_bookmarks;
  CREATE POLICY resource_bookmarks_insert_policy ON public.resource_bookmarks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS resource_bookmarks_delete_policy ON public.resource_bookmarks;
  CREATE POLICY resource_bookmarks_delete_policy ON public.resource_bookmarks
    FOR DELETE USING (auth.uid()::text = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
