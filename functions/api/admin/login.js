import { json, fail, readJson, safeEqual, createSession, sessionCookie, hmac } from '../../../lib/util.js';

// POST /api/admin/login : connexion à l'espace admin
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return fail("L'espace admin n'est pas configuré : définissez ADMIN_PASSWORD et SESSION_SECRET.", 500);
  }
  const data = await readJson(request);
  const password = data && typeof data.password === 'string' ? data.password : '';
  // On compare des empreintes de même longueur pour éviter toute fuite par le temps de réponse.
  const ok = safeEqual(await hmac(env.SESSION_SECRET, password), await hmac(env.SESSION_SECRET, env.ADMIN_PASSWORD));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800));
    return fail('Mot de passe incorrect', 401);
  }
  const token = await createSession(env);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token, 12 * 3600) });
}
