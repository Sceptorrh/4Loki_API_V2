'use client';

import { useState } from 'react';
import { FaDownload, FaUpload, FaExclamationTriangle, FaCheckCircle, FaTrash, FaAngleDown, FaAngleUp, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

interface PreviewData {
  [key: string]: any[];
}

interface ValidationError {
  field: string;
  error: string;
  value: any;
}

interface ErrorDetail {
  message: string;
  details: any;
  error?: any;
  sqlError?: string;
  validationErrors?: ValidationError[];
  errorType: string;
}

interface TableErrorReport {
  tableName: string;
  count: number;
  items: ErrorDetail[];
}

interface ImportReport {
  summary: {
    total: {
      success: number;
      failed: number;
    };
    tables: {
      [key: string]: {
        success: number;
        failed: number;
      };
    };
    missingSheets?: string[];
  };
  errorsByTable: TableErrorReport[];
}

// Error Report Component
const ErrorReportTable = ({ report }: { report: ImportReport }) => {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  if (!report?.errorsByTable?.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
        <FaTimesCircle />
        Import Errors
      </h3>

      <div className="space-y-4">
        {report.errorsByTable.map((tableReport) => (
          <div key={tableReport.tableName} className="border border-red-200 rounded-lg overflow-hidden">
            <div 
              className="bg-red-50 px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleTable(tableReport.tableName)}
            >
              <h4 className="font-medium text-red-700">
                {tableReport.tableName} - {tableReport.count} failed records
              </h4>
              {expandedTables[tableReport.tableName] ? <FaAngleUp /> : <FaAngleDown />}
            </div>

            {expandedTables[tableReport.tableName] && (
              <div className="px-4 py-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableReport.items.map((error, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-sm text-gray-700 align-top">
                          <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            {error.errorType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 align-top">
                          <div className="grid grid-cols-1 gap-1">
                            {error.details.id && <div><span className="font-medium">ID:</span> {error.details.id}</div>}
                            {error.details.name && <div><span className="font-medium">Name:</span> {error.details.name}</div>}
                            {error.details.date && <div><span className="font-medium">Date:</span> {error.details.date}</div>}
                            {error.details.time && <div><span className="font-medium">Time:</span> {error.details.time}</div>}
                            {error.details.customerId && <div><span className="font-medium">Customer ID:</span> {error.details.customerId}</div>}
                            {error.details.status && <div><span className="font-medium">Status:</span> {error.details.status}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 align-top">
                          {error.message}
                          {error.validationErrors && (
                            <ul className="list-disc ml-4 mt-2 text-xs">
                              {error.validationErrors.map((ve, i) => (
                                <li key={i}>
                                  <strong>{ve.field}:</strong> {ve.error} 
                                  {ve.value && <span> (value: {JSON.stringify(ve.value)})</span>}
                                </li>
                              ))}
                            </ul>
                          )}
                          {error.sqlError && (
                            <div className="bg-gray-100 p-2 mt-2 rounded text-xs overflow-auto">
                              <code>{error.sqlError}</code>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/backup/export`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export backup');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : '4loki_backup.xlsx';

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setPreviewData(null);
    setShowPreview(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/backup/preview`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview backup');
      }

      setPreviewData(data.preview);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    // Explicitly define the EventSource type
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    // Helper function to safely close the EventSource
    const closeEventSource = (source: EventSource | null) => {
      if (source) {
        try {
          source.close();
        } catch (err) {
          console.error('Error closing EventSource:', err);
        }
        return null;
      }
      return null;
    };

    const setupEventSource = () => {
      // Close existing connection if any
      eventSource = closeEventSource(eventSource);

      // Set up event source for progress updates with error handling
      const eventSourceUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/backup/import/progress`;
      console.log('Connecting to EventSource:', eventSourceUrl);
      
      eventSource = new EventSource(eventSourceUrl);
      
      eventSource.onopen = () => {
        console.log('EventSource connection opened');
        retryCount = 0; // Reset retry count on successful connection
      };
      
      eventSource.onmessage = (event) => {
        console.log('Received progress update:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.progress !== undefined) {
            setImportProgress(data.progress);
            setProgressMessage(data.message || 'Importing...');
            
            // If we've reached 100%, close the connection
            if (data.progress === 100) {
              console.log('Import complete, closing EventSource');
              eventSource = closeEventSource(eventSource);
            }
          }
        } catch (err) {
          console.error('Error parsing progress data:', err);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        
        // Try to reconnect a few times
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Attempting to reconnect (attempt ${retryCount} of ${MAX_RETRIES})...`);
          // Close current connection
          eventSource = closeEventSource(eventSource);
          // Wait a second before reconnecting
          setTimeout(setupEventSource, 1000);
        } else {
          console.log('Max retry attempts reached, giving up on EventSource connection');
          // Only close if we still have a reference
          eventSource = closeEventSource(eventSource);
          // Don't set an error here as the import might still be working
        }
      };
    };

    try {
      setIsImporting(true);
      setError(null);
      setImportResult(null);
      setImportProgress(0);
      setProgressMessage('Starting import...');
      
      // Set up the EventSource connection
      setupEventSource();

      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Starting import request');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/backup/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      console.log('Import request completed');
      
      // Close the event source if it's still open
      eventSource = closeEventSource(eventSource);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import backup');
      }

      setImportResult(data);
      setShowPreview(false);
      setSelectedFile(null);
      setImportProgress(100);
      setProgressMessage('Import complete');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message);
      setImportProgress(0);
    } finally {
      // Make absolutely sure we close the EventSource
      eventSource = closeEventSource(eventSource);
      setIsImporting(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      setIsClearing(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/backup/clear`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear database');
      }

      // Show success message
      setImportResult({ message: 'Database cleared successfully' });
      setShowClearConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Backup & Restore</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Export Data</h2>
          <p className="text-gray-600 mb-4">
            Download a backup of all your data in Excel format.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <FaDownload /> Export Backup
              </>
            )}
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Import Data</h2>
          <p className="text-gray-600 mb-4">
            Restore your data from a backup file.
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`w-full bg-secondary-600 text-white py-2 px-4 rounded-md hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ${
                isImporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isImporting ? (
                'Importing...'
              ) : (
                <>
                  <FaUpload /> Select Backup File
                </>
              )}
            </label>
          </div>
        </div>

        {/* Clear Database Section */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Clear Database</h2>
          <p className="text-gray-600 mb-4">
            Warning: This will permanently delete all non-static data from the database.
            This action cannot be undone.
          </p>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={isClearing}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isClearing ? (
              'Clearing...'
            ) : (
              <>
                <FaTrash /> Clear Database
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && previewData && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Preview Import Data</h2>
          <div className="space-y-6">
            {Object.entries(previewData).map(([table, rows]) => (
              <div key={table} className="overflow-x-auto">
                <h3 className="text-lg font-medium mb-2 capitalize">{table}</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(rows[0] || {}).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td
                            key={i}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {value === null ? 'NULL' : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length > 5 && (
                      <tr>
                        <td
                          colSpan={Object.keys(rows[0] || {}).length}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          ... and {rows.length - 5} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>
        </div>
      )}

      {/* Import Progress Bar */}
      {isImporting && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Import Progress</h2>
          <div className="mb-2 flex justify-between">
            <span>{progressMessage}</span>
            <span>{importProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-primary-600 h-4 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Clear Database Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <FaExclamationTriangle className="text-2xl" />
              <h3 className="text-xl font-semibold">Confirm Database Clear</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear all non-static data from the database?
              This action cannot be undone. Please make sure you have a backup before proceeding.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDatabase}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearing ? 'Clearing...' : 'Clear Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {(importResult || error) && (
        <div className="mt-8">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                <FaCheckCircle />
                <span>{importResult.message}</span>
              </div>
              
              {/* Display Missing Sheets Warning */}
              {importResult.report?.summary?.missingSheets && 
               importResult.report.summary.missingSheets.length > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md flex gap-2">
                  <FaInfoCircle className="mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Some sheets were not imported:</p>
                    <ul className="list-disc ml-5 mt-1">
                      {importResult.report.summary.missingSheets.map((sheet: string, index: number) => (
                        <li key={index}>{sheet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Import Summary */}
              {importResult.report && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">Import Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{importResult.report.summary.total.success}</div>
                      <div className="text-sm text-gray-500">Records imported</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{importResult.report.summary.total.failed}</div>
                      <div className="text-sm text-gray-500">Records failed</div>
                    </div>
                    
                    {/* Table-specific counts - show all tables */}
                    {['Customer', 'Dog', 'Appointment', 'AppointmentDog', 'AdditionalHour', 'DogDogbreed', 'ServiceAppointmentDog'].map((tableName) => {
                      // Get counts from import result if available, otherwise show zeros
                      const counts = importResult.report.summary.tables[tableName] || { success: 0, failed: 0 };
                      
                      // Determine if this table was part of the import
                      const isImported = !!importResult.report.summary.tables[tableName];
                      const isMissing = importResult.report.summary.missingSheets?.includes(tableName);
                      
                      return (
                        <div key={tableName} className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-lg font-medium flex items-center justify-between">
                            {tableName}
                            {isMissing && (
                              <span title="Table was missing from import" className="text-yellow-500 ml-1">
                                <FaInfoCircle size={14} />
                              </span>
                            )}
                            {!isImported && !isMissing && (
                              <span title="Table was not part of this import" className="text-gray-400 ml-1">
                                <FaInfoCircle size={14} />
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between mt-2">
                            <div>
                              <div className="text-sm text-gray-500">Success</div>
                              <div className="text-green-600 font-bold">{counts.success}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Failed</div>
                              <div className="text-red-600 font-bold">{counts.failed}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Show Error Report if there are failures */}
              {importResult.report && importResult.report.summary.total.failed > 0 && (
                <ErrorReportTable report={importResult.report} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 