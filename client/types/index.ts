// Generic/App-wide types
export type UserRole = 'superadmin' | 'admin' | 'user';
export type Platform = 'wordpress' | 'shopify';

export interface User {
  username: string;
  password?: string; // Optional for security, especially when sending to client
  role: UserRole;
  syncsRemaining: number;
  maxWebsites: number;
  websiteCount?: number;
  menuSettings?: Record<string, boolean>;
  createdBy?: string;
  assignedAdmins?: string[];
  allowedMenuItems?: string[];
  email?: string;
  isEmailVerified?: boolean;
}

export interface Admin extends User {
  role: 'admin';
  allowedMenuItems: string[];
}

export interface MenuItem {
  key: string;
  label: string;
  description: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthLoading: boolean;
  login: (username: string, password_provided: string) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (userData: Partial<User>) => Promise<void>;
  loginAsUser: (username: string) => Promise<void>;
}

export interface AppStatus {
  state: 'idle' | 'processing' | 'success' | 'error';
  message: string;
}

// Website types
export interface Website {
  _id?: string; // MongoDB ObjectId
  id?: string; // Alias for _id for compatibility
  user_username: string;
  platform: Platform;
  name: string;
  url: string; // For WP: Full URL. For Shopify: store handle (e.g., 'my-store').
  consumerKey: string | null;
  consumerSecret: string | null;
  shopify_access_token: string | null;
  currency_symbol: string;
  is_primary: boolean;
}
