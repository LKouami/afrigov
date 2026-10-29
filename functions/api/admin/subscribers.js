import { json, fail, readJson } from '../../../lib/util.js';

// GET /api/admin/subscribers (?format=csv pour l'export vers Brevo ou MailerLite)
export async function onRequestGet({ request, env }) {
  const { results } = await env.DB.prepare('SELECT id, email, lang, consent_at FROM subscribers ORDER BY consent_at DESC').all();
  if (new URL(request.url).searchParams.get('format') === 'csv') {
    const lines = ['email,lang,consent_at', ...results.map((s) => `${s.email},${s.lang},${s.consent_at}`)];
    return new Response(lines.join('\n'), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="afrigov-abonnes-${new Date().toISOString().slice(0, 10)}.csv"`,
        'cache-control': 'no-store',
      },
    });
  }
  return json({ subscribers: results });
}

// POST /api/admin/subscribers { id, action: "delete" } : désinscription manuelle
export async function onRequestPost({ request, env }) {
  const data = await readJson(request);
  const id = data && parseInt(data.id, 10);
  if (!id || data.action !== 'delete') return fail('Requête invalide');
  await env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
