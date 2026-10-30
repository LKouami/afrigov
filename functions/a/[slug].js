// Page d'un article rendue côté serveur : titre, description, aperçu de partage et texte complet
// sont présents dans le HTML. Google, LinkedIn, WhatsApp et X les lisent sans exécuter de JavaScript.
import { markdown, esc } from '../../lib/markdown.js';
import { getPublished } from '../../lib/util.js';

const SITE = 'https://afrigov.news';
const CATEGORY_FR = {
  'Core government systems': "Systèmes de gestion de l'État",
  'Public service delivery': 'Services publics numériques',
  'Citizen engagement': 'Participation citoyenne',
  'GovTech enablers': 'Stratégies, lois et compétences',
  Infrastructure: 'Infrastructures numériques',
  Financing: 'Financement du numérique public',
  Ecosystem: 'Acteurs et écosystème',
};
const CATEGORY_EN = {
  'Core government systems': 'Government management systems',
  'Public service delivery': 'Digital public services',
  'Citizen engagement': 'Citizen engagement',
  'GovTech enablers': 'Strategies, laws and skills',
  Infrastructure: 'Digital infrastructure',
  Financing: 'Funding digital government',
  Ecosystem: 'People and ecosystem',
};

function plainText(md) {
  return String(md || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(a) {
  const text = a.lede || plainText(a.body);
  return text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, '') + '…' : text;
}

function formatDate(iso, lang) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const setAttr = (name, value) => ({ element(el) { el.setAttribute(name, value); } });

export async function onRequestGet({ request, env, params }) {
  const template = await env.ASSETS.fetch(new URL('/article', request.url));
  const article = await getPublished(env, params.slug);

  if (!article) {
    // Article absent : la page s'affiche (message géré par le navigateur) avec un vrai code 404, non indexée.
    return new HTMLRewriter()
      .on('head', { element(el) { el.append('<meta name="robots" content="noindex">', { html: true }); } })
      .transform(new Response(template.body, { status: 404, headers: template.headers }));
  }

  const lang = article.lang === 'fr' ? 'fr' : 'en';
  const url = `${SITE}/a/${encodeURIComponent(article.slug)}`;
  const title = `${article.title} | AFRIGOV`;
  const description = excerpt(article);
  const section = article.kicker || [(lang === 'fr' ? CATEGORY_FR : CATEGORY_EN)[article.category] || article.category, article.country].filter(Boolean).join(' · ');
  const byline = [formatDate(article.published_at, lang), article.author ? (lang === 'fr' ? 'Par ' : 'By ') + article.author : '']
    .filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('<span aria-hidden="true">·</span>');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    inLanguage: lang,
    datePublished: article.published_at,
    dateModified: article.updated_at ? new Date(article.updated_at.replace(' ', 'T') + 'Z').toISOString() : article.published_at,
    mainEntityOfPage: url,
    url,
    image: `${SITE}/og-image.png`,
    author: article.author ? { '@type': 'Person', name: article.author } : { '@type': 'Organization', name: 'AFRIGOV' },
    publisher: { '@type': 'Organization', name: 'AFRIGOV', logo: { '@type': 'ImageObject', url: `${SITE}/favicon.svg` } },
  };
  if (article.category) jsonld.articleSection = article.category;

  const response = new HTMLRewriter()
    .on('html', setAttr('lang', lang))
    .on('title', {
      element(el) {
        el.removeAttribute('data-title-en');
        el.removeAttribute('data-title-fr');
        el.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.removeAttribute('data-desc-en');
        el.removeAttribute('data-desc-fr');
        el.setAttribute('content', description);
      },
    })
    .on('link[rel="canonical"]', setAttr('href', url))
    .on('meta[property="og:url"]', setAttr('content', url))
    .on('meta[property="og:title"]', setAttr('content', article.title))
    .on('meta[property="og:description"]', setAttr('content', description))
    .on('meta[property="og:type"]', setAttr('content', 'article'))
    .on('meta[property="og:locale"]', setAttr('content', lang === 'fr' ? 'fr_FR' : 'en_US'))
    .on('head', {
      element(el) {
        el.append(`<meta property="article:published_time" content="${esc(article.published_at || '')}">`, { html: true });
        el.append(`<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`, { html: true });
      },
    })
    .on('#a-section', { element(el) { el.setInnerContent(section); } })
    .on('#a-title', { element(el) { el.setInnerContent(article.title); } })
    .on('#a-byline', { element(el) { el.setInnerContent(byline, { html: true }); } })
    .on('#a-lede', {
      element(el) {
        if (!article.lede) return;
        el.removeAttribute('hidden');
        el.setInnerContent(article.lede);
      },
    })
    .on('#a-body', { element(el) { el.setInnerContent(markdown(article.body), { html: true }); } })
    .transform(template);

  const headers = new Headers(response.headers);
  headers.set('cache-control', 'public, max-age=60');
  return new Response(response.body, { status: 200, headers });
}
