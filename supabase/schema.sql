-- VCBS Social Listening Dashboard - Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. BRANDS TABLE
-- ============================================
CREATE TABLE public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default brands
INSERT INTO public.brands (name, display_name) VALUES
    ('VCBS', 'VCBS - Chứng khoán Vietcombank'),
    ('SSI', 'SSI - Chứng khoán SSI'),
    ('VNDIRECT', 'VNDirect');

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brands" ON public.brands
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- 3. UPLOAD_HISTORY TABLE
-- ============================================
CREATE TABLE public.upload_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    records_count INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins only
CREATE POLICY "Admins can manage upload history" ON public.upload_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 4. MENTIONS TABLE (Main data table)
-- ============================================
CREATE TABLE public.mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Thông tin thương hiệu
    brand TEXT NOT NULL DEFAULT 'VCBS',

    -- Thông tin kênh & nguồn
    channel TEXT NOT NULL CHECK (channel IN ('Báo mạng', 'Facebook', 'Youtube', 'Tiktok')),
    source_name TEXT,
    source_url TEXT,

    -- Thời gian
    published_date DATE NOT NULL,

    -- Nội dung
    title TEXT,
    content TEXT NOT NULL,
    original_type TEXT,

    -- Metrics từ Excel
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,

    -- Giá trị truyền thông
    ad_cost DECIMAL(15,2),
    prominence_level TEXT,
    media_value DECIMAL(15,2),

    -- AI Classification
    category TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('Tin tức thị trường', 'Bán hàng/Môi giới', 'Tin trực tiếp về thương hiệu')),
    sentiment TEXT NOT NULL CHECK (sentiment IN ('Tích cực', 'Tiêu cực', 'Trung tính')),
    ai_summary TEXT,

    -- Metadata
    upload_batch_id UUID REFERENCES public.upload_history(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mentions_brand ON public.mentions(brand);
CREATE INDEX idx_mentions_channel ON public.mentions(channel);
CREATE INDEX idx_mentions_sentiment ON public.mentions(sentiment);
CREATE INDEX idx_mentions_content_type ON public.mentions(content_type);
CREATE INDEX idx_mentions_category ON public.mentions(category);
CREATE INDEX idx_mentions_published_date ON public.mentions(published_date);
CREATE INDEX idx_mentions_brand_date ON public.mentions(brand, published_date);

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can read mentions" ON public.mentions
    FOR SELECT TO authenticated USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage mentions" ON public.mentions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 5. CATEGORY_RANKINGS TABLE
-- ============================================
CREATE TABLE public.category_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    month DATE NOT NULL,
    mentions_count INTEGER DEFAULT 0,
    rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER GENERATED ALWAYS AS (previous_rank - rank) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, month)
);

-- Enable RLS
ALTER TABLE public.category_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rankings" ON public.category_rankings
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- 6. VIEWS (Optimized queries)
-- ============================================

-- Daily mentions view for SOV chart
CREATE VIEW public.v_daily_mentions AS
SELECT
    brand,
    published_date,
    channel,
    COUNT(*) as mention_count,
    SUM(engagement) as total_engagement
FROM public.mentions
GROUP BY brand, published_date, channel
ORDER BY published_date;

-- Content type distribution view
CREATE VIEW public.v_content_type_distribution AS
SELECT
    brand,
    DATE_TRUNC('month', published_date)::DATE as month,
    content_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY brand, DATE_TRUNC('month', published_date)), 1) as percentage
FROM public.mentions
GROUP BY brand, DATE_TRUNC('month', published_date), content_type
ORDER BY month, content_type;

-- Category summary view
CREATE VIEW public.v_category_summary AS
SELECT
    brand,
    category,
    DATE_TRUNC('month', published_date)::DATE as month,
    COUNT(*) as mention_count,
    SUM(engagement) as total_engagement
FROM public.mentions
GROUP BY brand, category, DATE_TRUNC('month', published_date)
ORDER BY month, mention_count DESC;

-- Channel summary view
CREATE VIEW public.v_channel_summary AS
SELECT
    brand,
    channel,
    COUNT(*) as mention_count,
    SUM(engagement) as total_engagement,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY brand), 1) as percentage
FROM public.mentions
GROUP BY brand, channel;

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to get metrics summary
CREATE OR REPLACE FUNCTION get_metrics_summary(
    p_brand TEXT DEFAULT 'VCBS',
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_mentions BIGINT,
    total_engagement BIGINT,
    total_likes BIGINT,
    total_shares BIGINT,
    total_comments BIGINT,
    positive_count BIGINT,
    negative_count BIGINT,
    neutral_count BIGINT,
    nsr_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_mentions,
        COALESCE(SUM(m.engagement), 0)::BIGINT as total_engagement,
        COALESCE(SUM(m.likes), 0)::BIGINT as total_likes,
        COALESCE(SUM(m.shares), 0)::BIGINT as total_shares,
        COALESCE(SUM(m.comments), 0)::BIGINT as total_comments,
        COUNT(*) FILTER (WHERE m.sentiment = 'Tích cực')::BIGINT as positive_count,
        COUNT(*) FILTER (WHERE m.sentiment = 'Tiêu cực')::BIGINT as negative_count,
        COUNT(*) FILTER (WHERE m.sentiment = 'Trung tính')::BIGINT as neutral_count,
        ROUND(
            (COUNT(*) FILTER (WHERE m.sentiment = 'Tích cực') - COUNT(*) FILTER (WHERE m.sentiment = 'Tiêu cực'))::NUMERIC
            / NULLIF(COUNT(*), 0) * 100,
            1
        ) as nsr_score
    FROM public.mentions m
    WHERE m.brand = p_brand
        AND (p_start_date IS NULL OR m.published_date >= p_start_date)
        AND (p_end_date IS NULL OR m.published_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate metrics comparison
CREATE OR REPLACE FUNCTION get_metrics_comparison(
    p_brand TEXT,
    current_start DATE,
    current_end DATE
)
RETURNS TABLE (
    metric_name TEXT,
    current_value NUMERIC,
    previous_value NUMERIC,
    change_percent NUMERIC
) AS $$
DECLARE
    period_days INTEGER;
    prev_start DATE;
    prev_end DATE;
BEGIN
    period_days := current_end - current_start;
    prev_end := current_start - INTERVAL '1 day';
    prev_start := prev_end - period_days;

    RETURN QUERY
    WITH current_metrics AS (
        SELECT
            COUNT(*) as mentions,
            COALESCE(SUM(m.engagement), 0) as engagement,
            COUNT(*) FILTER (WHERE m.sentiment = 'Tích cực') as positive,
            COUNT(*) FILTER (WHERE m.sentiment = 'Tiêu cực') as negative
        FROM public.mentions m
        WHERE m.brand = p_brand
            AND m.published_date BETWEEN current_start AND current_end
    ),
    previous_metrics AS (
        SELECT
            COUNT(*) as mentions,
            COALESCE(SUM(m.engagement), 0) as engagement,
            COUNT(*) FILTER (WHERE m.sentiment = 'Tích cực') as positive,
            COUNT(*) FILTER (WHERE m.sentiment = 'Tiêu cực') as negative
        FROM public.mentions m
        WHERE m.brand = p_brand
            AND m.published_date BETWEEN prev_start AND prev_end
    )
    SELECT
        'total_mentions'::TEXT,
        c.mentions::NUMERIC,
        p.mentions::NUMERIC,
        ROUND(((c.mentions - p.mentions)::NUMERIC / NULLIF(p.mentions, 0) * 100), 1)
    FROM current_metrics c, previous_metrics p
    UNION ALL
    SELECT
        'total_engagement'::TEXT,
        c.engagement::NUMERIC,
        p.engagement::NUMERIC,
        ROUND(((c.engagement - p.engagement)::NUMERIC / NULLIF(p.engagement, 0) * 100), 1)
    FROM current_metrics c, previous_metrics p
    UNION ALL
    SELECT
        'positive'::TEXT,
        c.positive::NUMERIC,
        p.positive::NUMERIC,
        ROUND(((c.positive - p.positive)::NUMERIC / NULLIF(p.positive, 0) * 100), 1)
    FROM current_metrics c, previous_metrics p
    UNION ALL
    SELECT
        'negative'::TEXT,
        c.negative::NUMERIC,
        p.negative::NUMERIC,
        ROUND(((c.negative - p.negative)::NUMERIC / NULLIF(p.negative, 0) * 100), 1)
    FROM current_metrics c, previous_metrics p;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGER: Update Category Rankings
-- ============================================
CREATE OR REPLACE FUNCTION update_category_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate rankings for current month
    WITH ranked_categories AS (
        SELECT
            brand,
            category,
            DATE_TRUNC('month', published_date)::DATE as month,
            COUNT(*) as mentions_count,
            ROW_NUMBER() OVER (
                PARTITION BY brand, DATE_TRUNC('month', published_date)
                ORDER BY COUNT(*) DESC
            ) as current_rank
        FROM public.mentions
        GROUP BY brand, category, DATE_TRUNC('month', published_date)
    ),
    previous_rankings AS (
        SELECT category, rank as prev_rank, month
        FROM public.category_rankings
        WHERE month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
    )
    INSERT INTO public.category_rankings (category, month, mentions_count, rank, previous_rank)
    SELECT
        rc.category,
        rc.month,
        rc.mentions_count,
        rc.current_rank,
        COALESCE(pr.prev_rank, rc.current_rank)
    FROM ranked_categories rc
    LEFT JOIN previous_rankings pr ON rc.category = pr.category
    ON CONFLICT (category, month)
    DO UPDATE SET
        mentions_count = EXCLUDED.mentions_count,
        rank = EXCLUDED.rank,
        previous_rank = EXCLUDED.previous_rank;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rankings after insert
CREATE TRIGGER trigger_update_rankings
AFTER INSERT ON public.mentions
FOR EACH STATEMENT
EXECUTE FUNCTION update_category_rankings();

-- ============================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data for testing

/*
INSERT INTO public.mentions (brand, channel, published_date, title, content, category, content_type, sentiment, likes, shares, comments, engagement)
VALUES
('VCBS', 'Báo mạng', '2024-11-28', 'VCBS: Thị trường chứng khoán tăng trưởng', 'Nội dung bài viết về thị trường...', 'Cổ phiếu', 'Tin tức thị trường', 'Tích cực', 100, 50, 30, 180),
('VCBS', 'Facebook', '2024-11-27', 'Khuyến nghị đầu tư từ VCBS', 'Nội dung khuyến nghị...', 'Báo cáo Phân tích', 'Bán hàng/Môi giới', 'Trung tính', 200, 100, 80, 380),
('VCBS', 'Youtube', '2024-11-26', 'VCBS ra mắt nền tảng mới', 'Nội dung về nền tảng...', 'Nền tảng giao dịch', 'Tin trực tiếp về thương hiệu', 'Tích cực', 500, 200, 150, 850);
*/
