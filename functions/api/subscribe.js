import { json, fail, readJson, clean, isEmail } from '../../lib/util.js';

// POST /api/subscribe : inscription à la newsletter
export async function onRequestPost({ request, env }) {
  const data = await readJson(request);
  if (!data) return fail('Invalid request');
  if (data.website) return json({ ok: true });
  const email = clean(data.email, 254).toLowerCase();
  if (!isEmail(email)) return fail('Please enter a valid email address.', 400, 'invalid_email');
  if (!data.consent) return fail('Please confirm you agree to receive AFRIGOV by email.', 400, 'consent_required');
  const lang = data.lang === 'fr' ? 'fr' : 'en';
  await env.DB.prepare('INSERT INTO subscribers (email, lang) VALUES (?, ?) ON CONFLICT(email) DO NOTHING')
    .bind(email, lang)
    .run();
  return json({ ok: true }, 201);
}
