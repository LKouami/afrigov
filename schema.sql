-- AFRIGOV, schéma de la base Cloudflare D1
-- Exécution : npx wrangler d1 execute afrigov-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  kicker       TEXT NOT NULL DEFAULT '',        -- surtitre : rubrique · pays
  lede         TEXT NOT NULL DEFAULT '',        -- chapô
  body         TEXT NOT NULL DEFAULT '',        -- contenu en Markdown
  category     TEXT NOT NULL DEFAULT '',        -- une des 7 catégories de veille
  country      TEXT NOT NULL DEFAULT '',
  issue        INTEGER,                         -- numéro de la revue
  lang         TEXT NOT NULL DEFAULT 'en',      -- en | fr
  author       TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  views        INTEGER NOT NULL DEFAULT 0,
  likes        INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status, published_at);

-- Un like par visiteur et par article. On ne garde qu'une empreinte hachée et salée, jamais l'adresse IP.
CREATE TABLE IF NOT EXISTS likes (
  article_id  INTEGER NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (article_id, fingerprint)
);

-- Vues par jour, pour les statistiques de l'espace admin.
CREATE TABLE IF NOT EXISTS views_daily (
  article_id INTEGER NOT NULL,
  day        TEXT NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, day)
);

-- Une vue par visiteur, par article et par jour. Empreinte hachée et salée, effacée dès le lendemain.
CREATE TABLE IF NOT EXISTS view_marks (
  article_id  INTEGER NOT NULL,
  fingerprint TEXT NOT NULL,
  day         TEXT NOT NULL,
  PRIMARY KEY (article_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_view_marks_day ON view_marks(day);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,                    -- jamais affiché publiquement
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | approved
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id, status);

CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  lang       TEXT NOT NULL DEFAULT 'en',
  consent_at TEXT NOT NULL DEFAULT (datetime('now'))
);
