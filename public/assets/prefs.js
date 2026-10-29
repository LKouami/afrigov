// AFRIGOV, préférences d'affichage appliquées avant l'affichage de la page (évite le flash).
// Langue et thème sont mémorisés dans le navigateur : ce sont des préférences demandées par le visiteur.
(function () {
  var root = document.documentElement;
  var lang = null, theme = null;
  try { lang = localStorage.getItem('afg_lang'); theme = localStorage.getItem('afg_theme'); } catch (e) {}
  if (root.getAttribute('data-fixed-lang')) lang = root.getAttribute('lang');
  if (lang !== 'fr' && lang !== 'en') {
    lang = /^fr\b/i.test(navigator.language || '') ? 'fr' : 'en';
  }
  root.setAttribute('lang', lang);
  if (theme === 'dark' || theme === 'light') root.setAttribute('data-theme', theme);
})();
