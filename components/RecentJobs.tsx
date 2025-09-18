import React, { useState, useEffect } from 'react';
import { CropJob, JobStatus } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const baseClasses = 'px-2.5 py-0.5 text-xs font-medium rounded-full inline-block';
  const statusConfig = {
    [JobStatus.COMPLETED]: { text: 'Completed', classes: 'bg-green-500/20 text-green-300' },
    [JobStatus.PROCESSING]: { text: 'Processing', classes: 'bg-blue-500/20 text-blue-300 animate-pulse' },
    [JobStatus.PENDING]: { text: 'Pending', classes: 'bg-yellow-500/20 text-yellow-300' },
    [JobStatus.FAILED]: { text: 'Failed', classes: 'bg-red-500/20 text-red-300' },
  };
  const config = statusConfig[status];
  return <span className={`${baseClasses} ${config.classes}`}>{config.text}</span>;
};

const RecentJobs: React.FC<{ sessionToken: string }> = ({ sessionToken }) => {
  const [jobs, setJobs] = useState<CropJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/jobs`, {
           headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch jobs.');
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        setJobs([]); // Clear jobs on error
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [sessionToken]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white">Recent Jobs</h2>
      </div>
      {isLoading ? (
        <div className="text-center p-6 text-gray-400">Loading Recent Jobs...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">File Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Job ID</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {jobs.length > 0 ? jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white truncate max-w-xs">{job.fileName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"><StatusBadge status={job.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(job.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{job.id}</td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={4} className="text-center px-6 py-4 text-gray-500">No recent jobs found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentJobs;
