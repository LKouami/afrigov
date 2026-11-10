-- Ajoute la traduction facultative d'un article dans l'autre langue.
-- Base déjà en ligne : npx wrangler d1 execute afrigov-db --remote --file=migrations/0001_traductions.sql
ALTER TABLE articles ADD COLUMN tr_title  TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN tr_kicker TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN tr_lede   TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN tr_body   TEXT NOT NULL DEFAULT '';
