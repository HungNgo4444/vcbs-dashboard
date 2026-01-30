import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[History API] Starting...');
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[History API] User:', user?.id, 'Auth error:', authError?.message);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[History API] Profile:', profile, 'Error:', profileError?.message);

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch upload history with uploader info (exclude soft-deleted records)
    const { data, error } = await supabase
      .from('upload_history')
      .select(`
        *,
        profiles:uploaded_by (
          email,
          full_name
        )
      `)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('[History API] Data count:', data?.length, 'Error:', error?.message);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[History API] Error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
