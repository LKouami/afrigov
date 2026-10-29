// AFRIGOV, lecture d'un article. Sur l'accueil, affiche le dernier texte publié en entier.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var isHome = document.body.hasAttribute('data-home');
  var parts = location.pathname.split('/').filter(Boolean);
  var slug = isHome ? '' : decodeURIComponent(parts[0] === 'a' ? parts[1] || '' : new URLSearchParams(location.search).get('s') || '');
  var preview = new URLSearchParams(location.search).get('preview') === '1';
  var base = '';
  var article = null;
  var state = 'loading'; // loading | ready | notfound | empty
  var likeState = { likes: 0, liked: false };
  var comments = null;

  function render() {
    $('like-label').textContent = AFG.t(likeState.liked ? 'liked' : 'like');
    $('views-label').textContent = AFG.t('views');
    renderComments();
    if (state === 'empty') {
      $('a-section').textContent = '';
      $('a-title').textContent = AFG.t('no_articles_title');
      $('a-byline').textContent = '';
      $('a-body').innerHTML = '<p>' + AFG.esc(AFG.t('welcome_text')) + '</p>';
      return;
    }
    if (state === 'notfound') {
      $('a-title').textContent = AFG.t('not_found_title');
      $('a-body').innerHTML = '<p>' + AFG.esc(AFG.t('not_found_text')) + '</p>';
      document.title = AFG.t('not_found_title') + ' | AFRIGOV';
      return;
    }
    if (!article) return;
    var a = article;
    if (!isHome) document.title = a.title + ' | AFRIGOV';
    var link = '/a/' + encodeURIComponent(a.slug);
    $('a-title').innerHTML = isHome ? '<a href="' + link + '">' + AFG.esc(a.title) + '</a>' : AFG.esc(a.title);
    $('a-section').textContent = a.kicker || [AFG.category(a.category), a.country].filter(Boolean).join(' · ');
    var by = [
      AFG.formatDate(a.published_at),
      a.author ? AFG.t('by') + ' ' + a.author : '',
      AFG.readingTime(a.body) + ' ' + AFG.t('min_read'),
      a.status === 'draft' ? AFG.t('draft_preview') : '',
    ].filter(Boolean).map(function (x) { return '<span>' + AFG.esc(x) + '</span>'; });
    $('a-byline').innerHTML = by.join('<span aria-hidden="true">·</span>');
  }

  function setLike(r) {
    likeState = { likes: r.likes, liked: !!r.liked };
    $('like-count').textContent = r.likes;
    $('like').setAttribute('aria-pressed', String(likeState.liked));
    $('like-label').textContent = AFG.t(likeState.liked ? 'liked' : 'like');
  }

  function renderComments() {
    var title = AFG.t('comments_title');
    if (!comments) { $('comments-title').textContent = title; return; }
    $('comments-title').textContent = comments.length ? title + ' (' + comments.length + ')' : title;
    $('comment-list').innerHTML = comments.length
      ? comments.map(function (c) {
          return '<div class="comment"><div class="who">' + AFG.esc(c.name) + '<span>' + AFG.esc(AFG.formatDate(c.created_at)) + '</span></div><p>' + AFG.esc(c.body) + '</p></div>';
        }).join('')
      : '<p class="comments-empty">' + AFG.esc(AFG.t('no_comments')) + '</p>';
  }

  function show(a) {
    article = a;
    state = 'ready';
    document.dispatchEvent(new CustomEvent('afg:article', { detail: a.slug }));
    base = '/api/articles/' + encodeURIComponent(a.slug);
    $('a-section').setAttribute('lang', a.lang || 'en');
    $('a-title').setAttribute('lang', a.lang || 'en');
    $('a-body').setAttribute('lang', a.lang || 'en');
    if (a.lede) { $('a-lede').textContent = a.lede; $('a-lede').hidden = false; $('a-lede').setAttribute('lang', a.lang || 'en'); }
    if (!isHome) {
      var desc = document.querySelector('meta[name="description"]');
      if (desc && a.lede) { desc.setAttribute('content', a.lede); desc.removeAttribute('data-desc-en'); }
    }
    $('a-body').innerHTML = AFG.markdown(a.body);
    $('article').setAttribute('aria-busy', 'false');
    $('view-count').textContent = a.views;
    setLike({ likes: a.likes, liked: false });
    render();
    if (a.status !== 'published') return;
    $('a-actions').hidden = false;
    $('comments').hidden = false;
    if (!preview) {
      AFG.api(base + '/view', { method: 'POST' }).then(function (r) { $('view-count').textContent = r.views; }).catch(function () {});
    }
    AFG.api(base + '/like').then(setLike).catch(function () {});
    AFG.api(base + '/comments').then(function (d) { comments = d.comments; renderComments(); }).catch(function () {});
  }

  AFG.onLangChange(render);
  render();

  if (isHome) {
    AFG.api('/api/articles').then(function (d) {
      if (!d.articles.length) { state = 'empty'; $('article').setAttribute('aria-busy', 'false'); render(); return; }
      // Le dernier texte dans la langue du lecteur s'il existe, sinon le dernier tout court.
      var pick = d.articles.filter(function (a) { return a.lang === AFG.lang(); })[0] || d.articles[0];
      return AFG.api('/api/articles/' + encodeURIComponent(pick.slug)).then(function (r) { show(r.article); });
    }).catch(function () { state = 'notfound'; render(); });
  } else if (!slug) {
    state = 'notfound'; render();
  } else {
    AFG.api('/api/articles/' + encodeURIComponent(slug) + (preview ? '?preview=1' : ''))
      .then(function (r) { show(r.article); })
      .catch(function () { state = 'notfound'; $('article').setAttribute('aria-busy', 'false'); render(); });
  }

  $('like').addEventListener('click', function () {
    var btn = $('like');
    btn.disabled = true;
    AFG.api(base + '/like', { method: 'POST' }).then(setLike).catch(function () {}).then(function () { btn.disabled = false; });
  });

  $('share').addEventListener('click', function () {
    if (!article) return;
    var url = location.origin + '/a/' + encodeURIComponent(article.slug);
    var done = function () { $('share-msg').textContent = AFG.t('link_copied'); setTimeout(function () { $('share-msg').textContent = ''; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { $('share-msg').textContent = url; });
    } else {
      $('share-msg').textContent = url;
    }
  });

  var formStarted = Date.now();
  $('comment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var el = function (n) { return f.elements.namedItem(n); };
    var msg = $('c-msg');
    var btn = f.querySelector('button[type="submit"]');
    msg.hidden = true;
    msg.className = 'notice';
    btn.disabled = true;
    AFG.api(base + '/comments', {
      method: 'POST',
      body: {
        name: el('name').value, email: el('email').value, body: el('body').value, consent: el('consent').checked,
        website: el('website').value, elapsed: Date.now() - formStarted,
      },
    }).then(function () {
      msg.textContent = AFG.t('comment_ok');
      msg.hidden = false;
      f.reset();
    }).catch(function (err) {
      msg.textContent = err.message;
      msg.className = 'notice error';
      msg.hidden = false;
    }).then(function () { btn.disabled = false; });
  });
})();
