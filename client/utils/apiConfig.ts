/**
 * API Configuration and Validation Utilities
 */

// Get API base URL with validation
export const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    console.warn('VITE_API_URL not set, using default localhost:3002');
    return 'http://localhost:3002/api';
  }

  // Validate URL format
  try {
    new URL(apiUrl);
    return apiUrl;
  } catch (error) {
    console.error('Invalid VITE_API_URL format:', apiUrl);
    return 'http://localhost:3002/api';
  }
};

// Get app configuration
export const getAppConfig = () => {
  return {
    name: import.meta.env.VITE_APP_NAME || 'EcomManager',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    apiUrl: getApiBaseUrl(),
    features: {
      emailVerification: import.meta.env.VITE_ENABLE_EMAIL_VERIFICATION === 'true',
      signup: import.meta.env.VITE_ENABLE_SIGNUP === 'true',
    },
  };
};

// Validate API connection
export const validateApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API connection validation failed:', error);
    return false;
  }
};

// Get environment info
export const getEnvironmentInfo = () => {
  return {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    apiUrl: getApiBaseUrl(),
  };
};

export default {
  getApiBaseUrl,
  getAppConfig,
  validateApiConnection,
  getEnvironmentInfo,
};
