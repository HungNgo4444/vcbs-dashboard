import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch reports (optional month/year/type query params)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    let query = supabase
      .from('monthly_reports')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    // Filter by month/year if provided
    if (month && year) {
      query = query.eq('month', parseInt(month)).eq('year', parseInt(year));
    } else if (year) {
      query = query.eq('year', parseInt(year));
    }

    // Filter by report_type if provided
    if (type) {
      query = query.eq('report_type', type);
    }

    const { data: reports, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Create new report (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication & admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Parse request body
    const body = await request.json();
    const { month, year, title, content, report_type = 'nhan_dinh' } = body;

    // Validate required fields
    if (!month || !year || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: month, year, title, content' },
        { status: 400 }
      );
    }

    // Check if report for this month/year/type already exists
    const { data: existing } = await supabase
      .from('monthly_reports')
      .select('id')
      .eq('month', month)
      .eq('year', year)
      .eq('report_type', report_type)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Report for ${month}/${year} (${report_type}) already exists. Use PUT to update.` },
        { status: 409 }
      );
    }

    // Create report
    const { data: report, error } = await supabase
      .from('monthly_reports')
      .insert({
        month,
        year,
        title,
        content,
        report_type,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
