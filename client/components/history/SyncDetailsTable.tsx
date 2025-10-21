import React, { useState, useMemo, useEffect } from 'react';
import type { SyncDetail } from '../../types/sync';
import type { ChangeDetail } from '../../types/sync';
import { SearchIcon, SortAscIcon, SortDescIcon, SortIcon } from '../ui/icons';

const ChangesDisplay: React.FC<{ changesJson: string }> = ({ changesJson }) => {
  try {
    const changes = JSON.parse(changesJson);

    if (changes.message) {
      return <span className="text-red-400 text-xs font-mono break-all">{changes.message}</span>;
    }

    if (Object.keys(changes).length === 0) {
      return <span className="text-gray-500">-</span>;
    }

    return (
      <ul className="space-y-1 text-xs font-mono">
        {Object.entries(changes).map(([key, value]) => {
          const detail = value as ChangeDetail;
          return (
            <li key={key} className="flex flex-wrap items-baseline">
              <span className="font-semibold text-gray-300 capitalize mr-2">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-red-400 line-through mr-1 break-all">
                {String(detail.old ?? 'N/A')}
              </span>
              <span className="text-green-400 break-all">→ {String(detail.new ?? 'N/A')}</span>
            </li>
          );
        })}
      </ul>
    );
  } catch {
    return <span className="text-red-400">Invalid change data</span>;
  }
};

const StatusBadge: React.FC<{ status: SyncDetail['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize';
  const statusMap = {
    updated: 'bg-green-900 text-green-200',
    not_found: 'bg-yellow-900 text-yellow-200',
    up_to_date: 'bg-gray-700 text-gray-300',
    error: 'bg-red-900 text-red-200',
  };
  return <span className={`${baseClasses} ${statusMap[status]}`}>{status.replace('_', ' ')}</span>;
};

interface SyncDetailsTableProps {
  details: SyncDetail[];
}

type SortConfig = {
  key: keyof SyncDetail | null;
  direction: 'ascending' | 'descending';
};

const SyncDetailsTable: React.FC<SyncDetailsTableProps> = ({ details }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'status',
    direction: 'ascending',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const sortedData = useMemo(() => {
    let sortableItems = [...details];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [details, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedData.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(lowercasedFilter)),
    );
  }, [sortedData, searchTerm]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (newTotalPages > 0 && currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0 || isNaN(newTotalPages)) {
      setCurrentPage(1);
    }
  }, [filteredData.length, rowsPerPage, currentPage]);

  const currentRows = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filteredData.slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const headers: (keyof SyncDetail)[] = ['sku', 'product_name', 'status', 'changes_json'];
  const headerLabels: Record<keyof SyncDetail, string> = {
    id: 'ID',
    sync_id: 'Sync ID',
    sku: 'SKU',
    product_name: 'Product Name',
    status: 'Status',
    changes_json: 'Changes',
  };

  const requestSort = (key: keyof SyncDetail) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key: keyof SyncDetail) => {
    if (sortConfig.key !== key) return <SortIcon className="w-4 h-4 text-gray-500" />;
    if (sortConfig.direction === 'ascending')
      return <SortAscIcon className="w-4 h-4 text-sky-400" />;
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
      <h3 className="text-xl font-semibold text-white mb-4">Detailed Sync Report</h3>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 p-4 bg-gray-900/50 rounded-lg">
        <div className="relative w-full md:w-auto md:flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder={`Search ${details.length} records...`}
            className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            value={searchTerm}
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {currentRows.map((row) => (
          <div
            key={row.id}
            className="w-full rounded-2xl bg-[#0d1b2a] p-4 shadow-md border border-slate-700 text-gray-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">SKU</p>
                <p className="font-bold text-white break-all">{row.sku}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <p className="text-sm text-gray-300 break-words">{row.product_name}</p>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Changes</p>
              <ChangesDisplay changesJson={row.changes_json} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
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
                    <span>{headerLabels[key]}</span>
                    {getSortIcon(key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {currentRows.length > 0 ? (
              currentRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {row.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                    {row.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <ChangesDisplay changesJson={row.changes_json} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                  {searchTerm ? `No results found for "${searchTerm}".` : 'No details to display.'}
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
          filteredData.length !== details.length &&
          ` (Filtered from ${details.length} total)`}
      </p>
    </div>
  );
};

export default SyncDetailsTable;
