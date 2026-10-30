// AFRIGOV, espace admin : connexion, tableau de bord, articles, modération, abonnés.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = AFG.esc;
  var editingSlug = null;
  var articles = [];
  var commentStatus = 'pending';

  function showLogin() { $('login-view').hidden = false; $('app-view').hidden = true; $('logout').hidden = true; $('password').focus(); }
  function showApp() { $('login-view').hidden = true; $('app-view').hidden = false; $('logout').hidden = false; loadDashboard(); }

  function handle(err) {
    if (err && err.status === 401) { showLogin(); return; }
    alertMsg(err.message || 'Erreur');
  }
  function alertMsg(text) {
    var m = $('ed-msg');
    m.textContent = text; m.className = 'notice error'; m.hidden = false;
  }

  AFG.api('/api/admin/me').then(showApp).catch(function (err) {
    if (err.status === 500) { $('login-msg').textContent = err.message; $('login-msg').hidden = false; }
    showLogin();
  });

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    $('login-msg').hidden = true;
    AFG.api('/api/admin/login', { method: 'POST', body: { password: $('password').value } })
      .then(function () { $('password').value = ''; showApp(); })
      .catch(function (err) { $('login-msg').textContent = err.message; $('login-msg').hidden = false; });
  });

  $('logout').addEventListener('click', function () {
    AFG.api('/api/admin/logout', { method: 'POST' }).then(showLogin);
  });

  // ---------- Onglets ----------
  document.querySelector('.tabs').addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]');
    if (t) openTab(t.getAttribute('data-tab'));
  });
  function openTab(name) {
    document.querySelectorAll('[data-tab]').forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', String(on));
      $('panel-' + t.getAttribute('data-tab')).hidden = !on;
    });
    if (name === 'dashboard') loadDashboard();
    if (name === 'articles') { showList(); loadArticles(); }
    if (name === 'comments') loadComments();
    if (name === 'subscribers') loadSubscribers();
  }

  // ---------- Tableau de bord ----------
  function loadDashboard() {
    AFG.api('/api/admin/stats').then(function (d) {
      var t = d.totals;
      var items = [
        [t.published, 'articles publiés'], [t.drafts, 'brouillons'], [t.views, 'vues au total'], [t.likes, 'likes'],
        [t.comments, 'commentaires publiés'], [t.pending, 'commentaires en attente'], [t.subscribers, 'abonnés'],
      ];
      $('stats').innerHTML = items.map(function (i) { return '<div class="stat"><strong>' + i[0] + '</strong><span>' + i[1] + '</span></div>'; }).join('');
      setBadge(t.pending);
      // 30 jours, jours sans vue compris
      var map = {}; d.daily.forEach(function (r) { map[r.day] = r.views; });
      var days = []; for (var i = 29; i >= 0; i--) { var dt = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); days.push([dt, map[dt] || 0]); }
      var max = Math.max.apply(null, days.map(function (x) { return x[1]; }).concat([1]));
      $('chart').innerHTML = days.map(function (x) { return '<div title="' + x[0] + ' : ' + x[1] + ' vues" style="height:' + (x[1] / max * 100) + '%"></div>'; }).join('');
      $('chart-start').textContent = days[0][0];
      $('chart-end').textContent = days[29][0];
      $('top').innerHTML = d.top.length
        ? d.top.map(function (a) { return '<tr><td><a href="/a/' + encodeURIComponent(a.slug) + '" target="_blank" rel="noopener">' + esc(a.title) + '</a></td><td class="num">' + a.views + '</td><td class="num">' + a.likes + '</td></tr>'; }).join('')
        : '<tr><td colspan="3" class="meta">Aucun article publié pour le moment.</td></tr>';
    }).catch(handle);
  }
  function setBadge(n) { $('pending-badge').textContent = n; $('pending-badge').hidden = !n; }

  // ---------- Articles ----------
  function loadArticles() {
    AFG.api('/api/admin/articles').then(function (d) {
      articles = d.articles;
      $('articles').innerHTML = articles.length ? articles.map(function (a) {
        return '<tr><td><strong>' + esc(a.title) + '</strong><br><span class="meta">/a/' + esc(a.slug) + '</span></td>' +
          '<td><span class="status ' + a.status + '">' + (a.status === 'published' ? 'Publié' : 'Brouillon') + '</span></td>' +
          '<td class="num">' + a.views + '</td><td class="num">' + a.likes + '</td>' +
          '<td class="num">' + a.comments + (a.pending ? ' <span class="badge">' + a.pending + '</span>' : '') + '</td>' +
          '<td class="meta">' + esc(AFG.formatDate(a.updated_at, 'fr')) + '</td>' +
          '<td><button type="button" class="btn ghost" data-edit="' + esc(a.slug) + '">Modifier</button></td></tr>';
      }).join('') : '<tr><td colspan="7" class="meta">Aucun article. Cliquez sur « Nouvel article » pour commencer.</td></tr>';
    }).catch(handle);
  }

  $('articles').addEventListener('click', function (e) {
    var b = e.target.closest('[data-edit]');
    if (!b) return;
    var a = articles.filter(function (x) { return x.slug === b.getAttribute('data-edit'); })[0];
    if (a) openEditor(a);
  });
  $('new-article').addEventListener('click', function () { openEditor(null); });
  $('back').addEventListener('click', function () { showList(); loadArticles(); });

  function showList() { $('articles-list-view').hidden = false; $('editor-view').hidden = true; }

  var fields = ['title', 'slug', 'kicker', 'lede', 'category', 'country', 'issue', 'lang', 'author', 'body'];
  function field(n) { return $('ed-' + n); }

  function openEditor(a) {
    editingSlug = a ? a.slug : null;
    fields.forEach(function (n) { field(n).value = a && a[n] != null ? a[n] : (n === 'lang' ? 'en' : ''); });
    setStatus(a ? a.status : 'draft');
    $('ed-delete').hidden = !a;
    $('ed-msg').hidden = true;
    $('articles-list-view').hidden = true;
    $('editor-view').hidden = false;
    updatePreview();
    field('title').focus();
  }

  function setStatus(status) {
    $('ed-status').textContent = status === 'published' ? 'Publié' : 'Brouillon';
    $('ed-status').className = 'status ' + status;
    var link = $('ed-preview-link');
    if (editingSlug) {
      link.hidden = false;
      link.href = '/a/' + encodeURIComponent(editingSlug) + (status === 'published' ? '' : '?preview=1');
    } else link.hidden = true;
  }

  function updatePreview() {
    $('pv-kicker').textContent = field('kicker').value || [AFG.category(field('category').value), field('country').value].filter(Boolean).join(' · ');
    $('pv-title').textContent = field('title').value || 'Titre de l’article';
    $('pv-lede').textContent = field('lede').value;
    $('pv-body').innerHTML = AFG.markdown(field('body').value);
  }
  $('editor-view').addEventListener('input', updatePreview);

  $('editor-view').addEventListener('click', function (e) {
    var b = e.target.closest('[data-save]');
    if (!b) return;
    var payload = {};
    fields.forEach(function (n) { payload[n] = field(n).value; });
    payload.status = b.getAttribute('data-save');
    var req = editingSlug
      ? AFG.api('/api/articles/' + encodeURIComponent(editingSlug), { method: 'PUT', body: payload })
      : AFG.api('/api/articles', { method: 'POST', body: payload });
    req.then(function (r) {
      editingSlug = r.slug;
      field('slug').value = r.slug;
      setStatus(payload.status);
      $('ed-delete').hidden = false;
      var m = $('ed-msg');
      m.textContent = payload.status === 'published' ? 'Article publié.' : 'Brouillon enregistré.';
      m.className = 'notice'; m.hidden = false;
    }).catch(handle);
  });

  var deleteArmed = false;
  $('ed-delete').addEventListener('click', function () {
    if (!deleteArmed) {
      deleteArmed = true;
      $('ed-delete').textContent = 'Confirmer la suppression';
      setTimeout(function () { deleteArmed = false; $('ed-delete').textContent = 'Supprimer'; }, 4000);
      return;
    }
    AFG.api('/api/articles/' + encodeURIComponent(editingSlug), { method: 'DELETE' })
      .then(function () { deleteArmed = false; $('ed-delete').textContent = 'Supprimer'; showList(); loadArticles(); })
      .catch(handle);
  });

  // ---------- Commentaires ----------
  document.querySelector('#panel-comments .filters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cstatus]');
    if (!b) return;
    commentStatus = b.getAttribute('data-cstatus');
    document.querySelectorAll('[data-cstatus]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    loadComments();
  });

  function loadComments() {
    AFG.api('/api/admin/comments?status=' + commentStatus).then(function (d) {
      if (commentStatus === 'pending') setBadge(d.comments.length);
      $('comments-admin').innerHTML = d.comments.length ? d.comments.map(function (c) {
        return '<div class="comment"><div class="who">' + esc(c.name) + ' <span class="meta">' + esc(c.email) + ' · ' + esc(AFG.formatDate(c.created_at, 'fr')) + '</span></div>' +
          '<div class="meta">Sur : <a href="/a/' + encodeURIComponent(c.article_slug) + '" target="_blank" rel="noopener">' + esc(c.article_title) + '</a></div>' +
          '<p>' + esc(c.body) + '</p><div class="toolbar" style="margin-top:8px">' +
          (c.status === 'pending' ? '<button type="button" class="btn" data-cid="' + c.id + '" data-act="approve">Publier</button>' : '') +
          '<button type="button" class="btn danger" data-cid="' + c.id + '" data-act="delete">Supprimer</button></div></div>';
      }).join('') : '<p class="meta">' + (commentStatus === 'pending' ? 'Aucun commentaire en attente.' : 'Aucun commentaire publié.') + '</p>';
    }).catch(handle);
  }

  $('comments-admin').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cid]');
    if (!b) return;
    b.disabled = true;
    AFG.api('/api/admin/comments', { method: 'POST', body: { id: b.getAttribute('data-cid'), action: b.getAttribute('data-act') } })
      .then(loadComments).catch(handle);
  });

  // ---------- Abonnés ----------
  function loadSubscribers() {
    AFG.api('/api/admin/subscribers').then(function (d) {
      $('sub-count').textContent = d.subscribers.length + ' abonné' + (d.subscribers.length > 1 ? 's' : '');
      $('subscribers').innerHTML = d.subscribers.length ? d.subscribers.map(function (s) {
        return '<tr><td>' + esc(s.email) + '</td><td>' + esc(s.lang) + '</td><td class="meta">' + esc(AFG.formatDate(s.consent_at, 'fr')) + '</td>' +
          '<td><button type="button" class="btn danger" data-sid="' + s.id + '">Désinscrire</button></td></tr>';
      }).join('') : '<tr><td colspan="4" class="meta">Aucun abonné pour le moment.</td></tr>';
    }).catch(handle);
  }
  $('subscribers').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sid]');
    if (!b) return;
    b.disabled = true;
    AFG.api('/api/admin/subscribers', { method: 'POST', body: { id: b.getAttribute('data-sid'), action: 'delete' } })
      .then(loadSubscribers).catch(handle);
  });
})();
