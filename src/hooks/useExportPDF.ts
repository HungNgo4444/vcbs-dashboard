'use client';

import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  filename?: string;
  margin?: number;
}

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = useCallback(async (
    elementRef: React.RefObject<HTMLElement>,
    options: ExportOptions = {}
  ) => {
    const element = elementRef.current;
    if (!element) {
      console.error('Element not found for PDF export');
      return;
    }

    const {
      filename = 'report.pdf',
      margin = 20,
    } = options;

    setIsExporting(true);

    try {
      // Wait for Mermaid diagrams to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate PDF dimensions (A4)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const contentWidth = pdfWidth - (margin * 2);

      // Scale image to fit PDF width
      const scaledHeight = (imgHeight * contentWidth) / imgWidth;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Handle multi-page if content is too long
      const pageHeight = pdfHeight - (margin * 2);
      let remainingHeight = scaledHeight;
      const position = margin;
      let page = 0;

      while (remainingHeight > 0) {
        if (page > 0) {
          pdf.addPage();
        }

        // Calculate the portion of image to draw on this page
        const drawHeight = Math.min(pageHeight, remainingHeight);
        const sourceY = (page * pageHeight / scaledHeight) * imgHeight;
        const sourceHeight = (drawHeight / scaledHeight) * imgHeight;

        // Create a temporary canvas for this page's portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, imgWidth, sourceHeight,
            0, 0, imgWidth, sourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', margin, position, contentWidth, drawHeight);
        }

        remainingHeight -= pageHeight;
        page++;
      }

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToPDF, isExporting };
}
