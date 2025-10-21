import React, { useState } from 'react';
import { WordPressGuide } from './WordPressGuide';
import { ShopifyGuide } from './ShopifyGuide';
import { WordPressIcon, ShopifyIcon } from '../ui/icons';

type Guide = 'wordpress' | 'shopify';

export const Knowledgebase: React.FC = () => {
  const [activeGuide, setActiveGuide] = useState<Guide>('wordpress');

  const TabButton: React.FC<{ guide: Guide; label: string; icon: React.ReactNode }> = ({
    guide,
    label,
    icon,
  }) => {
    const isActive = activeGuide === guide;
    return (
      <button
        onClick={() => setActiveGuide(guide)}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
          isActive
            ? 'bg-slate-800 text-sky-400 border-sky-400'
            : 'text-gray-400 border-transparent hover:bg-slate-800/50 hover:text-white'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Knowledgebase</h1>
        <p className="text-lg text-gray-400 mt-2">
          Find guides and tutorials on how to connect and use the application.
        </p>
      </header>

      <div className="bg-gray-900/50 rounded-lg">
        <div className="border-b border-slate-700 px-4">
          <div className="flex -mb-px">
            <TabButton
              guide="wordpress"
              label="WordPress / WooCommerce"
              icon={<WordPressIcon className="w-5 h-5" />}
            />
            <TabButton guide="shopify" label="Shopify" icon={<ShopifyIcon className="w-5 h-5" />} />
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeGuide === 'wordpress' && <WordPressGuide />}
          {activeGuide === 'shopify' && <ShopifyGuide />}
        </div>
      </div>
    </div>
  );
};
