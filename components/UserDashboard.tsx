import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from './Navigation';
import UserSettings from './UserSettings';
import { FileUploader } from './FileUploader';
import { StatusDisplay } from './StatusDisplay';
import { ProcessButton } from './ProcessButton';
import { DataTable } from './DataTable';
import { processStockFiles } from '../services/dataProcessor';
import * as api from '../services/api';
// FIX: Update import path for constants.
import { CLOSING_STOCK_FILENAME, ITEM_DIRECTORY_FILENAME } from '../config/constants';
// FIX: Update import paths for types.
import type { AppStatus, Website } from '../types/index';
import type { FinalStockData, WorkflowStep } from '../types/processing';
import { ProgressTracker } from './ProgressTracker';
import { WordPressSync } from './WordPressSync';
import SyncHistory from './SyncHistory';
// FIX: Updated import for OrderViewer to use a named import from its new location.
import { OrderViewer } from './orders/OrderViewer';
import ProductManager from './ProductManager';
import CategoryManager from './CategoryManager';
import { SpinnerIcon, WordPressIcon, CheckCircleIcon } from './icons';

const UserDashboard: React.FC = () => {
    const { user, updateCurrentUser, logout } = useAuth();
    const [activeView, setActiveView] = useState('orders');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    
    // State for File Processing View
    const [closingStockFile, setClosingStockFile] = useState<File | null>(null);
    const [itemDirectoryFile, setItemDirectoryFile] = useState<File | null>(null);
    const [status, setStatus] = useState<AppStatus>({ state: 'idle', message: 'Please upload both Excel files.' });
    const [processedData, setProcessedData] = useState<FinalStockData[] | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [workflowConfig, setWorkflowConfig] = useState<WorkflowStep[]>([]);
    const [processSteps, setProcessSteps] = useState<string[]>([]);
    
    // New state for multi-site
    const [websites, setWebsites] = useState<Website[]>([]);
    const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
    const [isLoadingWebsites, setIsLoadingWebsites] = useState(true);

     useEffect(() => {
        // After mounting, call `lucide.createIcons()` to render the icons
        if (typeof (window as any).lucide !== 'undefined') {
            (window as any).lucide.createIcons();
        }
    }, [activeView, isSidebarExpanded]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;
            setIsLoadingWebsites(true);
            try {
                const [steps, userWebsites] = await Promise.all([
                    api.getWorkflowSteps(),
                    api.getWebsitesForUser(user.username)
                ]);
                setWorkflowConfig(steps);
                setWebsites(userWebsites);
            } catch (error) {
                console.error("Failed to load initial data", error);
                setStatus({ state: 'error', message: 'Could not load initial configuration.' });
            } finally {
                setIsLoadingWebsites(false);
            }
        };
        loadInitialData();
    }, [user]);

    const handleProcess = useCallback(async () => {
        if (!closingStockFile || !itemDirectoryFile) {
            setStatus({ state: 'error', message: 'Both files must be selected.' });
            return;
        }
        if (workflowConfig.length === 0) {
            setStatus({ state: 'error', message: 'Workflow configuration is not loaded.' });
            return;
        }

        setStatus({ state: 'processing', message: 'Starting process...' });
        setProcessedData(null);
        
        const enabledSteps = workflowConfig.filter(step => step.is_enabled);
        const dynamicProcessSteps = [
            'Reading Excel files',
            ...enabledSteps.map(s => s.step_name),
            'Preparing data preview'
        ];
        setProcessSteps(dynamicProcessSteps);
        setCurrentStep(1);

        const updateStep = (step: number) => {
            setCurrentStep(step);
        };

        try {
            const jsonData = await processStockFiles(closingStockFile, itemDirectoryFile, workflowConfig, updateStep);
            setProcessedData(jsonData);
            setStatus({ state: 'success', message: 'Processing complete! Review the data below.' });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setStatus({ state: 'error', message: `Processing failed: ${errorMessage}` });
        }
    }, [closingStockFile, itemDirectoryFile, workflowConfig]);

    const handleReset = () => {
        setClosingStockFile(null);
        setItemDirectoryFile(null);
        setProcessedData(null);
        setStatus({ state: 'idle', message: 'Please upload both Excel files.' });
        setCurrentStep(0);
        setProcessSteps([]);
        setSelectedWebsite(null);

        const fileInput1 = document.getElementById('closing-stock-file') as HTMLInputElement;
        const fileInput2 = document.getElementById('item-directory-file') as HTMLInputElement;
        if (fileInput1) fileInput1.value = '';
        if (fileInput2) fileInput2.value = '';
    };
    
    const handleResetSiteSelection = () => {
        handleReset();
    }

    const handleSyncSuccess = async () => {
        if (user && user.syncsRemaining > 0) {
            const newSyncsRemaining = user.syncsRemaining - 1;
            await updateCurrentUser({ syncsRemaining: newSyncsRemaining });
        }
    };
    
    const renderProcessingView = () => {
        if (isLoadingWebsites) {
            return (
                <div className="flex justify-center items-center h-full">
                    <SpinnerIcon className="w-8 h-8 text-sky-400" />
                    <p className="ml-4 text-sky-300">Loading Configuration...</p>
                </div>
            );
        }
        
        if (!selectedWebsite) {
             return (
                <div className="animate-fade-in">
                    <header className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-white">Select a Website to Sync</h2>
                        <p className="text-gray-400 mt-1">Choose one of your configured sites to begin the update process.</p>
                    </header>
                    {websites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {websites.map(site => (
                                <button key={site.id} onClick={() => setSelectedWebsite(site)} className="bg-gray-800 p-6 rounded-lg text-left hover:bg-gray-700/80 border border-gray-700 hover:border-sky-500 transition-all transform hover:scale-105">
                                    <p className="font-bold text-lg text-white">{site.name}</p>

                                    <p className="text-sm text-sky-400 break-all">{site.url}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-900/50 rounded-lg">
                            <WordPressIcon className="w-12 h-12 mx-auto text-gray-500" />
                            <h3 className="mt-2 text-lg font-medium text-white">No websites configured</h3>
                            <p className="mt-1 text-sm text-gray-400">Please go to <button onClick={() => setActiveView('settings')} className="font-semibold text-sky-400 hover:underline">Settings</button> to add a new website.</p>
                        </div>
                    )}
                </div>
            )
        }
        
         return (
            <div className="animate-fade-in">
              <header className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white tracking-tight">Stock Processing Workflow</h1>
                <p className="text-lg text-gray-400 mt-2">Automated Excel Data Transformation & WooCommerce Sync</p>
              </header>
        
              <div className="bg-gray-900/50 p-8 rounded-lg transition-all duration-500">
                <div className="p-4 mb-8 bg-sky-900/50 border border-sky-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <CheckCircleIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />
                         <div>
                            <p className="font-semibold text-white">Syncing to: {selectedWebsite.name}</p>
                            <p className="text-sm text-gray-300">{selectedWebsite.url}</p>
                         </div>
                    </div>
                    <button onClick={handleResetSiteSelection} className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">Change</button>
                </div>
              
                {status.state !== 'success' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <FileUploader
                        id="closing-stock-file"
                        label="Closing Stock Report"
                        expectedFilename={CLOSING_STOCK_FILENAME}
                        onFileSelect={setClosingStockFile}
                        disabled={status.state === 'processing'}
                      />
                      <FileUploader
                        id="item-directory-file"
                        label="Item Directory"
                        expectedFilename={ITEM_DIRECTORY_FILENAME}
                        onFileSelect={setItemDirectoryFile}
                        disabled={status.state === 'processing'}
                      />
                    </div>
        
                    <div className="mt-8 flex flex-col items-center space-y-6">
                      <ProcessButton
                        onClick={handleProcess}
                        disabled={!closingStockFile || !itemDirectoryFile || status.state === 'processing'}
                        isProcessing={status.state === 'processing'}
                      />
                      {status.state === 'processing' ? (
                        <ProgressTracker steps={processSteps} currentStep={currentStep} />
                      ) : (
                        <StatusDisplay status={status} />
                      )}
                      {status.state === 'error' && (
                        <button onClick={handleReset} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 rounded-md transition-colors">
                          Try Again
                        </button>
                      )}
                    </div>
                  </>
                )}
                {status.state === 'success' && processedData && user && selectedWebsite && (
                  <>
                    <DataTable data={processedData} onReset={handleReset} />
                    <WordPressSync
                      processedData={processedData}
                      user={user}
                      website={selectedWebsite}
                      onSyncSuccess={handleSyncSuccess}
                    />
                  </>
                )}
              </div>
            </div>
          );
    };

    const renderContent = () => {
        switch (activeView) {
            case 'processing':
                return renderProcessingView();
            case 'history':
                return <SyncHistory />;
            case 'orders':
                return <OrderViewer />;
            case 'products':
                return <ProductManager isAdminView={false} />;
            case 'categories':
                return <CategoryManager isAdminView={false} />;
            case 'settings':
                return <UserSettings />;
            default:
                return null;
        }
    };
    
    if (!user) return null;

    return (
        <div className="relative min-h-screen">
            <Navigation
                role="user"
                activeView={activeView}
                onNavigate={setActiveView}
                user={user}
                logout={logout}
                isExpanded={isSidebarExpanded}
                onToggleExpand={setIsSidebarExpanded}
            />
            <div className={`pb-24 sm:pb-0 transition-all duration-300 ${isSidebarExpanded ? 'sm:ml-64' : 'sm:ml-16'}`}>
                <main className="p-4 sm:p-6 lg:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;