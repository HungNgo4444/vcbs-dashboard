'use client';

import { useCallback, useState } from 'react';

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const exportToPDF = useCallback(async (reportId: string) => {
    if (!reportId) {
      console.error('Report ID is required for PDF export');
      return;
    }

    setIsExporting(true);
    setExportingId(reportId);

    try {
      const response = await fetch(`/api/export-pdf/${reportId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to export PDF');
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
      console.error('Error exporting PDF:', error);
      alert('Không thể xuất PDF. Vui lòng thử lại sau.');
    } finally {
      setIsExporting(false);
      setExportingId(null);
    }
  }, []);

  return { exportToPDF, isExporting, exportingId };
}
