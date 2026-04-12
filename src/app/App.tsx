import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { onAuthChange } from '../services/auth';
import { useCmsHeaderStore } from '../stores/cmsHeaderStore';
import ToastContainer from '../components/ui/ToastContainer';
import ErrorBoundary from '../components/common/ErrorBoundary';

import { useConfigStore } from '../stores/configStore';

const App: React.FC = () => {
  // Subscribe to Firebase auth state changes and initial system configs
  useEffect(() => {
    const unsubAuth = onAuthChange();
    const unsubConfig = useConfigStore.getState().initializeConfigs();
    useCmsHeaderStore.getState().load();
    return () => {
        unsubAuth();
        unsubConfig();
    };
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;

