'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Script from 'next/script';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Custom markdown component
const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none markdown-body">
      {/* @ts-ignore */}
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Declare ECharts types
declare global {
  interface Window {
    echarts: any;
  }
}

interface AISearchResponse {
  visualization: string | null;
  textOutput: string | null;
  steps: string[];
  originalQuery?: string;
  fixedQuery?: string;
  error?: string;
}

export default function AISearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visualization, setVisualization] = useState<string | null>(null);
  const [textOutput, setTextOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [echartsLoaded, setEchartsLoaded] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [response, setResponse] = useState<AISearchResponse | null>(null);

  // Effect to handle visualization updates
  useEffect(() => {
    const initChart = async () => {
      if (!visualization || !chartContainerRef.current || !window.echarts) {
        return;
      }

      try {
        // Clean up existing instance
        if (chartInstanceRef.current) {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        }

        // Initialize container
        const chartContainer = chartContainerRef.current;

        // Check if the visualization is a chart configuration
        const optionsMatch = visualization.match(/const options = ({[\s\S]*?});/);
        if (!optionsMatch) {
          // If not a chart configuration, display as HTML
          chartContainer.innerHTML = visualization;
          return;
        }

        // Handle chart visualization
        const optionsStr = optionsMatch[1];
        const options = JSON.parse(JSON.stringify(eval(`(${optionsStr})`)));

        // Initialize chart
        chartInstanceRef.current = window.echarts.init(chartContainer);

        // Update options with better defaults
        const finalOptions = {
          ...options,
          animation: true,
          grid: {
            top: 50,
            right: 30,
            bottom: 50,
            left: 60,
            containLabel: true
          },
          tooltip: {
            ...options.tooltip,
            formatter: options.tooltip?.formatter || undefined
          }
        };

        // If it's a time-based chart with YYYYWW format, format the labels
        if (options.xAxis?.data?.[0]?.toString().match(/^\d{6}$/)) {
          finalOptions.xAxis = {
            ...options.xAxis,
            data: options.xAxis.data.map((item: string | number) => {
              const str = item.toString();
              const year = str.substring(0, 4);
              const week = str.substring(4);
              return `Week ${week}`;
            }),
            axisLabel: {
              interval: 'auto',
              rotate: 45,
              margin: 8
            }
          };
          
          // Update tooltip for week format
          finalOptions.tooltip.formatter = (params: any) => {
            const value = typeof params[0].value === 'number' 
              ? params[0].value.toFixed(2) 
              : params[0].value;
            const weekData = options.xAxis.data[params[0].dataIndex];
            const year = weekData.toString().substring(0, 4);
            const week = weekData.toString().substring(4);
            return `Week ${week}, ${year}<br/>${params[0].seriesName || 'Value'}: ${typeof value === 'number' && options.yAxis?.axisLabel?.formatter?.includes('€') ? '€' : ''}${value}`;
          };
        }

        chartInstanceRef.current.setOption(finalOptions);

        // Handle resize
        const handleResize = () => {
          if (chartInstanceRef.current) {
            chartInstanceRef.current.resize();
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      } catch (error) {
        console.error('Error in visualization:', error);
        toast.error('Error rendering visualization');
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    if (visualization && echartsLoaded) {
      const timer = setTimeout(() => {
        initChart();
      }, 250);

      return () => {
        clearTimeout(timer);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.dispose();
        }
      };
    }
  }, [visualization, echartsLoaded]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setVisualization(null);
    setTextOutput(null);
    setResponse(null);
    
    try {
      const response = await fetch('/api/v1/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data: AISearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setVisualization(data.visualization);
      setTextOutput(data.textOutput);
      setResponse(data);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred while processing your request.');
      toast.error(error.message || 'Failed to process search request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setEchartsLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load ECharts:', e);
          toast.error('Failed to load visualization library');
        }}
      />
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">AI Search</h1>
        
        {/* Search Input Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter your search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Execution Steps and Queries */}
        {response && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">Execution Details</h2>
            
            {/* Steps Timeline */}
            <div className="space-y-2">
              {response.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  </div>
                  <p className="text-gray-600">{step}</p>
                </div>
              ))}
            </div>

            {/* SQL Queries */}
            {response.originalQuery && (
              <div className="mt-4 space-y-3">
                <h3 className="font-semibold text-gray-700">Generated SQL Query:</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {response.originalQuery}
                </pre>
              </div>
            )}
            
            {response.fixedQuery && (
              <div className="mt-4 space-y-3">
                <h3 className="font-semibold text-gray-700">Fixed SQL Query:</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                  {response.fixedQuery}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Visualization Section */}
        {visualization && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Visualization</h2>
            <div 
              ref={chartContainerRef}
              style={{ width: '100%', height: '500px' }}
              className="relative bg-gray-50"
            />
          </div>
        )}

        {/* Text Output Section */}
        {textOutput && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <MarkdownRenderer content={textOutput} />
          </div>
        )}
      </div>
    </>
  );
} 