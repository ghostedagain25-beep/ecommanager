import React, { useEffect, useState } from 'react';

const QuickGuide: React.FC = () => {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const quickGuideUrl = (() => {
    try {
      const v = localStorage.getItem('quickGuideUrl');
      return v && v.trim().length > 0 ? v : '/quick-guide.html';
    } catch {
      return '/quick-guide.html';
    }
  })();

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(quickGuideUrl, { credentials: 'omit' });
        if (!res.ok) throw new Error(`Failed to load quick guide (${res.status})`);
        const text = await res.text();
        if (!aborted) setHtml(text);
      } catch (e: any) {
        if (!aborted) setError(e?.message || 'Failed to load quick guide');
      } finally {
        if (!aborted) setIsLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [quickGuideUrl]);

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(quickGuideUrl, '_blank');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex gap-2">
          <li>
            <span className="hover:text-white cursor-default">Home</span>
          </li>
          <li>/</li>
          <li className="text-white font-medium">Quick Guide</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Quick Guide</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => location.reload()} className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md">
            Refresh
          </button>
          <button onClick={handleOpenNewTab} className="px-3 py-1.5 text-sm bg-sky-600 hover:bg-sky-700 rounded-md">
            Open in new tab
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-gray-300">Loading guide...</div>
      )}
      {error && (
        <div className="p-4 bg-red-900/40 rounded-lg border border-red-700 text-red-300">{error}</div>
      )}

      {!isLoading && !error && (
        <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
          {/* Render inside iframe to preserve styles of the generated HTML without risking CSS collisions */}
          <iframe title="Quick Guide" srcDoc={html} className="w-full h-[70vh]" />
        </div>
      )}
    </div>
  );
};

export default QuickGuide;
