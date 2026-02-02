import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Month names in Vietnamese
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// Convert markdown to HTML (basic conversion)
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Tables
  const tableRegex = /\|(.+)\|\n\|[-:|]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').filter((h: string) => h.trim());
    const rows = bodyRows.trim().split('\n').map((row: string) =>
      row.split('|').filter((c: string) => c.trim())
    );

    let table = '<table><thead><tr>';
    headers.forEach((h: string) => {
      table += `<th>${h.trim()}</th>`;
    });
    table += '</tr></thead><tbody>';

    rows.forEach((row: string[]) => {
      table += '<tr>';
      row.forEach((cell: string) => {
        table += `<td>${cell.trim()}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
  });

  // Blockquotes
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gm, '<oli>$1</oli>');
  html = html.replace(/(<oli>.*<\/oli>\n?)+/g, (match) => {
    return '<ol>' + match.replace(/<\/?oli>/g, (tag) => tag.replace('oli', 'li')) + '</ol>';
  });

  // Code blocks (skip mermaid)
  html = html.replace(/```mermaid\n[\s\S]*?```/g, '<div class="mermaid-placeholder">[Biểu đồ Mermaid - xem trên web]</div>');
  html = html.replace(/```[\s\S]*?```/g, '<pre><code>$&</code></pre>');
  html = html.replace(/```/g, '');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') ||
        para.startsWith('<table') || para.startsWith('<blockquote') || para.startsWith('<pre') ||
        para.startsWith('<hr') || para.startsWith('<div')) {
      return para;
    }
    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

// Generate HTML template for PDF
function generatePdfHtml(report: {
  title: string;
  content: string;
  month: number;
  year: number;
  updated_at: string;
}): string {
  const contentHtml = markdownToHtml(report.content);
  const monthName = MONTH_NAMES[report.month - 1];
  const updatedDate = new Date(report.updated_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #1a1a1a;
      padding: 30px 40px;
      max-width: 100%;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 2px solid #52B788;
    }

    .header h1 {
      font-size: 16pt;
      color: #1B4332;
      margin-bottom: 6px;
      font-weight: 700;
    }

    .header .date {
      font-size: 10pt;
      color: #666;
    }

    .content {
      max-width: 100%;
    }

    h1 { font-size: 13pt; color: #1B4332; margin: 16px 0 8px; border-bottom: 1px solid #D8F3DC; padding-bottom: 6px; }
    h2 { font-size: 11pt; color: #1B4332; margin: 14px 0 6px; }
    h3 { font-size: 10pt; color: #1B4332; margin: 10px 0 5px; }

    p { margin: 6px 0; text-align: justify; }

    a { color: #2D6A4F; text-decoration: underline; }

    strong { color: #1B4332; font-weight: 600; }

    ul, ol { margin: 6px 0 6px 20px; }
    li { margin: 2px 0; }

    blockquote {
      border-left: 3px solid #52B788;
      background: #F0FDF4;
      padding: 8px 12px;
      margin: 10px 0;
      color: #1B4332;
      font-style: normal;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8pt;
    }

    th {
      background: #D8F3DC;
      color: #1B4332;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #B7E4C7;
    }

    td {
      padding: 5px 8px;
      border: 1px solid #D8F3DC;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #FAFFF9;
    }

    code {
      background: #F0F0F0;
      padding: 1px 4px;
      border-radius: 3px;
      font-family: 'Consolas', monospace;
      font-size: 8pt;
    }

    pre {
      background: #F5F5F5;
      padding: 10px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 10px 0;
    }

    pre code {
      background: none;
      padding: 0;
    }

    hr {
      border: none;
      border-top: 1px solid #D8F3DC;
      margin: 14px 0;
    }

    .mermaid-placeholder {
      background: #FFF9E6;
      border: 1px dashed #E6B800;
      padding: 16px;
      text-align: center;
      color: #996600;
      margin: 16px 0;
      border-radius: 8px;
    }

    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #D8F3DC;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }

    @media print {
      body { padding: 15px 20px; }
      .header h1 { font-size: 14pt; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <div class="date">${monthName} ${report.year}</div>
  </div>

  <div class="content">
    ${contentHtml}
  </div>

  <div class="footer">
    Cập nhật: ${updatedDate} | VCBS Dashboard
  </div>
</body>
</html>
  `;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch report
    const { data: report, error: fetchError } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate HTML
    const html = generatePdfHtml(report);

    // Launch browser
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 800 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Create filename
    const filename = `${report.title.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')}_${report.month}_${report.year}.pdf`;

    // Convert Uint8Array to Buffer for NextResponse
    const buffer = Buffer.from(pdfBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
