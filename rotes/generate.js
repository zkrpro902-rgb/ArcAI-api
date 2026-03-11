const express = require('express');
const axios = require('axios');
const db = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { prompt, type, guild_id, guild_name, options = [] } = req.body;
  const user = req.session.user;
  if (!prompt) return res.status(400).json({ error: 'Prompt requis' });
  try {
    const systemPrompt = `Tu es ArcAI, assistant spécialisé dans la création de structures de serveurs Discord.
Réponds UNIQUEMENT en JSON valide avec ce format:
{
  "name": "Nom du serveur",
  "description": "Description courte",
  "categories": [
    { "name": "NOM CATÉGORIE", "channels": [
      { "name": "nom-canal", "type": "text", "description": "desc" },
      { "name": "vocal", "type": "voice" }
    ]}
  ],
  "roles": [
    { "name": "Admin", "color": "#FF0000", "permissions": ["ADMINISTRATOR"] }
  ]
}
Options: ${options.join(', ')}`;
    const mistralRes = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Crée une structure Discord pour: "${prompt}" — Type: ${type}` }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' }
    });
    const raw = mistralRes.data.choices[0].message.content;
    let structure;
    try {
      structure = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      return res.status(500).json({ error: 'Structure invalide retournée par Mistral' });
    }
    const result = db.prepare(
      'INSERT INTO generations (user_discord_id, guild_id, guild_name, prompt, type, structure, status) VALUES (?,?,?,?,?,?,?)'
    ).run(user.discord_id, guild_id || null, guild_name || null, prompt, type, JSON.stringify(structure), 'generated');
    const channelsCount = structure.categories?.reduce((acc, cat) => acc + (cat.channels?.length || 0), 0) || 0;
    res.json({
      id: result.lastInsertRowid,
      structure,
      stats: { channels: channelsCount, roles: structure.roles?.length || 0, categories: structure.categories?.length || 0 }
    });
  } catch (err) {
    console.error('Generate error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
});

router.post('/:id/deploy', (req, res) => {
  const { id } = req.params;
  const user = req.session.user;
  const gen = db.prepare('SELECT * FROM generations WHERE id = ? AND user_discord_id = ?').get(id, user.discord_id);
  if (!gen) return res.status(404).json({ error: 'Génération introuvable' });
  db.prepare("UPDATE generations SET status = 'deployed', deployed_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  res.json({ success: true });
});

module.exports = router;
