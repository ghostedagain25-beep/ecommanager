import React from 'react';
import { useWebsite } from '../../context/WebsiteContext';

interface WebsiteSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export const WebsiteSelector: React.FC<WebsiteSelectorProps> = ({ 
  className = "bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500 w-full",
  showLabel = false 
}) => {
  const { websites, selectedWebsite, setSelectedWebsite, isLoading } = useWebsite();

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const websiteId = e.target.value;
    const newWebsite = websites.find(w => w.id.toString() === websiteId);
    setSelectedWebsite(newWebsite || null);
  };

  if (websites.length <= 1) {
    return null; // Don't show selector if there's only one or no websites
  }

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <label htmlFor="website-select" className="text-sm font-medium text-gray-300">
          Select Website
        </label>
      )}
      <select
        id="website-select"
        value={selectedWebsite?.id?.toString() || ''}
        onChange={handleWebsiteChange}
        className={className}
        disabled={isLoading}
      >
        <option value="">Select a website...</option>
        {websites.map((site, index) => (
          <option key={site.id || `website-${index}`} value={site.id?.toString()}>
            {site.name} ({site.platform})
            {site.is_primary && ' (Primary)'}
          </option>
        ))}
      </select>
    </div>
  );
};
