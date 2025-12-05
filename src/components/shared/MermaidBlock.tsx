'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidBlockProps {
  chart: string;
}

// Track if mermaid has been initialized
let mermaidInitialized = false;

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart.trim()) return;

      try {
        // Dynamic import mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default;

        // Initialize only once
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            themeVariables: {
              // Base forest theme colors
              primaryColor: '#52B788',
              primaryTextColor: '#1B4332',
              primaryBorderColor: '#2D6A4F',
              lineColor: '#40916C',
              secondaryColor: '#95D5B2',
              tertiaryColor: '#D8F3DC',

              // Background - light theme
              background: '#FFFFFF',
              mainBkg: '#F0FFF4',
              secondBkg: '#D8F3DC',

              // Text colors
              textColor: '#1B4332',
              titleColor: '#1B4332',
              nodeTextColor: '#1B4332',

              // Pie chart specific - forest palette
              pie1: '#52B788',
              pie2: '#74C69D',
              pie3: '#2D6A4F',
              pie4: '#95D5B2',
              pie5: '#40916C',
              pie6: '#B7E4C7',
              pie7: '#1B4332',
              pie8: '#D8F3DC',
              pie9: '#368A5E',
              pie10: '#A3D9BB',
              pie11: '#245C3D',
              pie12: '#C5EBDA',
              pieTitleTextSize: '16px',
              pieTitleTextColor: '#1B4332',
              pieSectionTextSize: '14px',
              pieSectionTextColor: '#FFFFFF',
              pieLegendTextSize: '14px',
              pieLegendTextColor: '#1B4332',
              pieStrokeColor: '#FFFFFF',
              pieStrokeWidth: '2px',
              pieOuterStrokeWidth: '2px',
              pieOuterStrokeColor: '#FFFFFF',
              pieOpacity: '1',

              // Flowchart
              nodeBorder: '#2D6A4F',
              clusterBkg: '#D8F3DC',
              clusterBorder: '#52B788',
              defaultLinkColor: '#40916C',
              edgeLabelBackground: '#F0FFF4',

              // Sequence diagram
              actorBkg: '#52B788',
              actorBorder: '#2D6A4F',
              actorTextColor: '#FFFFFF',
              actorLineColor: '#40916C',
              signalColor: '#1B4332',
              signalTextColor: '#1B4332',
              labelBoxBkgColor: '#D8F3DC',
              labelBoxBorderColor: '#52B788',
              labelTextColor: '#1B4332',
              loopTextColor: '#1B4332',
              noteBkgColor: '#D8F3DC',
              noteBorderColor: '#52B788',
              noteTextColor: '#1B4332',

              // State diagram
              labelColor: '#1B4332',
              altBackground: '#D8F3DC',

              // Class diagram
              classText: '#1B4332',

              // Git graph
              git0: '#52B788',
              git1: '#74C69D',
              git2: '#2D6A4F',
              git3: '#95D5B2',
              git4: '#40916C',
              git5: '#B7E4C7',
              git6: '#1B4332',
              git7: '#D8F3DC',
              gitBranchLabel0: '#FFFFFF',
              gitBranchLabel1: '#FFFFFF',
              gitBranchLabel2: '#FFFFFF',
              gitBranchLabel3: '#1B4332',
              commitLabelColor: '#1B4332',
              commitLabelBackground: '#D8F3DC',
            },
          });
          mermaidInitialized = true;
        }

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

        // Render the chart
        let { svg: renderedSvg } = await mermaid.render(id, chart.trim());

        // Post-process SVG to fix dark backgrounds in pie charts
        // The first rect in SVG is typically the background
        renderedSvg = renderedSvg
          // Replace background rect (first rect with full width/height)
          .replace(
            /(<rect[^>]*class="[^"]*"[^>]*)(fill="[^"]*")/,
            '$1fill="#FFFFFF"'
          )
          // Also catch inline style backgrounds
          .replace(
            /style="[^"]*background-color:\s*[^;"]+[^"]*"/g,
            'style="background-color: #FFFFFF"'
          )
          // Replace dark fills in general (colors starting with #2, #3, #4)
          .replace(/fill="#[234][0-9a-fA-F]{5}"/g, 'fill="#FFFFFF"');

        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setSvg('');
      }
    };

    renderChart();
  }, [chart]);

  // After SVG is rendered, fix background rect via DOM
  useEffect(() => {
    if (containerRef.current && svg) {
      // Find all rect elements and check for dark backgrounds
      const rects = containerRef.current.querySelectorAll('rect');
      rects.forEach((rect, index) => {
        const fill = rect.getAttribute('fill');
        // First rect is usually background, or any rect with dark color
        if (index === 0 || (fill && /^#[234][0-9a-fA-F]{5}$/i.test(fill))) {
          rect.setAttribute('fill', '#FFFFFF');
        }
      });

      // Also check SVG element itself for background style
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.style.backgroundColor = 'transparent';
      }
    }
  }, [svg]);

  if (error) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium mb-2">Lỗi render biểu đồ:</p>
        <pre className="text-xs text-red-500 overflow-x-auto">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">Xem code gốc</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{chart}</pre>
        </details>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 p-4 bg-forest-50 border border-forest-200 rounded-lg animate-pulse">
        <div className="h-32 flex items-center justify-center text-forest-600 text-sm">
          Đang render biểu đồ...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto bg-white rounded-lg p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
