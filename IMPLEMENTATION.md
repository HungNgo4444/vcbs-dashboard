# VCBS Social Listening Dashboard - Implementation Guide

## 📋 Tổng quan Project

Dashboard báo cáo Social Listening cho thương hiệu VCBS (Công ty Chứng khoán Vietcombank) với các tính năng phân tích truyền thông xã hội, quản lý dữ liệu và phân quyền người dùng.

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Next.js 14 (App Router), React 18 |
| UI Library | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| File Processing | xlsx (SheetJS) |
| Hosting | Vercel |
| State Management | React Context + Hooks |

---

## 📁 Cấu trúc Project

```
social-listening-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── upload/
│   │   │   │   └── page.tsx
│   │   │   └── history/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts
│   │   └── data/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── MetricCard.tsx           # Card tổng đề cập, tương tác, NSR...
│   │   ├── SOVLineChart.tsx         # Line chart SOV theo kênh
│   │   ├── ContentTypeStackChart.tsx # 100% stacked column chart
│   │   ├── CategoryBarChart.tsx     # Bar chart category với ranking
│   │   ├── ArticlesTable.tsx        # Matrix table bài viết
│   │   ├── FilterBar.tsx            # Bộ lọc dữ liệu
│   │   └── DashboardHeader.tsx      # Header với user info
│   ├── admin/
│   │   ├── ExcelUploader.tsx        # Component upload Excel
│   │   ├── UploadHistory.tsx        # Lịch sử upload
│   │   └── AdminBar.tsx             # Admin panel bar
│   └── shared/
│       ├── SentimentBadge.tsx       # Badge sắc thái
│       ├── ChannelBadge.tsx         # Badge kênh
│       ├── RankChange.tsx           # Indicator thay đổi xếp hạng
│       └── LoadingSpinner.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Supabase browser client
│   │   ├── server.ts                # Supabase server client
│   │   └── admin.ts                 # Supabase admin client
│   ├── utils/
│   │   ├── excel-parser.ts          # Parse Excel file
│   │   ├── data-transformer.ts      # Transform data cho charts
│   │   └── helpers.ts               # Utility functions
│   └── constants.ts                 # Constants (categories, channels...)
├── hooks/
│   ├── useAuth.ts                   # Auth hook
│   ├── useDashboardData.ts          # Fetch dashboard data
│   └── useFilters.ts                # Filter state management
├── types/
│   ├── database.ts                  # Supabase database types
│   ├── dashboard.ts                 # Dashboard-specific types
│   └── index.ts
├── styles/
│   └── theme.ts                     # Color theme configuration
├── middleware.ts                    # Auth middleware
├── .env.local                       # Environment variables
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 🗄️ Database Schema (Supabase)

### Tables

#### 1. `users` (Managed by Supabase Auth + custom fields)
```sql
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
```

#### 2. `mentions` (Bài viết/đề cập)
```sql
CREATE TABLE public.mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Thông tin thương hiệu
    brand TEXT NOT NULL DEFAULT 'VCBS',             -- Khách hàng (VCBS, SSI, VNDIRECT...)

    -- Thông tin kênh & nguồn
    channel TEXT NOT NULL CHECK (channel IN ('Báo mạng', 'Facebook', 'Youtube', 'Tiktok')),
    source_name TEXT,                               -- Nguồn phát hành (tên page, báo...)
    source_url TEXT,                                -- Link bài viết gốc

    -- Thời gian
    published_date DATE NOT NULL,                   -- Ngày phát hành

    -- Nội dung
    title TEXT,                                     -- Tiêu đề bài viết
    content TEXT NOT NULL,                          -- Nội dung đầy đủ
    original_type TEXT,                             -- Loại tin gốc

    -- Metrics từ Excel
    likes INTEGER DEFAULT 0,                        -- Số Like
    shares INTEGER DEFAULT 0,                       -- Số Share
    comments INTEGER DEFAULT 0,                     -- Số Comment
    engagement INTEGER DEFAULT 0,                   -- Tổng tương tác (Like + Share + Comment)

    -- Giá trị truyền thông
    ad_cost DECIMAL(15,2),                          -- Chi phí quảng cáo
    prominence_level TEXT,                          -- Mức độ nổi bật
    media_value DECIMAL(15,2),                      -- Giá trị truyền thông

    -- AI Classification (từ các cột AI_*)
    category TEXT NOT NULL,                         -- AI_CATEGORY: Phân loại chứng khoán (14 loại)
    content_type TEXT NOT NULL CHECK (content_type IN ('Tin tức thị trường', 'Bán hàng/Môi giới', 'Tin trực tiếp về thương hiệu')),
    sentiment TEXT NOT NULL CHECK (sentiment IN ('Tích cực', 'Tiêu cực', 'Trung tính')),
    ai_summary TEXT,                                -- AI_NOTE: Ghi chú tóm tắt từ AI

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
```

#### 3. `brands` (Thương hiệu - hỗ trợ mở rộng)
```sql
CREATE TABLE public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,                      -- Tên thương hiệu (VCBS, SSI...)
    display_name TEXT,                              -- Tên hiển thị
    logo_url TEXT,                                  -- URL logo
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
```

#### 4. `upload_history` (Lịch sử upload)
```sql
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
```

#### 5. `category_rankings` (Xếp hạng category theo tháng)
```sql
CREATE TABLE public.category_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    month DATE NOT NULL,                            -- First day of month
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
```

### Views (Tối ưu queries)

#### 1. `v_daily_mentions` (SOV Line Chart)
```sql
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
```

#### 2. `v_content_type_distribution` (Stacked Chart)
```sql
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
```

#### 3. `v_metrics_summary` (Cards) - Function thay vì View để hỗ trợ filter
```sql
-- Function để lấy metrics summary theo brand và date range
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
```

#### 4. `v_category_summary` (Category Bar Chart)
```sql
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
```

#### 5. `v_channel_summary` (SOV Summary)
```sql
CREATE VIEW public.v_channel_summary AS
SELECT
    brand,
    channel,
    COUNT(*) as mention_count,
    SUM(engagement) as total_engagement,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY brand), 1) as percentage
FROM public.mentions
GROUP BY brand, channel;
```

### Functions

#### Calculate monthly metrics comparison
```sql
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
```

#### Update Category Rankings (Trigger sau khi upload)
```sql
CREATE OR REPLACE FUNCTION update_category_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate rankings cho tháng hiện tại
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

-- Trigger để tự động update rankings sau mỗi lần insert
CREATE TRIGGER trigger_update_rankings
AFTER INSERT ON public.mentions
FOR EACH STATEMENT
EXECUTE FUNCTION update_category_rankings();
```

---

## 🎨 Theme & Style Guide

### Color Palette
```typescript
// styles/theme.ts
export const theme = {
  colors: {
    // Primary - Forest Green
    primary: {
      900: '#081C15',  // Darkest
      800: '#1B4332',  // Primary dark
      700: '#2D6A4F',  // Primary
      600: '#40916C',  // Primary light
      500: '#52B788',  // Accent
      400: '#74C69D',  // Light accent
      300: '#95D5B2',  // Lighter
      200: '#B7E4C7',  // Border
      100: '#D8F3DC',  // Background light
      50:  '#F0FDF4',  // Background lightest
    },
    // Sentiment colors
    sentiment: {
      positive: {
        bg: '#D8F3DC',
        text: '#1B4332',
        border: '#95D5B2',
      },
      negative: {
        bg: '#FFE5E5',
        text: '#C41E3A',
        border: '#FFB3B3',
      },
      neutral: {
        bg: '#F5F5F5',
        text: '#666666',
        border: '#DDDDDD',
      },
    },
    // Channel colors (khớp với ALLOWED_CHANNELS)
    channel: {
      'Báo mạng': { bg: '#E8F5E9', text: '#1B4332' },
      'Facebook': { bg: '#E3F2FD', text: '#1565C0' },
      'Youtube':  { bg: '#FFEBEE', text: '#C62828' },
      'Tiktok':   { bg: '#FCE4EC', text: '#AD1457' },
    },
    // Chart colors
    chart: {
      line: ['#1B4332', '#2D6A4F', '#40916C', '#52B788'],
      bar: ['#1B4332', '#40916C', '#74C69D'],
    }
  },
  gradients: {
    header: 'linear-gradient(135deg, #081C15 0%, #1B4332 40%, #2D6A4F 100%)',
    card: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
    button: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
    accent: 'linear-gradient(180deg, #1B4332 0%, #52B788 100%)',
  },
  shadows: {
    card: '0 4px 24px rgba(27, 67, 50, 0.06)',
    cardHover: '0 10px 40px rgba(27, 67, 50, 0.15)',
    button: '0 4px 12px rgba(27, 67, 50, 0.2)',
  },
};
```

### Tailwind Config
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#081C15',
          800: '#1B4332',
          700: '#2D6A4F',
          600: '#40916C',
          500: '#52B788',
          400: '#74C69D',
          300: '#95D5B2',
          200: '#B7E4C7',
          100: '#D8F3DC',
          50:  '#F0FDF4',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 🔐 Authentication Flow

### 1. Login Page
- Email/Password authentication
- Credentials được dev cung cấp (không có đăng ký)
- Redirect đến dashboard sau khi login

### 2. Middleware Protection
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session?.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

### 3. Role-based Access
| Feature | Admin | User |
|---------|-------|------|
| View Dashboard | ✅ | ✅ |
| Upload Excel | ✅ | ❌ |
| View Upload History | ✅ | ❌ |
| Manage Data | ✅ | ❌ |

---

## 📊 Dashboard Components

### 1. Metric Cards
```typescript
// components/dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string
  value: string | number
  change?: number           // % thay đổi so tháng trước
  icon: string
  isNegativeMetric?: boolean  // true cho "Tiêu cực" - khi giảm là tốt
}
```

**Cards hiển thị:**
- Tổng đề cập
- Tổng tương tác
- Tích cực
- Tiêu cực (isNegativeMetric = true)
- NSR Score (Net Sentiment Ratio)

### 2. SOV Line Chart
- Trục X: Ngày (date)
- Trục Y: Số đề cập
- Legend: 4 kênh (Báo mạng, Facebook, Youtube, Tiktok)
- Filter: 7 ngày / 30 ngày / 90 ngày

### 3. Content Type Stacked Chart
- 100% stacked bar chart (horizontal)
- Trục Y: Tháng
- 3 segments: Tin tức thị trường, Bán hàng/Môi giới, Tin trực tiếp về thương hiệu

### 4. Category Bar Chart
- Horizontal bar chart với ranking
- Hiển thị: Tên category, số mentions, thanh progress bar, thay đổi rank (↑↓)
- Categories:
  - Cổ phiếu
  - Trái phiếu
  - Chứng chỉ quỹ
  - Chứng quyền
  - Phái sinh
  - Giao dịch ký quỹ
  - Nền tảng giao dịch
  - Mở tài khoản
  - Nộp/Rút tiền
  - Môi giới/Tư vấn
  - Báo cáo Phân tích
  - Phí & Ưu đãi
  - Tư vấn Doanh nghiệp
  - Blockchain & Tài sản mã hóa

### 5. Articles Table
| Column | Description |
|--------|-------------|
| Nội dung | Nội dung bài viết (truncate 2 lines) |
| Kênh | Badge màu theo channel |
| Sắc thái | Badge (Tích cực/Tiêu cực/Trung tính) |
| Tương tác | Số engagement |
| Ngày | Ngày đăng |

- Pagination: 10 items/page
- Sortable columns

### 6. Filter Bar
```typescript
interface Filters {
  channel: string | 'all'
  sentiment: string | 'all'
  contentType: string | 'all'
  category: string | 'all'
  dateRange?: {
    start: Date
    end: Date
  }
}
```

---

## 📤 Excel Upload Flow

### 1. Expected Excel Format (Từ User Upload)

| Column (Excel) | Type | Required | Description |
|----------------|------|----------|-------------|
| Khách hàng | string | ✅ | Tên thương hiệu (VCBS, SSI, VNDIRECT...) |
| Phương tiện | string | ✅ | Kênh: `Báo mạng`, `Facebook`, `Youtube`, `Tiktok` |
| Nguồn phát hành | string | ❌ | Tên nguồn/page đăng bài |
| Ngày phát hành | date | ✅ | Ngày đăng bài viết |
| Tiêu đề | string | ❌ | Tiêu đề bài viết |
| Loại tin | string | ❌ | Phân loại tin gốc |
| Link | string | ❌ | URL bài viết gốc |
| Chi phí | number | ❌ | Chi phí quảng cáo (nếu có) |
| Mức độ nổi bật | string | ❌ | Đánh giá mức độ nổi bật |
| Giá trị truyền thông | number | ❌ | Giá trị quy đổi truyền thông |
| Nội dung | string | ✅ | Nội dung đầy đủ bài viết |
| Like | number | ❌ | Số lượt like |
| Share | number | ❌ | Số lượt share |
| Comment | number | ❌ | Số lượt comment |
| Tổng tương tác | number | ❌ | Tổng engagement (Like + Share + Comment) |
| AI_CATEGORY | string | ✅ | Category chứng khoán (1 trong 14 loại - xem bên dưới) |
| AI_THELOAINOIDUNG | string | ✅ | `Tin tức thị trường`, `Bán hàng/Môi giới`, `Tin trực tiếp về thương hiệu` |
| AI_SACTHAI | string | ✅ | `Tích cực`, `Tiêu cực`, `Trung tính` |
| AI_NOTE | string | ❌ | Ghi chú tóm tắt nội dung (AI generated) |

> **⚠️ Lưu ý quan trọng:** Admin phải chuẩn hóa dữ liệu TRƯỚC khi upload. Giá trị phải khớp CHÍNH XÁC với các giá trị cho phép (case-sensitive). Nếu sai sẽ báo lỗi chi tiết tại row nào và giá trị nào không hợp lệ.

### 2. Column Mapping (Excel → Database)

```typescript
// lib/utils/excel-mapper.ts

// Excel Column → Database Column
export const EXCEL_TO_DB_MAPPING = {
  'Khách hàng': 'brand',
  'Phương tiện': 'channel',
  'Nguồn phát hành': 'source_name',
  'Ngày phát hành': 'published_date',
  'Tiêu đề': 'title',
  'Loại tin': 'original_type',
  'Link': 'source_url',
  'Chi phí': 'ad_cost',
  'Mức độ nổi bật': 'prominence_level',
  'Giá trị truyền thông': 'media_value',
  'Nội dung': 'content',
  'Like': 'likes',
  'Share': 'shares',
  'Comment': 'comments',
  'Tổng tương tác': 'engagement',
  'AI_CATEGORY': 'category',
  'AI_THELOAINOIDUNG': 'content_type',
  'AI_SACTHAI': 'sentiment',
  'AI_NOTE': 'ai_summary',
};

// ============================================
// ALLOWED VALUES - Admin phải chuẩn hóa data trước khi upload
// Nếu giá trị không khớp chính xác → báo lỗi
// ============================================

// Kênh - Phải đúng chính xác 1 trong 4 giá trị
export const ALLOWED_CHANNELS = [
  'Báo mạng',
  'Facebook',
  'Youtube',
  'Tiktok',
] as const;

// Sắc thái - Phải đúng chính xác 1 trong 3 giá trị
export const ALLOWED_SENTIMENTS = [
  'Tích cực',
  'Tiêu cực',
  'Trung tính',
] as const;

// Thể loại nội dung - Phải đúng chính xác 1 trong 3 giá trị
export const ALLOWED_CONTENT_TYPES = [
  'Tin tức thị trường',
  'Bán hàng/Môi giới',
  'Tin trực tiếp về thương hiệu',
] as const;

// Category chứng khoán - Phải đúng chính xác 1 trong 14 giá trị
export const ALLOWED_CATEGORIES = [
  'Cổ phiếu',
  'Trái phiếu',
  'Chứng chỉ quỹ',
  'Chứng quyền',
  'Phái sinh',
  'Giao dịch ký quỹ',
  'Nền tảng giao dịch',
  'Mở tài khoản',
  'Nộp/Rút tiền',
  'Môi giới/Tư vấn',
  'Báo cáo Phân tích',
  'Phí & Ưu đãi',
  'Tư vấn Doanh nghiệp',
  'Blockchain & Tài sản mã hóa',
] as const;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export function validateChannel(value: string): string {
  if (!ALLOWED_CHANNELS.includes(value as any)) {
    throw new Error(
      `Giá trị Phương tiện "${value}" không hợp lệ. ` +
      `Phải là một trong: ${ALLOWED_CHANNELS.join(', ')}`
    );
  }
  return value;
}

export function validateSentiment(value: string): string {
  if (!ALLOWED_SENTIMENTS.includes(value as any)) {
    throw new Error(
      `Giá trị AI_SACTHAI "${value}" không hợp lệ. ` +
      `Phải là một trong: ${ALLOWED_SENTIMENTS.join(', ')}`
    );
  }
  return value;
}

export function validateContentType(value: string): string {
  if (!ALLOWED_CONTENT_TYPES.includes(value as any)) {
    throw new Error(
      `Giá trị AI_THELOAINOIDUNG "${value}" không hợp lệ. ` +
      `Phải là một trong: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    );
  }
  return value;
}

export function validateCategory(value: string): string {
  if (!ALLOWED_CATEGORIES.includes(value as any)) {
    throw new Error(
      `Giá trị AI_CATEGORY "${value}" không hợp lệ. ` +
      `Phải là một trong: ${ALLOWED_CATEGORIES.join(', ')}`
    );
  }
  return value;
}
```

### 3. Data Transformation Flow

```
Excel File Upload
       ↓
┌─────────────────────────────────────────────────────────┐
│  1. PARSE EXCEL                                         │
│     - Read file với xlsx library                        │
│     - Extract headers & rows                            │
│     - Validate required columns exist                   │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│  2. VALIDATE DATA (Strict - No Normalization)           │
│     - Check required fields not empty                   │
│     - Validate Phương tiện ∈ ALLOWED_CHANNELS           │
│       (Báo mạng, Facebook, Youtube, Tiktok)             │
│     - Validate AI_SACTHAI ∈ ALLOWED_SENTIMENTS          │
│       (Tích cực, Tiêu cực, Trung tính)                  │
│     - Validate AI_THELOAINOIDUNG ∈ ALLOWED_CONTENT_TYPES│
│     - Validate AI_CATEGORY ∈ 14 ALLOWED_CATEGORIES      │
│     - Validate date format                              │
│     ⚠️ Nếu sai → báo lỗi chi tiết (row, giá trị sai)   │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│  3. TRANSFORM DATA                                      │
│     - Map Excel columns → DB columns                    │
│     - Parse dates (DD/MM/YYYY → Date object)            │
│     - Calculate engagement if missing:                  │
│       engagement = Like + Share + Comment               │
│     - Set default brand = 'VCBS' if empty               │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│  4. INSERT TO DATABASE                                  │
│     - Batch insert valid records to `mentions` table    │
│     - Skip invalid rows, log errors                     │
│     - Update `category_rankings` table (via trigger)    │
│     - Record in `upload_history`                        │
└─────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────┐
│  5. RETURN RESULT                                       │
│     - Total rows processed                              │
│     - Successful inserts count                          │
│     - Failed rows with error details:                   │
│       + Row number                                      │
│       + Error message (giá trị sai, giá trị cho phép)   │
│     - Upload batch ID for reference                     │
└─────────────────────────────────────────────────────────┘
```

### 4. Excel Parser Implementation

```typescript
// lib/utils/excel-parser.ts
import * as XLSX from 'xlsx';

interface ExcelRow {
  'Khách hàng'?: string;
  'Phương tiện'?: string;
  'Nguồn phát hành'?: string;
  'Ngày phát hành'?: string | Date;
  'Tiêu đề'?: string;
  'Loại tin'?: string;
  'Link'?: string;
  'Chi phí'?: number;
  'Mức độ nổi bật'?: string;
  'Giá trị truyền thông'?: number;
  'Nội dung'?: string;
  'Like'?: number;
  'Share'?: number;
  'Comment'?: number;
  'Tổng tương tác'?: number;
  'AI_CATEGORY'?: string;
  'AI_THELOAINOIDUNG'?: string;
  'AI_SACTHAI'?: string;
  'AI_NOTE'?: string;
}

interface TransformedMention {
  brand: string;
  channel: string;
  source_name: string | null;
  published_date: string;
  title: string | null;
  original_type: string | null;
  source_url: string | null;
  ad_cost: number | null;
  prominence_level: string | null;
  media_value: number | null;
  content: string;
  likes: number;
  shares: number;
  comments: number;
  engagement: number;
  category: string;
  content_type: string;
  sentiment: string;
  ai_summary: string | null;
}

interface ParseResult {
  success: boolean;
  data: TransformedMention[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  const result: ParseResult = {
    success: true,
    data: [],
    errors: [],
    totalRows: jsonData.length,
  };

  jsonData.forEach((row, index) => {
    try {
      const transformed = transformRow(row, index + 2); // +2 for header row
      if (transformed) {
        result.data.push(transformed);
      }
    } catch (error) {
      result.errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

function transformRow(row: ExcelRow, rowNumber: number): TransformedMention | null {
  // ============================================
  // 1. VALIDATE REQUIRED FIELDS
  // ============================================
  if (!row['Nội dung']) {
    throw new Error(`Row ${rowNumber}: Thiếu trường bắt buộc "Nội dung"`);
  }
  if (!row['Phương tiện']) {
    throw new Error(`Row ${rowNumber}: Thiếu trường bắt buộc "Phương tiện"`);
  }
  if (!row['Ngày phát hành']) {
    throw new Error(`Row ${rowNumber}: Thiếu trường bắt buộc "Ngày phát hành"`);
  }
  if (!row['AI_SACTHAI']) {
    throw new Error(`Row ${rowNumber}: Thiếu trường bắt buộc "AI_SACTHAI"`);
  }
  if (!row['AI_THELOAINOIDUNG']) {
    throw new Error(`Row ${rowNumber}: Thiếu trường bắt buộc "AI_THELOAINOIDUNG"`);
  }
  if (!row['AI_CATEGORY']) {
    throw new Error(`Row ${rowNumber}: Thiếu trường bắt buộc "AI_CATEGORY"`);
  }

  // ============================================
  // 2. VALIDATE ENUM VALUES
  // Admin phải chuẩn hóa data trước khi upload
  // Không normalize - nếu sai giá trị sẽ báo lỗi chi tiết
  // ============================================
  try {
    validateChannel(row['Phương tiện']);
  } catch (e) {
    throw new Error(`Row ${rowNumber}: ${(e as Error).message}`);
  }

  try {
    validateSentiment(row['AI_SACTHAI']);
  } catch (e) {
    throw new Error(`Row ${rowNumber}: ${(e as Error).message}`);
  }

  try {
    validateContentType(row['AI_THELOAINOIDUNG']);
  } catch (e) {
    throw new Error(`Row ${rowNumber}: ${(e as Error).message}`);
  }

  try {
    validateCategory(row['AI_CATEGORY']);
  } catch (e) {
    throw new Error(`Row ${rowNumber}: ${(e as Error).message}`);
  }

  // ============================================
  // 3. CALCULATE ENGAGEMENT
  // ============================================
  const likes = Number(row['Like']) || 0;
  const shares = Number(row['Share']) || 0;
  const comments = Number(row['Comment']) || 0;
  const engagement = row['Tổng tương tác']
    ? Number(row['Tổng tương tác'])
    : likes + shares + comments;

  // ============================================
  // 4. PARSE DATE
  // ============================================
  const publishedDate = parseDate(row['Ngày phát hành']);

  // ============================================
  // 5. RETURN TRANSFORMED DATA
  // Sử dụng trực tiếp giá trị từ Excel (đã validate)
  // ============================================
  return {
    brand: row['Khách hàng'] || 'VCBS',
    channel: row['Phương tiện'],
    source_name: row['Nguồn phát hành'] || null,
    published_date: publishedDate,
    title: row['Tiêu đề'] || null,
    original_type: row['Loại tin'] || null,
    source_url: row['Link'] || null,
    ad_cost: row['Chi phí'] ? Number(row['Chi phí']) : null,
    prominence_level: row['Mức độ nổi bật'] || null,
    media_value: row['Giá trị truyền thông'] ? Number(row['Giá trị truyền thông']) : null,
    content: row['Nội dung'],
    likes,
    shares,
    comments,
    engagement,
    category: row['AI_CATEGORY'],
    content_type: row['AI_THELOAINOIDUNG'],
    sentiment: row['AI_SACTHAI'],
    ai_summary: row['AI_NOTE'] || null,
  };
}
```

### 5. API Route

```typescript
// app/api/upload/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseExcelFile } from '@/lib/utils/excel-parser';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Check authentication & admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // 2. Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // 3. Create upload history record
  const { data: uploadRecord, error: uploadError } = await supabase
    .from('upload_history')
    .insert({
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id,
      status: 'processing',
    })
    .select()
    .single();

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to create upload record' }, { status: 500 });
  }

  try {
    // 4. Parse Excel file
    const buffer = await file.arrayBuffer();
    const parseResult = parseExcelFile(buffer);

    if (parseResult.data.length === 0) {
      await supabase
        .from('upload_history')
        .update({ status: 'failed', error_message: 'No valid data found' })
        .eq('id', uploadRecord.id);

      return NextResponse.json({
        error: 'No valid data found',
        errors: parseResult.errors,
      }, { status: 400 });
    }

    // 5. Insert data with upload_batch_id
    const dataWithBatchId = parseResult.data.map(item => ({
      ...item,
      upload_batch_id: uploadRecord.id,
    }));

    const { error: insertError } = await supabase
      .from('mentions')
      .insert(dataWithBatchId);

    if (insertError) {
      await supabase
        .from('upload_history')
        .update({ status: 'failed', error_message: insertError.message })
        .eq('id', uploadRecord.id);

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 6. Update upload history
    await supabase
      .from('upload_history')
      .update({
        status: 'completed',
        records_count: parseResult.data.length,
      })
      .eq('id', uploadRecord.id);

    // 7. Trigger category rankings update (can be done via DB trigger or here)
    await updateCategoryRankings(supabase);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${parseResult.data.length} records`,
      totalRows: parseResult.totalRows,
      successCount: parseResult.data.length,
      errorCount: parseResult.errors.length,
      errors: parseResult.errors,
      uploadId: uploadRecord.id,
    });

  } catch (error) {
    await supabase
      .from('upload_history')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', uploadRecord.id);

    return NextResponse.json({
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm hoặc pnpm
- Supabase account
- Vercel account

### Step 1: Clone & Install
```bash
# Clone project
git clone <repo-url>
cd social-listening-dashboard

# Install dependencies
npm install
# hoặc
pnpm install
```

### Step 2: Setup Supabase
1. Tạo project mới trên [supabase.com](https://supabase.com)
2. Vào SQL Editor, chạy các scripts trong phần Database Schema
3. Lấy credentials:
   - Project URL
   - Anon Key
   - Service Role Key (cho admin operations)

### Step 3: Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Create Admin User
```sql
-- Trong Supabase SQL Editor sau khi user đăng ký
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@vcbs.com.vn';
```

### Step 5: Run Development
```bash
npm run dev
# hoặc
pnpm dev
```

### Step 6: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables trong Vercel Dashboard
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "recharts": "^2.10.0",
    "xlsx": "^0.18.5",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.292.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/node": "^20.9.0",
    "@types/react": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Setup & Foundation
- [ ] Initialize Next.js project với TypeScript
- [ ] Setup Tailwind CSS và shadcn/ui
- [ ] Cấu hình Supabase client
- [ ] Tạo database schema
- [ ] Setup authentication

### Phase 2: Core Components
- [ ] DashboardHeader
- [ ] FilterBar
- [ ] MetricCard (5 cards)
- [ ] SOVLineChart
- [ ] ContentTypeStackChart
- [ ] CategoryBarChart
- [ ] ArticlesTable

### Phase 3: Data Layer
- [ ] API routes cho fetch data
- [ ] Hooks (useAuth, useDashboardData, useFilters)
- [ ] Real-time filtering

### Phase 4: Admin Features
- [ ] Excel upload component
- [ ] File validation
- [ ] Data import API
- [ ] Upload history page

### Phase 5: Polish & Deploy
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Deploy to Vercel
- [ ] Testing

---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/data/metrics` | Lấy metric cards data | User |
| GET | `/api/data/sov` | Lấy SOV chart data | User |
| GET | `/api/data/content-types` | Lấy content type distribution | User |
| GET | `/api/data/categories` | Lấy category rankings | User |
| GET | `/api/data/articles` | Lấy danh sách bài viết | User |
| POST | `/api/upload` | Upload Excel file | Admin |
| GET | `/api/upload/history` | Lấy lịch sử upload | Admin |

---

## 📝 Notes

1. **Performance**: Sử dụng Views và Indexes để tối ưu queries
2. **Security**: RLS policies đảm bảo data access control
3. **UX**: Loading states, error messages, toast notifications
4. **Responsive**: Mobile-first design, breakpoints cho tablet/desktop
5. **Accessibility**: ARIA labels, keyboard navigation

---

## 🎯 Future Enhancements

- [ ] Export data to PDF/Excel
- [ ] Date range picker cho filter
- [ ] Real-time updates với Supabase Realtime
- [ ] Email notifications cho anomaly detection
- [ ] Multi-brand support (không chỉ VCBS)
- [ ] Comparison period selection
- [ ] Custom dashboard layouts
