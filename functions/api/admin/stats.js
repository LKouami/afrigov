import { json } from '../../../lib/util.js';

// GET /api/admin/stats : chiffres clés et vues des 30 derniers jours
export async function onRequestGet({ env }) {
  const [totals, daily, top] = await env.DB.batch([
    env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM articles WHERE status = 'published') AS published,
         (SELECT COUNT(*) FROM articles WHERE status = 'draft') AS drafts,
         (SELECT COALESCE(SUM(views), 0) FROM articles) AS views,
         (SELECT COALESCE(SUM(likes), 0) FROM articles) AS likes,
         (SELECT COUNT(*) FROM comments WHERE status = 'approved') AS comments,
         (SELECT COUNT(*) FROM comments WHERE status = 'pending') AS pending,
         (SELECT COUNT(*) FROM subscribers) AS subscribers`
    ),
    env.DB.prepare(
      "SELECT day, SUM(count) AS views FROM views_daily WHERE day >= date('now', '-29 days') GROUP BY day ORDER BY day"
    ),
    env.DB.prepare(
      "SELECT title, slug, views, likes FROM articles WHERE status = 'published' ORDER BY views DESC LIMIT 5"
    ),
  ]);
  return json({ totals: totals.results[0], daily: daily.results, top: top.results });
}
