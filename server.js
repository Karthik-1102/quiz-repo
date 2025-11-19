const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    answers JSONB NOT NULL
  );
`).catch(err => console.error('Error creating table:', err));

// Store quiz result
app.post('/results', async (req, res) => {
  const { answers } = req.body;
  const timestamp = new Date().toISOString();
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    const result = await pool.query(
  'INSERT INTO results (timestamp, answers) VALUES ($1, $2::jsonb) RETURNING id',
  [timestamp, JSON.stringify(answers)]
);
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all results
app.get('/results', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM results ORDER BY id DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      answers: row.answers,
    })));
  } catch (err) {
    console.error('Select error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/resultsdel', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE results');
    res.json({ success: true, message: 'All results deleted (table truncated)' });
  } catch (err) {
    console.error('Error truncating results table:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
