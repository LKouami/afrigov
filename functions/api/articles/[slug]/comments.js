import { json, fail, readJson, getPublished, clean, isEmail } from '../../../../lib/util.js';

// GET : commentaires validés (l'email n'est jamais renvoyé)
export async function onRequestGet({ env, params }) {
  const article = await getPublished(env, params.slug);
  if (!article) return fail('Article introuvable', 404, 'not_found');
  const { results } = await env.DB.prepare(
    "SELECT id, name, body, created_at FROM comments WHERE article_id = ? AND status = 'approved' ORDER BY created_at ASC"
  )
    .bind(article.id)
    .all();
  return json({ comments: results });
}

// POST : nouveau commentaire, en attente de modération
export async function onRequestPost({ request, env, params }) {
  const article = await getPublished(env, params.slug);
  if (!article) return fail('Article introuvable', 404, 'not_found');
  const data = await readJson(request);
  if (!data) return fail('Requête invalide');

  // Anti-spam : champ piège invisible et délai minimum de saisie.
  if (data.website) return json({ ok: true, pending: true });
  if (Number(data.elapsed) < 3000) return fail('Merci de prendre le temps de rédiger votre commentaire.', 400, 'too_fast');

  const name = clean(data.name, 60);
  const email = clean(data.email, 254).toLowerCase();
  const body = clean(data.body, 2000);
  if (name.length < 2) return fail('Indiquez votre nom.', 400, 'name_required');
  if (!isEmail(email)) return fail('Indiquez une adresse email valide.', 400, 'invalid_email');
  if (body.length < 2) return fail('Le commentaire est vide.', 400, 'empty_comment');
  if (!data.consent) return fail("Acceptez l'utilisation de vos données pour publier un commentaire.", 400, 'consent_required');

  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM comments WHERE email = ? AND created_at > datetime('now', '-10 minutes')"
  )
    .bind(email)
    .first();
  if (recent.n >= 3) return fail('Trop de commentaires en peu de temps. Réessayez dans quelques minutes.', 429, 'rate_limited');

  await env.DB.prepare('INSERT INTO comments (article_id, name, email, body) VALUES (?, ?, ?, ?)')
    .bind(article.id, name, email, body)
    .run();
  return json({ ok: true, pending: true }, 201);
}
