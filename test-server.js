const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL pool connection
const pool = new Pool({
  connectionString: "postgresql://akila_app_user:GaG0ennCWzZfjv5Rj9oklHQfJqAflI1s@dpg-d4eqc0je5dus73fl5ju0-a.oregon-postgres.render.com/akila_app",
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
  let { answers } = req.body;  // allow reassignment
  const timestamp = new Date().toISOString();

  if (!answers) {
    return res.status(400).json({ error: 'Invalid data: no answers' });
  }

  // Defensive check: if answers is a JSON string, parse it once
  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers);
    } catch (parseError) {
      console.error('JSON Parse error on answers:', parseError);
      return res.status(400).json({ error: 'Malformed JSON in answers' });
    }
  }

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid data: answers not an array' });
  }

  try {
    console.log('Parsed answers:', answers);
    console.log("JSON:", JSON.stringify(answers))
    // const result = await pool.query(
    //   'INSERT INTO results (timestamp, answers) VALUES ($1, $2) RETURNING id',
    //   [timestamp, answers]
    // );
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
