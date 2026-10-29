import { json, fail, getPublished, visitorFingerprint } from '../../../../lib/util.js';

// GET : ce visiteur a-t-il déjà aimé l'article ?
export async function onRequestGet({ request, env, params }) {
  const article = await getPublished(env, params.slug);
  if (!article) return fail('Article introuvable', 404, 'not_found');
  const fp = await visitorFingerprint(request, env, `like:${article.id}`);
  const row = await env.DB.prepare('SELECT 1 FROM likes WHERE article_id = ? AND fingerprint = ?').bind(article.id, fp).first();
  return json({ likes: article.likes, liked: !!row });
}

// POST : aimer ou ne plus aimer (bascule). Un like par visiteur, sans cookie.
export async function onRequestPost({ request, env, params }) {
  const article = await getPublished(env, params.slug);
  if (!article) return fail('Article introuvable', 404, 'not_found');
  const fp = await visitorFingerprint(request, env, `like:${article.id}`);
  const row = await env.DB.prepare('SELECT 1 FROM likes WHERE article_id = ? AND fingerprint = ?').bind(article.id, fp).first();
  if (row) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM likes WHERE article_id = ? AND fingerprint = ?').bind(article.id, fp),
      env.DB.prepare('UPDATE articles SET likes = MAX(likes - 1, 0) WHERE id = ?').bind(article.id),
    ]);
  } else {
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO likes (article_id, fingerprint) VALUES (?, ?)').bind(article.id, fp),
      env.DB.prepare('UPDATE articles SET likes = likes + 1 WHERE id = ?').bind(article.id),
    ]);
  }
  const updated = await env.DB.prepare('SELECT likes FROM articles WHERE id = ?').bind(article.id).first();
  return json({ likes: updated.likes, liked: !row });
}
