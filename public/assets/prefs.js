// AFRIGOV, langue appliquée avant l'affichage de la page (évite le flash).
// La langue choisie est mémorisée dans le navigateur : c'est une préférence demandée par le visiteur.
(function () {
  var root = document.documentElement;
  var lang = null;
  try { lang = localStorage.getItem('afg_lang'); } catch (e) {}
  if (root.getAttribute('data-fixed-lang')) lang = root.getAttribute('lang');
  if (lang !== 'fr' && lang !== 'en') {
    lang = /^fr\b/i.test(navigator.language || '') ? 'fr' : 'en';
  }
  root.setAttribute('lang', lang);
})();
