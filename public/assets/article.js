// AFRIGOV, page article : contenu, vues, likes, commentaires.
(function () {
  'use strict';
  var parts = location.pathname.split('/').filter(Boolean);
  var slug = decodeURIComponent(parts[0] === 'a' ? parts[1] || '' : new URLSearchParams(location.search).get('s') || '');
  var preview = new URLSearchParams(location.search).get('preview') === '1';
  var base = '/api/articles/' + encodeURIComponent(slug);
  var $ = function (id) { return document.getElementById(id); };
  var article = null;
  var notFoundState = false;
  var likeState = { likes: 0, liked: false };
  var comments = null;

  function renderStatic() {
    $('like-label').textContent = AFG.t(likeState.liked ? 'liked' : 'like');
    $('views-label').textContent = AFG.t('views');
    renderComments();
    if (notFoundState) {
      $('a-title').textContent = AFG.t('not_found_title');
      $('a-lede').textContent = AFG.t('not_found_text');
      document.title = AFG.t('not_found_title') + ' · AFRIGOV';
      return;
    }
    if (!article) return;
    var a = article;
    document.title = a.title + ' · AFRIGOV';
    $('a-kicker').textContent = a.kicker || [AFG.category(a.category), a.country].filter(Boolean).join(' · ');
    var meta = [
      a.author ? AFG.t('by') + ' ' + a.author : '',
      a.issue ? AFG.t('issue') + ' ' + a.issue : '',
      AFG.formatDate(a.published_at),
      AFG.readingTime(a.body) + ' ' + AFG.t('min_read'),
      a.status === 'draft' ? AFG.t('draft_preview') : '',
    ].filter(Boolean);
    $('a-meta').innerHTML = meta.map(function (m) { return '<span>' + AFG.esc(m) + '</span>'; }).join('');
  }

  function notFound() {
    notFoundState = true;
    $('article').setAttribute('aria-busy', 'false');
    renderStatic();
  }

  AFG.onLangChange(renderStatic);
  renderStatic();

  if (!slug) { notFound(); return; }

  AFG.api(base + (preview ? '?preview=1' : '')).then(function (data) {
    var a = article = data.article;
    // La langue de l'article s'applique à son contenu, pas à l'interface.
    $('a-header').setAttribute('lang', a.lang || 'en');
    $('a-body').setAttribute('lang', a.lang || 'en');
    var desc = document.querySelector('meta[name="description"]');
    if (desc && a.lede) { desc.setAttribute('content', a.lede); desc.removeAttribute('data-desc-en'); }
    $('a-title').textContent = a.title;
    $('a-lede').textContent = a.lede || '';
    $('a-body').innerHTML = AFG.markdown(a.body);
    $('article').setAttribute('aria-busy', 'false');
    $('view-count').textContent = a.views;
    setLike({ likes: a.likes, liked: false });
    renderStatic();

    if (a.status === 'published') {
      $('a-actions').hidden = false;
      $('comments').hidden = false;
      if (!preview) {
        AFG.api(base + '/view', { method: 'POST' }).then(function (r) { $('view-count').textContent = r.views; }).catch(function () {});
      }
      AFG.api(base + '/like').then(setLike).catch(function () {});
      loadComments();
    }
  }).catch(notFound);

  function setLike(r) {
    likeState = { likes: r.likes, liked: !!r.liked };
    $('like-count').textContent = r.likes;
    $('like').setAttribute('aria-pressed', String(likeState.liked));
    $('like-label').textContent = AFG.t(likeState.liked ? 'liked' : 'like');
  }

  $('like').addEventListener('click', function () {
    var btn = $('like');
    btn.disabled = true;
    AFG.api(base + '/like', { method: 'POST' }).then(setLike).catch(function () {}).then(function () { btn.disabled = false; });
  });

  $('share').addEventListener('click', function () {
    var url = location.origin + '/a/' + encodeURIComponent(slug);
    var done = function () { $('share-msg').textContent = AFG.t('link_copied'); setTimeout(function () { $('share-msg').textContent = ''; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { $('share-msg').textContent = url; });
    } else {
      $('share-msg').textContent = url;
    }
  });

  function renderComments() {
    var title = AFG.t('comments_title');
    if (!comments) { $('comments-title').textContent = title; return; }
    $('comments-title').textContent = comments.length ? title + ' (' + comments.length + ')' : title;
    $('comment-list').innerHTML = comments.length
      ? comments.map(function (c) {
          return '<div class="comment"><div class="who">' + AFG.esc(c.name) + ' <span class="meta">' + AFG.esc(AFG.formatDate(c.created_at)) + '</span></div><p>' + AFG.esc(c.body) + '</p></div>';
        }).join('')
      : '<p class="meta">' + AFG.esc(AFG.t('no_comments')) + '</p>';
  }

  function loadComments() {
    AFG.api(base + '/comments').then(function (data) { comments = data.comments; renderComments(); }).catch(function () {});
  }

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
