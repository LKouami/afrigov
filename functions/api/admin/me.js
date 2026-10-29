import { json } from '../../../lib/util.js';

// Le middleware a déjà vérifié la session : si on arrive ici, l'admin est connecté.
export async function onRequestGet() {
  return json({ ok: true });
}
