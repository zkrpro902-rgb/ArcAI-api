require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const db = require('./db');

const authRouter = require('./routes/auth');
const generateRouter = require('./routes/generate');
const guildsRouter = require('./routes/guilds');
const historyRouter = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.set('trust proxy', 1);

// Store de session compatible prod (pas de warning MemoryStore)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'arcai_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
};

app.use(session(sessionConfig));

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Non authentifié' });
  next();
};

app.use('/auth', authRouter);
app.use('/api/generate', requireAuth, generateRouter);
app.use('/api/guilds', requireAuth, guildsRouter);
app.use('/api/history', requireAuth, historyRouter);

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`🚀 ArcAI API démarrée sur le port ${PORT}`);
});

module.exports = app;
