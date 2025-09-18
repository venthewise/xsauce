import { supabase } from './server.js';
import { randomUUID } from 'crypto';

const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// --- User Management ---
export const findOrCreateUser = async (email) => {
  let { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code === 'PGRST116') { // not found
    const { data: newData, error: insertError } = await supabase
      .from('users')
      .insert({ id: randomUUID(), email })
      .select()
      .single();
    if (insertError) throw insertError;
    return newData;
  }

  if (error) throw error;
  return data;
};

// --- API Key Management ---
export const generateApiKey = async (userId) => {
  const newKeyString = `xs_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;
  const { data, error } = await supabase
    .from('api_keys')
    .insert({ user_id: userId, key: newKeyString, created_at: new Date(), call_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return { key: data.key, createdAt: new Date(data.created_at), callCount: data.call_count };
};

export const getApiKeys = async (userId) => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map(key => ({ key: key.key, createdAt: new Date(key.created_at), callCount: key.call_count }));
};

// --- Stats and Jobs ---
export const getStats = async (userId) => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('call_count')
    .eq('user_id', userId);
  if (error) throw error;
  const totalCalls = data.reduce((acc, key) => acc + key.call_count, 0);
  return [
    {
      title: "API Calls (Month)",
      value: totalCalls.toLocaleString(),
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

export const getJobs = async (userId) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(job => ({ id: job.id, fileName: job.file_name, status: job.status, createdAt: job.created_at, outputUrl: job.output_url }));
};
