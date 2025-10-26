import { useState, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  timeoutId: NodeJS.Timeout | null;
}

export const useLoadingState = (timeoutMs: number = 15000) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    timeoutId: null
  });

  const startLoading = () => {
    // Clear any existing timeout
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      console.warn('Loading timeout reached');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Loading timeout - please try again',
        timeoutId: null
      }));
    }, timeoutMs);

    setState({
      isLoading: true,
      error: null,
      timeoutId
    });
  };

  const stopLoading = (error?: string) => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }

    setState({
      isLoading: false,
      error: error || null,
      timeoutId: null
    });
  };

  const clearError = () => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
    };
  }, [state.timeoutId]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    startLoading,
    stopLoading,
    clearError
  };
};
