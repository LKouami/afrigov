// Outils partagés par les fonctions de l'API AFRIGOV.

export const CATEGORIES = [
  'Core government systems',
  'Public service delivery',
  'Citizen engagement',
  'GovTech enablers',
  'Infrastructure',
  'Financing',
  'Ecosystem',
];

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

// code : identifiant court que le site traduit en français ou en anglais.
export function fail(message, status = 400, code) {
  return json(code ? { error: message, code } : { error: message }, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const enc = new TextEncoder();

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

// Comparaison en temps constant, pour les mots de passe et signatures.
export function safeEqual(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function getCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export const SESSION_COOKIE = 'afg_admin';
const SESSION_HOURS = 12;

export async function createSession(env) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const sig = await hmac(env.SESSION_SECRET, `admin.${exp}`);
  return `${exp}.${sig}`;
}

export function sessionCookie(value, maxAge) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export async function isAdmin(request, env) {
  if (!env.SESSION_SECRET) return false;
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = await hmac(env.SESSION_SECRET, `admin.${exp}`);
  return safeEqual(sig, expected);
}

// Empreinte anonyme d'un visiteur : hachage salé, jamais l'IP en clair.
export async function visitorFingerprint(request, env, scope) {
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ua = request.headers.get('user-agent') || '';
  return sha256(`${env.SESSION_SECRET || 'afrigov'}|${scope}|${ip}|${ua}`);
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

export function isEmail(value) {
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(String(value));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getPublished(env, slug) {
  return env.DB.prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published'").bind(slug).first();
}

// Nettoie et valide les champs d'un article envoyés par l'espace admin.
export function normalize(d) {
  const issue = parseInt(d.issue, 10);
  return {
    slug: slugify(d.slug || d.title || ''),
    title: clean(d.title, 200),
    kicker: clean(d.kicker, 80),
    lede: clean(d.lede, 600),
    body: clean(d.body, 100000),
    category: CATEGORIES.includes(d.category) ? d.category : '',
    country: clean(d.country, 60),
    issue: Number.isFinite(issue) ? issue : null,
    lang: d.lang === 'fr' ? 'fr' : 'en',
    author: clean(d.author, 80),
    status: d.status === 'published' ? 'published' : 'draft',
  };
}
