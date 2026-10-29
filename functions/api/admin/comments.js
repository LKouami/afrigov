import { json, fail, readJson } from '../../../lib/util.js';

// GET /api/admin/comments?status=pending|approved
export async function onRequestGet({ request, env }) {
  const status = new URL(request.url).searchParams.get('status') === 'approved' ? 'approved' : 'pending';
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.name, c.email, c.body, c.status, c.created_at, a.title AS article_title, a.slug AS article_slug
     FROM comments c JOIN articles a ON a.id = c.article_id
     WHERE c.status = ? ORDER BY c.created_at DESC LIMIT 200`
  )
    .bind(status)
    .all();
  return json({ comments: results });
}

// POST /api/admin/comments { id, action: "approve" | "delete" }
export async function onRequestPost({ request, env }) {
  const data = await readJson(request);
  const id = data && parseInt(data.id, 10);
  if (!id) return fail('Commentaire inconnu');
  if (data.action === 'approve') {
    await env.DB.prepare("UPDATE comments SET status = 'approved' WHERE id = ?").bind(id).run();
  } else if (data.action === 'delete') {
    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
  } else {
    return fail('Action inconnue');
  }
  return json({ ok: true });
}
