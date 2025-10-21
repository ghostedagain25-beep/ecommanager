// Icon utility for ensuring Lucide icons are properly initialized
declare global {
  interface Window {
    lucide: any;
  }
}

export const initializeIcons = (): void => {
  if (typeof window !== 'undefined' && window.lucide) {
    try {
      window.lucide.createIcons();
    } catch (error) {
      console.warn('Failed to initialize Lucide icons:', error);
    }
  }
};

// Debounced icon initialization to prevent excessive calls
let iconTimeout: NodeJS.Timeout | null = null;

export const initializeIconsDebounced = (delay: number = 100): void => {
  if (iconTimeout) {
    clearTimeout(iconTimeout);
  }
  
  iconTimeout = setTimeout(() => {
    initializeIcons();
    iconTimeout = null;
  }, delay);
};

// Hook for React components to ensure icons are initialized
export const useIconInitialization = () => {
  const initIcons = () => {
    // Small delay to ensure DOM is updated
    setTimeout(initializeIcons, 50);
  };
  
  return initIcons;
};
