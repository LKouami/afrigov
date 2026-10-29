import { json } from '../../../lib/util.js';

// GET /api/admin/articles : tous les articles, brouillons compris, avec leurs compteurs
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT a.slug, a.title, a.kicker, a.lede, a.body, a.category, a.country, a.issue, a.lang, a.author, a.status,
            a.views, a.likes, a.published_at, a.updated_at,
            (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') AS comments,
            (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'pending') AS pending
     FROM articles a ORDER BY a.updated_at DESC`
  ).all();
  return json({ articles: results });
}
