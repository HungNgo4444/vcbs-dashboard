import * as XLSX from 'xlsx';
import {
  ALLOWED_CHANNELS,
  ALLOWED_SENTIMENTS,
  ALLOWED_CONTENT_TYPES,
  ALLOWED_CATEGORIES,
} from '@/lib/constants';
import type { ExcelRow, ParsedMention, ParseResult } from '@/types';

// Validation functions
export function validateChannel(value: string): string {
  if (!ALLOWED_CHANNELS.includes(value as typeof ALLOWED_CHANNELS[number])) {
    throw new Error(
      `Giá trị Phương tiện "${value}" không hợp lệ. ` +
        `Phải là một trong: ${ALLOWED_CHANNELS.join(', ')}`
    );
  }
  return value;
}

export function validateSentiment(value: string): string {
  if (!ALLOWED_SENTIMENTS.includes(value as typeof ALLOWED_SENTIMENTS[number])) {
    throw new Error(
      `Giá trị AI_SACTHAI "${value}" không hợp lệ. ` +
        `Phải là một trong: ${ALLOWED_SENTIMENTS.join(', ')}`
    );
  }
  return value;
}

export function validateContentType(value: string): string {
  if (!ALLOWED_CONTENT_TYPES.includes(value as typeof ALLOWED_CONTENT_TYPES[number])) {
    throw new Error(
      `Giá trị AI_THELOAINOIDUNG "${value}" không hợp lệ. ` +
        `Phải là một trong: ${ALLOWED_CONTENT_TYPES.join(', ')}`
    );
  }
  return value;
}

export function validateCategory(value: string): string {
  if (!ALLOWED_CATEGORIES.includes(value as typeof ALLOWED_CATEGORIES[number])) {
    throw new Error(
      `Giá trị AI_CATEGORY "${value}" không hợp lệ. ` +
        `Phải là một trong: ${ALLOWED_CATEGORIES.join(', ')}`
    );
  }
  return value;
}

// Parse date from Excel
function parseDate(dateValue: string | Date | undefined): string {
  if (!dateValue) {
    throw new Error('Ngày phát hành không được để trống');
  }

  // If it's already a Date object (from Excel)
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  // Try to parse string date (DD/MM/YYYY format)
  const dateStr = String(dateValue).trim();

  // Handle DD/MM/YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Handle YYYY-MM-DD format
  const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try parsing as generic date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  throw new Error(`Không thể parse ngày: "${dateStr}"`);
}

// Transform a single row
function transformRow(row: ExcelRow, rowNumber: number): ParsedMention | null {
  // 1. VALIDATE REQUIRED FIELDS
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

  // 2. VALIDATE ENUM VALUES
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

  // 3. CALCULATE ENGAGEMENT
  const likes = Number(row['Like']) || 0;
  const shares = Number(row['Share']) || 0;
  const comments = Number(row['Comment']) || 0;
  const engagement = row['Tổng tương tác']
    ? Number(row['Tổng tương tác'])
    : likes + shares + comments;

  // 4. PARSE DATE
  let publishedDate: string;
  try {
    publishedDate = parseDate(row['Ngày phát hành']);
  } catch (e) {
    throw new Error(`Row ${rowNumber}: ${(e as Error).message}`);
  }

  // 5. RETURN TRANSFORMED DATA
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

// Main parse function
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
