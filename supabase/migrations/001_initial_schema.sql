-- =====================================================
-- Carbonac Database Schema
-- Supabase PostgreSQL Migration
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PROFILES TABLE
-- Extended user information linked to auth.users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company TEXT,
    job_title TEXT,
    
    -- Subscription & billing
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
    stripe_customer_id TEXT,
    subscription_expires_at TIMESTAMPTZ,
    
    -- Usage limits (per month)
    monthly_conversions_limit INTEGER DEFAULT 10,
    monthly_storage_limit_mb INTEGER DEFAULT 100,
    
    -- Preferences
    preferred_engine TEXT DEFAULT 'typst' CHECK (preferred_engine IN ('typst', 'quarto', 'both')),
    preferred_theme TEXT DEFAULT 'white' CHECK (preferred_theme IN ('white', 'g10', 'g90', 'g100')),
    email_notifications BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTS TABLE
-- User uploaded/created documents
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Document info
    title TEXT NOT NULL,
    description TEXT,
    original_filename TEXT,
    original_file_type TEXT, -- pdf, docx, md, txt, etc.
    original_file_path TEXT, -- Supabase storage path
    original_file_size INTEGER, -- bytes
    
    -- Converted content
    markdown_content TEXT,
    markdown_file_path TEXT,
    
    -- Wizard settings
    wizard_answers JSONB DEFAULT '{}',
    report_settings JSONB DEFAULT '{}',
    
    -- Metadata
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    page_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'error', 'archived')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_converted_at TIMESTAMPTZ
);

-- =====================================================
-- CONVERSIONS TABLE
-- PDF conversion history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Conversion details
    engine TEXT NOT NULL CHECK (engine IN ('typst', 'quarto')),
    template TEXT NOT NULL,
    theme TEXT DEFAULT 'white',
    
    -- Output
    output_file_path TEXT,
    output_file_size INTEGER,
    output_page_count INTEGER,
    
    -- Processing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    processing_time_ms INTEGER,
    
    -- Settings used
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- USAGE_STATS TABLE
-- Track user usage for billing
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Current billing period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Counts
    conversions_count INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    storage_used_mb DECIMAL(10, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One record per user per billing period
    UNIQUE(user_id, period_start)
);

-- =====================================================
-- TEMPLATES TABLE
-- Custom user templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system templates
    
    -- Template info
    name TEXT NOT NULL,
    description TEXT,
    engine TEXT NOT NULL CHECK (engine IN ('typst', 'quarto')),
    
    -- Template content
    content TEXT NOT NULL, -- Template file content
    preview_image_url TEXT,
    
    -- Classification
    is_system BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    
    -- Usage count
    use_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversions_document_id ON public.conversions(document_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_period ON public.usage_stats(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public) WHERE is_public = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Documents: Users can only access their own documents
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Conversions: Users can only access their own conversions
CREATE POLICY "Users can view own conversions" ON public.conversions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversions" ON public.conversions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversions" ON public.conversions
    FOR UPDATE USING (auth.uid() = user_id);

-- Usage stats: Users can only view their own stats
CREATE POLICY "Users can view own usage stats" ON public.usage_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Templates: Users can view public templates and their own
CREATE POLICY "Users can view public templates" ON public.templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Initialize usage stats for current month
    INSERT INTO public.usage_stats (user_id, period_start, period_end)
    VALUES (
        NEW.id,
        date_trunc('month', NOW()),
        date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_usage_stats_updated_at
    BEFORE UPDATE ON public.usage_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to increment conversion count
CREATE OR REPLACE FUNCTION public.increment_conversion_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage stats
    UPDATE public.usage_stats
    SET conversions_count = conversions_count + 1
    WHERE user_id = NEW.user_id
        AND period_start <= NOW()
        AND period_end >= NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_conversion_created
    AFTER INSERT ON public.conversions
    FOR EACH ROW EXECUTE FUNCTION public.increment_conversion_count();

-- =====================================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- =====================================================
-- These need to be created via Supabase dashboard or API:
-- 
-- 1. documents - for original uploaded files
--    - Private bucket
--    - Max file size: 50MB
--    - Allowed types: pdf, doc, docx, txt, md, rtf, odt
--
-- 2. pdfs - for converted PDF outputs
--    - Private bucket
--    - Max file size: 100MB
--    - Allowed types: pdf
--
-- 3. avatars - for user profile pictures
--    - Public bucket
--    - Max file size: 5MB
--    - Allowed types: jpg, jpeg, png, gif, webp
