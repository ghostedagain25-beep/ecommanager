import { useEffect } from 'react';

// Custom hook to initialize Lucide icons in React components
export const useIcons = (dependencies: any[] = []) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        try {
          (window as any).lucide.createIcons();
        } catch (error) {
          console.warn('Failed to initialize Lucide icons:', error);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, dependencies);
};

// Hook specifically for components that need icons on mount
export const useIconsOnMount = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        try {
          (window as any).lucide.createIcons();
        } catch (error) {
          console.warn('Failed to initialize Lucide icons:', error);
        }
      }
    }, 100); // Slightly longer delay for mount

    return () => clearTimeout(timer);
  }, []);
};
