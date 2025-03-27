'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Script from 'next/script';

export default function AISearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visualization, setVisualization] = useState<string | null>(null);
  const [textOutput, setTextOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartJsLoaded, setChartJsLoaded] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Effect to handle visualization updates
  useEffect(() => {
    if (visualization && chartContainerRef.current && chartJsLoaded) {
      try {
        // Clean up any existing chart instance
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }

        // Clear the container and add a new canvas
        chartContainerRef.current.innerHTML = '';
        const canvas = document.createElement('canvas');
        chartContainerRef.current.appendChild(canvas);

        // Extract the chart configuration from the visualization HTML
        const scriptContent = visualization.match(/<script>([\s\S]*?)<\/script>/)?.[1] || '';
        
        // Create a safe function to execute the chart configuration
        const createChart = new Function('canvas', `
          try {
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            ${scriptContent}
          } catch (err) {
            console.error('Error creating chart:', err);
            throw err;
          }
        `);

        // Execute the chart creation
        createChart(canvas);

      } catch (error) {
        console.error('Error updating visualization:', error);
        toast.error('Error rendering visualization');
      }
    }
  }, [visualization, chartJsLoaded]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setVisualization(null);
    setTextOutput(null);
    
    try {
      const response = await fetch('/api/v1/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setVisualization(data.visualization);
      setTextOutput(data.textOutput);
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
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="beforeInteractive"
        onLoad={() => setChartJsLoaded(true)}
        onError={() => {
          console.error('Failed to load Chart.js');
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

        {/* Visualization Section */}
        {visualization && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Visualization</h2>
            <div 
              ref={chartContainerRef}
              className="min-h-[300px]"
            />
          </div>
        )}

        {/* Text Output Section */}
        {textOutput && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="min-h-[100px]">
              <p className="whitespace-pre-wrap">{textOutput}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 