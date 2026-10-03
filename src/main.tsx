import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { AuctionProvider } from './contexts/AuctionContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <SessionProvider>
        <AuctionProvider>
          <App />
        </AuctionProvider>
      </SessionProvider>
    </AuthProvider>
  </React.StrictMode>
);
