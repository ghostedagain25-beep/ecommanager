
import React, { useState, useCallback } from 'react';
// FIX: Update import paths for types.
import type { User, Website } from '../../types/index';
import type { FinalStockData } from '../../types/processing';
import type { SyncStatus, SyncResult, ChangesObject, SyncDetail, SyncPreviewData, PreviewableItem } from '../../types/sync';
import type { WooCommerceProduct, WooCommerceUpdatePayload } from '../../types/woocommerce';
import { fetchWooCommerceProducts, batchUpdateWooCommerceProducts } from '../../services/wooCommerceApi';
import * as api from '../../services/api';
import { WordPressIcon, SpinnerIcon, CheckCircleIcon, ExclamationIcon, InfoIcon, EyeIcon } from '../ui/icons';
import { TerminalDisplay } from '../ui/TerminalDisplay';
// FIX: Changed to named import for SyncPreview
import { SyncPreview } from './SyncPreview';

interface WordPressSyncProps {
  processedData: FinalStockData[];
  user: User;
  website: Website;
  onSyncSuccess: () => void;
}

const SYNC_BATCH_SIZE = 100;

export const WordPressSync: React.FC<WordPressSyncProps> = ({ processedData, user, website, onSyncSuccess }) => {
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle', message: 'Ready to sync product data.' });
  const [result, setResult] = useState<SyncResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<SyncPreviewData | null>(null);
  const [isConfirmingSync, setIsConfirmingSync] = useState(false);

  const { syncsRemaining, username } = user;
  
  const handleCancelPreview = () => {
      setPreviewData(null);
      setStatus({ state: 'idle', message: 'Preview canceled. Ready to sync product data.' });
      setTerminalOutput([]);
  };

  const generatePreview = useCallback(async () => {
    if (syncsRemaining <= 0) {
      setStatus({ state: 'error', message: 'No syncs remaining.' });
      return;
    }
    
    setTerminalOutput([]);
    setStatus({ state: 'previewing', message: 'Initializing preview...' });
    setResult(null);
    setErrorDetails([]);

    const onProgress = (message: string) => {
        setTerminalOutput(prev => [...prev, message]);
    };

    try {
      const totalProducts = processedData.length;
      if (totalProducts === 0) {
        setStatus({ state: 'success', message: 'No data to generate preview for.' });
        onProgress('No products in the source file.');
        return;
      }

      const totalBatches = Math.ceil(totalProducts / SYNC_BATCH_SIZE);
      onProgress(`Preparing to process ${totalProducts} products in ${totalBatches} batches for preview.`);

      const allToUpdate: PreviewableItem[] = [];
      const allUpToDate: { sku: string, name: string }[] = [];
      const allNotFound: { sku: string, product_name: 'N/A'}[] = [];
      const allUpdatePayloads: WooCommerceUpdatePayload[] = [];
      const allSyncDetailsForReport: Omit<SyncDetail, 'id' | 'sync_id'>[] = [];

      for (let i = 0; i < totalProducts; i += SYNC_BATCH_SIZE) {
        const batchNum = i / SYNC_BATCH_SIZE + 1;
        const chunk = processedData.slice(i, i + SYNC_BATCH_SIZE);
        
        onProgress(`\n--- [Preview] Starting Batch ${batchNum} of ${totalBatches} ---`);
        setStatus({ state: 'previewing', message: `Fetching data for batch ${batchNum}/${totalBatches}...` });

        const skusToFetch = chunk.map(p => String(p.SKU));
        // FIX: The `fetchWooCommerceProducts` function expects a `Website` object, not separate credentials.
        const wooProducts = await fetchWooCommerceProducts(website, skusToFetch);
        onProgress(`Fetched ${wooProducts.length} products from WooCommerce for comparison.`);

        const wooSkuMap = new Map<string, WooCommerceProduct>();
        wooProducts.forEach(p => {
          if (p.sku) wooSkuMap.set(p.sku.toString(), p);
        });
        
        for (const item of chunk) {
          const sku = String(item.SKU);
          const wooProduct = wooSkuMap.get(sku);

          if (wooProduct) {
            const newRegularPrice = String(item['REGULAR PRICE']);
            const newSalePrice = String(item['SALE PRICE']);
            const newStock = item['STOCK'];

            const changes: ChangesObject = {};
            if (wooProduct.regular_price !== newRegularPrice) changes.regular_price = { old: wooProduct.regular_price, new: newRegularPrice };
            if (wooProduct.sale_price !== newSalePrice) changes.sale_price = { old: wooProduct.sale_price, new: newSalePrice };
            if (wooProduct.stock_quantity !== newStock) changes.stock_quantity = { old: wooProduct.stock_quantity, new: newStock };
            
            const needsUpdate = Object.keys(changes).length > 0;

            if (needsUpdate) {
                const payload = {
                    id: wooProduct.id,
                    regular_price: newRegularPrice,
                    sale_price: newSalePrice,
                    stock_quantity: newStock,
                };
                allUpdatePayloads.push(payload);
                allToUpdate.push({ sku: wooProduct.sku, name: wooProduct.name, changes });
                allSyncDetailsForReport.push({ sku, product_name: wooProduct.name, status: 'updated', changes_json: JSON.stringify(changes) });
            } else {
                allUpToDate.push({ sku: wooProduct.sku, name: wooProduct.name });
                allSyncDetailsForReport.push({ sku, product_name: wooProduct.name, status: 'up_to_date', changes_json: '{}' });
            }
          } else {
            allNotFound.push({ sku, product_name: 'N/A' });
            allSyncDetailsForReport.push({ sku, product_name: 'N/A', status: 'not_found', changes_json: '{}' });
          }
        }
        onProgress(`Comparison complete for batch ${batchNum}.`);
      }

      onProgress('\nPreview generation complete.');
      setStatus({ state: 'idle', message: 'Preview ready. Review the changes below.' });
      setPreviewData({
          toUpdate: allToUpdate,
          upToDate: allUpToDate,
          notFound: allNotFound,
          updatePayload: allUpdatePayloads,
          syncDetailsForReport: allSyncDetailsForReport,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setStatus({ state: 'error', message: `Preview failed: ${errorMessage}` });
      onProgress(`Fatal Error: ${errorMessage}`);
      console.error(error);
    }
  }, [website, processedData, syncsRemaining]);

  const handleConfirmSync = useCallback(async () => {
    if (!previewData) return;

    setIsConfirmingSync(true);
    setStatus({ state: 'updating', message: 'Applying updates to your store...' });
    const onProgress = (message: string) => setTerminalOutput(prev => [...prev, message]);
    
    try {
        let totalUpdated = 0;
        const allErrorDetails: { id: number, message: string }[] = [];
        
        if (previewData.updatePayload.length > 0) {
            onProgress(`Sending ${previewData.updatePayload.length} updates to WooCommerce...`);
            // FIX: The `batchUpdateWooCommerceProducts` function expects a `Website` object, not separate credentials.
            const { updatedCount, errorDetails } = await batchUpdateWooCommerceProducts(website, previewData.updatePayload as WooCommerceUpdatePayload[]);
            totalUpdated = updatedCount;
            if (errorDetails.length > 0) {
                allErrorDetails.push(...errorDetails);
            }
            onProgress(`Update request complete: ${updatedCount} success, ${errorDetails.length} errors.`);
        } else {
            onProgress('No products required an update.');
        }

        onProgress('\nAll updates sent. Saving sync report...');
        const totalErrors = allErrorDetails.length;
        
        const summary = {
            updated: totalUpdated,
            notFound: previewData.notFound.length,
            upToDate: previewData.upToDate.length,
            errors: totalErrors
        };
        
        const finalSyncDetails = [...previewData.syncDetailsForReport];
        allErrorDetails.forEach(e => {
            finalSyncDetails.push({
                sku: `ID: ${e.id}`,
                product_name: 'Update Error',
                status: 'error',
                changes_json: JSON.stringify({ message: e.message }),
            });
        });
      
        await api.addSyncEvent(username, {
            total_processed: processedData.length,
            total_updated: totalUpdated,
            total_not_found: previewData.notFound.length,
            total_up_to_date: previewData.upToDate.length,
            total_errors: totalErrors
        }, finalSyncDetails);
        onProgress('Sync report saved.');

        setResult(summary);
        
        if (totalErrors > 0) {
            setErrorDetails(allErrorDetails.map(e => `ID ${e.id}: ${e.message}`).slice(0, 5));
            setStatus({ state: 'success', message: `Sync complete with ${totalErrors} error(s).` });
            console.error("Full sync errors:", allErrorDetails);
        } else {
            setStatus({ state: 'success', message: 'Synchronization completed successfully!' });
        }
      
        onSyncSuccess();

    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setStatus({ state: 'error', message: `Sync failed: ${errorMessage}` });
        onProgress(`Fatal Error: ${errorMessage}`);
        console.error(error);
    } finally {
        setIsConfirmingSync(false);
        setPreviewData(null); // Exit preview mode
    }
  }, [previewData, website, username, processedData.length, onSyncSuccess]);

  const isProcessing = status.state === 'previewing' || status.state === 'updating' || isConfirmingSync;

  if (previewData) {
      return (
          <div className="mt-12 animate-fade-in border-t-2 border-gray-700 pt-8">
              <SyncPreview
                  previewData={previewData}
                  onConfirm={handleConfirmSync}
                  onCancel={handleCancelPreview}
                  isSyncing={isConfirmingSync}
                  syncsRemaining={syncsRemaining}
                  currencySymbol={website.currency_symbol}
              />
              {isConfirmingSync && (
                  <div className="mt-6">
                      <TerminalDisplay lines={terminalOutput} />
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="mt-12 animate-fade-in border-t-2 border-gray-700 pt-8">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <WordPressIcon className="w-8 h-8 text-sky-400"/>
          <h2 className="text-2xl font-semibold text-white">Sync with WooCommerce</h2>
        </div>
        <p className="text-gray-400 mt-2">Update product prices and stock in your pre-configured store.</p>
      </header>
      
      <div className="max-w-3xl mx-auto bg-gray-900/50 p-8 rounded-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">WordPress Site URL</label>
            <p className="mt-1 p-2 text-gray-200 bg-gray-700/50 border border-gray-600 rounded-md">{website.url}</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-900/50 border border-yellow-700 rounded-md text-sm text-yellow-300">
            <p className="font-bold">Important: Server Configuration Required</p>
            <p className="mt-1">
                For the sync to work, your WordPress server must accept requests from this application (CORS policy). 
                If you encounter a "Network request failed" error, this is the most likely cause.
            </p>
        </div>
        
        <div className="mt-6">
            <button 
              onClick={generatePreview}
              disabled={isProcessing || syncsRemaining <= 0}
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {status.state === 'previewing' ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-3" />
                  Generating Preview...
                </>
              ) : (
                <>
                  <EyeIcon className="w-5 h-5 mr-3" />
                  Preview Sync ({syncsRemaining} {syncsRemaining === 1 ? 'sync' : 'syncs'} left)
                </>
              )}
            </button>
            {syncsRemaining <= 0 && !isProcessing && (
              <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-md text-sm text-yellow-300 text-center animate-fade-in">
                <p><span className="font-bold">Out of Syncs:</span> You have no synchronization attempts remaining. Please contact an administrator to add more.</p>
              </div>
            )}
        </div>
        
        {status.state === 'previewing' && (
            <div className="mt-6">
                <TerminalDisplay lines={terminalOutput} />
            </div>
        )}

        <div className="mt-6 min-h-[40px] flex items-center justify-center">
            {!isProcessing && status.state !== 'previewing' && (
                <div className={`flex items-center space-x-2 text-sm p-3 rounded-md w-full justify-center ${
                    status.state === 'error' ? 'bg-red-900/50 text-red-300' : 
                    status.state === 'success' ? 'bg-green-900/50 text-green-300' :
                    'bg-gray-800 text-gray-400'
                }`}>
                    {status.state === 'error' && <ExclamationIcon className="w-5 h-5"/>}
                    {status.state === 'success' && <CheckCircleIcon className="w-5 h-5"/>}
                    {status.state === 'idle' && <InfoIcon className="w-5 h-5"/>}
                    <span>{status.message}</span>
                </div>
            )}
        </div>
        
        {result && status.state === 'success' && (
          <div className="mt-4 p-4 border border-gray-700 rounded-lg text-center">
            <h4 className="font-semibold text-white">Sync Summary</h4>
            <div className="mt-2 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
                <p className="text-green-400"><span className="font-bold text-lg">{result.updated}</span> Products Updated</p>
                <p className="text-gray-400"><span className="font-bold text-lg">{result.upToDate}</span> Up-to-date</p>
                <p className="text-yellow-400"><span className="font-bold text-lg">{result.notFound}</span> Not Found</p>
                <p className={result.errors > 0 ? "text-red-400" : "text-gray-400"}>
                    <span className="font-bold text-lg">{result.errors}</span> Errors
                </p>
            </div>
            {errorDetails.length > 0 && (
              <div className="mt-4 text-left p-3 bg-red-900/50 rounded-md text-red-300 text-xs">
                <p className="font-bold mb-2">Error Details (first {errorDetails.length} of {result.errors} shown):</p>
                <ul className="list-disc list-inside space-y-1 font-mono">
                  {errorDetails.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
                {result.errors > 5 && <p className="mt-2 italic">Check browser console for all errors.</p>}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
