import { supabase } from './server.js';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

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

export const createCropJob = async (userId, fileName) => {
  const jobId = randomUUID();
  const { data, error } = await supabase
    .from('jobs')
    .insert({ id: jobId, user_id: userId, file_name: fileName, status: 'processing', created_at: new Date() })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const processCropJob = async (jobId, startTime, endTime) => {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    if (error) throw error;

    const inputPath = path.join('uploads', job.file_name);
    const outputPath = path.join('outputs', `${jobId}.mp4`);

    // Ensure output directory exists
    if (!fs.existsSync('outputs')) {
      fs.mkdirSync('outputs');
    }

    const duration = parseFloat(endTime) - parseFloat(startTime);

    ffmpeg(inputPath)
      .setStartTime(parseFloat(startTime))
      .setDuration(duration)
      .videoFilters('crop=ih*9/16:ih')
      .output(outputPath)
      .on('end', async () => {
        await supabase
          .from('jobs')
          .update({ status: 'completed', output_url: `/outputs/${jobId}.mp4` })
          .eq('id', jobId);
      })
      .on('error', async (err) => {
        console.error('FFmpeg error:', err);
        await supabase
          .from('jobs')
          .update({ status: 'failed' })
          .eq('id', jobId);
      })
      .run();
  } catch (error) {
    console.error('Process crop job error:', error);
  }
};
