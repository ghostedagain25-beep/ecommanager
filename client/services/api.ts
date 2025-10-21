import type { User, Website } from '../types/index';
import type { WorkflowStep } from '../types/processing';
import type { SyncHistorySummary, SyncDetail } from '../types/sync';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// --- JWT Token Management ---
let authToken: string | null = localStorage.getItem('authToken');

export const getToken = (): string | null => authToken;
export const setToken = (token: string): void => {
  authToken = token;
  localStorage.setItem('authToken', token);
};
export const clearToken = (): void => {
  authToken = null;
  localStorage.removeItem('authToken');
};

const getAuthHeader = (): Record<string, string> => {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    
    // Handle specific error cases
    if (response.status === 413) {
      throw new Error('Sync data is too large. Please try syncing fewer products at once or contact support.');
    }
    if (response.status === 408) {
      throw new Error('Sync operation timed out. Please try again with fewer products.');
    }
    
    throw new Error(errorData.message || 'An unknown API error occurred');
  }

  if (response.status === 204) {
    // No Content
    return null;
  }

  return response.json();
};

// --- Auth ---
export const login = async (
  username: string,
  password_provided: string,
): Promise<{ user: User; token: string }> => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password: password_provided }),
  });
};

export const getProfile = async (): Promise<User> => {
  return apiRequest('/auth/profile');
};

export const loginAsUser = async (username: string): Promise<{ user: User; token: string }> => {
  return apiRequest(`/auth/login-as`, {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
};

// --- User Management ---
export const getUsers = async (): Promise<User[]> => {
  return apiRequest('/users');
};

export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    await apiRequest(`/users/check/${username}`);
    return false; // 204 No Content means it doesn't exist
  } catch (error: any) {
    // Only return true if it's specifically a 409 Conflict (username exists)
    if (error.status === 409 || (error.message && error.message.includes('Username is taken'))) {
      return true; // Username exists
    }
    // For any other error (network, server error, etc.), throw it so the UI can handle it
    throw error;
  }
};

export const addUser = async (user: User): Promise<User> => {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
};

export const updateUser = async (username: string, userData: Partial<User>): Promise<User> => {
  return apiRequest(`/users/${username}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (username: string): Promise<void> => {
  return apiRequest(`/users/${username}`, { method: 'DELETE' });
};

// --- User Menu Settings ---
export const getUserMenuSettings = async (username: string): Promise<Record<string, boolean>> => {
  return apiRequest(`/users/${username}/menu-settings`);
};

export const saveUserMenuSettings = async (
  username: string,
  settings: Record<string, boolean>,
): Promise<void> => {
  return apiRequest(`/users/${username}/menu-settings`, {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
};

// --- Website Management ---
export const getWebsitesForUser = async (username: string): Promise<Website[]> => {
  console.log(`\n=== FRONTEND: Fetching websites for user: ${username} ===`);

  const websites = await apiRequest(`/websites/user/${username}`);

  console.log(
    `FRONTEND: Received ${websites.length} websites:`,
    websites.map((w) => ({
      name: w.name,
      platform: w.platform,
      id: w._id || w.id,
      is_primary: w.is_primary,
    })),
  );

  return websites;
};

export const addWebsite = async (
  websiteData: Omit<Website, '_id' | 'id' | 'user_username'>,
  username: string,
): Promise<Website> => {
  return apiRequest(`/websites/user/${username}`, {
    method: 'POST',
    body: JSON.stringify(websiteData),
  });
};

export const updateWebsite = async (
  websiteId: string,
  websiteData: Partial<Omit<Website, '_id' | 'id' | 'user_username'>>,
): Promise<Website> => {
  return apiRequest(`/websites/${websiteId}`, {
    method: 'PUT',
    body: JSON.stringify(websiteData),
  });
};

export const deleteWebsite = async (websiteId: string): Promise<void> => {
  return apiRequest(`/websites/${websiteId}`, { method: 'DELETE' });
};

export const setPrimaryWebsite = async (username: string, websiteId: string): Promise<void> => {
  return apiRequest(`/websites/user/${username}/primary/${websiteId}`, { method: 'POST' });
};

// --- Database Explorer (Admin) ---
export const getTables = async (): Promise<string[]> => {
  return apiRequest('/admin/tables');
};

export const getTableData = async (
  tableName: string,
): Promise<{ columns: string[]; rows: any[][] }> => {
  return apiRequest(`/admin/tables/${tableName}`);
};

export const searchAllTables = async (
  searchTerm: string,
): Promise<Record<string, { columns: string[]; rows: any[][] }>> => {
  return apiRequest(`/admin/search?term=${encodeURIComponent(searchTerm)}`);
};

// --- Workflow Management ---
export const getWorkflowSteps = async (): Promise<WorkflowStep[]> => {
  return apiRequest('/workflow/steps');
};

export const updateWorkflowStepsEnabled = async (
  updates: { step_key: string; is_enabled: boolean }[],
): Promise<void> => {
  return apiRequest('/workflow/steps', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
};

// --- Sync History ---
export const addSyncEvent = async (
  username: string,
  summary: Omit<SyncHistorySummary, 'id' | 'user_username' | 'sync_timestamp'>,
  details: Omit<SyncDetail, 'id' | 'sync_id'>[],
): Promise<void> => {
  // Check payload size and chunk if necessary
  const payload = { username, summary, details };
  const payloadSize = JSON.stringify(payload).length;
  const maxSizeBytes = 80 * 1024 * 1024; // 80MB to leave some buffer
  
  if (payloadSize > maxSizeBytes && details.length > 1) {
    // Split details into chunks
    const chunkSize = Math.ceil(details.length / Math.ceil(payloadSize / maxSizeBytes));
    console.log(`Large sync detected (${(payloadSize / 1024 / 1024).toFixed(2)}MB). Splitting into chunks of ${chunkSize} items.`);
    
    for (let i = 0; i < details.length; i += chunkSize) {
      const chunk = details.slice(i, i + chunkSize);
      const chunkSummary = i === 0 ? summary : {
        ...summary,
        total_updated: 0, // Only count in first chunk
        total_up_to_date: 0,
        total_not_found: 0,
        total_errors: 0
      };
      
      await apiRequest('/syncs', {
        method: 'POST',
        body: JSON.stringify({ username, summary: chunkSummary, details: chunk }),
      });
    }
  } else {
    // Send as single request
    return apiRequest('/syncs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};

export const getLatestSyncSummary = async (
  username: string,
): Promise<SyncHistorySummary | null> => {
  return apiRequest(`/syncs/summary/latest/${username}`);
};

export const getSyncDetailsByHistoryId = async (historyId: number): Promise<SyncDetail[]> => {
  return apiRequest(`/syncs/details/${historyId}`);
};

export const getAllSyncSummaries = async (): Promise<SyncHistorySummary[]> => {
  return apiRequest('/syncs/summary/all');
};

// --- Push API Helpers ---
export const addPushEvent = async (
  username: string,
  websiteId: string,
  type: 'inventory' | 'price' | 'product',
  summary: Partial<any>,
  details: any[],
): Promise<void> => {
  return apiRequest('/pushes', {
    method: 'POST',
    body: JSON.stringify({ username, websiteId, type, summary, details }),
  });
};

export const getLatestPushSummary = async (username: string): Promise<any | null> => {
  return apiRequest(`/pushes/summary/latest/${username}`);
};

export const getPushDetailsById = async (pushId: string): Promise<any[]> => {
  return apiRequest(`/pushes/details/${pushId}`);
};

export const getAllPushSummaries = async (): Promise<any[]> => {
  return apiRequest('/pushes/summary/all');
};
