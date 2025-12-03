import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseExcelFile } from '@/lib/utils/excel-parser';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check authentication & admin role
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
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      );
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

        return NextResponse.json(
          {
            error: 'No valid data found',
            errors: parseResult.errors,
          },
          { status: 400 }
        );
      }

      // 5. Insert data with upload_batch_id
      const dataWithBatchId = parseResult.data.map((item) => ({
        ...item,
        upload_batch_id: uploadRecord.id,
      }));

      // Insert in batches of 100 to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < dataWithBatchId.length; i += batchSize) {
        const batch = dataWithBatchId.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from('mentions').insert(batch);

        if (insertError) {
          await supabase
            .from('upload_history')
            .update({ status: 'failed', error_message: insertError.message })
            .eq('id', uploadRecord.id);

          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }

      // 6. Update upload history
      await supabase
        .from('upload_history')
        .update({
          status: 'completed',
          records_count: parseResult.data.length,
        })
        .eq('id', uploadRecord.id);

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

      return NextResponse.json(
        {
          error: 'Failed to process file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
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
