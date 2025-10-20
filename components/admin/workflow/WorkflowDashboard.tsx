import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../../services/api';
import { WorkflowStep } from '../../../types/processing';
import { SpinnerIcon, SaveIcon, CheckCircleIcon, ExclamationIcon, InfoIcon } from '../../ui/icons';

const WorkflowDashboard: React.FC = () => {
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [initialSteps, setInitialSteps] = useState<WorkflowStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getWorkflowSteps();
            setSteps(data);
            setInitialSteps(JSON.parse(JSON.stringify(data))); // Deep copy for reset
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workflow steps.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = (step_key: string) => {
        setSteps(prevSteps =>
            prevSteps.map(step =>
                step.step_key === step_key ? { ...step, is_enabled: !step.is_enabled } : step
            )
        );
        setSuccess(null); // Clear success message on change
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const updates = steps
                .filter(s => !s.is_mandatory)
                .map(s => ({ step_key: s.step_key, is_enabled: s.is_enabled }));

            await api.updateWorkflowStepsEnabled(updates);
            setSuccess('Workflow changes saved successfully!');
            // Refetch to confirm and update initial state
            fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleReset = () => {
        setSteps(JSON.parse(JSON.stringify(initialSteps)));
        setSuccess(null);
        setError(null);
    };

    const hasChanges = JSON.stringify(steps) !== JSON.stringify(initialSteps);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <SpinnerIcon className="w-8 h-8 text-sky-400" />
                <p className="ml-4 text-sky-300">Loading Workflow Configuration...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg" role="alert">
               <ExclamationIcon className="w-5 h-5 mr-3"/>
               <span className="font-medium">Error:</span> {error}
           </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Manage Data Processing Workflow</h2>
                    <p className="text-gray-400 mt-1">Enable or disable optional steps in the data pipeline.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={handleReset} disabled={!hasChanges || isSaving} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50">
                        Reset
                    </button>
                    <button onClick={handleSaveChanges} disabled={!hasChanges || isSaving} className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600">
                        {isSaving ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <SaveIcon className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>
            
             {success && (
                 <div className="flex items-center p-4 mb-4 text-sm text-green-300 bg-green-900/50 rounded-lg" role="alert">
                    <CheckCircleIcon className="w-5 h-5 mr-3"/>
                    {success}
                </div>
            )}
            
            <div className="space-y-4">
                {steps.map(step => (
                    <div key={step.step_key} className="p-4 bg-gray-900/50 rounded-lg flex items-start justify-between">
                        <div className="flex-1 mr-4">
                            <h4 className="font-semibold text-white">{step.step_name}</h4>
                            <p className="text-sm text-gray-400">{step.description}</p>
                        </div>
                        <div className="flex items-center">
                            {step.is_mandatory ? (
                                <span className="px-3 py-1 text-xs font-medium text-gray-300 bg-gray-700 rounded-full">Mandatory</span>
                            ) : (
                                <label htmlFor={`toggle-${step.step_key}`} className="inline-flex relative items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        id={`toggle-${step.step_key}`} 
                                        className="sr-only peer"
                                        checked={step.is_enabled}
                                        onChange={() => handleToggle(step.step_key)}
                                    />
                                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                </label>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-start p-4 text-sm text-sky-300 bg-sky-900/50 rounded-lg">
                <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"/>
                <div>
                    <span className="font-semibold">Note:</span> The order of these steps is fixed to ensure data integrity. Mandatory steps are essential for the process to complete correctly and cannot be disabled.
                </div>
            </div>
        </div>
    );
};

export default WorkflowDashboard;
