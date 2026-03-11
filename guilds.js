const express = require('express');
const axios = require('axios');

const router = express.Router();
const DISCORD_API = 'https://discord.com/api/v10';

router.get('/', async (req, res) => {
  const { access_token } = req.session.user;
  try {
    const guildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const adminGuilds = guildsRes.data
      .filter(g => g.owner || (parseInt(g.permissions) & 0x8) === 0x8)
      .map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        owner: g.owner
      }));
    res.json(adminGuilds);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les serveurs' });
  }
});

module.exports = router;
