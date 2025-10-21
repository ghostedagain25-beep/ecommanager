import { Admin, MenuItem, User } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Admin Management
export const getAllAdmins = async (): Promise<Admin[]> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/admins`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch admins');
  }
  
  return response.json();
};

export const createAdmin = async (adminData: {
  username: string;
  email?: string;
  password: string;
  allowedMenuItems?: string[];
  syncsRemaining?: number;
  maxWebsites?: number;
}): Promise<Admin> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/admins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(adminData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create admin');
  }
  
  return response.json();
};

export const updateAdmin = async (adminId: string, adminData: {
  allowedMenuItems?: string[];
  syncsRemaining?: number;
  maxWebsites?: number;
  email?: string;
}): Promise<Admin> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(adminData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update admin');
  }
  
  return response.json();
};

export const deleteAdmin = async (adminId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete admin');
  }
};

export const assignUsersToAdmin = async (adminId: string, userIds: string[]): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/admins/${adminId}/assign-users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userIds })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign users to admin');
  }
};

// User Management
export const getAllUsersForSuperAdmin = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/users`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
};

// Menu Items
export const getAvailableMenuItems = async (): Promise<MenuItem[]> => {
  const response = await fetch(`${API_BASE_URL}/superadmin/menu-items`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }
  
  return response.json();
};
