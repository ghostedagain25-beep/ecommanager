

import React from 'react';
// FIX: Update import path for types.
import type { AppStatus } from '../../types/index';
import { CheckCircleIcon, ExclamationIcon, InfoIcon, SpinnerIcon } from './icons';

interface StatusDisplayProps {
  status: AppStatus;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  const getStatusContent = () => {
    switch (status.state) {
      case 'idle':
        return { icon: <InfoIcon className="w-5 h-5 text-gray-400" />, color: 'text-gray-400' };
      case 'processing':
        return { icon: <SpinnerIcon className="w-5 h-5 text-sky-400" />, color: 'text-sky-400' };
      case 'success':
        return { icon: <CheckCircleIcon className="w-5 h-5 text-green-400" />, color: 'text-green-400' };
      case 'error':
        return { icon: <ExclamationIcon className="w-5 h-5 text-red-400" />, color: 'text-red-400' };
      default:
        return { icon: null, color: 'text-gray-400' };
    }
  };

  const { icon, color } = getStatusContent();

  return (
    <div className="w-full max-w-lg min-h-[40px] flex items-center justify-center p-2 bg-gray-900/50 rounded-lg">
      <div className="flex items-center space-x-3">
        {icon}
        <p className={`text-sm ${color}`}>{status.message}</p>
      </div>
    </div>
  );
};
