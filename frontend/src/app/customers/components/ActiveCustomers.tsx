import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { endpoints } from '@/lib/api';

interface ActiveCustomersProps {
  customers: Customer[];
  onActiveListUpdated?: (activeCustomers: Customer[]) => void;
}

export default function ActiveCustomers({ customers, onActiveListUpdated }: ActiveCustomersProps) {
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  
  // Fetch active customers from the API - only on initial mount
  useEffect(() => {
    const fetchActiveCustomers = async () => {
      try {
        setLoading(true);
        const response = await endpoints.customers.getActive();
        setActiveCustomers(response.data || []);
        setError(null);
        
        // Notify parent component of active customers
        if (onActiveListUpdated) {
          onActiveListUpdated(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching active customers:', err);
        setError('Failed to load active customers');
        setActiveCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCustomers();
    // Empty dependency array ensures this only runs once on mount
  }, []);

  // Fetch historical data when graph is shown
  useEffect(() => {
    if (showGraph) {
      const fetchHistoricalData = async () => {
        try {
          setGraphLoading(true);
          setGraphError(null);
          const response = await endpoints.customers.getActiveHistory();
          console.log('History data response:', response.data);
          
          if (!response.data || response.data.length === 0) {
            console.log('No history data returned from API');
            setGraphData([]);
            return;
          }
          
          // Format the data for the chart
          const formattedData = response.data.map((item: any) => {
            console.log('Processing history item:', item);
            return {
              month: format(new Date(item.month + '-01'), 'MMM yyyy'),
              activeCustomers: item.activeCustomers // Using the property name from the backend
            };
          });
          
          console.log('Formatted graph data:', formattedData);
          setGraphData(formattedData);
        } catch (err) {
          console.error('Error fetching active customers history:', err);
          setGraphError('Failed to load historical data');
        } finally {
          setGraphLoading(false);
        }
      };
      
      fetchHistoricalData();
    }
  }, [showGraph]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div 
        className="cursor-pointer"
        onClick={() => setShowGraph(!showGraph)}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Active Customers</h2>
          {loading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : error ? (
            <span className="text-sm text-red-500">{error}</span>
          ) : (
            <span className="text-2xl font-bold text-blue-600">{activeCustomers.length}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Customers with 2+ appointments and active in the last 100 days
        </p>
      </div>
      
      {showGraph && (
        <div className="mt-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Active Customers Over Time</h3>
          {graphLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading history data...</p>
              </div>
            </div>
          ) : graphError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {graphError}
            </div>
          ) : graphData.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No historical data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={graphData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="activeCustomers" 
                    name="Active Customers"
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 