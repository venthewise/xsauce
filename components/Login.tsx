import React, { useEffect, useRef } from 'react';
import { BoltIcon } from './icons/BoltIcon';

// This is a simple, dependency-free JWT decoder
const decodeJwt = (token: string): { email?: string; name?: string; } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

declare global {
  interface Window {
    google: any;
  }
}

interface LoginProps {
  onLoginSuccess: (token: string, email: string) => void;
  onLoginFailure: (message: string) => void;
  error: string | null;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "870686277575-cg11gibqnkk1efpteetibmp095lh43hl.apps.googleusercontent.com";
// The backend URL. In production, this would be an environment variable.
const API_URL = import.meta.env.VITE_API_URL;

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onLoginFailure, error }) => {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window.google === 'undefined' || !googleButtonRef.current) {
      return;
    }

    const handleCredentialResponse = async (response: { credential?: string }) => {
      if (!response.credential) {
        onLoginFailure("Google sign-in failed. No credential received.");
        return;
      }
      
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Authentication failed.');
        }

        const decodedGoogleToken = decodeJwt(response.credential);
        if (data.token && decodedGoogleToken?.email) {
          onLoginSuccess(data.token, decodedGoogleToken.email);
        } else {
           throw new Error("Invalid response from server.");
        }

      } catch (err: any) {
        onLoginFailure(err.message || "An unexpected error occurred during login.");
      }
    };

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
      });
    } catch(err) {
      console.error("Google Identity Services error:", err)
      onLoginFailure("Could not initialize Google Sign-In.");
    }
  }, [onLoginSuccess, onLoginFailure]);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center items-center space-x-3 mb-8">
          <BoltIcon className="h-10 w-10 text-indigo-400" />
          <h1 className="text-3xl font-bold text-gray-100">X-SAUCE</h1>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-center text-white mb-2">Sign In</h2>
          <p className="text-gray-400 text-center mb-6">Access your dashboard using Google.</p>
          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-6 text-sm text-center">
              {error}
            </div>
          )}
          <div className="flex justify-center items-center h-12">
             <div ref={googleButtonRef} id="google-signin-button"></div>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-4">Access is restricted to authorized users only.</p>
      </div>
    </div>
  );
};

export default Login;
