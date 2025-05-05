const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');  // Required for serving static files
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Serve static files from the 'public' folder (where your index.html is)
app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage (index.html) at the root URL '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload movie (admin)
app.post('/add-movie', async (req, res) => {
  const { name, link, thumbnail, category, description, date, owner } = req.body;
  try {
    const { data, error } = await supabase.from('movies').insert([{ name, link, thumbnail, category, description, date, owner }]);
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all movies (homepage)
app.get('/movies', async (req, res) => {
  try {
    const { data, error } = await supabase.from('movies').select('*');
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get movie by ID (for details page)
app.get('/movie/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('movies').select('*').eq('id', id).single();
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get movies by category
app.get('/movies/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const { data, error } = await supabase.from('movies').select('*').eq('category', category);
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Search movie (using query parameter)
app.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const { data, error } = await supabase.from('movies').select('*').ilike('name', `%${q}%`);
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Comment on movie
app.post('/comment', async (req, res) => {
  const { movie_id, user_name, comment } = req.body;
  try {
    // Check if the movie exists
    const { data: movie, error: movieError } = await supabase.from('movies').select('*').eq('id', movie_id).single();
    if (movieError) throw movieError;
    if (!movie) {
      return res.status(400).send({ error: 'Movie not found' });
    }

    // Insert the comment
    const { data, error } = await supabase.from('comments').insert([{ movie_id, user_name, comment }]);
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get comments for a specific movie (ordered by most recent)
app.get('/comments/:movieId', async (req, res) => {
  const { movieId } = req.params;
  try {
    const { data, error } = await supabase.from('comments').select('*').eq('movie_id', movieId).order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Like movie
app.post('/like', async (req, res) => {
  const { id } = req.body;
  try {
    const { data, error } = await supabase.rpc('increment_likes', { movie_id: id });
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Verify user (admin)
app.post('/verify-user', async (req, res) => {
  const { name } = req.body;
  try {
    const { data, error } = await supabase.from('users').update({ is_verified: true }).eq('name', name);
    if (error) throw error;
    res.status(200).send({ data });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
