import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { authMiddleware } from './authMiddleware.js';
import { apiKeyMiddleware } from './apiKeyMiddleware.js';
import * as apiService from './apiService.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(CLIENT_ID);

app.use(cors({
  origin: '*', // In production, restrict to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/outputs', express.static('outputs'));

// --- Public Routes ---

// Authentication endpoint for Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'No credential provided.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return res.status(400).json({ message: 'Could not extract email from token.' });
    }

    // Security check: Only allow the specified user
    if (email !== 'godrollx99@gmail.com') {
      return res.status(403).json({ message: 'Access Denied. Please sign in with god.' });
    }

    const user = await apiService.findOrCreateUser(email);

    // Create a session token (JWT) for the frontend
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, user });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed. Invalid token.' });
  }
});

// --- Protected Routes ---
// All routes below this line require a valid session token from the authMiddleware.

app.get('/api/keys', authMiddleware, async (req, res) => {
  try {
    const keys = await apiService.getApiKeys(req.user.userId);
    res.json(keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/keys', authMiddleware, async (req, res) => {
  try {
    const newKey = await apiService.generateApiKey(req.user.userId);
    res.status(201).json(newKey);
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await apiService.getStats(req.user.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/jobs', authMiddleware, async (req, res) => {
  try {
    const jobs = await apiService.getJobs(req.user.userId);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- API Key Authenticated Routes ---

app.post('/api/crop', apiKeyMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const job = await apiService.createCropJob(req.userId, req.file.filename);
    // Start processing asynchronously
    apiService.processCropJob(job.id, startTime, endTime);
    res.status(201).json({ jobId: job.id, status: 'processing' });
  } catch (error) {
    console.error('Crop request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
