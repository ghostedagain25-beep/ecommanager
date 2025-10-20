
import React from 'react';
import { CheckCircleIcon, SpinnerIcon } from './icons';

interface ProgressTrackerProps {
  steps: string[];
  currentStep: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full max-w-lg p-6 bg-gray-900/50 rounded-lg">
      <h3 className="text-lg font-semibold text-center text-white mb-4">Processing Files...</h3>
      <ol className="space-y-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          let icon;
          let textColor = 'text-gray-500';

          if (isCompleted) {
            icon = <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            textColor = 'text-gray-400 line-through';
          } else if (isCurrent) {
            icon = <SpinnerIcon className="w-5 h-5 text-sky-400" />;
            textColor = 'text-sky-400 font-semibold';
          } else { // isPending
            icon = <div className="w-5 h-5 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-gray-600"></div></div>;
            textColor = 'text-gray-500';
          }

          return (
            <li key={index} className="flex items-center space-x-3 transition-all duration-300">
              <span className="flex-shrink-0">{icon}</span>
              <span className={`text-sm ${textColor}`}>{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
