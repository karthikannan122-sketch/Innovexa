-- ============================================================================
-- INNOVEXA SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to provision all tables, 
-- constraints, foreign keys, RLS security rules, and real-time triggers.

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    bio TEXT DEFAULT '',
    headline TEXT DEFAULT '',
    organization TEXT DEFAULT '',
    role TEXT[] DEFAULT ARRAY['I CREATE IDEAS'],
    interests TEXT[] DEFAULT ARRAY['AI & MACHINE LEARNING'],
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    credits INTEGER DEFAULT 100,
    reputation_score INTEGER DEFAULT 100,
    reputation_tier TEXT DEFAULT 'NEW INNOVATOR',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#E76F82',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
CREATE POLICY "Categories are readable by everyone" 
ON public.categories FOR SELECT 
USING (true);

-- Seed Categories
INSERT INTO public.categories (id, name, description, color, icon) VALUES
('cat_ai', 'AI & Machine Learning', 'Neural networks, autonomous agents, computer vision, and foundation models.', '#7186D8', 'Cpu'),
('cat_health', 'Healthcare & Biotech', 'Clinical diagnostics, medical hardware, longevity, and telemetry therapeutics.', '#E76F82', 'HeartPulse'),
('cat_web', 'Web Technology', 'Distributed systems, browsers, high-performance UI frameworks, and protocols.', '#58B8AD', 'Globe'),
('cat_design', 'Design & Creative Tools', 'Generative media, UX engines, 3D design platforms, and vector suites.', '#69B89A', 'Palette'),
('cat_productivity', 'Productivity & Work', 'Workflow automation, knowledge graphs, and distributed collaboration.', '#9B8AE5', 'Sparkles'),
('cat_security', 'Cybersecurity', 'Zero-knowledge proofs, privacy protocols, and automated threat defense.', '#E9B45B', 'ShieldCheck')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. PROJECTS / INNOVATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT ('inno_' || replace(uuid_generate_v4()::text, '-', '')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id),
    category_name TEXT NOT NULL,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT,
    project_type TEXT DEFAULT 'IDEA', -- 'IDEA' | 'PRODUCT' | 'STARTUP'
    creation_type TEXT DEFAULT 'IDEA', -- 'IDEA' | 'PRODUCT' | 'STARTUP'
    innovation_type TEXT DEFAULT 'IDEA',
    project_stage TEXT DEFAULT 'idea', -- 'idea' | 'prototype' | 'mvp' | 'beta' | 'live'
    development_stage TEXT DEFAULT 'CONCEPT',
    status TEXT DEFAULT 'UNDER_VALIDATION', -- 'DRAFT' | 'UNDER_VALIDATION' | 'VALIDATION_COMPLETE' | 'PUBLISHED'
    launch_status TEXT DEFAULT 'validating', -- 'draft' | 'validating' | 'improving' | 'ready_to_launch' | 'published'
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    target_users TEXT,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    cover_image TEXT,
    
    -- Launch & Destination URLs
    launch_url TEXT,
    website_url TEXT,
    demo_url TEXT,
    github_url TEXT,
    app_store_url TEXT,
    play_store_url TEXT,
    has_live_product BOOLEAN DEFAULT FALSE,
    next_community_action TEXT DEFAULT 'follow',
    
    validation_target INTEGER DEFAULT 10,
    valid_reviews_count INTEGER DEFAULT 0,
    upvotes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup & filtering
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone" 
ON public.projects FOR SELECT 
USING (status != 'DRAFT' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own projects" ON public.projects;
CREATE POLICY "Users can only update their own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own projects" ON public.projects;
CREATE POLICY "Users can only delete their own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 4. REVIEWS TABLE (8 Core Fields + Constraints)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev_' || replace(uuid_generate_v4()::text, '-', '')),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relevance_answer TEXT,           -- 'YES' | 'NO' | 'MAYBE'
    problem_relevance TEXT NOT NULL, -- 'YES' | 'MAYBE' | 'NOT YET'
    would_use TEXT NOT NULL,         -- 'YES' | 'NO'
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    overall_feedback TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: Prevent duplicate review per user-project, prevent self-review
    CONSTRAINT unique_reviewer_project UNIQUE (project_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON public.reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert reviews (excluding their own projects)" ON public.reviews;
CREATE POLICY "Users can insert reviews (excluding their own projects)" 
ON public.reviews FOR INSERT 
WITH CHECK (
    auth.uid() = reviewer_id AND 
    auth.uid() != (SELECT user_id FROM public.projects WHERE id = project_id)
);

DROP POLICY IF EXISTS "Users can update their own review" ON public.reviews;
CREATE POLICY "Users can update their own review" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

-- Trigger: Automatically increment project review count on review insert
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects
    SET valid_reviews_count = valid_reviews_count + 1,
        updated_at = NOW()
    WHERE id = NEW.project_id;
    
    -- Award +10 points to reviewer
    UPDATE public.profiles
    SET credits = credits + 10,
        reputation_score = reputation_score + 10
    WHERE id = NEW.reviewer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_new_review();

-- ============================================================================
-- 5. COMMENTS & COMMUNITY DISCUSSION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY DEFAULT ('comm_' || replace(uuid_generate_v4()::text, '-', '')),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id TEXT REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;
CREATE POLICY "Authenticated users can post comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. PROJECT LIKES & UPVOTES (public.project_likes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_likes (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Innovator',
    user_avatar TEXT DEFAULT '',
    vote_type TEXT DEFAULT 'upvote',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_project_like UNIQUE (project_id, user_id)
);

-- Ensure columns exist if table was created previously
ALTER TABLE public.project_likes ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT 'Innovator';
ALTER TABLE public.project_likes ADD COLUMN IF NOT EXISTS user_avatar TEXT DEFAULT '';
ALTER TABLE public.project_likes ADD COLUMN IF NOT EXISTS vote_type TEXT DEFAULT 'upvote';

CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON public.project_likes(user_id);

ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project likes viewable by everyone" ON public.project_likes;
CREATE POLICY "Project likes viewable by everyone" 
ON public.project_likes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Project likes insertable by everyone" ON public.project_likes;
CREATE POLICY "Project likes insertable by everyone" 
ON public.project_likes FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Project likes updatable by everyone" ON public.project_likes;
CREATE POLICY "Project likes updatable by everyone" 
ON public.project_likes FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Project likes deletable by everyone" ON public.project_likes;
CREATE POLICY "Project likes deletable by everyone" 
ON public.project_likes FOR DELETE 
USING (true);

-- Auto-sync projects.upvotes_count trigger on project_likes change
CREATE OR REPLACE FUNCTION public.handle_project_like_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects
        SET upvotes_count = COALESCE(upvotes_count, 0) + 1
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects
        SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1)
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_like_change ON public.project_likes;
CREATE TRIGGER on_project_like_change
AFTER INSERT OR DELETE ON public.project_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_project_like_sync();

-- Also support upvotes as alias table if needed
CREATE TABLE IF NOT EXISTS public.upvotes (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Innovator',
    user_avatar TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_project_upvote UNIQUE (project_id, user_id)
);

ALTER TABLE public.upvotes ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT 'Innovator';
ALTER TABLE public.upvotes ADD COLUMN IF NOT EXISTS user_avatar TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_upvotes_project_id ON public.upvotes(project_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user_id ON public.upvotes(user_id);

ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Upvotes viewable by everyone" ON public.upvotes;
CREATE POLICY "Upvotes viewable by everyone" 
ON public.upvotes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Upvotes insertable by everyone" ON public.upvotes;
CREATE POLICY "Upvotes insertable by everyone" 
ON public.upvotes FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Upvotes deletable by everyone" ON public.upvotes;
CREATE POLICY "Upvotes deletable by everyone" 
ON public.upvotes FOR DELETE 
USING (true);

-- ============================================================================
-- 7. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif_' || replace(uuid_generate_v4()::text, '-', '')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Notification',
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'REVIEW_RECEIVED' | 'PROJECT_LIKED' | 'MILESTONE_REACHED' | 'ASSIGNMENT'
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own notifications" ON public.notifications;
CREATE POLICY "Users can only see their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 8. STORAGE BUCKET POLICIES (for Images & Media)
-- ============================================================================
-- Creates 'project-media' and 'avatars' buckets in Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public viewable
DROP POLICY IF EXISTS "Public Media Access" ON storage.objects;
CREATE POLICY "Public Media Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('project-media', 'avatars'));

-- Storage Policy: Authenticated Uploads
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
CREATE POLICY "Authenticated Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 9. EXTERNAL INNOVATION DISCOVERIES TABLE (Innovation Discovery Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.external_innovations (
    id TEXT PRIMARY KEY DEFAULT ('ext_' || replace(uuid_generate_v4()::text, '-', '')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    ai_summary TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'Technology',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    content_hash TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for fast searching, filtering, and deduplication
CREATE INDEX IF NOT EXISTS idx_external_innovations_category ON public.external_innovations(category);
CREATE INDEX IF NOT EXISTS idx_external_innovations_published ON public.external_innovations(published_at);
CREATE INDEX IF NOT EXISTS idx_external_innovations_hash ON public.external_innovations(content_hash);
CREATE INDEX IF NOT EXISTS idx_external_innovations_active ON public.external_innovations(is_active);

-- Enable RLS for external_innovations
ALTER TABLE public.external_innovations ENABLE ROW LEVEL SECURITY;

-- Read Access: All users (authenticated and public) can view active discoveries
DROP POLICY IF EXISTS "External innovations are viewable by everyone" ON public.external_innovations;
CREATE POLICY "External innovations are viewable by everyone" 
ON public.external_innovations FOR SELECT 
USING (is_active = true);

-- Interaction Access: Authenticated users can update like/view counts
DROP POLICY IF EXISTS "Authenticated users can update discovery interaction counts" ON public.external_innovations;
CREATE POLICY "Authenticated users can update discovery interaction counts" 
ON public.external_innovations FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Write/Delete Access: Backend service role only
DROP POLICY IF EXISTS "Service role manages external innovations" ON public.external_innovations;
CREATE POLICY "Service role manages external innovations" 
ON public.external_innovations FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ============================================================================
-- 10. EXTERNAL DISCOVERY SOURCES (Telemetry & Governance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.external_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    feed_type TEXT DEFAULT 'RSS', -- 'RSS' | 'API' | 'ATOM'
    category_hint TEXT DEFAULT 'Technology',
    is_enabled BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMPTZ,
    last_status TEXT DEFAULT 'IDLE', -- 'SUCCESS' | 'ERROR' | 'IDLE'
    last_error TEXT,
    items_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.external_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "External sources viewable by everyone" ON public.external_sources;
CREATE POLICY "External sources viewable by everyone" 
ON public.external_sources FOR SELECT 
USING (true);

-- Seed Approved Global Innovation Feeds
INSERT INTO public.external_sources (id, name, url, feed_type, category_hint, is_enabled) VALUES
('src_techcrunch', 'TechCrunch', 'https://techcrunch.com/feed/', 'RSS', 'AI & Machine Learning', true),
('src_sciencedaily_ai', 'ScienceDaily AI', 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml', 'RSS', 'AI & Machine Learning', true),
('src_sciencedaily_tech', 'ScienceDaily Tech', 'https://www.sciencedaily.com/rss/matter_energy/technology.xml', 'RSS', 'Web Technology', true),
('src_arxiv_ai', 'ArXiv AI & ML', 'https://rss.arxiv.org/rss/cs.AI', 'RSS', 'AI & Machine Learning', true),
('src_hackernews', 'Hacker News Top Innovations', 'https://hacker-news.firebaseio.com/v0/topstories.json', 'API', 'Web Technology', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. UNIFIED VOTES TABLE (Reviews, Discussions, Comments, Resources)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.votes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'review' | 'discussion' | 'comment' | 'resource'
    target_id TEXT NOT NULL,
    vote_type TEXT NOT NULL,   -- 'upvote' | 'downvote'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_target_vote UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_target ON public.votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes viewable by everyone" ON public.votes;
CREATE POLICY "Votes viewable by everyone" 
ON public.votes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes" ON public.votes;
CREATE POLICY "Users can insert their own votes" 
ON public.votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
CREATE POLICY "Users can update their own votes" 
ON public.votes FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;
CREATE POLICY "Users can delete their own votes" 
ON public.votes FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 12. COMMUNITY DISCUSSIONS / POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
    id TEXT PRIMARY KEY DEFAULT ('post_' || replace(uuid_generate_v4()::text, '-', '')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'DISCUSSION', -- 'QUESTION' | 'DISCUSSION' | 'FEEDBACK_REQUEST' | 'COLLABORATION' | 'CHALLENGE'
    category_id TEXT REFERENCES public.categories(id),
    category_name TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type ON public.community_posts(post_type);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community posts viewable by everyone" ON public.community_posts;
CREATE POLICY "Community posts viewable by everyone" 
ON public.community_posts FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts" 
ON public.community_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts" 
ON public.community_posts FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;
CREATE POLICY "Users can delete their own posts" 
ON public.community_posts FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 13. COMMUNITY POST COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_comments (
    id TEXT PRIMARY KEY DEFAULT ('comm_' || replace(uuid_generate_v4()::text, '-', '')),
    post_id TEXT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id TEXT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community comments viewable by everyone" ON public.community_comments;
CREATE POLICY "Community comments viewable by everyone" 
ON public.community_comments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create community comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create community comments" 
ON public.community_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own community comments" ON public.community_comments;
CREATE POLICY "Users can update their own community comments" 
ON public.community_comments FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own community comments" ON public.community_comments;
CREATE POLICY "Users can delete their own community comments" 
ON public.community_comments FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 14. COMMUNITY RESOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_resources (
    id TEXT PRIMARY KEY DEFAULT ('res_' || replace(uuid_generate_v4()::text, '-', '')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    resource_url TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'TOOL', -- 'TOOL' | 'ARTICLE' | 'RESEARCH' | 'GITHUB' | 'API' | 'DATASET' | 'VIDEO' | 'COURSE' | 'OTHER'
    category_id TEXT REFERENCES public.categories(id),
    category_name TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_resources_user_id ON public.community_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_category_id ON public.community_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_type ON public.community_resources(resource_type);

ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community resources viewable by everyone" ON public.community_resources;
CREATE POLICY "Community resources viewable by everyone" 
ON public.community_resources FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can share resources" ON public.community_resources;
CREATE POLICY "Authenticated users can share resources" 
ON public.community_resources FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own shared resources" ON public.community_resources;
CREATE POLICY "Users can update their own shared resources" 
ON public.community_resources FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own shared resources" ON public.community_resources;
CREATE POLICY "Users can delete their own shared resources" 
ON public.community_resources FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 15. RESOURCE BOOKMARKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES public.community_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_resource_bookmark UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user_id ON public.resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_res_id ON public.resource_bookmarks(resource_id);

ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resource bookmarks viewable by everyone" ON public.resource_bookmarks;
CREATE POLICY "Resource bookmarks viewable by everyone" 
ON public.resource_bookmarks FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.resource_bookmarks;
CREATE POLICY "Users can insert their own bookmarks" 
ON public.resource_bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.resource_bookmarks;
CREATE POLICY "Users can delete their own bookmarks" 
ON public.resource_bookmarks FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 16. PRIVATE MESSAGES & SUGGESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'message', -- 'message' | 'suggestion'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages viewable only by sender or receiver" ON public.messages;
CREATE POLICY "Messages viewable only by sender or receiver"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert messages as sender" ON public.messages;
CREATE POLICY "Users can insert messages as sender"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Senders can delete their own messages" ON public.messages;
CREATE POLICY "Senders can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================================================
-- 17. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'MESSAGE' | 'SUGGESTION' | 'REVIEW' | 'LIKE' | 'SYSTEM'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    related_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications viewable only by recipient" ON public.notifications;
CREATE POLICY "Notifications viewable only by recipient"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Recipients can update their notifications" ON public.notifications;
CREATE POLICY "Recipients can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Recipients can delete their notifications" ON public.notifications;
CREATE POLICY "Recipients can delete their notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);


