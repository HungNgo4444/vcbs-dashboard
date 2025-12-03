'use client';

import { useState } from 'react';
import { SentimentBadge } from '@/components/shared/SentimentBadge';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import type { Mention, Channel, Sentiment } from '@/types';
import { format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

interface ArticlesTableProps {
  articles: Mention[];
  maxHeight?: number;
}

type SortField = 'published_date' | 'engagement' | 'sentiment' | 'channel';
type SortDirection = 'asc' | 'desc';

export function ArticlesTable({
  articles,
  maxHeight = 450,
}: ArticlesTableProps) {
  const [sortField, setSortField] = useState<SortField>('published_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredArticle, setHoveredArticle] = useState<string | null>(null);

  // Sort articles locally
  const sortedArticles = [...articles].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'published_date':
        comparison = new Date(a.published_date).getTime() - new Date(b.published_date).getTime();
        break;
      case 'engagement':
        comparison = (a.engagement || 0) - (b.engagement || 0);
        break;
      case 'sentiment':
        const sentimentOrder = { 'Tích cực': 0, 'Trung tính': 1, 'Tiêu cực': 2 };
        comparison = sentimentOrder[a.sentiment] - sentimentOrder[b.sentiment];
        break;
      case 'channel':
        comparison = a.channel.localeCompare(b.channel);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const headerClass = "p-3 text-forest-700 font-bold bg-forest-50 text-[12px] uppercase tracking-wide cursor-pointer hover:bg-forest-100 transition-colors select-none sticky top-0 z-10";

  return (
    <div>
      <div
        className="overflow-y-auto overflow-x-auto"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}>
          <thead>
            <tr>
              <th
                className={`${headerClass} rounded-l-lg text-center w-[110px]`}
                onClick={() => handleSort('published_date')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Ngày
                  <SortIcon field="published_date" />
                </div>
              </th>
              <th className={`${headerClass} text-left`}>
                Nội dung
              </th>
              <th
                className={`${headerClass} text-center w-[135px]`}
                onClick={() => handleSort('channel')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Kênh
                  <SortIcon field="channel" />
                </div>
              </th>
              <th
                className={`${headerClass} text-center w-[150px]`}
                onClick={() => handleSort('sentiment')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Sắc thái
                  <SortIcon field="sentiment" />
                </div>
              </th>
              <th
                className={`${headerClass} text-right w-[150px]`}
                onClick={() => handleSort('engagement')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  Tương tác
                  <SortIcon field="engagement" />
                </div>
              </th>
              <th className={`${headerClass} rounded-r-lg text-center w-[50px]`}>
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedArticles.map((article) => (
              <tr
                key={article.id}
                className="bg-[#FAFFFE] hover:bg-forest-50 transition-colors relative"
                onMouseEnter={() => setHoveredArticle(article.id)}
                onMouseLeave={() => setHoveredArticle(null)}
              >
                <td className="p-3 text-center text-forest-800 font-medium rounded-l-lg text-[13px]">
                  {format(new Date(article.published_date), 'dd/MM/yyyy')}
                </td>
                <td className="p-3 text-gray-700 relative">
                  <div
                    className="overflow-hidden text-[13px] leading-snug font-medium"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                    title={article.ai_summary || article.content}
                  >
                    {article.ai_summary || article.title || article.content}
                  </div>

                  {/* Hover popup for full content */}
                  {hoveredArticle === article.id && article.content && (
                    <div
                      className="absolute left-0 top-full z-50 mt-1 p-4 bg-white rounded-lg shadow-xl border border-forest-200 max-w-[500px] max-h-[300px] overflow-y-auto"
                      style={{ minWidth: '300px' }}
                    >
                      <div className="text-[11px] text-forest-600 font-semibold uppercase mb-2">
                        Nội dung chi tiết
                      </div>
                      <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {article.content}
                      </div>
                    </div>
                  )}
                </td>
                <td className="p-3 text-center">
                  <ChannelBadge channel={article.channel as Channel} />
                </td>
                <td className="p-3 text-center">
                  <SentimentBadge sentiment={article.sentiment as Sentiment} />
                </td>
                <td className="p-3 text-right text-forest-800 font-bold text-[14px]">
                  {article.engagement.toLocaleString()}
                </td>
                <td className="p-3 text-center rounded-r-lg">
                  {article.source_url ? (
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-forest-50 hover:bg-forest-100 text-forest-700 transition-colors"
                      title="Xem bài viết gốc"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-forest-50">
        <span className="text-[13px] text-gray-500">
          Hiển thị {articles.length.toLocaleString()} bài viết
        </span>
      </div>
    </div>
  );
}
