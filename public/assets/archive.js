// AFRIGOV, archives : tous les textes, filtrables par rubrique et par recherche.
(function () {
  'use strict';
  var CATEGORIES = ['Core government systems', 'Public service delivery', 'Citizen engagement', 'GovTech enablers', 'Infrastructure', 'Financing', 'Ecosystem'];
  var params = new URLSearchParams(location.search);
  var section = CATEGORIES.indexOf(params.get('s')) > -1 ? params.get('s') : '';
  var query = (params.get('q') || '').trim();
  var $ = function (id) { return document.getElementById(id); };
  var all = null;
  var failed = false;

  var q = document.getElementById('q');
  if (q && query) q.value = query;

  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function renderFilters() {
    $('filters').innerHTML = [''].concat(CATEGORIES).map(function (c) {
      return '<button type="button" class="chip" data-cat="' + AFG.esc(c) + '" aria-pressed="' + (c === section) + '">' + AFG.esc(c ? AFG.category(c) : AFG.t('all')) + '</button>';
    }).join('');
  }

  function entry(a) {
    var by = [AFG.formatDate(a.published_at), a.author ? AFG.t('by') + ' ' + a.author : '', a.category ? AFG.category(a.category) : '']
      .filter(Boolean).map(function (x) { return '<span>' + AFG.esc(x) + '</span>'; }).join('<span aria-hidden="true">·</span>');
    return '<li class="entry" lang="' + AFG.esc(a.lang) + '"><h2><a href="/a/' + encodeURIComponent(a.slug) + '">' + AFG.esc(a.title) + '</a></h2>' +
      '<div class="byline"><span class="lang-tag">' + AFG.esc(String(a.lang).toUpperCase()) + '</span>' + by + '</div>' +
      (a.lede ? '<p>' + AFG.esc(a.lede) + '</p>' : '') + '</li>';
  }

  function render() {
    renderFilters();
    if (query) {
      $('archive-title').textContent = AFG.t('results_for') + ' « ' + query + ' »';
    } else if (section) {
      $('archive-title').textContent = AFG.category(section);
    }
    if (failed) { $('entries').innerHTML = '<li class="empty">' + AFG.esc(AFG.t('load_error')) + '</li>'; return; }
    if (!all) return;
    var words = norm(query).split(/\s+/).filter(Boolean);
    var list = all.filter(function (a) {
      if (section && a.category !== section) return false;
      var hay = norm([a.title, a.lede, a.country, a.author, a.category, AFG.category(a.category)].join(' '));
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    });
    $('entries').innerHTML = list.length
      ? list.map(entry).join('')
      : '<li class="empty">' + AFG.esc(query ? AFG.t('no_results') : section ? AFG.t('no_section') : AFG.t('no_articles')) + '</li>';
  }

  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    section = b.getAttribute('data-cat');
    var url = section ? '/archive?s=' + encodeURIComponent(section) : '/archive';
    history.replaceState(null, '', url);
    query = '';
    if (q) q.value = '';
    $('archive-title').innerHTML = '<span data-lang="en">Archive</span><span data-lang="fr">Archives</span>';
    render();
  });

  AFG.api('/api/articles').then(function (d) { all = d.articles; render(); }).catch(function () { failed = true; render(); });
  AFG.onLangChange(render);
  render();
})();
