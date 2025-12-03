import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // First, delete all mentions associated with this upload batch
    const { error: mentionsError } = await supabase
      .from('mentions')
      .delete()
      .eq('upload_batch_id', id);

    if (mentionsError) {
      console.error('Error deleting mentions:', mentionsError);
      return NextResponse.json(
        { error: 'Failed to delete associated mentions', details: mentionsError.message },
        { status: 500 }
      );
    }

    // Then delete the upload history record
    const { error: historyError } = await supabase
      .from('upload_history')
      .delete()
      .eq('id', id);

    if (historyError) {
      console.error('Error deleting upload history:', historyError);
      return NextResponse.json(
        { error: 'Failed to delete upload record', details: historyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
