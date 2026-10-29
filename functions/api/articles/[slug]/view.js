import { json, fail, getPublished, today } from '../../../../lib/util.js';

// POST /api/articles/:slug/view : compte une lecture. Aucun cookie, aucune donnée personnelle.
export async function onRequestPost({ env, params }) {
  const article = await getPublished(env, params.slug);
  if (!article) return fail('Article introuvable', 404, 'not_found');
  await env.DB.batch([
    env.DB.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(article.id),
    env.DB.prepare(
      'INSERT INTO views_daily (article_id, day, count) VALUES (?, ?, 1) ON CONFLICT(article_id, day) DO UPDATE SET count = count + 1'
    ).bind(article.id, today()),
  ]);
  return json({ views: article.views + 1 });
}
