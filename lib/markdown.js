// Rendu Markdown sûr, identique à celui du navigateur (public/assets/site.js). Tout est échappé avant mise en forme.

export function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

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

export function markdown(md) {
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
