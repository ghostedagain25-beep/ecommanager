import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Website, User } from '../types/index';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

interface WebsiteContextType {
  websites: Website[];
  selectedWebsite: Website | null;
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  setSelectedWebsite: (website: Website | null) => void;
  setSelectedUser: (user: User | null) => void;
  loadWebsitesForUser: (user: User) => Promise<void>;
  refreshWebsites: () => Promise<void>;
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined);

interface WebsiteProviderProps {
  children: ReactNode;
}

export const WebsiteProvider: React.FC<WebsiteProviderProps> = ({ children }) => {
  const { user: loggedInUser } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select logged in user for non-admin views
  useEffect(() => {
    if (loggedInUser && !selectedUser) {
      setSelectedUser(loggedInUser);
    }
  }, [loggedInUser, selectedUser]);

  const loadWebsitesForUser = async (user: User) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading websites for user: ${user.username}`);
      const userWebsites = await api.getWebsitesForUser(user.username);
      
      setWebsites(userWebsites);
      
      // Auto-select first website if none selected or if selected website is not in the new list
      if (userWebsites.length > 0) {
        const currentWebsiteStillValid = selectedWebsite && 
          userWebsites.some(w => w.id === selectedWebsite.id);
        
        if (!currentWebsiteStillValid) {
          // Try to find primary website first, otherwise use first website
          const primaryWebsite = userWebsites.find(w => w.is_primary);
          const websiteToSelect = primaryWebsite || userWebsites[0];
          setSelectedWebsite(websiteToSelect);
          console.log(`Auto-selected website: ${websiteToSelect.name}`);
        }
      } else {
        setSelectedWebsite(null);
      }
    } catch (err) {
      console.error('Failed to load websites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load websites');
      setWebsites([]);
      setSelectedWebsite(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWebsites = async () => {
    if (selectedUser) {
      await loadWebsitesForUser(selectedUser);
    }
  };

  // Load websites when selected user changes
  useEffect(() => {
    if (selectedUser) {
      loadWebsitesForUser(selectedUser);
    } else {
      setWebsites([]);
      setSelectedWebsite(null);
    }
  }, [selectedUser]);

  const handleSetSelectedUser = (user: User | null) => {
    setSelectedUser(user);
    // Clear website selection when user changes
    if (user !== selectedUser) {
      setSelectedWebsite(null);
    }
  };

  const handleSetSelectedWebsite = (website: Website | null) => {
    setSelectedWebsite(website);
    // Store in localStorage for persistence across page refreshes
    if (website) {
      localStorage.setItem('selectedWebsiteId', website.id.toString());
    } else {
      localStorage.removeItem('selectedWebsiteId');
    }
  };

  // Restore selected website from localStorage
  useEffect(() => {
    const savedWebsiteId = localStorage.getItem('selectedWebsiteId');
    if (savedWebsiteId && websites.length > 0 && !selectedWebsite) {
      const savedWebsite = websites.find(w => w.id.toString() === savedWebsiteId);
      if (savedWebsite) {
        setSelectedWebsite(savedWebsite);
      }
    }
  }, [websites, selectedWebsite]);

  const value: WebsiteContextType = {
    websites,
    selectedWebsite,
    selectedUser,
    isLoading,
    error,
    setSelectedWebsite: handleSetSelectedWebsite,
    setSelectedUser: handleSetSelectedUser,
    loadWebsitesForUser,
    refreshWebsites,
  };

  return (
    <WebsiteContext.Provider value={value}>
      {children}
    </WebsiteContext.Provider>
  );
};

export const useWebsite = (): WebsiteContextType => {
  const context = useContext(WebsiteContext);
  if (!context) {
    throw new Error('useWebsite must be used within a WebsiteProvider');
  }
  return context;
};
