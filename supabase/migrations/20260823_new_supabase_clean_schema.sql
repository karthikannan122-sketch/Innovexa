-- ============================================================================
-- INNOVEXA SUPABASE POSTGRESQL MIGRATION — 15 CLEAN TABLES ARCHITECTURE
-- ============================================================================
-- Migration: 20260823_new_supabase_clean_schema.sql
-- Description: Provision 15 clean tables with full RLS, triggers, indexes, and seeds.
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Innovator',
    name TEXT,
    email TEXT,
    avatar_url TEXT DEFAULT '',
    avatar TEXT,
    bio TEXT DEFAULT '',
    headline TEXT DEFAULT '',
    organization TEXT DEFAULT '',
    role TEXT[] DEFAULT ARRAY['I CREATE IDEAS'],
    interests TEXT[] DEFAULT ARRAY['AI & MACHINE LEARNING'],
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
    credits INTEGER DEFAULT 100,
    reputation_score INTEGER DEFAULT 100,
    reputation_tier TEXT DEFAULT 'NEW INNOVATOR',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. User Private Data
CREATE TABLE IF NOT EXISTS public.user_private_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT DEFAULT '',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
    settings JSONB DEFAULT '{"theme": "dark", "auto_save": true}'::jsonb,
    api_keys JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only select their own private data" ON public.user_private_data;
CREATE POLICY "Users can only select their own private data" ON public.user_private_data FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can only insert their own private data" ON public.user_private_data;
CREATE POLICY "Users can only insert their own private data" ON public.user_private_data FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can only update their own private data" ON public.user_private_data;
CREATE POLICY "Users can only update their own private data" ON public.user_private_data FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can only delete their own private data" ON public.user_private_data;
CREATE POLICY "Users can only delete their own private data" ON public.user_private_data FOR DELETE USING (auth.uid() = user_id);

-- User trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Innovator');
    v_avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(v_full_name::bytea, 'escape'));
    INSERT INTO public.profiles (id, full_name, name, email, avatar_url, avatar, onboarding_completed, created_at, updated_at)
    VALUES (NEW.id, v_full_name, v_full_name, NEW.email, v_avatar_url, v_avatar_url, false, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name), avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url), updated_at = NOW();
    INSERT INTO public.user_private_data (user_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'Sparkles',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
CREATE POLICY "Categories are readable by everyone" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Authenticated users can insert categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT ('inno_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL DEFAULT 'Technology',
    title TEXT NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    project_type TEXT DEFAULT 'IDEA',
    creation_type TEXT DEFAULT 'IDEA',
    innovation_type TEXT DEFAULT 'IDEA',
    project_stage TEXT DEFAULT 'idea',
    development_stage TEXT DEFAULT 'CONCEPT',
    status TEXT DEFAULT 'UNDER_VALIDATION',
    launch_status TEXT DEFAULT 'validating',
    problem_statement TEXT NOT NULL DEFAULT '',
    proposed_solution TEXT NOT NULL DEFAULT '',
    target_users TEXT DEFAULT '',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    cover_image TEXT DEFAULT '',
    launch_url TEXT DEFAULT '',
    website_url TEXT DEFAULT '',
    demo_url TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    app_store_url TEXT DEFAULT '',
    play_store_url TEXT DEFAULT '',
    has_live_product BOOLEAN DEFAULT FALSE,
    next_community_action TEXT DEFAULT 'follow',
    validation_target INTEGER DEFAULT 10,
    valid_reviews_count INTEGER DEFAULT 0,
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- 5. Project Votes
CREATE TABLE IF NOT EXISTS public.project_votes (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_project_vote UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_votes_project_id ON public.project_votes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_votes_user_id ON public.project_votes(user_id);
ALTER TABLE public.project_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project votes are viewable by everyone" ON public.project_votes;
CREATE POLICY "Project votes are viewable by everyone" ON public.project_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can vote on projects" ON public.project_votes;
CREATE POLICY "Users can vote on projects" ON public.project_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can change their project vote" ON public.project_votes;
CREATE POLICY "Users can change their project vote" ON public.project_votes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their project vote" ON public.project_votes;
CREATE POLICY "Users can delete their project vote" ON public.project_votes FOR DELETE USING (auth.uid() = user_id);

-- Sync project vote trigger
CREATE OR REPLACE FUNCTION public.handle_project_vote_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE public.projects SET upvotes_count = COALESCE(upvotes_count, 0) + 1, updated_at = NOW() WHERE id = NEW.project_id;
        ELSIF NEW.vote_type = 'downvote' THEN
            UPDATE public.projects SET downvotes_count = COALESCE(downvotes_count, 0) + 1, updated_at = NOW() WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type != NEW.vote_type THEN
            IF OLD.vote_type = 'upvote' THEN
                UPDATE public.projects SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1) WHERE id = OLD.project_id;
            ELSIF OLD.vote_type = 'downvote' THEN
                UPDATE public.projects SET downvotes_count = GREATEST(0, COALESCE(downvotes_count, 1) - 1) WHERE id = OLD.project_id;
            END IF;
            IF NEW.vote_type = 'upvote' THEN
                UPDATE public.projects SET upvotes_count = COALESCE(upvotes_count, 0) + 1, updated_at = NOW() WHERE id = NEW.project_id;
            ELSIF NEW.vote_type = 'downvote' THEN
                UPDATE public.projects SET downvotes_count = COALESCE(downvotes_count, 0) + 1, updated_at = NOW() WHERE id = NEW.project_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE public.projects SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1), updated_at = NOW() WHERE id = OLD.project_id;
        ELSIF OLD.vote_type = 'downvote' THEN
            UPDATE public.projects SET downvotes_count = GREATEST(0, COALESCE(downvotes_count, 1) - 1), updated_at = NOW() WHERE id = OLD.project_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_project_vote_sync ON public.project_votes;
CREATE TRIGGER on_project_vote_sync AFTER INSERT OR UPDATE OR DELETE ON public.project_votes FOR EACH ROW EXECUTE FUNCTION public.handle_project_vote_sync();

-- 6. Project Suggestions
CREATE TABLE IF NOT EXISTS public.project_suggestions (
    id TEXT PRIMARY KEY DEFAULT ('sug_' || replace(gen_random_uuid()::text, '-', '')),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected', 'implemented')),
    upvotes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_suggestions_project_id ON public.project_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_suggestions_user_id ON public.project_suggestions(user_id);
ALTER TABLE public.project_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project suggestions are viewable by everyone" ON public.project_suggestions;
CREATE POLICY "Project suggestions are viewable by everyone" ON public.project_suggestions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can submit project suggestions" ON public.project_suggestions;
CREATE POLICY "Users can submit project suggestions" ON public.project_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users and project owners can update suggestions" ON public.project_suggestions;
CREATE POLICY "Users and project owners can update suggestions" ON public.project_suggestions FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.projects WHERE id = project_id));
DROP POLICY IF EXISTS "Users can delete their own suggestions" ON public.project_suggestions;
CREATE POLICY "Users can delete their own suggestions" ON public.project_suggestions FOR DELETE USING (auth.uid() = user_id);

-- 7. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev_' || replace(gen_random_uuid()::text, '-', '')),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_relevance TEXT NOT NULL DEFAULT 'YES',
    relevance_answer TEXT DEFAULT 'YES',
    would_use TEXT NOT NULL DEFAULT 'YES',
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    overall_feedback TEXT NOT NULL,
    suggestion TEXT DEFAULT '',
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_reviewer_project UNIQUE (project_id, reviewer_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON public.reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can submit reviews" ON public.reviews;
CREATE POLICY "Users can submit reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "Users can update their reviews" ON public.reviews;
CREATE POLICY "Users can update their reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "Users can delete their reviews" ON public.reviews;
CREATE POLICY "Users can delete their reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Review sync trigger
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects SET valid_reviews_count = COALESCE(valid_reviews_count, 0) + 1, updated_at = NOW() WHERE id = NEW.project_id;
    UPDATE public.profiles SET credits = COALESCE(credits, 0) + 10, reputation_score = COALESCE(reputation_score, 0) + 10, updated_at = NOW() WHERE id = NEW.reviewer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_new_review();

-- 8. Review Suggestions
CREATE TABLE IF NOT EXISTS public.review_suggestions (
    id TEXT PRIMARY KEY DEFAULT ('revsug_' || replace(gen_random_uuid()::text, '-', '')),
    review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'applied', 'acknowledged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_suggestions_review_id ON public.review_suggestions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_suggestions_user_id ON public.review_suggestions(user_id);
ALTER TABLE public.review_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review suggestions are viewable by everyone" ON public.review_suggestions;
CREATE POLICY "Review suggestions are viewable by everyone" ON public.review_suggestions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can submit review suggestions" ON public.review_suggestions;
CREATE POLICY "Users can submit review suggestions" ON public.review_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their review suggestions" ON public.review_suggestions;
CREATE POLICY "Users can update their review suggestions" ON public.review_suggestions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their review suggestions" ON public.review_suggestions;
CREATE POLICY "Users can delete their review suggestions" ON public.review_suggestions FOR DELETE USING (auth.uid() = user_id);

-- 9. Review Votes
CREATE TABLE IF NOT EXISTS public.review_votes (
    id BIGSERIAL PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'helpful')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_review_vote UNIQUE (review_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Review votes are viewable by everyone" ON public.review_votes;
CREATE POLICY "Review votes are viewable by everyone" ON public.review_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can vote on reviews" ON public.review_votes;
CREATE POLICY "Users can vote on reviews" ON public.review_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their review vote" ON public.review_votes;
CREATE POLICY "Users can update their review vote" ON public.review_votes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their review vote" ON public.review_votes;
CREATE POLICY "Users can delete their review vote" ON public.review_votes FOR DELETE USING (auth.uid() = user_id);

-- Sync review vote trigger
CREATE OR REPLACE FUNCTION public.handle_review_vote_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type IN ('upvote', 'helpful') THEN
            UPDATE public.reviews SET upvotes_count = COALESCE(upvotes_count, 0) + 1, updated_at = NOW() WHERE id = NEW.review_id;
        ELSIF NEW.vote_type = 'downvote' THEN
            UPDATE public.reviews SET downvotes_count = COALESCE(downvotes_count, 0) + 1, updated_at = NOW() WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type IN ('upvote', 'helpful') THEN
            UPDATE public.reviews SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1), updated_at = NOW() WHERE id = OLD.review_id;
        ELSIF OLD.vote_type = 'downvote' THEN
            UPDATE public.reviews SET downvotes_count = GREATEST(0, COALESCE(downvotes_count, 1) - 1), updated_at = NOW() WHERE id = OLD.review_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_review_vote_sync ON public.review_votes;
CREATE TRIGGER on_review_vote_sync AFTER INSERT OR DELETE ON public.review_votes FOR EACH ROW EXECUTE FUNCTION public.handle_review_vote_sync();

-- 10. Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id TEXT PRIMARY KEY DEFAULT ('post_' || replace(gen_random_uuid()::text, '-', '')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL DEFAULT 'Technology',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'DISCUSSION' CHECK (post_type IN ('QUESTION', 'DISCUSSION', 'FEEDBACK_REQUEST', 'COLLABORATION', 'CHALLENGE')),
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
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Community posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;
CREATE POLICY "Users can delete their own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- 11. Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
    id TEXT PRIMARY KEY DEFAULT ('comm_' || replace(gen_random_uuid()::text, '-', '')),
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
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON public.community_comments(parent_comment_id);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Community comments are viewable by everyone" ON public.community_comments;
CREATE POLICY "Community comments are viewable by everyone" ON public.community_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create community comments" ON public.community_comments;
CREATE POLICY "Authenticated users can create community comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own community comments" ON public.community_comments;
CREATE POLICY "Users can update their own community comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own community comments" ON public.community_comments;
CREATE POLICY "Users can delete their own community comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);

-- Sync comment count trigger
CREATE OR REPLACE FUNCTION public.handle_community_comment_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts SET comments_count = COALESCE(comments_count, 0) + 1, updated_at = NOW() WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts SET comments_count = GREATEST(0, COALESCE(comments_count, 1) - 1), updated_at = NOW() WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_community_comment_sync ON public.community_comments;
CREATE TRIGGER on_community_comment_sync AFTER INSERT OR DELETE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.handle_community_comment_sync();

-- 12. Community Votes
CREATE TABLE IF NOT EXISTS public.community_votes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_community_vote UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_community_votes_target ON public.community_votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_user_id ON public.community_votes(user_id);
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Community votes are viewable by everyone" ON public.community_votes;
CREATE POLICY "Community votes are viewable by everyone" ON public.community_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can vote on community items" ON public.community_votes;
CREATE POLICY "Users can vote on community items" ON public.community_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their community vote" ON public.community_votes;
CREATE POLICY "Users can update their community vote" ON public.community_votes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their community vote" ON public.community_votes;
CREATE POLICY "Users can delete their community vote" ON public.community_votes FOR DELETE USING (auth.uid() = user_id);

-- Sync community vote trigger
CREATE OR REPLACE FUNCTION public.handle_community_vote_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'post' THEN
            IF NEW.vote_type = 'upvote' THEN
                UPDATE public.community_posts SET upvotes_count = COALESCE(upvotes_count, 0) + 1 WHERE id = NEW.target_id;
            ELSE
                UPDATE public.community_posts SET downvotes_count = COALESCE(downvotes_count, 0) + 1 WHERE id = NEW.target_id;
            END IF;
        ELSIF NEW.target_type = 'comment' THEN
            IF NEW.vote_type = 'upvote' THEN
                UPDATE public.community_comments SET upvotes_count = COALESCE(upvotes_count, 0) + 1 WHERE id = NEW.target_id;
            ELSE
                UPDATE public.community_comments SET downvotes_count = COALESCE(downvotes_count, 0) + 1 WHERE id = NEW.target_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'post' THEN
            IF OLD.vote_type = 'upvote' THEN
                UPDATE public.community_posts SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1) WHERE id = OLD.target_id;
            ELSE
                UPDATE public.community_posts SET downvotes_count = GREATEST(0, COALESCE(downvotes_count, 1) - 1) WHERE id = OLD.target_id;
            END IF;
        ELSIF OLD.target_type = 'comment' THEN
            IF OLD.vote_type = 'upvote' THEN
                UPDATE public.community_comments SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 1) - 1) WHERE id = OLD.target_id;
            ELSE
                UPDATE public.community_comments SET downvotes_count = GREATEST(0, COALESCE(downvotes_count, 1) - 1) WHERE id = OLD.target_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_community_vote_sync ON public.community_votes;
CREATE TRIGGER on_community_vote_sync AFTER INSERT OR DELETE ON public.community_votes FOR EACH ROW EXECUTE FUNCTION public.handle_community_vote_sync();

-- 13. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'message',
    related_project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Messages viewable by sender or receiver" ON public.messages;
CREATE POLICY "Messages viewable by sender or receiver" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
CREATE POLICY "Participants can update messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Senders can delete their messages" ON public.messages;
CREATE POLICY "Senders can delete their messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Notification',
    message TEXT NOT NULL,
    related_project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    related_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;
CREATE POLICY "Users can delete their notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- 15. Project Follows
CREATE TABLE IF NOT EXISTS public.project_follows (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_project_follow UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_follows_project_id ON public.project_follows(project_id);
CREATE INDEX IF NOT EXISTS idx_project_follows_user_id ON public.project_follows(user_id);
ALTER TABLE public.project_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project follows are viewable by everyone" ON public.project_follows;
CREATE POLICY "Project follows are viewable by everyone" ON public.project_follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow projects" ON public.project_follows;
CREATE POLICY "Users can follow projects" ON public.project_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unfollow projects" ON public.project_follows;
CREATE POLICY "Users can unfollow projects" ON public.project_follows FOR DELETE USING (auth.uid() = user_id);

-- Seed Default Categories
INSERT INTO public.categories (id, name, slug, description, icon) VALUES
('93fe2938-c843-4fa4-8b01-b07d59990023', 'Technology', 'technology', 'Technology, software, cloud and hardware innovations', 'Cpu'),
('9dbbcd45-778e-411c-92cc-debee85d7137', 'Education', 'education', 'EdTech, learning platforms, and skill development solutions', 'GraduationCap'),
('19b552c7-2ed6-44fe-9846-5d1501b1104f', 'Healthcare', 'healthcare', 'Digital health, medical devices, wellness, and biotech', 'HeartPulse'),
('e6fa521c-f84c-42f6-9c7d-88447ee259cc', 'Business', 'business', 'Enterprise tools, B2B SaaS, operations, and commerce', 'Briefcase'),
('913ce065-82bd-4101-a508-22bf41eaf0d5', 'Environment', 'environment', 'Clean tech, conservation, renewable energy, and climate solutions', 'Leaf'),
('3d3d928f-2a11-4639-83d5-865730960135', 'Social Impact', 'social-impact', 'Civic tech, accessibility, and community impact initiatives', 'Users'),
('4314f823-fb81-4a31-aec0-5e1d97aaeb9e', 'Artificial Intelligence', 'artificial-intelligence', 'Generative AI, neural models, robotics, and agentic systems', 'BrainCircuit'),
('01f81a37-e7f2-4f7d-957e-8e37f1418670', 'Cybersecurity', 'cybersecurity', 'Security, zero-trust, identity, cryptography, and privacy', 'ShieldCheck'),
('6988000f-f521-4e61-af1c-523263a53ad2', 'Sustainability', 'sustainability', 'Circular economy, waste reduction, and sustainable living', 'Recycle'),
('7dcfed5c-7406-4d4a-b9ee-d3c09e667ae9', 'Finance', 'finance', 'FinTech, decentralized finance, investing, and accounting', 'Coins'),
('198af608-fb9b-42c3-a7fa-83ffbd3dd392', 'Productivity', 'productivity', 'Workflow automation, developer tooling, and collaboration', 'Zap'),
('a1ed5bda-732a-46db-8e9f-303ca31a8f29', 'Other', 'other', 'Cross-domain and emerging creative innovations', 'Sparkles')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, icon = EXCLUDED.icon;
