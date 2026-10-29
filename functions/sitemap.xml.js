// Plan du site pour les moteurs de recherche : pages fixes et tous les articles publiés.
const SITE = 'https://afrigov.news';

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT slug, published_at, updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC"
  ).all();
  const urls = [
    { loc: `${SITE}/`, lastmod: results[0] ? results[0].published_at : null },
    { loc: `${SITE}/archive` },
    { loc: `${SITE}/about` },
    ...results.map((a) => ({
      loc: `${SITE}/a/${encodeURIComponent(a.slug)}`,
      lastmod: a.updated_at ? new Date(a.updated_at.replace(' ', 'T') + 'Z').toISOString() : a.published_at,
    })),
  ];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${xmlEscape(u.lastmod.slice(0, 10))}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
