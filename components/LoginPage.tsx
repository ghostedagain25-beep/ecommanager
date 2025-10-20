import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyIcon, SpinnerIcon, UserIcon } from './icons';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Stock Processor Dashboard</h1>
                    <p className="text-md text-gray-400 mt-2">Please sign in to continue</p>
                </header>
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="admin"
                                />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="password"className="block text-sm font-medium text-gray-300">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        
                        <div>
                             <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors"
                            >
                                {isLoading ? <SpinnerIcon className="w-5 h-5"/> : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;