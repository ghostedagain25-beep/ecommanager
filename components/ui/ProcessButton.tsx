
import React from 'react';
import { PlayIcon, SpinnerIcon } from './icons';

interface ProcessButtonProps {
    onClick: () => void;
    disabled: boolean;
    isProcessing: boolean;
}

export const ProcessButton: React.FC<ProcessButtonProps> = ({ onClick, disabled, isProcessing }) => {
  return (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center w-full max-w-xs px-8 py-4 border border-transparent text-lg font-semibold rounded-full text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
    >
      {isProcessing ? (
          <>
            <SpinnerIcon className="w-6 h-6 mr-3" />
            Processing...
          </>
      ) : (
          <>
            <PlayIcon className="w-6 h-6 mr-3" />
            Process Files
          </>
      )}
    </button>
  );
};
