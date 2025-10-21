import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../../services/api';
import { GenericDataTable } from '../../ui/GenericDataTable';
import {
  SpinnerIcon,
  TableIcon,
  ExclamationIcon,
  InfoIcon,
  SearchIcon,
  CancelIcon,
} from '../../ui/icons';

type GlobalSearchResults = Record<string, { columns: string[]; rows: any[][] }>;

const DatabaseExplorer: React.FC = () => {
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[][] } | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Global Search
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResults | null>(null);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  useEffect(() => {
    const fetchTables = async () => {
      setIsLoadingTables(true);
      try {
        const names = await api.getTables();
        setTableNames(names);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch table list.');
      } finally {
        setIsLoadingTables(false);
      }
    };
    fetchTables();
  }, []);

  const handleSelectTable = useCallback(async (tableName: string) => {
    setSelectedTable(tableName);
    setIsLoadingData(true);
    setError(null);
    setTableData(null);
    try {
      const data = await api.getTableData(tableName);
      setTableData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to load data for table "${tableName}".`,
      );
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchTerm.trim()) {
      setGlobalSearchResults(null);
      return;
    }
    setIsGlobalSearching(true);
    setError(null);
    try {
      const results = await api.searchAllTables(globalSearchTerm);
      setGlobalSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Global search failed.');
    } finally {
      setIsGlobalSearching(false);
    }
  };

  const clearGlobalSearch = () => {
    setGlobalSearchTerm('');
    setGlobalSearchResults(null);
    setError(null);
  };

  const activeTableClass = 'bg-sky-600 text-white';
  const inactiveTableClass = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  const renderGlobalSearchResults = () => {
    if (!globalSearchResults) return null;

    const tablesWithResults = Object.keys(globalSearchResults);
    const totalMatches = tablesWithResults.reduce(
      (acc, tableName) => acc + globalSearchResults[tableName].rows.length,
      0,
    );

    return (
      <div className="animate-fade-in">
        <h3 className="text-xl font-semibold text-white mb-4">
          Found {totalMatches} results for "<span className="text-sky-400">{globalSearchTerm}</span>
          "
        </h3>
        {tablesWithResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
            <InfoIcon className="w-8 h-8 text-gray-500" />
            <p className="mt-3 text-gray-400">No matches found in the database.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {tablesWithResults.map((tableName) => (
              <div key={tableName}>
                <GenericDataTable
                  columns={globalSearchResults[tableName].columns}
                  rows={globalSearchResults[tableName].rows}
                  tableName={tableName}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold text-white mb-4">Explore Database Tables</h2>

      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Global Database Search</h3>
        <form onSubmit={handleGlobalSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search across all tables..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={isGlobalSearching}
            className="flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600"
          >
            {isGlobalSearching ? (
              <SpinnerIcon className="w-5 h-5" />
            ) : (
              <SearchIcon className="w-5 h-5" />
            )}
            <span className="ml-2">Search</span>
          </button>
          {(globalSearchResults || globalSearchTerm) && (
            <button
              type="button"
              onClick={clearGlobalSearch}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
            >
              <CancelIcon className="w-5 h-5 mr-2" /> Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-red-300 bg-red-900/50 rounded-lg"
          role="alert"
        >
          <ExclamationIcon className="w-5 h-5 mr-3" />
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {isGlobalSearching ? (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
          <SpinnerIcon className="w-8 h-8 text-sky-400" />
          <p className="mt-3 text-sky-300">Searching database...</p>
        </div>
      ) : globalSearchResults ? (
        renderGlobalSearchResults()
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-6 min-h-[40px]">
            {isLoadingTables ? (
              <div className="flex items-center text-gray-400">
                <SpinnerIcon className="w-5 h-5 mr-2" />
                <span>Loading tables...</span>
              </div>
            ) : tableNames.length > 0 ? (
              tableNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelectTable(name)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedTable === name ? activeTableClass : inactiveTableClass}`}
                  disabled={isLoadingData}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>{name}</span>
                </button>
              ))
            ) : (
              !error && <p className="text-gray-400">No tables found in the database.</p>
            )}
          </div>

          <div className="mt-4">
            {isLoadingData && (
              <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
                <SpinnerIcon className="w-8 h-8 text-sky-400" />
                <p className="mt-3 text-sky-300">Loading table data...</p>
              </div>
            )}

            {!isLoadingData && !selectedTable && !error && (
              <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
                <InfoIcon className="w-8 h-8 text-gray-500" />
                <p className="mt-3 text-gray-400">Select a table to view its contents.</p>
              </div>
            )}

            {!isLoadingData && tableData && (
              <GenericDataTable
                columns={tableData.columns}
                rows={tableData.rows}
                tableName={selectedTable || ''}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DatabaseExplorer;
