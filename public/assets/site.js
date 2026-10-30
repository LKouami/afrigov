// AFRIGOV, script commun : langue, thème, utilitaires, rendu Markdown sûr, consentement cookies, inscription.
(function () {
  'use strict';
  var CONFIG = window.AFRIGOV_CONFIG || {};
  var root = document.documentElement;

  // ---------- Traductions des textes générés par les scripts ----------
  var I18N = {
    en: {
      consent_title: 'Your privacy',
      consent_text: 'No advertising, no tracking cookies. With your permission, we count visits with Cloudflare Web Analytics to see which articles are useful. Views, likes and comments work without cookies. <a href="/privacy">Privacy policy</a>.',
      consent_legend: 'Choose what you allow',
      consent_necessary: '<strong>Strictly necessary</strong>: remembers your choices (privacy, language). Always on.',
      consent_analytics: '<strong>Audience measurement</strong>: anonymous visit statistics (Cloudflare Web Analytics).',
      accept: 'Accept', refuse: 'Refuse', settings: 'Settings', save_choices: 'Save my choices',
      sub_ok: 'Thank you. You will get the next article by email.',
      generic_error: 'Something went wrong. Please try again.',
      all: 'All', issue: 'Issue', views: 'views', likes: 'likes', comments: 'comments',
      no_articles: 'No articles yet.',
      no_articles_title: 'First articles coming soon', welcome_text: 'AFRIGOV looks at how African governments are changing with digital technology: their tools, their services, their relationship with citizens, and everything that makes it possible.', no_results: 'No article matches your search.', results_for: 'Results for', permalink: 'Permalink', no_section: 'Nothing published in this section yet.', no_popular: 'Nothing published yet.',
      load_error: 'Articles could not be loaded. Please refresh the page.',
      by: 'By', min_read: 'min read', draft_preview: 'DRAFT PREVIEW',
      not_found_title: 'Article not found', not_found_text: 'This article does not exist or is no longer published.',
      like: 'Like', liked: 'Liked', link_copied: 'Link copied',
      comments_title: 'Comments', no_comments: 'No comments yet.',
      comment_ok: 'Thank you. Your comment will appear once it has been reviewed.',
      to_dark: 'Switch to dark mode', to_light: 'Switch to light mode', to_lang: 'Lire en français',
      err_invalid_email: 'Please enter a valid email address.',
      err_consent_required: 'Please tick the box to give your consent.',
      err_too_fast: 'Please take a moment to write your comment.',
      err_name_required: 'Please enter your name.',
      err_empty_comment: 'Your comment is empty.',
      err_rate_limited: 'Too many comments in a short time. Please try again in a few minutes.',
      err_not_found: 'This article does not exist or is no longer published.',
    },
    fr: {
      consent_title: 'Votre vie privée',
      consent_text: 'Pas de publicité, pas de cookies de suivi. Avec votre accord, nous comptons les visites avec Cloudflare Web Analytics pour savoir quels articles sont utiles. Vues, likes et commentaires fonctionnent sans cookie. <a href="/privacy">Politique de confidentialité</a>.',
      consent_legend: 'Choisissez ce que vous autorisez',
      consent_necessary: '<strong>Strictement nécessaire</strong> : mémorise vos choix (confidentialité, langue). Toujours actif.',
      consent_analytics: '<strong>Mesure d\'audience</strong> : statistiques de visite anonymes (Cloudflare Web Analytics).',
      accept: 'Accepter', refuse: 'Refuser', settings: 'Paramétrer', save_choices: 'Enregistrer mes choix',
      sub_ok: 'Merci. Vous recevrez le prochain article par email.',
      generic_error: 'Une erreur est survenue. Merci de réessayer.',
      all: 'Tout', issue: 'Numéro', views: 'vues', likes: 'likes', comments: 'commentaires',
      no_articles: 'Aucun article pour le moment.',
      no_articles_title: 'Premiers articles très bientôt', welcome_text: 'AFRIGOV s\'intéresse à la façon dont les administrations africaines se transforment avec le numérique : leurs outils, leurs services, leur lien avec les citoyens, et tout ce qui rend cela possible.', no_results: 'Aucun article ne correspond à votre recherche.', results_for: 'Résultats pour', permalink: 'Lien permanent', no_section: 'Rien n\'a encore été publié dans cette rubrique.', no_popular: 'Rien de publié pour le moment.',
      load_error: 'Les articles n\'ont pas pu être chargés. Merci de rafraîchir la page.',
      by: 'Par', min_read: 'min de lecture', draft_preview: 'APERÇU DU BROUILLON',
      not_found_title: 'Article introuvable', not_found_text: 'Cet article n\'existe pas ou n\'est plus publié.',
      like: 'J\'aime', liked: 'Aimé', link_copied: 'Lien copié',
      comments_title: 'Commentaires', no_comments: 'Aucun commentaire pour le moment.',
      comment_ok: 'Merci. Votre commentaire apparaîtra après relecture.',
      to_dark: 'Passer en mode sombre', to_light: 'Passer en mode clair', to_lang: 'Read in English',
      err_invalid_email: 'Indiquez une adresse email valide.',
      err_consent_required: 'Cochez la case pour donner votre accord.',
      err_too_fast: 'Prenez le temps de rédiger votre commentaire.',
      err_name_required: 'Indiquez votre nom.',
      err_empty_comment: 'Le commentaire est vide.',
      err_rate_limited: 'Trop de commentaires en peu de temps. Réessayez dans quelques minutes.',
      err_not_found: 'Cet article n\'existe pas ou n\'est plus publié.',
    },
  };

  var CATEGORY_FR = {
    'Core government systems': 'Systèmes de gestion de l\'État',
    'Public service delivery': 'Services publics numériques',
    'Citizen engagement': 'Participation citoyenne',
    'GovTech enablers': 'Stratégies, lois et compétences',
    'Infrastructure': 'Infrastructures numériques',
    'Financing': 'Financement du numérique public',
    'Ecosystem': 'Acteurs et écosystème',
  };
  var CATEGORY_EN = {
    'Core government systems': 'Government management systems',
    'Public service delivery': 'Digital public services',
    'Citizen engagement': 'Citizen engagement',
    'GovTech enablers': 'Strategies, laws and skills',
    'Infrastructure': 'Digital infrastructure',
    'Financing': 'Funding digital government',
    'Ecosystem': 'People and ecosystem',
  };

  function lang() { return root.getAttribute('lang') === 'fr' ? 'fr' : 'en'; }
  function t(key) { return (I18N[lang()] && I18N[lang()][key]) || I18N.en[key] || key; }
  function category(c) { return (lang() === 'fr' ? CATEGORY_FR : CATEGORY_EN)[c] || c; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function api(path, options) {
    options = options || {};
    var init = { method: options.method || 'GET', headers: {}, credentials: 'same-origin' };
    if (options.body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
    return fetch(path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = data.code && I18N.en['err_' + data.code] ? t('err_' + data.code) : data.error || t('generic_error');
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function formatDate(iso, l) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso.replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? '' : 'Z'));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString((l || lang()) === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function readingTime(text) {
    var words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }

  // ---------- Markdown sûr : tout est échappé avant mise en forme ----------
  function safeUrl(url) {
    return /^(https?:\/\/|\/|#|mailto:)/i.test(url) ? url : '#';
  }

  function inline(text) {
    var s = esc(text);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) {
      return /^https:\/\//i.test(url) || /^\//.test(url) ? '<img src="' + url + '" alt="' + alt + '" loading="lazy">' : '';
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      var u = safeUrl(url);
      var ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + u + '"' + ext + '>' + label + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g, '$1<em>$2</em>');
    return s;
  }

  function markdown(md) {
    var lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var para = [];
    var list = null;
    var quote = [];

    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('<' + list.tag + '>' + list.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + list.tag + '>'); list = null; } }
    function flushQuote() { if (quote.length) { out.push('<blockquote><p>' + inline(quote.join(' ')) + '</p></blockquote>'); quote = []; } }
    function flushAll() { flushPara(); flushList(); flushQuote(); }

    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      var m;
      if (!line.trim()) { flushAll(); return; }
      if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { flushAll(); var tag = m[1].length === 2 ? 'h2' : 'h3'; out.push('<' + tag + '>' + inline(m[2]) + '</' + tag + '>'); return; }
      if (/^---+$/.test(line.trim())) { flushAll(); out.push('<hr>'); return; }
      if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); return; }
      if ((m = line.match(/^[-*]\s+(.*)$/))) { flushPara(); flushQuote(); if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); return; }
      if ((m = line.match(/^\d+[.)]\s+(.*)$/))) { flushPara(); flushQuote(); if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); return; }
      flushList(); flushQuote(); para.push(line.trim());
    });
    flushAll();
    return out.join('\n');
  }

  // ---------- Langue ----------
  var langListeners = [];
  function onLangChange(fn) { langListeners.push(fn); }

  function applyAttributes() {
    document.querySelectorAll('[data-ph-en]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute('data-ph-' + lang()));
    });
    document.querySelectorAll('[data-title-en]').forEach(function (el) {
      if (el.hasAttribute('data-title-' + lang())) document.title = el.getAttribute('data-title-' + lang());
    });
    document.querySelectorAll('[data-desc-en]').forEach(function (el) {
      el.setAttribute('content', el.getAttribute('data-desc-' + lang()));
    });
    document.querySelectorAll('input[name="lang"]').forEach(function (el) { el.value = lang(); });
    document.querySelectorAll('[data-today]').forEach(function (el) {
      var d = new Date().toLocaleDateString(lang() === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      el.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    });
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang()));
    });
  }

  function setLang(l) {
    root.setAttribute('lang', l);
    try { localStorage.setItem('afg_lang', l); } catch (e) {}
    applyAttributes();
    if (banner) openBanner(!banner.querySelector('#consent-settings').hidden);
    langListeners.forEach(function (fn) { fn(l); });
  }

  // ---------- Consentement cookies ----------
  var CONSENT_KEY = 'afg_consent';

  function getConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      if (c && c.v === (CONFIG.consentVersion || 1)) return c;
    } catch (e) {}
    return null;
  }

  function saveConsent(analytics) {
    var previous = getConsent();
    var c = { v: CONFIG.consentVersion || 1, analytics: !!analytics, at: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) {}
    closeBanner();
    if (previous && previous.analytics && !c.analytics) { location.reload(); return; }
    applyConsent(c);
  }

  var analyticsLoaded = false;
  function applyConsent(c) {
    if (!c || !c.analytics || analyticsLoaded || !CONFIG.cfAnalyticsToken) return;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: CONFIG.cfAnalyticsToken }));
    document.head.appendChild(s);
    analyticsLoaded = true;
  }

  var banner = null;
  function closeBanner() { if (banner) { banner.remove(); banner = null; } }

  function openBanner(showSettings) {
    var current = getConsent();
    var wasChecked = banner && banner.querySelector('#consent-analytics') ? banner.querySelector('#consent-analytics').checked : current && current.analytics;
    closeBanner();
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.innerHTML =
      '<div class="consent-inner">' +
      '<h2 id="consent-title">' + t('consent_title') + '</h2>' +
      '<p>' + t('consent_text') + '</p>' +
      '<fieldset id="consent-settings"' + (showSettings ? '' : ' hidden') + '>' +
      '<legend>' + t('consent_legend') + '</legend>' +
      '<label class="check"><input type="checkbox" checked disabled> <span>' + t('consent_necessary') + '</span></label>' +
      '<label class="check"><input type="checkbox" id="consent-analytics"' + (wasChecked ? ' checked' : '') + '> <span>' + t('consent_analytics') + '</span></label>' +
      '</fieldset>' +
      '<div class="buttons">' +
      '<button type="button" class="btn" data-c="accept">' + t('accept') + '</button>' +
      '<button type="button" class="btn ghost" data-c="refuse">' + t('refuse') + '</button>' +
      '<button type="button" class="btn ghost" data-c="settings">' + (showSettings ? t('save_choices') : t('settings')) + '</button>' +
      '</div></div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      var action = b.getAttribute('data-c');
      if (action === 'accept') saveConsent(true);
      else if (action === 'refuse') saveConsent(false);
      else if (action === 'settings') {
        var fs = banner.querySelector('#consent-settings');
        if (fs.hidden) { fs.hidden = false; b.textContent = t('save_choices'); }
        else saveConsent(banner.querySelector('#consent-analytics').checked);
      }
    });
  }

  // ---------- Inscription ----------
  function bindSubscribe(form) {
    var started = Date.now();
    var el = function (n) { return form.elements.namedItem(n); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('[data-msg]');
      var btn = form.querySelector('button[type="submit"]');
      msg.hidden = true;
      msg.className = 'notice';
      btn.disabled = true;
      api('/api/subscribe', {
        method: 'POST',
        body: {
          email: el('email').value,
          consent: el('consent').checked,
          lang: lang(),
          website: el('website').value,
          elapsed: Date.now() - started,
        },
      }).then(function () {
        msg.textContent = t('sub_ok');
        msg.hidden = false;
        form.reset();
      }).catch(function (err) {
        msg.textContent = err.message;
        msg.className = 'notice error';
        msg.hidden = false;
      }).then(function () { btn.disabled = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyAttributes();
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang')); });
    });

    var c = getConsent();
    if (c) applyConsent(c); else if (!document.body.hasAttribute('data-no-consent')) openBanner(false);
    document.querySelectorAll('[data-open-consent]').forEach(function (b) {
      b.addEventListener('click', function () { openBanner(true); });
    });
    document.querySelectorAll('form[data-subscribe]').forEach(bindSubscribe);
    document.querySelectorAll('[data-contact]').forEach(function (el) {
      var email = CONFIG.contactEmail || '';
      el.innerHTML = email ? '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>' : '';
    });
    document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
  });

  window.AFG = {
    esc: esc, api: api, markdown: markdown, formatDate: formatDate, readingTime: readingTime,
    openConsent: openBanner, t: t, lang: lang, category: category, onLangChange: onLangChange,
  };
})();
