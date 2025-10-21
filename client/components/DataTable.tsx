import React, { useState, useMemo, useEffect } from 'react';
// FIX: Update import path for types.
import type { FinalStockData } from '../types/processing';
import { DownloadButton } from './DownloadButton';
// FIX: Update import path for constants.
import { OUTPUT_FILENAME } from '../config/constants';
import { SearchIcon, SortAscIcon, SortDescIcon, SortIcon } from './icons';

interface DataTableProps {
  data: FinalStockData[];
  onReset: () => void;
}

type SortConfig = {
  key: keyof FinalStockData | null;
  direction: 'ascending' | 'descending';
};

export const DataTable: React.FC<DataTableProps> = ({ data, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedData.filter((item) => {
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(lowercasedFilter),
      );
    });
  }, [sortedData, searchTerm]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (newTotalPages > 0 && currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0) {
      setCurrentPage(1);
    }
  }, [filteredData.length, rowsPerPage, currentPage]);

  const currentRows = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filteredData.slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const requestSort = (key: keyof FinalStockData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const headers = data.length > 0 ? (Object.keys(data[0]) as (keyof FinalStockData)[]) : [];

  const getSortIcon = (key: keyof FinalStockData) => {
    if (sortConfig.key !== key) {
      return <SortIcon className="w-4 h-4 text-gray-500" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <SortAscIcon className="w-4 h-4 text-sky-400" />;
    }
    return <SortDescIcon className="w-4 h-4 text-sky-400" />;
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, filteredData.length);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-center text-white mb-6">Data Preview</h2>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
        <div className="relative w-full md:w-auto md:flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder={`Search ${data.length} records...`}
            className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            value={searchTerm}
          />
        </div>
        <div className="flex items-center space-x-4">
          <DownloadButton jsonData={data} filename={OUTPUT_FILENAME} />
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
          >
            Process New Files
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {currentRows.map((row, index) => (
          <div
            key={`${row.SKU}-${index}`}
            className="w-full rounded-2xl bg-[#0d1b2a] p-4 shadow-md border border-slate-700 text-gray-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">SKU</p>
                <p className="font-bold text-white break-all">{row.SKU}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xs text-gray-400">Stock</p>
                <p className="font-semibold text-sky-300">{row.STOCK}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-slate-700 pt-3">
              {Object.entries(row).map(([key, value]) => {
                if (key === 'SKU' || key === 'STOCK') return null;
                return (
                  <div key={key} className="flex justify-between items-start gap-4">
                    <span className="font-medium text-gray-400 capitalize flex-shrink-0">
                      {key.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-100 text-right break-all">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => requestSort(key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{key}</span>
                    {getSortIcon(key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {currentRows.length > 0 ? (
              currentRows.map((row, index) => (
                <tr key={`${row.SKU}-${index}`} className="hover:bg-gray-700/50">
                  {headers.map((key) => (
                    <td
                      key={key}
                      data-label={key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                    >
                      {row[key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                  {searchTerm ? `No results found for "${searchTerm}".` : 'No data to display.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4 px-2">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>Rows:</span>
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="bg-gray-700 border border-gray-600 rounded-md p-1 focus:ring-sky-500 focus:border-sky-500"
            disabled={filteredData.length === 0}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        {filteredData.length > 0
          ? `Showing ${startRow} to ${endRow} of ${filteredData.length} records.`
          : 'No records to display.'}
        {searchTerm &&
          filteredData.length !== data.length &&
          ` (Filtered from ${data.length} total)`}
      </p>
    </div>
  );
};
