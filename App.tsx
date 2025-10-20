import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { WebsiteProvider } from './context/WebsiteContext';
import LoginPage from './components/auth/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { DatabaseIcon, SpinnerIcon } from './components/ui/icons';

const App: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  
  if (isAuthLoading) {
    return (
        <div className="min-h-screen bg-[#1b2735] flex flex-col items-center justify-center text-center p-4">
            <div className="flex items-center text-sky-400">
                <SpinnerIcon className="w-8 h-8 mr-4" />
                <DatabaseIcon className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-semibold text-white mt-6">
              Connecting to Server...
            </h1>
            <p className="text-gray-400 mt-2">Authenticating your session. This will only take a moment.</p>
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <WebsiteProvider>
      <div className="min-h-screen bg-[#1b2735] text-gray-100" key={user.username}>
        {user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
      </div>
    </WebsiteProvider>
  );
};

export default App;