// AFRIGOV, colonne latérale : recherche instantanée et articles récents.
(function () {
  'use strict';
  var articles = null;
  var shown = '';
  var recent = document.getElementById('recent');
  var input = document.getElementById('q');
  var results = document.getElementById('q-results');
  var active = -1;

  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  // ---------- Articles récents ----------
  function renderRecent() {
    if (!recent || !articles) return;
    var current = shown || decodeURIComponent((location.pathname.match(/^\/a\/([^/]+)/) || [])[1] || '');
    var items = articles.filter(function (a) { return a.slug !== current; }).slice(0, 6);
    recent.innerHTML = items.length
      ? items.map(function (a) {
          return '<li><a href="/a/' + encodeURIComponent(a.slug) + '" lang="' + AFG.esc(a.lang) + '">' + AFG.esc(a.title) +
            '<time datetime="' + AFG.esc(a.published_at || '') + '">' + AFG.esc(AFG.formatDate(a.published_at)) + '</time></a></li>';
        }).join('')
      : '<li class="empty">' + AFG.esc(AFG.t('no_popular')) + '</li>';
  }

  // ---------- Recherche pendant la saisie ----------
  function highlight(text, words) {
    var html = AFG.esc(text);
    words.forEach(function (w) {
      if (w.length < 2) return;
      var src = norm(text), idx = src.indexOf(w);
      if (idx < 0) return;
      var plain = text.substr(idx, w.length);
      html = html.replace(AFG.esc(plain), '<mark>' + AFG.esc(plain) + '</mark>');
    });
    return html;
  }

  function close() {
    if (!results) return;
    results.hidden = true;
    results.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  }

  function search() {
    var q = input.value.trim();
    if (!q || !articles) { close(); return; }
    var words = norm(q).split(/\s+/).filter(Boolean);
    var found = articles.filter(function (a) {
      var hay = norm([a.title, a.lede, a.country, a.author].join(' '));
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    }).slice(0, 8);
    active = -1;
    results.innerHTML = found.length
      ? found.map(function (a, i) {
          return '<li><a href="/a/' + encodeURIComponent(a.slug) + '" role="option" id="q-opt-' + i + '" lang="' + AFG.esc(a.lang) + '">' +
            highlight(a.title, words) + '<small>' + AFG.esc(AFG.formatDate(a.published_at)) + (a.author ? ' · ' + AFG.esc(a.author) : '') + '</small></a></li>';
        }).join('')
      : '<li class="none">' + AFG.esc(AFG.t('no_results')) + '</li>';
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function move(step) {
    var opts = results.querySelectorAll('a');
    if (!opts.length) return;
    if (active > -1) opts[active].removeAttribute('aria-selected');
    active = (active + step + opts.length) % opts.length;
    opts[active].setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  }

  if (input && results) {
    input.addEventListener('input', search);
    input.addEventListener('focus', function () { if (input.value.trim()) search(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Escape') { close(); }
      else if (e.key === 'Enter') {
        var opts = results.querySelectorAll('a');
        if (opts.length) { e.preventDefault(); location.href = opts[Math.max(active, 0)].getAttribute('href'); }
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search')) close();
    });
  }

  document.addEventListener('afg:article', function (e) { shown = e.detail; renderRecent(); });
  AFG.api('/api/articles').then(function (d) { articles = d.articles; renderRecent(); if (input && input.value.trim()) search(); }).catch(function () {});
  AFG.onLangChange(function () { renderRecent(); if (input && input.value.trim()) search(); });
})();
