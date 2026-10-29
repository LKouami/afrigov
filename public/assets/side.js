// AFRIGOV, colonne latérale : les derniers textes publiés.
(function () {
  'use strict';
  var list = document.getElementById('recent');
  if (!list) return;
  var articles = null;
  var shown = '';
  document.addEventListener('afg:article', function (e) { shown = e.detail; render(); });

  function render() {
    if (!articles) return;
    var current = shown || decodeURIComponent((location.pathname.match(/^\/a\/([^/]+)/) || [])[1] || '');
    var items = articles.filter(function (a) { return a.slug !== current; }).slice(0, 6);
    list.innerHTML = items.length
      ? items.map(function (a) {
          return '<li><a href="/a/' + encodeURIComponent(a.slug) + '" lang="' + AFG.esc(a.lang) + '">' + AFG.esc(a.title) +
            '<time datetime="' + AFG.esc(a.published_at || '') + '">' + AFG.esc(AFG.formatDate(a.published_at)) + '</time></a></li>';
        }).join('')
      : '<li class="empty">' + AFG.esc(AFG.t('no_popular')) + '</li>';
  }

  AFG.api('/api/articles').then(function (d) { articles = d.articles; render(); }).catch(function () {});
  AFG.onLangChange(render);
})();
