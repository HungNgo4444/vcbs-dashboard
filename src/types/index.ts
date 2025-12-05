// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mention {
  id: string;
  brand: string;
  channel: Channel;
  source_name: string | null;
  source_url: string | null;
  published_date: string;
  title: string | null;
  content: string;
  original_type: string | null;
  likes: number;
  shares: number;
  comments: number;
  engagement: number;
  ad_cost: number | null;
  prominence_level: string | null;
  media_value: number | null;
  category: Category;
  content_type: ContentType;
  sentiment: Sentiment;
  ai_summary: string | null;
  upload_batch_id: string | null;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UploadHistory {
  id: string;
  file_name: string;
  file_size: number | null;
  records_count: number;
  uploaded_by: string;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface CategoryRanking {
  id: string;
  category: string;
  month: string;
  mentions_count: number;
  rank: number;
  previous_rank: number | null;
  rank_change: number | null;
  created_at: string;
}

// Report types
export type ReportType = 'nhan_dinh' | 'bao_cao_nganh';

export const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'nhan_dinh', label: 'Nhận định Báo cáo' },
  { value: 'bao_cao_nganh', label: 'Báo cáo Ngành' },
];

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  title: string;
  content: string;
  report_type: ReportType;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

// Enum types
export type Channel = 'Báo mạng' | 'Facebook' | 'Youtube' | 'Tiktok';
export type Sentiment = 'Tích cực' | 'Tiêu cực' | 'Trung tính';
export type ContentType = 'Tin tức thị trường' | 'Bán hàng/Môi giới' | 'Tin trực tiếp về thương hiệu';
export type Category =
  | 'Cổ phiếu'
  | 'Trái phiếu'
  | 'Chứng chỉ quỹ'
  | 'Chứng quyền'
  | 'Phái sinh'
  | 'Giao dịch ký quỹ'
  | 'Nền tảng giao dịch'
  | 'Mở tài khoản'
  | 'Nộp/Rút tiền'
  | 'Môi giới/Tư vấn'
  | 'Báo cáo Phân tích'
  | 'Phí & Ưu đãi'
  | 'Tư vấn Doanh nghiệp'
  | 'Blockchain & Tài sản mã hóa';

// Dashboard types
export interface DashboardFilters {
  channels: Channel[];
  sentiments: Sentiment[];
  contentTypes: ContentType[];
  categories: Category[];
  month: number | null; // 1-12, null = all months
  year: number | null; // e.g., 2025, null = all years
}

export interface MetricsSummary {
  total_mentions: number;
  total_engagement: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  nsr_score: number;
}

export interface MetricsComparison {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change_percent: number;
}

export interface SOVDataPoint {
  date: string;
  'Báo mạng': number;
  'Facebook': number;
  'Youtube': number;
  'Tiktok': number;
}

export interface ContentTypeDataPoint {
  month: string;
  'Tin tức thị trường': number;
  'Bán hàng/Môi giới': number;
  'Tin trực tiếp về thương hiệu': number;
}

export interface CategoryDataPoint {
  name: string;
  mentions: number;
  change: number | null;
  rank: number;
}

// Excel parsing types
export interface ExcelRow {
  'Khách hàng'?: string;
  'Phương tiện'?: string;
  'Nguồn phát hành'?: string;
  'Ngày phát hành'?: string | Date;
  'Tiêu đề'?: string;
  'Loại tin'?: string;
  'Link'?: string;
  'Chi phí'?: number;
  'Mức độ nổi bật'?: string;
  'Giá trị truyền thông'?: number;
  'Nội dung'?: string;
  'Like'?: number;
  'Share'?: number;
  'Comment'?: number;
  'Tổng tương tác'?: number;
  'AI_CATEGORY'?: string;
  'AI_THELOAINOIDUNG'?: string;
  'AI_SACTHAI'?: string;
  'AI_NOTE'?: string;
}

export interface ParsedMention {
  brand: string;
  channel: string;
  source_name: string | null;
  published_date: string;
  title: string | null;
  original_type: string | null;
  source_url: string | null;
  ad_cost: number | null;
  prominence_level: string | null;
  media_value: number | null;
  content: string;
  likes: number;
  shares: number;
  comments: number;
  engagement: number;
  category: string;
  content_type: string;
  sentiment: string;
  ai_summary: string | null;
}

export interface ParseResult {
  success: boolean;
  data: ParsedMention[];
  errors: { row: number; message: string }[];
  totalRows: number;
}
