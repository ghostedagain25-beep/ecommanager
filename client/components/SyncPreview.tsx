import React, { useState } from 'react';
// FIX: Update import paths for types.
import type {
  SyncPreviewData,
  ChangesObject,
  ProductSyncChange,
  ChangeDetail,
} from '../types/sync';
import type { WooCommerceProduct } from '../types/woocommerce';
import { SpinnerIcon, SyncIcon, CancelIcon, EyeIcon } from './icons';

const ChangesDisplay: React.FC<{ changes: ChangesObject; currencySymbol: string }> = ({
  changes,
  currencySymbol,
}) => {
  if (Object.keys(changes).length === 0) {
    return <span className="text-gray-500">-</span>;
  }

  const formatPrice = (key: string, value: any) => {
    if (key.includes('price')) {
      return `${currencySymbol}${value}`;
    }
    return String(value ?? 'N/A');
  };

  return (
    <ul className="space-y-1 text-xs font-mono">
      {Object.entries(changes).map(([key, value]) => {
        const detail = value as ChangeDetail;
        return (
          <li key={key}>
            <span className="font-semibold text-gray-300 capitalize">
              {key.replace(/_/g, ' ')}:
            </span>
            <span className="text-red-400 line-through ml-2">{formatPrice(key, detail.old)}</span>
            <span className="text-green-400 ml-1">→ {formatPrice(key, detail.new)}</span>
          </li>
        );
      })}
    </ul>
  );
};

interface SyncPreviewProps {
  previewData: SyncPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  isSyncing: boolean;
  syncsRemaining: number;
  currencySymbol: string;
}

const SyncPreview: React.FC<SyncPreviewProps> = ({
  previewData,
  onConfirm,
  onCancel,
  isSyncing,
  syncsRemaining,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'update' | 'uptodate' | 'notfound'>('update');

  const { toUpdate, upToDate, notFound } = previewData;

  const renderTable = (
    data: (ProductSyncChange | WooCommerceProduct | { sku: string; name: string })[],
  ) => {
    if (data.length === 0) {
      return <p className="text-center text-gray-500 py-8">No products in this category.</p>;
    }

    const headers = ['SKU', 'Product Name'];
    if (activeTab === 'update') headers.push('Changes');

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50 max-h-96">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50 sticky top-0">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {data.map((item, index) => (
              <tr key={'sku' in item ? item.sku : index} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {'sku' in item ? item.sku : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                  {'name' in item ? item.name : 'N/A'}
                </td>
                {activeTab === 'update' && 'changes' in item && (
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <ChangesDisplay changes={item.changes} currencySymbol={currencySymbol} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'update':
        return renderTable(toUpdate);
      case 'uptodate':
        return renderTable(upToDate);
      case 'notfound':
        return renderTable(notFound.map((n) => ({ ...n, name: n.product_name })));
      default:
        return null;
    }
  };

  const TabButton: React.FC<{
    tabKey: 'update' | 'uptodate' | 'notfound';
    label: string;
    count: number;
  }> = ({ tabKey, label, count }) => {
    const isActive = activeTab === tabKey;
    return (
      <button
        onClick={() => setActiveTab(tabKey)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
      >
        {label}{' '}
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-sky-200 text-sky-800' : 'bg-gray-600 text-gray-200'}`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="animate-fade-in">
      <header className="text-center mb-6">
        <div className="flex items-center justify-center gap-3">
          <EyeIcon className="w-7 h-7 text-sky-400" />
          <h2 className="text-2xl font-semibold text-white">Sync Preview</h2>
        </div>
        <p className="text-gray-400 mt-2">
          Review the proposed changes before applying them to your store.
        </p>
      </header>

      <div className="bg-gray-900/50 p-6 rounded-lg">
        <div className="flex items-center space-x-2 border-b border-gray-700 pb-4 mb-4">
          <TabButton tabKey="update" label="To Be Updated" count={toUpdate.length} />
          <TabButton tabKey="uptodate" label="Up-to-date" count={upToDate.length} />
          <TabButton tabKey="notfound" label="Not Found" count={notFound.length} />
        </div>

        {renderContent()}

        <div className="mt-6 pt-6 border-t border-gray-700 flex justify-end items-center gap-4">
          <button
            onClick={onCancel}
            disabled={isSyncing}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50"
          >
            <CancelIcon className="w-5 h-5 mr-2" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSyncing || syncsRemaining <= 0 || toUpdate.length === 0}
            className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isSyncing ? (
              <>
                <SpinnerIcon className="w-5 h-5 mr-3" />
                Syncing...
              </>
            ) : (
              <>
                <SyncIcon className="w-5 h-5 mr-3" />
                Confirm & Sync ({toUpdate.length} Updates)
              </>
            )}
          </button>
        </div>
        {toUpdate.length === 0 && (
          <p className="text-center text-sm text-green-400 mt-4">
            All products are already up-to-date. No action needed.
          </p>
        )}
        {syncsRemaining <= 0 && toUpdate.length > 0 && (
          <p className="text-center text-sm text-red-400 mt-4">
            Cannot sync: You have no syncs remaining. Please contact an administrator.
          </p>
        )}
      </div>
    </div>
  );
};

export default SyncPreview;
