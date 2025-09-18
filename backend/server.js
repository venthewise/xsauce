import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from './authMiddleware.js';
import * as apiService from './apiService.js';

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(CLIENT_ID);

app.use(cors({
  origin: '*' // In production, you should restrict this to your frontend's URL
}));
app.use(express.json());

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
  const keys = await apiService.getApiKeys(req.user.userId);
  res.json(keys);
});

app.post('/api/keys', authMiddleware, async (req, res) => {
  const newKey = await apiService.generateApiKey(req.user.userId);
  res.status(201).json(newKey);
});

app.get('/api/stats', authMiddleware, async (req, res) => {
  const stats = await apiService.getStats(req.user.userId);
  res.json(stats);
});

app.get('/api/jobs', authMiddleware, async (req, res) => {
  const jobs = await apiService.getJobs(req.user.userId);
  res.json(jobs);
});


app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
