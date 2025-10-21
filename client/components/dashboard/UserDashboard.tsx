import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// FIX: Corrected import paths after component refactoring.
import Navigation from '../layout/Navigation';
import UserSettings from '../settings/UserSettings';
import SyncHistory from '../history/SyncHistory';
import { OrderViewer } from '../orders/OrderViewer';
import { ProductManager } from '../catalog/ProductManager';
import { CategoryManager } from '../catalog/CategoryManager';
import DataProcessingView from '../processing/DataProcessingView';
import { Knowledgebase } from '../knowledgebase/Knowledgebase';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('orders');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    // After mounting, call `lucide.createIcons()` to render the icons
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
    }
  }, [activeView, isSidebarExpanded]);

  const renderContent = () => {
    switch (activeView) {
      case 'processing':
        return <DataProcessingView />;
      case 'history':
        return <SyncHistory />;
      case 'orders':
        return <OrderViewer />;
      case 'products':
        return <ProductManager isAdminView={false} />;
      case 'categories':
        return <CategoryManager isAdminView={false} />;
      case 'knowledgebase':
        return <Knowledgebase />;
      case 'settings':
        return <UserSettings />;
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <Navigation
        role="user"
        activeView={activeView}
        onNavigate={setActiveView}
        user={user}
        logout={logout}
        isExpanded={isSidebarExpanded}
        onToggleExpand={setIsSidebarExpanded}
      />
      <div
        className={`pb-24 sm:pb-0 transition-all duration-300 ${isSidebarExpanded ? 'sm:ml-64' : 'sm:ml-16'}`}
      >
        <main className="p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default UserDashboard;
