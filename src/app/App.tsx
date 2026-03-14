import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { onAuthChange } from '../services/auth';
import { useCmsHeaderStore } from '../stores/cmsHeaderStore';
import ToastContainer from '../components/ui/ToastContainer';
import ErrorBoundary from '../components/common/ErrorBoundary';

const App: React.FC = () => {
  // Subscribe to Firebase auth state changes at the top level
  useEffect(() => {
    const unsubscribe = onAuthChange();
    useCmsHeaderStore.getState().load();
    return unsubscribe;
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;

