import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
// FIX: Update import path for types.
import type { SyncHistorySummary, SyncDetail } from '../types/sync';
import { SpinnerIcon, InfoIcon, ExclamationIcon } from './icons';
import SyncDetailsTable from './SyncDetailsTable';

const SyncHistory: React.FC = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<SyncHistorySummary | null>(null);
    const [details, setDetails] = useState<SyncDetail[] | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        
        const fetchSummary = async () => {
            setIsLoadingSummary(true);
            setError(null);
            try {
                const data = await api.getLatestSyncSummary(user.username);
                setSummary(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load sync summary.');
            } finally {
                setIsLoadingSummary(false);
            }
        };

        fetchSummary();
    }, [user]);

    const handleViewDetails = useCallback(async () => {
        if (!summary) return;

        setIsLoadingDetails(true);
        setError(null);
        try {
            const data = await api.getSyncDetailsByHistoryId(summary.id);
            setDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sync details.');
        } finally {
            setIsLoadingDetails(false);
        }
    }, [summary]);

    if (isLoadingSummary) {
        return (
            <div className="flex justify-center items-center h-full">
                <SpinnerIcon className="w-8 h-8 text-sky-400" />
                <p className="ml-4 text-sky-300">Loading Sync History...</p>
            </div>
        );
    }
    
    if (error) {
         return (
             <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg" role="alert">
                <ExclamationIcon className="w-5 h-5 mr-3"/>
                <span className="font-medium">Error:</span> {error}
            </div>
        )
    }

    if (!summary) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
                <InfoIcon className="w-8 h-8 text-gray-500" />
                <p className="mt-3 text-gray-400">No sync history found for this user.</p>
                <p className="mt-1 text-sm text-gray-500">Perform a sync from the "File Processing" tab to see a report here.</p>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-6">Last Sync Report</h2>
            <div className="p-6 bg-gray-900/50 rounded-lg">
                <h3 className="font-semibold text-white">Sync Summary</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Performed on: {new Date(summary.sync_timestamp).toLocaleString()}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-sky-400">{summary.total_processed}</p>
                        <p className="text-sm text-gray-400">Processed</p>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{summary.total_updated}</p>
                        <p className="text-sm text-gray-400">Updated</p>
                    </div>
                     <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-gray-300">{summary.total_up_to_date}</p>
                        <p className="text-sm text-gray-400">Up-to-date</p>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-400">{summary.total_not_found}</p>
                        <p className="text-sm text-gray-400">Not Found</p>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-red-400">{summary.total_errors}</p>
                        <p className="text-sm text-gray-400">Errors</p>
                    </div>
                </div>
                 <div className="mt-6 text-center">
                    {!details && (
                        <button 
                            onClick={handleViewDetails}
                            disabled={isLoadingDetails}
                            className="inline-flex items-center px-6 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600"
                        >
                            {isLoadingDetails ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5 mr-2" />
                                    Loading Details...
                                </>
                            ) : (
                                'View Detailed Report'
                            )}
                        </button>
                    )}
                </div>
            </div>
            {details && (
                <div className="mt-8">
                     <SyncDetailsTable details={details} />
                </div>
            )}
        </div>
    );
};

export default SyncHistory;