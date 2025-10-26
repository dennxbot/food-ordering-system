import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

const AuthDebug = () => {
  const { user, isLoading, isAuthenticated, isAdmin, isKiosk, isInitialized, resetAuth } = useAuth();
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Auth Debug</h3>
      <div className="space-y-1">
        <div>Time: {timestamp}</div>
        <div>Loading: {isLoading ? '✅' : '❌'}</div>
        <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user ? `${user.role} (${user.email})` : 'None'}</div>
        <div>Is Admin: {isAdmin ? '✅' : '❌'}</div>
        <div>Is Kiosk: {isKiosk ? '✅' : '❌'}</div>
        <div>Path: {window.location.pathname}</div>
        <div>Stored User: {localStorage.getItem('currentUser') ? '✅' : '❌'}</div>
        <button
          onClick={resetAuth}
          className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          🚨 Reset Auth
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
