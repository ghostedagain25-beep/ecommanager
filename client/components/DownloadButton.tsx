import React, { useCallback } from 'react';
import { DownloadIcon } from './icons';
import { convertToCsv } from '../services/dataProcessor';

interface DownloadButtonProps {
  jsonData: any[] | null;
  filename: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ jsonData, filename }) => {
  const handleDownload = useCallback(() => {
    if (!jsonData || jsonData.length === 0) return;

    const csvData = convertToCsv(jsonData);

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [jsonData, filename]);

  return (
    <button
      onClick={handleDownload}
      disabled={!jsonData || jsonData.length === 0}
      className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200"
    >
      <DownloadIcon className="w-5 h-5 mr-2" />
      Download CSV
    </button>
  );
};
