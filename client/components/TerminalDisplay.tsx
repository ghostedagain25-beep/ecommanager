import React, { useEffect, useRef } from 'react';

interface TerminalDisplayProps {
  lines: string[];
}

export const TerminalDisplay: React.FC<TerminalDisplayProps> = ({ lines }) => {
  const endOfTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="w-full h-64 p-4 bg-black/80 rounded-lg shadow-inner font-mono text-xs overflow-y-auto border border-gray-700 animate-fade-in">
      <div className="text-gray-400"># Syncing with WooCommerce...</div>
      {lines.map((line, index) => (
        <div key={index} className="flex whitespace-pre-wrap">
          <span className="text-sky-400 mr-2 flex-shrink-0">$</span>
          <p className="text-gray-200">{line}</p>
        </div>
      ))}
      <div className="flex items-center">
        <span className="text-sky-400 mr-2">$</span>
        <div className="w-2 h-4 bg-green-400 animate-pulse"></div>
      </div>
      <div ref={endOfTerminalRef} />
    </div>
  );
};
