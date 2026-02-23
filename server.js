const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://date_db_u6ar_user:h1mKZZ50XBrq2IAiJ3EZH9c2ektKoYnf@dpg-d6e71afpm1nc73a9enng-a.oregon-postgres.render.com/date_db_u6ar",
  ssl: {
    rejectUnauthorized: false
  }
});

// 🧱 Initialize DB
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        answer VARCHAR(10),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("PostgreSQL ready");
  } catch (err) {
    console.error("DB init failed:", err);
  }
}

initializeDatabase();

// ❤️ POST response
app.post("/response", async (req, res) => {
  const { answer, message } = req.body;

  if (!answer) {
    return res.status(400).json({ error: "Answer required" });
  }

  try {
    await pool.query(
      "INSERT INTO responses (answer, message) VALUES ($1, $2)",
      [answer, message || null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// 📥 GET all responses
app.get("/getResponses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM responses ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching responses");
  }
});

// 🧹 DELETE all responses
app.get("/delResponses", async (req, res) => {
  try {
    await pool.query("DELETE FROM responses");
    res.json({ success: true, message: "All responses deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting responses");
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});