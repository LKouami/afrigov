// AFRIGOV, archives : tous les textes, du plus récent au plus ancien.
(function () {
  'use strict';
  var list = document.getElementById('entries');
  var all = null;
  var failed = false;

  function entry(a) {
    var by = [AFG.formatDate(a.published_at), a.author ? AFG.t('by') + ' ' + a.author : '']
      .filter(Boolean).map(function (x) { return '<span>' + AFG.esc(x) + '</span>'; }).join('<span aria-hidden="true">·</span>');
    return '<li class="entry" lang="' + AFG.esc(a.lang) + '"><h2><a href="/a/' + encodeURIComponent(a.slug) + '">' + AFG.esc(a.title) + '</a></h2>' +
      '<div class="byline">' + by + '</div>' + (a.lede ? '<p>' + AFG.esc(a.lede) + '</p>' : '') + '</li>';
  }

  function render() {
    if (failed) { list.innerHTML = '<li class="empty">' + AFG.esc(AFG.t('load_error')) + '</li>'; return; }
    if (!all) return;
    list.innerHTML = all.length ? all.map(entry).join('') : '<li class="empty">' + AFG.esc(AFG.t('no_articles')) + '</li>';
  }

  AFG.api('/api/articles').then(function (d) { all = d.articles; render(); }).catch(function () { failed = true; render(); });
  AFG.onLangChange(render);
})();
