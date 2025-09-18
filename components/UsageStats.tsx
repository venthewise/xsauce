import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { CubeIcon } from './icons/CubeIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';

const API_URL = 'http://localhost:3001';

interface Stat {
  title: string;
  value: string;
}

interface StatCardProps extends Stat {
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex items-center space-x-4">
    <div className="bg-gray-700 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const UsageStats: React.FC<{ sessionToken: string }> = ({ sessionToken }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/stats`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch stats.');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        // Set default stats on error to prevent crashing UI
        setStats([
          { title: "API Calls (Month)", value: "N/A" },
          { title: "Tasks Completed", value: "N/A" },
          { title: "Storage Used", value: "N/A" }
        ]);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [sessionToken]);

  const icons = [
    <ChartBarIcon className="h-6 w-6 text-indigo-400" />,
    <CubeIcon className="h-6 w-6 text-teal-400" />,
    <DatabaseIcon className="h-6 w-6 text-amber-400" />
  ];

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Usage Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Skeleton loaders */}
           {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-gray-800 rounded-lg shadow-lg p-5 h-24 animate-pulse"></div>
           ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Usage Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} icon={icons[index]} />
        ))}
      </div>
    </div>
  );
};

export default UsageStats;
