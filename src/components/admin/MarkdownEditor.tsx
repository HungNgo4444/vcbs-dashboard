'use client';

import { useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  Link,
  Heading2,
  Quote,
  List,
  ListOrdered,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toolbarButtons: ToolbarButton[] = [
    { icon: <Bold className="w-4 h-4" />, label: 'Bold', prefix: '**', suffix: '**' },
    { icon: <Italic className="w-4 h-4" />, label: 'Italic', prefix: '_', suffix: '_' },
    { icon: <Link className="w-4 h-4" />, label: 'Link', prefix: '[', suffix: '](url)' },
    { icon: <Heading2 className="w-4 h-4" />, label: 'Heading', prefix: '## ', suffix: '', block: true },
    { icon: <Quote className="w-4 h-4" />, label: 'Quote', prefix: '> ', suffix: '', block: true },
    { icon: <List className="w-4 h-4" />, label: 'Bullet List', prefix: '- ', suffix: '', block: true },
    { icon: <ListOrdered className="w-4 h-4" />, label: 'Numbered List', prefix: '1. ', suffix: '', block: true },
  ];

  const insertMarkdown = useCallback((prefix: string, suffix: string, block?: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText: string;
    let newCursorPos: number;

    if (block) {
      // For block elements, add newline if not at start of line
      const beforeSelection = value.substring(0, start);
      const needsNewline = beforeSelection.length > 0 && !beforeSelection.endsWith('\n');
      const linePrefix = needsNewline ? '\n' : '';

      newText = value.substring(0, start) + linePrefix + prefix + selectedText + suffix + value.substring(end);
      newCursorPos = start + linePrefix.length + prefix.length + selectedText.length + suffix.length;
    } else {
      newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    }

    onChange(newText);

    // Restore cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  return (
    <div className="border-2 border-forest-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-forest-50 border-b border-forest-200">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => insertMarkdown(btn.prefix, btn.suffix, btn.block)}
            className="p-2 rounded-md hover:bg-forest-100 text-forest-700 transition-colors"
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-gray-500">Markdown supported</span>
      </div>

      {/* Editor and Preview */}
      <div className="grid grid-cols-2 divide-x divide-forest-200">
        {/* Editor */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Nhập nội dung markdown...'}
            className="w-full h-[400px] p-4 resize-none outline-none text-[14px] text-forest-800 font-mono leading-relaxed"
          />
        </div>

        {/* Preview */}
        <div className="h-[400px] overflow-y-auto p-4 bg-gray-50">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-semibold">
            Preview
          </div>
          <div className="prose prose-sm max-w-none
            prose-headings:text-forest-800 prose-headings:font-bold
            prose-h1:text-xl prose-h1:border-b prose-h1:border-forest-200 prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-forest-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-forest-800 prose-strong:font-semibold
            prose-ul:my-2 prose-ol:my-2
            prose-li:text-gray-700 prose-li:my-1
            prose-blockquote:border-l-4 prose-blockquote:border-forest-400 prose-blockquote:bg-forest-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-forest-800
            prose-table:border-collapse prose-table:w-full prose-table:my-4
            prose-th:bg-forest-100 prose-th:text-forest-800 prose-th:font-semibold prose-th:text-left prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-forest-200
            prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-forest-200 prose-td:text-gray-700
            prose-hr:border-forest-200
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '*Chưa có nội dung*'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
