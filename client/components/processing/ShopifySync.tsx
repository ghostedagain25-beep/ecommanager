import React, { useState, useCallback } from 'react';
import type { User, Website } from '../../types/index';
import type { FinalStockData } from '../../types/processing';
import type {
  SyncStatus,
  SyncResult,
  ChangesObject,
  SyncDetail,
  SyncPreviewData,
  PreviewableItem,
} from '../../types/sync';
import type { ShopifyVariant, ShopifyVariantUpdatePayload } from '../../types/shopify';
import { fetchShopifyProductsBySku, batchUpdateShopifyVariants } from '../../services/shopifyApi';
import * as api from '../../services/api';
import {
  ShopifyIcon,
  SpinnerIcon,
  CheckCircleIcon,
  ExclamationIcon,
  InfoIcon,
  EyeIcon,
} from '../ui/icons';
import { TerminalDisplay } from '../ui/TerminalDisplay';
import { SyncPreview } from './SyncPreview';

interface ShopifySyncProps {
  processedData: FinalStockData[];
  user: User;
  website: Website;
  onSyncSuccess: () => void;
}

export const ShopifySync: React.FC<ShopifySyncProps> = ({
  processedData,
  user,
  website,
  onSyncSuccess,
}) => {
  const [status, setStatus] = useState<SyncStatus>({
    state: 'idle',
    message: 'Ready to sync product data.',
  });
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
      setTerminalOutput((prev) => [...prev, message]);
    };

    try {
      const totalProductsInFile = processedData.length;
      if (totalProductsInFile === 0) {
        setStatus({ state: 'success', message: 'No data to generate preview for.' });
        onProgress('No products in the source file.');
        return;
      }
      onProgress(`Found ${totalProductsInFile} products in the source file.`);

      setStatus({
        state: 'previewing',
        message: `Fetching products from Shopify... This may take a moment.`,
      });
      const skusToFetch = processedData.map((p) => String(p.SKU));
      const shopifyVariants = await fetchShopifyProductsBySku(website, skusToFetch);
      onProgress(`Fetched ${shopifyVariants.length} matching product variants from Shopify.`);

      const variantSkuMap = new Map<string, ShopifyVariant>();
      shopifyVariants.forEach((v) => {
        if (v.sku) variantSkuMap.set(v.sku.toString(), v);
      });

      const allToUpdate: PreviewableItem[] = [];
      const allUpToDate: { sku: string; name: string }[] = [];
      const allNotFound: { sku: string; product_name: 'N/A' }[] = [];
      const allUpdatePayloads: ShopifyVariantUpdatePayload[] = [];
      const allSyncDetailsForReport: Omit<SyncDetail, 'id' | 'sync_id'>[] = [];

      for (const item of processedData) {
        const sku = String(item.SKU);
        const shopifyVariant = variantSkuMap.get(sku);

        if (shopifyVariant) {
          const newSalePriceNum = Number(item['SALE PRICE']);
          const newRegularPriceNum = Number(item['REGULAR PRICE']);
          const newStockNum = Number(item['STOCK']);

          const newCompareAtPriceForUpdate =
            newRegularPriceNum > 0 ? String(newRegularPriceNum) : null;
          const newSalePriceStr = String(newSalePriceNum);

          const changes: ChangesObject = {};
          const productName = `${shopifyVariant.product_title || 'Product'} - ${shopifyVariant.title}`;

          if (parseFloat(shopifyVariant.price) !== newSalePriceNum) {
            changes.price = { old: shopifyVariant.price, new: newSalePriceStr };
          }

          const oldCompareAtPriceNum = shopifyVariant.compare_at_price
            ? parseFloat(shopifyVariant.compare_at_price)
            : 0;
          if (oldCompareAtPriceNum !== newRegularPriceNum) {
            changes.compare_at_price = {
              old: shopifyVariant.compare_at_price,
              new: newCompareAtPriceForUpdate,
            };
          }

          if (shopifyVariant.inventory_quantity !== newStockNum) {
            changes.stock_quantity = { old: shopifyVariant.inventory_quantity, new: newStockNum };
          }

          const needsUpdate = Object.keys(changes).length > 0;

          if (needsUpdate) {
            const payload: ShopifyVariantUpdatePayload = {
              variant_id: shopifyVariant.id,
              price: newSalePriceStr,
              compare_at_price: newCompareAtPriceForUpdate,
              inventory_quantity: newStockNum,
              inventory_item_id: shopifyVariant.inventory_item_id,
            };
            allUpdatePayloads.push(payload);
            allToUpdate.push({ sku, name: productName, changes });
            allSyncDetailsForReport.push({
              sku,
              product_name: productName,
              status: 'updated',
              changes_json: JSON.stringify(changes),
            });
          } else {
            allUpToDate.push({ sku, name: productName });
            allSyncDetailsForReport.push({
              sku,
              product_name: productName,
              status: 'up_to_date',
              changes_json: '{}',
            });
          }
        } else {
          allNotFound.push({ sku, product_name: 'N/A' });
          allSyncDetailsForReport.push({
            sku,
            product_name: 'N/A',
            status: 'not_found',
            changes_json: '{}',
          });
        }
      }
      onProgress('Comparison complete.');

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
    const onProgress = (message: string) => setTerminalOutput((prev) => [...prev, message]);

    try {
      onProgress(`Sending ${previewData.updatePayload.length} updates to Shopify...`);
      const { updatedCount, errorDetails } = await batchUpdateShopifyVariants(
        website,
        previewData.updatePayload as ShopifyVariantUpdatePayload[],
      );
      onProgress(
        `Update request complete: ${updatedCount} success, ${errorDetails.length} errors.`,
      );

      onProgress('\nAll updates sent. Saving sync report...');
      const summary = {
        updated: updatedCount,
        notFound: previewData.notFound.length,
        upToDate: previewData.upToDate.length,
        errors: errorDetails.length,
      };

      await api.addSyncEvent(
        username,
        {
          total_processed: processedData.length,
          total_updated: summary.updated,
          total_not_found: summary.notFound,
          total_up_to_date: summary.upToDate,
          total_errors: summary.errors,
        },
        previewData.syncDetailsForReport,
      );
      onProgress('Sync report saved.');

      setResult(summary);

      if (errorDetails.length > 0) {
        setErrorDetails(errorDetails.map((e) => `${e.sku}: ${e.message}`).slice(0, 5));
        setStatus({
          state: 'success',
          message: `Sync complete with ${errorDetails.length} error(s).`,
        });
      } else {
        setStatus({ state: 'success', message: 'Synchronization completed successfully!' });
      }

      onSyncSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setStatus({ state: 'error', message: `Sync failed: ${errorMessage}` });
      onProgress(`Fatal Error: ${errorMessage}`);
      console.error(error);
    } finally {
      setIsConfirmingSync(false);
      setPreviewData(null);
    }
  }, [previewData, website, username, processedData.length, onSyncSuccess]);

  const isProcessing =
    status.state === 'previewing' || status.state === 'updating' || isConfirmingSync;

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
          <ShopifyIcon className="w-8 h-8 text-green-400" />
          <h2 className="text-2xl font-semibold text-white">Sync with Shopify</h2>
        </div>
        <p className="text-gray-400 mt-2">
          Update product prices and stock in your pre-configured store.
        </p>
      </header>

      <div className="max-w-3xl mx-auto bg-gray-900/50 p-8 rounded-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Shopify Store</label>
            <p className="mt-1 p-2 text-gray-200 bg-gray-700/50 border border-gray-600 rounded-md">
              {website.url}.myshopify.com
            </p>
          </div>
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
              <p>
                <span className="font-bold">Out of Syncs:</span> You have no synchronization
                attempts remaining.
              </p>
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
            <div
              className={`flex items-center space-x-2 text-sm p-3 rounded-md w-full justify-center ${
                status.state === 'error'
                  ? 'bg-red-900/50 text-red-300'
                  : status.state === 'success'
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-gray-800 text-gray-400'
              }`}
            >
              {status.state === 'error' && <ExclamationIcon className="w-5 h-5" />}
              {status.state === 'success' && <CheckCircleIcon className="w-5 h-5" />}
              {status.state === 'idle' && <InfoIcon className="w-5 h-5" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>

        {result && status.state === 'success' && (
          <div className="mt-4 p-4 border border-gray-700 rounded-lg text-center">
            <h4 className="font-semibold text-white">Sync Summary</h4>
            <div className="mt-2 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
              <p className="text-green-400">
                <span className="font-bold text-lg">{result.updated}</span> Variants Updated
              </p>
              <p className="text-gray-400">
                <span className="font-bold text-lg">{result.upToDate}</span> Up-to-date
              </p>
              <p className="text-yellow-400">
                <span className="font-bold text-lg">{result.notFound}</span> Not Found
              </p>
              <p className={result.errors > 0 ? 'text-red-400' : 'text-gray-400'}>
                <span className="font-bold text-lg">{result.errors}</span> Errors
              </p>
            </div>
            {errorDetails.length > 0 && (
              <div className="mt-4 text-left p-3 bg-red-900/50 rounded-md text-red-300 text-xs">
                <p className="font-bold mb-2">
                  Error Details (first {errorDetails.length} of {result.errors} shown):
                </p>
                <ul className="list-disc list-inside space-y-1 font-mono">
                  {errorDetails.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
                {result.errors > 5 && (
                  <p className="mt-2 italic">Check browser console for all errors.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
