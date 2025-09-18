import { supabase } from './server.js';

export const apiKeyMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid API key' });
  }

  const apiKey = authHeader.substring(7);

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    req.userId = data.user_id;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};