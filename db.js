const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'arcai.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT DEFAULT '0',
    avatar TEXT,
    access_token TEXT,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_discord_id TEXT NOT NULL,
    guild_id TEXT,
    guild_name TEXT,
    prompt TEXT NOT NULL,
    type TEXT DEFAULT 'gaming',
    structure TEXT NOT NULL,
    status TEXT DEFAULT 'generated',
    deployed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_discord_id) REFERENCES users(discord_id)
  );

  CREATE TABLE IF NOT EXISTS deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generation_id INTEGER NOT NULL,
    guild_id TEXT NOT NULL,
    channels_created INTEGER DEFAULT 0,
    roles_created INTEGER DEFAULT 0,
    deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generation_id) REFERENCES generations(id)
  );
`);

console.log('✅ Base de données SQLite initialisée');
module.exports = db;
