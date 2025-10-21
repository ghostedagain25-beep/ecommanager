import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon, SortAscIcon, SortDescIcon, SortIcon } from './icons';

interface GenericDataTableProps {
  columns: string[];
  rows: any[][];
  tableName: string;
}

type SortConfig = {
  key: string | null;
  direction: 'ascending' | 'descending';
};

export const GenericDataTable: React.FC<GenericDataTableProps> = ({ columns, rows, tableName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedData = useMemo(() => {
    let sortableItems = [...rows];
    if (sortConfig.key !== null) {
      const sortIndex = columns.indexOf(sortConfig.key);
      if (sortIndex !== -1) {
        sortableItems.sort((a, b) => {
          const aVal = a[sortIndex];
          const bVal = b[sortIndex];

          if (aVal < bVal) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aVal > bVal) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
      }
    }
    return sortableItems;
  }, [rows, sortConfig, columns]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedData.filter((row) => {
      return row.some((value) => String(value).toLowerCase().includes(lowercasedFilter));
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

  // Reset pagination and search when table changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'ascending' });
  }, [tableName]);

  const currentRows = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filteredData.slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white">
          Table: <span className="text-sky-400">{tableName}</span>
        </h3>
        <div className="relative w-full md:w-auto md:flex-grow max-w-lg">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder={`Search ${rows.length} records...`}
            className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            value={searchTerm}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50">
        <table className="min-w-full divide-y divide-gray-700 responsive-table">
          <thead className="bg-gray-700/50">
            <tr>
              {columns.map((key) => (
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
                <tr key={index} className="hover:bg-gray-700/50">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      data-label={columns[cellIndex]}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-md truncate"
                    >
                      {cell === null ? (
                        <span className="italic text-gray-500">NULL</span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {rows.length === 0
                    ? 'This table is empty.'
                    : `No results found for "${searchTerm}".`}
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
          filteredData.length !== rows.length &&
          ` (Filtered from ${rows.length} total)`}
      </p>
    </div>
  );
};
