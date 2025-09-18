// This file acts as a simple in-memory database and service layer.
// In a real application, this would connect to a database like PostgreSQL.

const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// In-memory data stores
let users = {};
let apiKeys = {}; // { userId: [key1, key2, ...] }
let nextUserId = 1;

// --- User Management ---
export const findOrCreateUser = (email) => {
  const existingUser = Object.values(users).find(u => u.email === email);
  if (existingUser) {
    return existingUser;
  }
  const newUser = { id: `user_${nextUserId++}`, email };
  users[newUser.id] = newUser;
  apiKeys[newUser.id] = [];
  return newUser;
};

// --- API Key Management ---
export const generateApiKey = (userId) => {
  const newKeyString = `xs_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
  const newKey = {
    key: newKeyString,
    createdAt: new Date(),
    callCount: 0,
  };
  
  if (!apiKeys[userId]) {
    apiKeys[userId] = [];
  }
  apiKeys[userId].unshift(newKey); // Add to the beginning of the array
  return newKey;
};

export const getApiKeys = (userId) => {
  return apiKeys[userId] || [];
};

// --- Mock Data Services ---
export const getStats = (userId) => {
  // In a real app, you'd calculate this from database records.
  return [
    {
      title: "API Calls (Month)",
      value: (apiKeys[userId]?.reduce((acc, key) => acc + key.callCount, 0) || 1234).toLocaleString(),
    },
    {
      title: "Tasks Completed",
      value: "89",
    },
    {
      title: "Storage Used",
      value: "2.5 GB",
    }
  ];
};

export const getJobs = (userId) => {
  // This is static mock data. A real implementation would fetch from a database.
  return [
    { id: 'job_1a2b3c', fileName: 'task_alpha.json', status: JobStatus.COMPLETED, createdAt: '2024-07-21T10:30:00Z', outputUrl: '/downloads/task_alpha_result.json' },
    { id: 'job_4d5e6f', fileName: 'archive-data.zip', status: JobStatus.PROCESSING, createdAt: '2024-07-21T12:45:00Z' },
    { id: 'job_7g8h9i', fileName: 'user-records.csv', status: JobStatus.PENDING, createdAt: '2024-07-21T13:05:00Z' },
    { id: 'job_j0k1l2', fileName: 'backup_images.tar.gz', status: JobStatus.FAILED, createdAt: '2024-07-20T18:15:00Z' },
    { id: 'job_m3n4o5', fileName: 'report_main.pdf', status: JobStatus.COMPLETED, createdAt: '2024-07-20T15:00:00Z', outputUrl: '/downloads/report_main_processed.pdf' },
  ];
};
