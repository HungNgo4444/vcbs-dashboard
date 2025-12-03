// Allowed values - Admin phải chuẩn hóa data trước khi upload
export const ALLOWED_CHANNELS = [
  'Báo mạng',
  'Facebook',
  'Youtube',
  'Tiktok',
] as const;

export const ALLOWED_SENTIMENTS = [
  'Tích cực',
  'Tiêu cực',
  'Trung tính',
] as const;

export const ALLOWED_CONTENT_TYPES = [
  'Tin tức thị trường',
  'Bán hàng/Môi giới',
  'Tin trực tiếp về thương hiệu',
] as const;

export const ALLOWED_CATEGORIES = [
  'Cổ phiếu',
  'Trái phiếu',
  'Chứng chỉ quỹ',
  'Chứng quyền',
  'Phái sinh',
  'Giao dịch ký quỹ',
  'Nền tảng giao dịch',
  'Mở tài khoản',
  'Nộp/Rút tiền',
  'Môi giới/Tư vấn',
  'Báo cáo Phân tích',
  'Phí & Ưu đãi',
  'Tư vấn Doanh nghiệp',
  'Blockchain & Tài sản mã hóa',
] as const;

// Excel Column → Database Column Mapping
export const EXCEL_TO_DB_MAPPING: Record<string, string> = {
  'Khách hàng': 'brand',
  'Phương tiện': 'channel',
  'Nguồn phát hành': 'source_name',
  'Ngày phát hành': 'published_date',
  'Tiêu đề': 'title',
  'Loại tin': 'original_type',
  'Link': 'source_url',
  'Chi phí': 'ad_cost',
  'Mức độ nổi bật': 'prominence_level',
  'Giá trị truyền thông': 'media_value',
  'Nội dung': 'content',
  'Like': 'likes',
  'Share': 'shares',
  'Comment': 'comments',
  'Tổng tương tác': 'engagement',
  'AI_CATEGORY': 'category',
  'AI_THELOAINOIDUNG': 'content_type',
  'AI_SACTHAI': 'sentiment',
  'AI_NOTE': 'ai_summary',
};

// Chart colors - Updated: Facebook=blue, Tiktok=teal, Youtube=red
export const CHANNEL_COLORS: Record<string, string> = {
  'Báo mạng': '#1B4332',
  'Facebook': '#1877F2',
  'Youtube': '#FF0000',
  'Tiktok': '#00BCD4',
};

export const CONTENT_TYPE_COLORS: Record<string, string> = {
  'Tin tức thị trường': '#1B4332',
  'Bán hàng/Môi giới': '#40916C',
  'Tin trực tiếp về thương hiệu': '#74C69D',
};

// Badge colors
export const SENTIMENT_COLORS = {
  'Tích cực': { bg: '#D8F3DC', text: '#1B4332', border: '#95D5B2' },
  'Tiêu cực': { bg: '#FFE5E5', text: '#C41E3A', border: '#FFB3B3' },
  'Trung tính': { bg: '#F5F5F5', text: '#666666', border: '#DDDDDD' },
};

export const CHANNEL_BADGE_COLORS = {
  'Báo mạng': { bg: '#E8F5E9', text: '#1B4332' },
  'Facebook': { bg: '#E3F2FD', text: '#1565C0' },
  'Youtube': { bg: '#FFEBEE', text: '#C62828' },
  'Tiktok': { bg: '#FCE4EC', text: '#AD1457' },
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

