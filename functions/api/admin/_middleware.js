import { fail, isAdmin } from '../../../lib/util.js';

// Protège toutes les routes /api/admin/* sauf la connexion.
export async function onRequest(context) {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;
  if (path === '/api/admin/login') return next();
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return fail("L'espace admin n'est pas configuré : définissez ADMIN_PASSWORD et SESSION_SECRET.", 500);
  }
  if (!(await isAdmin(request, env))) return fail('Non autorisé', 401);
  return next();
}
