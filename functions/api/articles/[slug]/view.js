import { json, fail, getPublished, today, visitorFingerprint, isAdmin } from '../../../../lib/util.js';

// POST /api/articles/:slug/view : compte une lecture par visiteur, par article et par jour.
// Aucun cookie : on garde seulement une empreinte hachée et salée, effacée dès le lendemain.
// Les lectures de l'équipe connectée à l'admin ne sont pas comptées.
export async function onRequestPost({ request, env, params }) {
  const article = await getPublished(env, params.slug);
  if (!article) return fail('Article introuvable', 404, 'not_found');
  if (await isAdmin(request, env)) return json({ views: article.views });

  const day = today();
  const fp = await visitorFingerprint(request, env, `view:${article.id}:${day}`);
  const [, mark] = await env.DB.batch([
    env.DB.prepare('DELETE FROM view_marks WHERE day < ?').bind(day),
    env.DB.prepare('INSERT OR IGNORE INTO view_marks (article_id, fingerprint, day) VALUES (?, ?, ?)').bind(article.id, fp, day),
  ]);
  if (!mark.meta.changes) return json({ views: article.views });

  await env.DB.batch([
    env.DB.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(article.id),
    env.DB.prepare(
      'INSERT INTO views_daily (article_id, day, count) VALUES (?, ?, 1) ON CONFLICT(article_id, day) DO UPDATE SET count = count + 1'
    ).bind(article.id, day),
  ]);
  return json({ views: article.views + 1 });
}
