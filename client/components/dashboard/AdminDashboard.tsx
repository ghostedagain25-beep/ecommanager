import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// FIX: Corrected import paths after component refactoring.
import Navigation from '../layout/Navigation';
import UserManagement from '../admin/user-management/UserManagement';
import WorkflowDashboard from '../admin/workflow/WorkflowDashboard';
import DatabaseExplorer from '../admin/database/DatabaseExplorer';
import AdminSettings from '../settings/AdminSettings';
import AdminSyncHistory from '../history/AdminSyncHistory';
import { OrderViewer } from '../orders/OrderViewer';
import { ProductManager } from '../catalog/ProductManager';
import { CategoryManager } from '../catalog/CategoryManager';
import { Knowledgebase } from '../knowledgebase/Knowledgebase';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('products');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    // After mounting, call `lucide.createIcons()` to render the icons
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
    }
  }, [activeView, isSidebarExpanded]);

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />;
      case 'workflow':
        return <WorkflowDashboard />;
      case 'history':
        return <AdminSyncHistory />;
      case 'orders':
        return <OrderViewer />;
      case 'products':
        return <ProductManager isAdminView={true} />;
      case 'categories':
        return <CategoryManager isAdminView={true} />;
      case 'database':
        return <DatabaseExplorer />;
      case 'knowledgebase':
        return <Knowledgebase />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <h1>Admin View: {activeView}</h1>;
    }
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <Navigation
        role="admin"
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

export default AdminDashboard;
