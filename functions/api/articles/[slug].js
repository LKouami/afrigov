import { json, fail, readJson, isAdmin, getPublished, normalize } from '../../../lib/util.js';

// GET /api/articles/:slug : un article publié (ou un brouillon pour l'admin avec ?preview=1)
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  let article;
  if (url.searchParams.get('preview') === '1' && (await isAdmin(request, env))) {
    article = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?').bind(params.slug).first();
  } else {
    article = await getPublished(env, params.slug);
  }
  if (!article) return fail('Article introuvable', 404, 'not_found');
  const { id, ...publicFields } = article;
  return json({ article: publicFields });
}

// PUT /api/articles/:slug : mise à jour (admin)
export async function onRequestPut({ request, env, params }) {
  if (!(await isAdmin(request, env))) return fail('Non autorisé', 401);
  const current = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?').bind(params.slug).first();
  if (!current) return fail('Article introuvable', 404, 'not_found');
  const data = await readJson(request);
  if (!data) return fail('Requête invalide');
  const a = normalize({ ...current, ...data });
  if (!a.title) return fail('Le titre est obligatoire');
  if (a.slug !== current.slug) {
    const taken = await env.DB.prepare('SELECT id FROM articles WHERE slug = ?').bind(a.slug).first();
    if (taken) return fail('Cette adresse est déjà utilisée par un autre article', 409);
  }
  const publishedAt = a.status === 'published' ? current.published_at || new Date().toISOString() : current.published_at;
  await env.DB.prepare(
    `UPDATE articles SET slug=?, title=?, kicker=?, lede=?, body=?, category=?, country=?, issue=?, lang=?, author=?,
            status=?, published_at=?, updated_at=datetime('now') WHERE id=?`
  )
    .bind(a.slug, a.title, a.kicker, a.lede, a.body, a.category, a.country, a.issue, a.lang, a.author, a.status, publishedAt, current.id)
    .run();
  return json({ ok: true, slug: a.slug });
}

// DELETE /api/articles/:slug : suppression (admin), avec ses commentaires, likes et vues
export async function onRequestDelete({ request, env, params }) {
  if (!(await isAdmin(request, env))) return fail('Non autorisé', 401);
  const current = await env.DB.prepare('SELECT id FROM articles WHERE slug = ?').bind(params.slug).first();
  if (!current) return fail('Article introuvable', 404, 'not_found');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM comments WHERE article_id = ?').bind(current.id),
    env.DB.prepare('DELETE FROM likes WHERE article_id = ?').bind(current.id),
    env.DB.prepare('DELETE FROM views_daily WHERE article_id = ?').bind(current.id),
    env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(current.id),
  ]);
  return json({ ok: true });
}
