import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ApiKeyManager from './components/ApiKeyManager';
import UsageStats from './components/UsageStats';
import RecentJobs from './components/RecentJobs';
import Login from './components/Login';

const App: React.FC = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // On initial load, check for a stored token
  useEffect(() => {
    const token = sessionStorage.getItem('sessionToken');
    const email = sessionStorage.getItem('userEmail');
    if (token && email) {
      setSessionToken(token);
      setUserEmail(email);
    }
  }, []);

  const handleLoginSuccess = (token: string, email: string) => {
    sessionStorage.setItem('sessionToken', token);
    sessionStorage.setItem('userEmail', email);
    setSessionToken(token);
    setUserEmail(email);
    setLoginError(null);
  };
  
  const handleLoginFailure = (message: string) => {
    setLoginError(message);
  }

  const handleLogout = () => {
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('userEmail');
    setSessionToken(null);
    setUserEmail(null);
    setLoginError(null);
  };

  if (!sessionToken) {
    return <Login onLoginSuccess={handleLoginSuccess} onLoginFailure={handleLoginFailure} error={loginError} />;
  }

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <Header userEmail={userEmail} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <ApiKeyManager sessionToken={sessionToken} />
          <UsageStats sessionToken={sessionToken} />
          <RecentJobs sessionToken={sessionToken} />
        </div>
      </main>
    </div>
  );
};

export default App;
