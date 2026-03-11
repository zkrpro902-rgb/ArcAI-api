const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const user = req.session.user;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const generations = db.prepare(
    'SELECT * FROM generations WHERE user_discord_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(user.discord_id, parseInt(limit), parseInt(offset));
  const total = db.prepare('SELECT COUNT(*) as count FROM generations WHERE user_discord_id = ?').get(user.discord_id);
  res.json({
    generations: generations.map(g => ({ ...g, structure: JSON.parse(g.structure) })),
    total: total.count,
    page: parseInt(page)
  });
});

router.get('/stats', (req, res) => {
  const user = req.session.user;
  const total = db.prepare('SELECT COUNT(*) as count FROM generations WHERE user_discord_id = ?').get(user.discord_id);
  const deployed = db.prepare("SELECT COUNT(*) as count FROM generations WHERE user_discord_id = ? AND status = 'deployed'").get(user.discord_id);
  const thisMonth = db.prepare("SELECT COUNT(*) as count FROM generations WHERE user_discord_id = ? AND created_at >= date('now', 'start of month')").get(user.discord_id);
  const gens = db.prepare('SELECT structure FROM generations WHERE user_discord_id = ?').all(user.discord_id);
  let totalChannels = 0, totalRoles = 0;
  gens.forEach(g => {
    try {
      const s = JSON.parse(g.structure);
      totalChannels += s.categories?.reduce((a, c) => a + (c.channels?.length || 0), 0) || 0;
      totalRoles += s.roles?.length || 0;
    } catch {}
  });
  res.json({ total_generations: total.count, deployed: deployed.count, this_month: thisMonth.count, total_channels: totalChannels, total_roles: totalRoles });
});

router.delete('/:id', (req, res) => {
  const user = req.session.user;
  const gen = db.prepare('SELECT * FROM generations WHERE id = ? AND user_discord_id = ?').get(req.params.id, user.discord_id);
  if (!gen) return res.status(404).json({ error: 'Introuvable' });
  db.prepare('DELETE FROM generations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
