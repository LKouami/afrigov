// AFRIGOV, page d'accueil : liste des articles et filtres par catégorie.
(function () {
  'use strict';
  var CATEGORIES = ['Core government systems', 'Public service delivery', 'Citizen engagement', 'GovTech enablers', 'Infrastructure', 'Financing', 'Ecosystem'];
  var listEl = document.getElementById('list');
  var filtersEl = document.getElementById('filters');
  var current = '';
  var articles = null;
  var failed = false;

  function renderFilters() {
    var all = [''].concat(CATEGORIES);
    filtersEl.innerHTML = all.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + AFG.esc(c) + '" aria-pressed="' + (c === current) + '">' + AFG.esc(c ? AFG.category(c) : AFG.t('all')) + '</button>';
    }).join('');
  }

  function card(a) {
    var meta = [
      a.issue ? AFG.t('issue') + ' ' + a.issue : '',
      AFG.formatDate(a.published_at),
      a.views + ' ' + AFG.t('views'),
      a.likes + ' ' + AFG.t('likes'),
      a.comments + ' ' + AFG.t('comments'),
    ].filter(Boolean).map(function (m) { return '<span>' + AFG.esc(m) + '</span>'; }).join('');
    var kicker = a.kicker || [AFG.category(a.category), a.country].filter(Boolean).join(' · ');
    return '<a class="card" href="/a/' + encodeURIComponent(a.slug) + '" lang="' + AFG.esc(a.lang) + '">' +
      (kicker ? '<p class="kicker">' + AFG.esc(kicker) + '</p>' : '') +
      '<h2>' + AFG.esc(a.title) + '</h2>' +
      (a.lede ? '<p>' + AFG.esc(a.lede) + '</p>' : '') +
      '<div class="meta"><span class="lang-tag">' + AFG.esc(String(a.lang).toUpperCase()) + '</span>' + meta + '</div></a>';
  }

  function renderList() {
    if (failed) { listEl.innerHTML = '<p class="empty">' + AFG.esc(AFG.t('load_error')) + '</p>'; return; }
    if (!articles) return;
    // Les articles dans la langue choisie passent en premier, les autres suivent.
    var lang = AFG.lang();
    var sorted = articles.slice().sort(function (x, y) { return (y.lang === lang) - (x.lang === lang); });
    listEl.innerHTML = sorted.length ? sorted.map(card).join('') : '<p class="empty">' + AFG.esc(AFG.t('no_articles')) + '</p>';
  }

  function load() {
    var q = current ? '?category=' + encodeURIComponent(current) : '';
    AFG.api('/api/articles' + q).then(function (data) {
      failed = false; articles = data.articles; renderList();
    }).catch(function () { failed = true; renderList(); });
  }

  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    current = b.getAttribute('data-cat');
    renderFilters();
    load();
  });

  AFG.onLangChange(function () { renderFilters(); renderList(); });
  renderFilters();
  load();
})();
