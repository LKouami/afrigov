// AFRIGOV, une : article principal, fil des dernières publications, les plus lus, pages de rubrique.
(function () {
  'use strict';
  var CATEGORIES = ['Core government systems', 'Public service delivery', 'Citizen engagement', 'GovTech enablers', 'Infrastructure', 'Financing', 'Ecosystem'];
  var section = new URLSearchParams(location.search).get('s') || '';
  if (CATEGORIES.indexOf(section) === -1) section = '';
  var $ = function (id) { return document.getElementById(id); };
  var all = null;
  var failed = false;

  document.querySelectorAll('.sections [data-section]').forEach(function (a) {
    if (a.getAttribute('data-section') === section) a.setAttribute('aria-current', 'page');
  });

  function shortDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(AFG.lang() === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
  }

  function kicker(a, linked) {
    var cat = a.category ? (linked ? '<a href="/?s=' + encodeURIComponent(a.category) + '">' + AFG.esc(AFG.category(a.category)) + '</a>' : AFG.esc(AFG.category(a.category))) : '';
    var text = a.kicker ? AFG.esc(a.kicker) : [cat, AFG.esc(a.country || '')].filter(Boolean).join(' · ');
    return text ? '<p class="kicker">' + text + '</p>' : '';
  }

  function meta(a) {
    var parts = [
      '<span class="lang-tag">' + AFG.esc(String(a.lang).toUpperCase()) + '</span>',
      a.author ? '<span>' + AFG.esc(AFG.t('by') + ' ' + a.author) + '</span>' : '',
      '<span>' + AFG.esc(AFG.formatDate(a.published_at)) + '</span>',
      a.comments ? '<span>' + a.comments + ' ' + AFG.esc(AFG.t('comments')) + '</span>' : '',
    ];
    return '<div class="meta">' + parts.join('') + '</div>';
  }

  function leadHtml(a) {
    return '<a class="lead" href="/a/' + encodeURIComponent(a.slug) + '" lang="' + AFG.esc(a.lang) + '">' +
      kicker(a, false) + '<h2>' + AFG.esc(a.title) + '</h2>' + (a.lede ? '<p>' + AFG.esc(a.lede) + '</p>' : '') + meta(a) + '</a>';
  }

  function itemHtml(a) {
    return '<li><a class="item" href="/a/' + encodeURIComponent(a.slug) + '" lang="' + AFG.esc(a.lang) + '">' +
      '<time datetime="' + AFG.esc(a.published_at || '') + '">' + AFG.esc(shortDate(a.published_at)) + '</time>' +
      '<div>' + kicker(a, false) + '<h3>' + AFG.esc(a.title) + '</h3>' + (a.lede ? '<p>' + AFG.esc(a.lede) + '</p>' : '') + meta(a) + '</div></a></li>';
  }

  function render() {
    if (section) {
      $('page-heading').hidden = false;
      $('section-name').textContent = AFG.category(section);
      document.title = AFG.category(section) + ' · AFRIGOV';
    }
    if (failed) { $('lead').innerHTML = '<p class="empty">' + AFG.esc(AFG.t('load_error')) + '</p>'; return; }
    if (!all) return;

    var lang = AFG.lang();
    var list = all.filter(function (a) { return !section || a.category === section; });
    // Les articles dans la langue choisie passent devant, à date égale l'ordre reste chronologique.
    list.sort(function (x, y) { return (y.lang === lang) - (x.lang === lang) || String(y.published_at).localeCompare(String(x.published_at)); });

    if (!list.length) {
      $('lead').innerHTML = section
        ? '<p class="empty">' + AFG.esc(AFG.t('no_section')) + '</p>'
        : '<div class="empty"><strong>' + AFG.esc(AFG.t('no_articles_title')) + '</strong>' + AFG.esc(AFG.t('no_articles')) + '</div>';
      $('stream').innerHTML = '';
      $('stream-title').hidden = true;
    } else {
      $('lead').innerHTML = leadHtml(list[0]);
      $('stream').innerHTML = list.slice(1).map(itemHtml).join('');
      $('stream-title').hidden = list.length < 2;
    }

    var popular = all.slice().filter(function (a) { return a.views > 0; }).sort(function (x, y) { return y.views - x.views; }).slice(0, 5);
    $('popular').innerHTML = popular.length
      ? popular.map(function (a) { return '<li><a href="/a/' + encodeURIComponent(a.slug) + '" lang="' + AFG.esc(a.lang) + '">' + AFG.esc(a.title) + '</a></li>'; }).join('')
      : '<li class="none"><span class="meta">' + AFG.esc(AFG.t('no_popular')) + '</span></li>';
  }

  AFG.api('/api/articles').then(function (data) { all = data.articles; render(); })
    .catch(function () { failed = true; render(); });
  AFG.onLangChange(render);
})();
