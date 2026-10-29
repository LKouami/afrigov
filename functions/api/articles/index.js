import { json, fail, readJson, isAdmin, normalize, CATEGORIES } from '../../../lib/util.js';

// GET /api/articles : articles publiés (filtre facultatif ?category=)
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  let sql = `SELECT a.slug, a.title, a.kicker, a.lede, a.category, a.country, a.issue, a.lang, a.author,
                    a.views, a.likes, a.published_at,
                    (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.status = 'approved') AS comments
             FROM articles a WHERE a.status = 'published'`;
  const binds = [];
  if (category && CATEGORIES.includes(category)) {
    sql += ' AND a.category = ?';
    binds.push(category);
  }
  sql += ' ORDER BY a.published_at DESC LIMIT 100';
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ articles: results });
}

// POST /api/articles : création (admin)
export async function onRequestPost({ request, env }) {
  if (!(await isAdmin(request, env))) return fail('Non autorisé', 401);
  const data = await readJson(request);
  if (!data) return fail('Requête invalide');
  const article = normalize(data);
  if (!article.title) return fail('Le titre est obligatoire');
  if (!article.slug) return fail("L'adresse (slug) est obligatoire");
  const exists = await env.DB.prepare('SELECT id FROM articles WHERE slug = ?').bind(article.slug).first();
  if (exists) return fail('Cette adresse est déjà utilisée par un autre article', 409);
  await env.DB.prepare(
    `INSERT INTO articles (slug, title, kicker, lede, body, category, country, issue, lang, author, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      article.slug, article.title, article.kicker, article.lede, article.body, article.category, article.country,
      article.issue, article.lang, article.author, article.status,
      article.status === 'published' ? new Date().toISOString() : null
    )
    .run();
  return json({ ok: true, slug: article.slug }, 201);
}
