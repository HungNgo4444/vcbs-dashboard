import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock Data Generator
const generateMockData = () => {
  const sovData = Array.from({ length: 30 }, (_, i) => ({
    date: `${(i + 1).toString().padStart(2, '0')}/11`,
    'Báo mạng': Math.floor(Math.random() * 50) + 20,
    'Facebook': Math.floor(Math.random() * 80) + 40,
    'YouTube': Math.floor(Math.random() * 30) + 10,
    'TikTok': Math.floor(Math.random() * 40) + 15,
  }));

  const stackedData = [
    { month: 'T8', 'Tin tức thị trường': 45, 'Bán hàng/Môi giới': 30, 'Tin thương hiệu': 25 },
    { month: 'T9', 'Tin tức thị trường': 40, 'Bán hàng/Môi giới': 35, 'Tin thương hiệu': 25 },
    { month: 'T10', 'Tin tức thị trường': 38, 'Bán hàng/Môi giới': 32, 'Tin thương hiệu': 30 },
    { month: 'T11', 'Tin tức thị trường': 42, 'Bán hàng/Môi giới': 28, 'Tin thương hiệu': 30 },
  ];

  const categories = [
    'Giao dịch ký quỹ', 'Mở tài khoản', 'Nền tảng giao dịch', 'Chứng chỉ quỹ', 
    'Nộp/Rút tiền', 'Báo cáo Phân tích', 'Trái phiếu', 'Cổ phiếu',
    'Blockchain & Crypto', 'Môi giới/Tư vấn', 'Chứng quyền', 'Phái sinh',
    'Phí & Ưu đãi', 'Tư vấn DN'
  ];

  const categoryData = [
    { name: 'Giao dịch ký quỹ', mentions: 599, change: -2 },
    { name: 'Mở tài khoản', mentions: 552, change: 0 },
    { name: 'Nền tảng giao dịch', mentions: 550, change: 1 },
    { name: 'Chứng chỉ quỹ', mentions: 542, change: -2 },
    { name: 'Nộp/Rút tiền', mentions: 529, change: 1 },
    { name: 'Báo cáo Phân tích', mentions: 459, change: 0 },
    { name: 'Trái phiếu', mentions: 449, change: 1 },
    { name: 'Cổ phiếu', mentions: 438, change: 0 },
    { name: 'Blockchain & Crypto', mentions: 428, change: -1 },
    { name: 'Môi giới/Tư vấn', mentions: 400, change: 0 },
    { name: 'Chứng quyền', mentions: 398, change: -2 },
    { name: 'Phái sinh', mentions: 337, change: -2 },
  ];

  const articles = [
    { id: 1, content: 'VCBS: Thị trường chứng khoán Việt Nam sẽ tăng trưởng mạnh trong Q4/2024 với động lực từ dòng vốn ngoại và các chính sách hỗ trợ...', sentiment: 'Tích cực', channel: 'Báo mạng', date: '28/11/2024', engagement: 1250 },
    { id: 2, content: 'Nhà đầu tư lo ngại về biến động thị trường, VCBS khuyến nghị thận trọng với các cổ phiếu có P/E cao trong giai đoạn hiện tại...', sentiment: 'Trung tính', channel: 'Facebook', date: '27/11/2024', engagement: 3420 },
    { id: 3, content: 'VCBS ra mắt nền tảng giao dịch mới VCBS Pro với nhiều tính năng ưu việt, giao diện thân thiện người dùng...', sentiment: 'Tích cực', channel: 'YouTube', date: '26/11/2024', engagement: 8900 },
    { id: 4, content: 'Phí giao dịch VCBS được điều chỉnh tăng, một số khách hàng phản hồi tiêu cực trên các kênh social media...', sentiment: 'Tiêu cực', channel: 'TikTok', date: '25/11/2024', engagement: 5600 },
    { id: 5, content: 'Báo cáo phân tích kỹ thuật VN-Index từ VCBS được các chuyên gia đánh giá cao về độ chính xác và chi tiết...', sentiment: 'Tích cực', channel: 'Báo mạng', date: '24/11/2024', engagement: 980 },
    { id: 6, content: 'VCBS tổ chức webinar miễn phí về chiến lược đầu tư phái sinh cho nhà đầu tư cá nhân, thu hút hàng nghìn người đăng ký...', sentiment: 'Tích cực', channel: 'Facebook', date: '23/11/2024', engagement: 4200 },
  ];

  return { sovData, stackedData, categoryData, articles };
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, isNegativeMetric = false }) => {
  // isNegativeMetric: true cho metric "Tiêu cực" - khi số giảm là tốt
  const isPositiveChange = isNegativeMetric ? change < 0 : change >= 0;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
      borderRadius: '16px',
      padding: '20px 24px',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(27, 67, 50, 0.25)',
      minHeight: '120px',
    }}>
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '120px',
        height: '120px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '40px',
        width: '60px',
        height: '60px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-1px' }}>{value}</div>
      {change !== undefined && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          fontSize: '12px',
          color: isPositiveChange ? '#B7E4C7' : '#FF8A8A',
          fontWeight: 500,
        }}>
          <span style={{ fontSize: '10px' }}>{change >= 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(change)}% vs tháng trước</span>
        </div>
      )}
    </div>
  );
};

// Filter Dropdown
const FilterDropdown = ({ label, options, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ 
      fontSize: '11px', 
      color: '#2D6A4F', 
      fontWeight: 700, 
      textTransform: 'uppercase', 
      letterSpacing: '0.8px' 
    }}>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '10px 32px 10px 12px',
        borderRadius: '8px',
        border: '2px solid #B7E4C7',
        background: '#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%231B4332\' d=\'M6 8L2 4h8z\'/%3E%3C/svg%3E") no-repeat right 12px center',
        color: '#1B4332',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        minWidth: '140px',
        transition: 'all 0.2s',
      }}
    >
      <option value="all">Tất cả</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

// Chart Card Wrapper
const ChartCard = ({ title, subtitle, children, action }) => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 24px rgba(27, 67, 50, 0.06)',
    border: '1px solid #D8F3DC',
    height: '100%',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div>
        <h3 style={{ 
          margin: 0, 
          color: '#1B4332', 
          fontSize: '15px', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{
            width: '4px',
            height: '18px',
            background: 'linear-gradient(180deg, #1B4332 0%, #52B788 100%)',
            borderRadius: '2px',
          }} />
          {title}
        </h3>
        {subtitle && <p style={{ margin: '6px 0 0 14px', fontSize: '12px', color: '#6C757D' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// Sentiment Badge
const SentimentBadge = ({ sentiment }) => {
  const config = {
    'Tích cực': { bg: '#D8F3DC', color: '#1B4332', border: '#95D5B2' },
    'Tiêu cực': { bg: '#FFE5E5', color: '#C41E3A', border: '#FFB3B3' },
    'Trung tính': { bg: '#F5F5F5', color: '#666', border: '#DDD' },
  };
  const c = config[sentiment] || config['Trung tính'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '5px 12px',
      borderRadius: '20px',
      background: c.bg,
      color: c.color,
      fontSize: '11px',
      fontWeight: 600,
      border: `1px solid ${c.border}`,
    }}>
      <span style={{ 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        background: c.color 
      }} />
      {sentiment}
    </span>
  );
};

// Channel Badge
const ChannelBadge = ({ channel }) => {
  const colors = {
    'Báo mạng': { bg: '#E8F5E9', color: '#1B4332' },
    'Facebook': { bg: '#E3F2FD', color: '#1565C0' },
    'YouTube': { bg: '#FFEBEE', color: '#C62828' },
    'TikTok': { bg: '#FCE4EC', color: '#AD1457' },
  };
  const c = colors[channel] || colors['Báo mạng'];
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '6px',
      background: c.bg,
      color: c.color,
      fontSize: '11px',
      fontWeight: 600,
    }}>
      {channel}
    </span>
  );
};

// Rank Change Indicator
const RankChange = ({ change }) => {
  if (change === 0) return <span style={{ color: '#999', fontSize: '12px' }}>—</span>;
  const isUp = change < 0;
  return (
    <span style={{ 
      color: isUp ? '#2D6A4F' : '#D62828',
      fontWeight: 700,
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
    }}>
      {isUp ? '↑' : '↓'}{Math.abs(change)}
    </span>
  );
};

// Main Dashboard
export default function VCBSDashboard() {
  // isAdmin sẽ được set bởi dev thông qua account, không có UI switch
  const isAdmin = false; // Thay đổi thành true để xem Admin view
  
  const [filters, setFilters] = useState({
    channel: 'all',
    sentiment: 'all',
    contentType: 'all',
    category: 'all',
  });

  const mockData = useMemo(() => generateMockData(), []);

  const channels = ['Báo mạng', 'Facebook', 'YouTube', 'TikTok'];
  const sentiments = ['Tích cực', 'Tiêu cực', 'Trung tính'];
  const contentTypes = ['Tin tức thị trường', 'Bán hàng/Môi giới', 'Tin thương hiệu'];
  const categories = [
    'Cổ phiếu', 'Trái phiếu', 'Chứng chỉ quỹ', 'Chứng quyền', 'Phái sinh',
    'Giao dịch ký quỹ', 'Nền tảng giao dịch', 'Mở tài khoản', 'Nộp/Rút tiền',
    'Môi giới/Tư vấn', 'Báo cáo Phân tích', 'Phí & Ưu đãi', 'Tư vấn DN', 'Blockchain & Crypto'
  ];

  const channelColors = {
    'Báo mạng': '#1B4332',
    'Facebook': '#2D6A4F',
    'YouTube': '#40916C',
    'TikTok': '#52B788',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FDF9 50%, #fff 100%)',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #081C15 0%, #1B4332 40%, #2D6A4F 100%)',
        padding: '0 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 30px rgba(0,0,0,0.15)',
        height: '70px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #40916C 0%, #74C69D 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#fff',
            fontSize: '16px',
            boxShadow: '0 4px 15px rgba(64, 145, 108, 0.4)',
            letterSpacing: '-0.5px',
          }}>
            VCBS
          </div>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Social Listening Dashboard
            </h1>
            <p style={{ margin: 0, color: '#95D5B2', fontSize: '12px' }}>
              Báo cáo phân tích truyền thông xã hội
            </p>
          </div>
        </div>
        
        {/* User Info - Role được set bởi dev */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #52B788 0%, #74C69D 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
          }}>
            NV
          </div>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Nguyễn Văn A</div>
            <div style={{ fontSize: '11px', color: '#95D5B2' }}>{isAdmin ? 'Quản trị viên' : 'Người dùng'}</div>
          </div>
        </div>
      </header>

      {/* Admin Upload Bar - Chỉ hiện khi isAdmin = true */}
      {isAdmin && (
        <div style={{
          background: 'linear-gradient(90deg, #2D6A4F 0%, #40916C 100%)',
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>Admin Panel: Upload file Excel để cập nhật dữ liệu dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{
              background: '#fff',
              color: '#1B4332',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
            }}>
              📁 Chọn File Excel
              <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            </label>
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
            }}>
              📋 Xem lịch sử upload
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: '#fff',
        padding: '20px 40px',
        borderBottom: '1px solid #D8F3DC',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        boxShadow: '0 2px 10px rgba(27, 67, 50, 0.04)',
      }}>
        <FilterDropdown 
          label="Kênh" 
          options={channels} 
          value={filters.channel}
          onChange={(v) => setFilters({...filters, channel: v})}
        />
        <FilterDropdown 
          label="Sắc thái" 
          options={sentiments} 
          value={filters.sentiment}
          onChange={(v) => setFilters({...filters, sentiment: v})}
        />
        <FilterDropdown 
          label="Thể loại nội dung" 
          options={contentTypes} 
          value={filters.contentType}
          onChange={(v) => setFilters({...filters, contentType: v})}
        />
        <FilterDropdown 
          label="Category" 
          options={categories} 
          value={filters.category}
          onChange={(v) => setFilters({...filters, category: v})}
        />
        
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button style={{
            background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)',
          }}>
            🔍 Áp dụng bộ lọc
          </button>
          <button style={{
            background: 'transparent',
            color: '#2D6A4F',
            border: '2px solid #B7E4C7',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}>
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ padding: '28px 40px' }}>
        {/* Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <MetricCard title="Tổng đề cập" value="12,847" change={8.5} icon="📢" />
          <MetricCard title="Tổng tương tác" value="89,234" change={12.3} icon="💬" />
          <MetricCard title="Tích cực" value="8,421" change={5.2} icon="😊" />
          <MetricCard title="Tiêu cực" value="1,203" change={-2.8} icon="😞" isNegativeMetric={true} />
          <MetricCard title="NSR Score" value="78.5" change={3.1} icon="📈" />
        </div>

        {/* Charts Row 1 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* SOV Line Chart */}
          <ChartCard 
            title="Share of Voice theo Kênh" 
            subtitle="Xu hướng đề cập trong 30 ngày qua"
            action={
              <select style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #D8F3DC',
                fontSize: '12px',
                color: '#1B4332',
                background: '#F0FDF4',
              }}>
                <option>30 ngày</option>
                <option>7 ngày</option>
                <option>90 ngày</option>
              </select>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mockData.sovData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#666' }} 
                  axisLine={{ stroke: '#D8F3DC' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#666' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #D8F3DC',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                  iconSize={8}
                />
                {Object.entries(channelColors).map(([key, color]) => (
                  <Line 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={color} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Stacked Bar Chart */}
          <ChartCard title="Phân bổ Nội dung theo Thể loại" subtitle="Tỷ lệ % theo từng tháng">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mockData.stackedData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#666' }} 
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#1B4332', fontWeight: 600 }} 
                  width={35}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(v) => `${v}%`}
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #D8F3DC',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar dataKey="Tin tức thị trường" stackId="a" fill="#1B4332" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Bán hàng/Môi giới" stackId="a" fill="#40916C" />
                <Bar dataKey="Tin thương hiệu" stackId="a" fill="#74C69D" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* Category Ranking */}
          <ChartCard 
            title="Đề cập theo Category" 
            subtitle="Top categories & thay đổi xếp hạng"
          >
            <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '8px' }}>
              {mockData.categoryData.map((item, idx) => (
                <div key={item.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < mockData.categoryData.length - 1 ? '1px solid #F0FDF4' : 'none',
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    background: idx < 3 
                      ? `linear-gradient(135deg, ${idx === 0 ? '#1B4332' : idx === 1 ? '#2D6A4F' : '#40916C'} 0%, ${idx === 0 ? '#2D6A4F' : idx === 1 ? '#40916C' : '#52B788'} 100%)`
                      : '#F0FDF4',
                    color: idx < 3 ? '#fff' : '#1B4332',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '11px',
                    marginRight: '12px',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: '#1B4332', 
                      marginBottom: '5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      height: '5px',
                      background: '#F0FDF4',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((item.mentions / 600) * 100, 100)}%`,
                        background: `linear-gradient(90deg, #1B4332 0%, #52B788 100%)`,
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: '#1B4332',
                    marginLeft: '12px',
                    minWidth: '45px',
                    textAlign: 'right',
                  }}>
                    {item.mentions}
                  </div>
                  <div style={{ marginLeft: '10px', minWidth: '30px', textAlign: 'center' }}>
                    <RankChange change={item.change} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Articles Table */}
          <ChartCard 
            title="Bảng tin Chi tiết" 
            subtitle="Danh sách bài viết mới nhất"
            action={
              <button style={{
                background: '#F0FDF4',
                border: '1px solid #B7E4C7',
                color: '#1B4332',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                Xem tất cả →
              </button>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'separate',
                borderSpacing: '0 4px',
                fontSize: '12px',
              }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '12px 10px', 
                      textAlign: 'left', 
                      color: '#2D6A4F', 
                      fontWeight: 700, 
                      background: '#F0FDF4',
                      borderRadius: '8px 0 0 8px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>Nội dung</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: '#2D6A4F', fontWeight: 700, background: '#F0FDF4', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '85px' }}>Kênh</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: '#2D6A4F', fontWeight: 700, background: '#F0FDF4', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Sắc thái</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', color: '#2D6A4F', fontWeight: 700, background: '#F0FDF4', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Tương tác</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', color: '#2D6A4F', fontWeight: 700, background: '#F0FDF4', borderRadius: '0 8px 8px 0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '90px' }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.articles.map((article) => (
                    <tr key={article.id} style={{ 
                      background: '#FAFFFE',
                      transition: 'all 0.2s',
                    }}>
                      <td style={{ 
                        padding: '14px 10px', 
                        color: '#333',
                        lineHeight: '1.5',
                        borderRadius: '8px 0 0 8px',
                        maxWidth: '300px',
                      }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {article.content}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <ChannelBadge channel={article.channel} />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <SentimentBadge sentiment={article.sentiment} />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1B4332', fontWeight: 600 }}>
                        {article.engagement.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center', color: '#666', fontSize: '11px', borderRadius: '0 8px 8px 0' }}>
                        {article.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #F0FDF4',
            }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Hiển thị 1-6 của 1,247 bài viết</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, '...', 208].map((page, idx) => (
                  <button
                    key={idx}
                    style={{
                      width: '30px',
                      height: '30px',
                      border: page === 1 ? 'none' : '1px solid #D8F3DC',
                      background: page === 1 ? 'linear-gradient(135deg, #1B4332, #2D6A4F)' : '#fff',
                      color: page === 1 ? '#fff' : '#2D6A4F',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Footer - Chỉ hiển thị thông tin, không có button export */}
        <div style={{
          marginTop: '24px',
          padding: '18px 24px',
          background: '#fff',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid #D8F3DC',
          boxShadow: '0 2px 10px rgba(27, 67, 50, 0.04)',
          gap: '24px',
        }}>
          <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#1B4332', fontWeight: 600 }}>📅 Cập nhật:</span> 28/11/2024 15:30
          </div>
          <div style={{ width: '1px', height: '16px', background: '#D8F3DC' }} />
          <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#1B4332', fontWeight: 600 }}>📊 Khoảng thời gian:</span> 01/11 - 28/11/2024
          </div>
        </div>
      </main>
    </div>
  );
}
