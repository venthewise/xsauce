import React from 'react';
import { BoltIcon } from './icons/BoltIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface HeaderProps {
  onLogout: () => void;
  userEmail: string | null;
}

const Header: React.FC<HeaderProps> = ({ onLogout, userEmail }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <BoltIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="text-xl font-bold text-gray-100">X-SAUCE</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300 hidden sm:block">
              {userEmail && <span className="font-medium">{userEmail}</span>}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 p-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
              aria-label="Logout"
            >
              <LogoutIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;