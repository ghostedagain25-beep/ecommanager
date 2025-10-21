import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
// FIX: Update import path for types.
import type { SyncHistorySummary, SyncDetail } from '../types/sync';
import { SpinnerIcon, InfoIcon, ExclamationIcon, ClipboardListIcon } from './icons';
import SyncDetailsTable from './SyncDetailsTable';

const AdminSyncHistory: React.FC = () => {
  const [summaries, setSummaries] = useState<SyncHistorySummary[]>([]);
  const [selectedSync, setSelectedSync] = useState<SyncHistorySummary | null>(null);
  const [details, setDetails] = useState<SyncDetail[] | null>(null);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      setIsLoadingSummaries(true);
      setError(null);
      try {
        const data = await api.getAllSyncSummaries();
        setSummaries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sync summaries.');
      } finally {
        setIsLoadingSummaries(false);
      }
    };

    fetchSummaries();
  }, []);

  const handleViewDetails = useCallback(
    async (summary: SyncHistorySummary) => {
      if (selectedSync?.id === summary.id) {
        // Toggle off details view
        setSelectedSync(null);
        setDetails(null);
        return;
      }

      setSelectedSync(summary);
      setIsLoadingDetails(true);
      setError(null);
      setDetails(null);
      try {
        const data = await api.getSyncDetailsByHistoryId(summary.id);
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sync details.');
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [selectedSync],
  );

  if (isLoadingSummaries) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="w-8 h-8 text-sky-400" />
        <p className="ml-4 text-sky-300">Loading All Sync Histories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"
        role="alert"
      >
        <ExclamationIcon className="w-5 h-5 mr-3" />
        <span className="font-medium">Error:</span> {error}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
        <InfoIcon className="w-8 h-8 text-gray-500" />
        <p className="mt-3 text-gray-400">No sync history found for any user.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-white mb-6">All User Sync History</h2>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="w-full rounded-2xl bg-[#0d1b2a] p-4 shadow-md border border-slate-700 text-gray-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <p className="font-bold text-lg text-white break-all">{summary.user_username}</p>
                <p className="text-sm text-gray-400">
                  {new Date(summary.sync_timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleViewDetails(summary)}
                className="text-sky-400 hover:text-sky-300 disabled:text-gray-500 disabled:cursor-wait p-2 flex-shrink-0 ml-2"
                disabled={isLoadingDetails && selectedSync?.id === summary.id}
              >
                {isLoadingDetails && selectedSync?.id === summary.id ? (
                  <SpinnerIcon className="w-5 h-5" />
                ) : (
                  <ClipboardListIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-b border-slate-700 py-3">
              <div>
                <p className="text-xs text-gray-400">Processed</p>
                <p className="font-semibold text-sky-300">{summary.total_processed}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Updated</p>
                <p className="font-semibold text-green-400">{summary.total_updated}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Errors</p>
                <p
                  className={`font-semibold ${summary.total_errors > 0 ? 'text-red-400' : 'text-gray-400'}`}
                >
                  {summary.total_errors}
                </p>
              </div>
            </div>
            {selectedSync?.id === summary.id && (
              <div className="mt-4">
                {isLoadingDetails && (
                  <div className="flex justify-center items-center py-4">
                    <SpinnerIcon className="w-6 h-6 text-sky-400" />
                    <span className="ml-3 text-gray-300">Loading details...</span>
                  </div>
                )}
                {details && <SyncDetailsTable details={details} />}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Processed
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Updated
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Errors
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {summaries.map((summary) => (
              <React.Fragment key={summary.id}>
                <tr className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {summary.user_username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(summary.sync_timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-300 text-center">
                    {summary.total_processed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center">
                    {summary.total_updated}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-center ${summary.total_errors > 0 ? 'text-red-400' : 'text-gray-400'}`}
                  >
                    {summary.total_errors}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(summary)}
                      className="text-sky-400 hover:text-sky-300 disabled:text-gray-500 disabled:cursor-wait"
                      disabled={isLoadingDetails && selectedSync?.id === summary.id}
                    >
                      <ClipboardListIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
                {selectedSync?.id === summary.id && (
                  <tr>
                    <td colSpan={6} className="p-4 bg-gray-900">
                      {isLoadingDetails && (
                        <div className="flex justify-center items-center py-4">
                          <SpinnerIcon className="w-6 h-6 text-sky-400" />
                          <span className="ml-3 text-gray-300">Loading details...</span>
                        </div>
                      )}
                      {details && <SyncDetailsTable details={details} />}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSyncHistory;
