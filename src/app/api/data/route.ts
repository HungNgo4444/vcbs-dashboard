import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const type = searchParams.get('type') || 'metrics';
    const brand = searchParams.get('brand') || 'VCBS';
    const channel = searchParams.get('channel');
    const sentiment = searchParams.get('sentiment');
    const contentType = searchParams.get('contentType');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build base query
    let query = supabase.from('mentions').select('*', { count: 'exact' });

    // Apply filters
    query = query.eq('brand', brand);

    if (channel && channel !== 'all') {
      query = query.eq('channel', channel);
    }
    if (sentiment && sentiment !== 'all') {
      query = query.eq('sentiment', sentiment);
    }
    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (startDate) {
      query = query.gte('published_date', startDate);
    }
    if (endDate) {
      query = query.lte('published_date', endDate);
    }

    switch (type) {
      case 'articles': {
        // Paginated articles
        const offset = (page - 1) * limit;
        query = query
          .order('published_date', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
          data,
          total: count,
          page,
          limit,
        });
      }

      case 'metrics': {
        const { data, error } = await query;

        if (error) throw error;

        const mentions = data || [];
        const total = mentions.length;
        const engagement = mentions.reduce((sum, m) => sum + (m.engagement || 0), 0);
        const positive = mentions.filter((m) => m.sentiment === 'Tích cực').length;
        const negative = mentions.filter((m) => m.sentiment === 'Tiêu cực').length;
        const neutral = mentions.filter((m) => m.sentiment === 'Trung tính').length;

        return NextResponse.json({
          total_mentions: total,
          total_engagement: engagement,
          positive_count: positive,
          negative_count: negative,
          neutral_count: neutral,
          nsr_score: total > 0 ? Math.round(((positive - negative) / total) * 1000) / 10 : 0,
        });
      }

      case 'channels': {
        const { data, error } = await query;

        if (error) throw error;

        const channelCounts: Record<string, number> = {};
        data?.forEach((m) => {
          channelCounts[m.channel] = (channelCounts[m.channel] || 0) + 1;
        });

        return NextResponse.json(channelCounts);
      }

      case 'categories': {
        const { data, error } = await query;

        if (error) throw error;

        const categoryCounts: Record<string, number> = {};
        data?.forEach((m) => {
          categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
        });

        // Sort by count descending
        const sorted = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([name, count], idx) => ({
            name,
            mentions: count,
            rank: idx + 1,
            change: 0,
          }));

        return NextResponse.json(sorted);
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
