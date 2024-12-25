const express = require('express');
const mysql = require('mysql2/promise');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express App
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection Pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'auction_db',
});

// Routes

// 1. Fetch Player Details
app.get('/api/player/:id', async (req, res) => {
  const playerId = req.params.id;
  try {
    const [player] = await db.query('SELECT * FROM players WHERE id = ?', [playerId]);
    if (!player.length) return res.status(404).json({ message: 'Player not found' });
    res.json(player[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Update Player Details
app.put('/api/player/:id', async (req, res) => {
  const playerId = req.params.id;
  const { name, position, base_price } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE players SET name = ?, position = ?, base_price = ? WHERE id = ?',
      [name, position, base_price, playerId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Player not found' });
    res.json({ message: 'Player updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Fetch Team Details
app.get('/api/team/:id', async (req, res) => {
  const teamId = req.params.id;
  try {
    const [team] = await db.query('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team.length) return res.status(404).json({ message: 'Team not found' });
    res.json(team[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Fetch All Teams
app.get('/api/teams', async (req, res) => {
  try {
    const [teams] = await db.query('SELECT * FROM teams');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Update Team Details
app.put('/api/team/:id', async (req, res) => {
  const teamId = req.params.id;
  const { name, purse } = req.body;
  try {
    const [result] = await db.query('UPDATE teams SET name = ?, purse = ? WHERE id = ?', [
      name,
      purse,
      teamId,
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Fetch Auction Details
app.get('/api/auction/:id', async (req, res) => {
  const auctionId = req.params.id;
  try {
    const [auction] = await db.query('SELECT * FROM auctions WHERE id = ?', [auctionId]);
    if (!auction.length) return res.status(404).json({ message: 'Auction not found' });
    res.json(auction[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Update Auction Details
app.put('/api/auction/:id', async (req, res) => {
  const auctionId = req.params.id;
  const { status, start_time, end_time } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE auctions SET status = ?, start_time = ?, end_time = ? WHERE id = ?',
      [status, start_time, end_time, auctionId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Auction not found' });
    res.json({ message: 'Auction updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. Generate Auction Poster
app.post('/api/poster/generate', async (req, res) => {
  const { auctionName, startTime, endTime } = req.body;

  try {
    const outputPath = path.join(__dirname, 'public/posters', `${auctionName}-poster.png`);

    await sharp('./public/templates/default-poster.png')
      .composite([
        {
          input: Buffer.from(`
            <svg width="800" height="600">
              <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)"/>
              <text x="50%" y="40%" font-size="40" fill="white" text-anchor="middle">
                ${auctionName}
              </text>
              <text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle">
                Start: ${new Date(startTime).toLocaleString()}
              </text>
              <text x="50%" y="60%" font-size="20" fill="white" text-anchor="middle">
                End: ${new Date(endTime).toLocaleString()}
              </text>
            </svg>
          `),
          left: 0,
          top: 0,
        },
      ])
      .toFile(outputPath);

    res.json({ message: 'Poster generated successfully', posterUrl: `/posters/${auctionName}-poster.png` });
  } catch (err) {
    res.status(500).json({ message: 'Error generating poster', error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
