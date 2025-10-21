import React from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { useAuth } from '../../context/AuthContext';

interface WebsiteSelectorProps {
  className?: string;
  showLabel?: boolean;
  showUserSelector?: boolean; // For admin views
  compact?: boolean;
}

export const WebsiteSelector: React.FC<WebsiteSelectorProps> = ({
  className = 'bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500 w-full',
  showLabel = false,
  showUserSelector = false,
  compact = false,
}) => {
  const { user } = useAuth();
  const {
    websites,
    selectedWebsite,
    setSelectedWebsite,
    selectedUser,
    setSelectedUser,
    isLoading,
    error,
  } = useWebsite();

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const websiteId = e.target.value;
    if (!websiteId) {
      setSelectedWebsite(null);
      return;
    }
    const newWebsite = websites.find((w) => (w.id || w._id)?.toString() === websiteId);
    setSelectedWebsite(newWebsite || null);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const username = e.target.value;
    if (username && user?.role === 'admin') {
      // For admin, allow selecting different users
      setSelectedUser({ username } as any); // Simplified for now
    }
  };

  if (error) {
    return (
      <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-500">
        Error loading websites: {error}
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-gray-400 text-sm p-2">Loading websites...</div>;
  }

  if (websites.length === 0) {
    return (
      <div className="text-yellow-400 text-sm p-2 bg-yellow-900/20 rounded border border-yellow-500">
        No websites found. Please add a website first.
      </div>
    );
  }

  // Don't show selector if there's only one website and not in compact mode
  if (websites.length === 1 && !compact && !showUserSelector) {
    return (
      <div className="text-gray-300 text-sm p-2">
        Website: <span className="text-white font-medium">{websites[0].name}</span>
        {websites[0].is_primary && <span className="text-sky-400 ml-2">(Primary)</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <label htmlFor="website-select" className="text-sm font-medium text-gray-300">
          {showUserSelector ? 'User & Website' : 'Select Website'}
        </label>
      )}

      {showUserSelector && user?.role === 'admin' && (
        <select
          id="user-select"
          value={selectedUser?.username || ''}
          onChange={handleUserChange}
          className={className}
          disabled={isLoading}
        >
          <option value="">Select a user...</option>
          {/* This would need to be populated with available users */}
        </select>
      )}

      <select
        id="website-select"
        value={(selectedWebsite?.id || selectedWebsite?._id)?.toString() || ''}
        onChange={handleWebsiteChange}
        className={className}
        disabled={isLoading || websites.length === 0}
      >
        <option value="">
          {websites.length === 0 ? 'No websites available' : 'Select a website...'}
        </option>
        {websites.map((site, index) => (
          <option
            key={site.id || site._id || `website-${index}`}
            value={(site.id || site._id)?.toString()}
          >
            {site.name} ({site.platform}){site.is_primary && ' (Primary)'}
          </option>
        ))}
      </select>

      {selectedWebsite && (
        <div className="text-xs text-gray-400 mt-1">URL: {selectedWebsite.url}</div>
      )}
    </div>
  );
};
