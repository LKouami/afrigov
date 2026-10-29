Tu vas m'aider à mettre en ligne le site AFRIGOV (dossier courant) sur Cloudflare Pages, avec une base Cloudflare D1, sur le domaine afrigov.news que j'ai déjà acheté chez Cloudflare. Lis d'abord README.md, wrangler.toml et schema.sql pour comprendre le projet. Ne modifie pas le code du site sauf si un déploiement échoue à cause de lui, et dis-moi alors ce que tu changes.

Règles :
- Ne mets jamais de mot de passe ni de secret dans un fichier suivi par git. `.dev.vars` doit rester dans `.gitignore`.
- Demande-moi avant toute action payante ou irréversible (suppression de projet, de base, de DNS).
- Explique-moi chaque étape en une phrase, en français, et arrête-toi si une commande échoue deux fois.

Étapes :
1. Vérifie que Node.js 18 ou plus est installé (`node -v`). Sinon, dis-moi comment l'installer et arrête-toi.
2. Connecte wrangler à mon compte : `npx wrangler login` (je validerai dans le navigateur), puis `npx wrangler whoami`.
3. Crée la base : `npx wrangler d1 create afrigov-db`. Reporte le `database_id` obtenu dans `wrangler.toml` à la place de `REMPLACER-PAR-VOTRE-DATABASE-ID`. Si la base existe déjà, récupère son identifiant avec `npx wrangler d1 list`.
4. Crée les tables : `npx wrangler d1 execute afrigov-db --remote --file=schema.sql`.
5. Mets à jour le dépôt GitHub LKouami/afrigov avec le `database_id` : `git pull`, puis commit "Configure la base D1" et push sur la branche main.
6. Crée le projet Pages relié au dépôt GitHub pour que chaque push redéploie le site. Cette étape se fait dans le tableau de bord Cloudflare : guide-moi pas à pas (Workers & Pages > Create > Pages > Connect to Git > choisir le dépôt LKouami/afrigov, branche main, framework None, commande de build vide, dossier de sortie `public`). Le fichier wrangler.toml fournit la liaison D1 `DB`.
   Si je préfère ne pas relier GitHub, fais à la place : `npx wrangler pages project create afrigov --production-branch=main` puis `npx wrangler pages deploy`.
7. Définis les secrets de production. Génère SESSION_SECRET avec `openssl rand -hex 32` (ou `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), et demande-moi de taper moi-même ADMIN_PASSWORD :
   `npx wrangler pages secret put SESSION_SECRET --project-name=afrigov`
   `npx wrangler pages secret put ADMIN_PASSWORD --project-name=afrigov`
   Puis redéploie (nouveau push ou `npx wrangler pages deploy`) pour que les secrets soient pris en compte.
8. Branche le domaine : guide-moi dans le tableau de bord (Workers & Pages > afrigov > Custom domains > Set up a custom domain > `afrigov.news`, puis aussi `www.afrigov.news`). Attends que le certificat soit actif.
9. Crée l'adresse contact@afrigov.news : guide-moi dans le tableau de bord (afrigov.news > Email > Email Routing > activer, puis une règle contact@afrigov.news vers mon adresse Gmail, que je te donnerai).
10. Teste le site en ligne et fais-moi un compte rendu :
    - `https://afrigov.news` s'affiche, le bandeau cookies apparaît, le sélecteur FR / EN fonctionne, la recherche affiche les articles pendant la saisie ;
    - `https://afrigov.news/sitemap.xml` et `https://afrigov.news/robots.txt` répondent ;
    - `https://afrigov.news/api/articles` répond `{"articles":[]}` ;
    - `https://afrigov.news/admin` affiche la connexion ; je me connecte et je publie un article de test ;
    - l'article s'ouvre sur `/a/<adresse>` et son titre apparaît dans le code source de la page (rendu serveur), le compteur de vues augmente, le like fonctionne, un commentaire de test arrive en attente dans l'admin ;
    - l'inscription à la newsletter apparaît dans l'onglet Abonnés.
    Ensuite, propose-moi de supprimer l'article de test.
11. Termine par la liste de ce qu'il me reste à faire : compléter `public/privacy.html` et `public/about.html`, et ajouter le jeton Cloudflare Web Analytics dans `public/assets/config.js` si je veux la mesure d'audience.
