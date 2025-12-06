'use client';

import { useCallback, useState } from 'react';

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Fallback: Browser Print API
  const browserPrint = useCallback((reportId: string) => {
    // Find the report content element and print it
    const printContent = document.querySelector(`[data-report-id="${reportId}"]`);

    if (!printContent) {
      // If no specific element, print the main report content
      window.print();
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để xuất PDF');
      return;
    }

    // Get the HTML content
    const content = printContent.innerHTML;

    // Write print-optimized HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Xuất PDF</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 20px;
            max-width: 100%;
          }
          h1 { font-size: 18pt; color: #1B4332; margin: 20px 0 12px; border-bottom: 1px solid #D8F3DC; padding-bottom: 8px; }
          h2 { font-size: 14pt; color: #1B4332; margin: 16px 0 10px; }
          h3 { font-size: 12pt; color: #1B4332; margin: 14px 0 8px; }
          p { margin: 8px 0; text-align: justify; }
          a { color: #2D6A4F; text-decoration: underline; }
          strong { color: #1B4332; font-weight: 600; }
          ul, ol { margin: 8px 0 8px 20px; }
          li { margin: 4px 0; }
          blockquote {
            border-left: 4px solid #52B788;
            background: #F0FDF4;
            padding: 10px 14px;
            margin: 12px 0;
            color: #1B4332;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 10pt;
          }
          th {
            background: #D8F3DC;
            color: #1B4332;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #B7E4C7;
          }
          td {
            padding: 6px 10px;
            border: 1px solid #D8F3DC;
          }
          tr:nth-child(even) td { background: #FAFFF9; }
          code {
            background: #F0F0F0;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
            font-size: 10pt;
          }
          pre {
            background: #F5F5F5;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
          }
          hr { border: none; border-top: 1px solid #D8F3DC; margin: 16px 0; }

          /* Hide elements not needed in print */
          .no-print, button, .mermaid-error { display: none !important; }

          /* Mermaid diagrams */
          svg { max-width: 100%; height: auto; }

          @media print {
            body { padding: 0; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  const exportToPDF = useCallback(async (reportId: string) => {
    if (!reportId) {
      console.error('Report ID is required for PDF export');
      return;
    }

    setIsExporting(true);
    setExportingId(reportId);

    try {
      // Try server-side PDF generation first
      const response = await fetch(`/api/export-pdf/${reportId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Server PDF failed, falling back to browser print:', errorData.error);

        // Fallback to browser print
        browserPrint(reportId);
        return;
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Invalid response type, falling back to browser print');
        browserPrint(reportId);
        return;
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'report.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF, falling back to browser print:', error);
      // Fallback to browser print on any error
      browserPrint(reportId);
    } finally {
      setIsExporting(false);
      setExportingId(null);
    }
  }, [browserPrint]);

  return { exportToPDF, isExporting, exportingId };
}