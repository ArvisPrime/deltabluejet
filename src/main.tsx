import React from 'react';
import ReactDOM from 'react-dom/client';
import './config/i18n';           // Initialize i18n (must be before App)
import './styles/rtl.css';        // RTL layout overrides
import './styles/responsive.css'; // Mobile & tablet responsive overrides
import App from './app/App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
