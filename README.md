# AFRIGOV, le site

Site de la revue AFRIGOV, e-Gov by Africans. Il tourne gratuitement sur Cloudflare Pages, avec une base de données Cloudflare D1.

## Ce que fait le site

- Site bilingue anglais et français, avec un sélecteur FR / EN discret dans l'en-tête.
- Accueil façon carnet de lecture : le dernier texte publié s'affiche en entier, avec une colonne latérale (abonnement, recherche, derniers textes, rubriques).
- Page Archives avec recherche et filtre par rubrique (les 7 catégories de veille).
- Page article avec compteur de vues, bouton « J'aime », copie du lien et commentaires.
- Commentaires avec nom et email, publiés seulement après validation dans l'espace admin. Anti-spam : champ piège et délai minimum.
- Inscription à la newsletter, avec consentement. Export CSV des abonnés pour Brevo ou MailerLite.
- Bandeau cookies avec trois choix : Accepter, Refuser, Paramétrer. La mesure d'audience (Cloudflare Web Analytics) ne se charge qu'après accord. Le choix est modifiable à tout moment depuis le pied de page.
- Vues, likes et commentaires fonctionnent sans cookie. Pour compter un like par lecteur, le site garde une empreinte chiffrée, jamais l'adresse IP.
- Polices hébergées sur le site : aucune requête vers Google.
- Espace admin (`/admin`) protégé par mot de passe : tableau de bord (vues sur 30 jours, articles les plus lus), rédaction en Markdown avec aperçu en direct, brouillons, publication, modération des commentaires, gestion des abonnés.

## Mettre le site en ligne (environ 20 minutes)

Il faut un compte Cloudflare gratuit et Node.js installé sur l'ordinateur. Toutes les commandes se lancent dans ce dossier.

1. Se connecter à Cloudflare :
   ```
   npx wrangler login
   ```
2. Créer la base de données :
   ```
   npx wrangler d1 create afrigov-db
   ```
   Copier l'identifiant `database_id` affiché dans `wrangler.toml`, à la place de `REMPLACER-PAR-VOTRE-DATABASE-ID`.
3. Créer les tables :
   ```
   npx wrangler d1 execute afrigov-db --remote --file=schema.sql
   ```
4. Créer le projet et publier le site :
   ```
   npx wrangler pages project create afrigov --production-branch=main
   npx wrangler pages deploy
   ```
5. Définir les deux secrets (le mot de passe admin et une longue clé aléatoire) :
   ```
   npx wrangler pages secret put ADMIN_PASSWORD --project-name=afrigov
   npx wrangler pages secret put SESSION_SECRET --project-name=afrigov
   ```
   Pour SESSION_SECRET, utilisez une chaîne aléatoire d'au moins 32 caractères (par exemple le résultat de `openssl rand -hex 32`). Republiez ensuite avec `npx wrangler pages deploy`.
6. Brancher le domaine : tableau de bord Cloudflare > Workers & Pages > afrigov > Custom domains > ajouter `afrigov.news`. C'est plus simple si le domaine est géré par Cloudflare (DNS).
7. Facultatif, la mesure d'audience : tableau de bord Cloudflare > Web Analytics > ajouter le site, puis coller le jeton dans `public/assets/config.js` (`cfAnalyticsToken`) et republier.

L'espace admin est ensuite à l'adresse `https://afrigov.news/admin`.

## Écrire un article

Dans l'espace admin : Articles > Nouvel article. Le contenu s'écrit en Markdown :

- `## Intertitre` et `### Sous-titre`
- `**gras**`, `*italique*`, `[lien](https://...)`
- `- élément de liste`, `1. liste numérotée`, `> citation`, `---` pour un séparateur
- Encadré chiffre clé : `!!! 0,587 | Togo, score GTMI 2025, groupe B`
- Image hébergée ailleurs : `![description](https://...)`

« Enregistrer le brouillon » garde l'article invisible du public. « Publier » le met en ligne à l'adresse `/a/<adresse-de-l-article>`.

## Envoyer la revue

Le site collecte les abonnés, il n'envoie pas les emails. Chaque mois : Abonnés > Exporter en CSV, importer le fichier dans Brevo ou MailerLite (gratuits au démarrage), puis envoyer la newsletter avec un lien vers les articles du site. Le lien de désinscription est géré par Brevo ou MailerLite. Pensez à supprimer aussi la personne dans l'espace admin quand elle se désinscrit.

## Tester sur son ordinateur

```
cp .dev.vars.example .dev.vars
npx wrangler d1 execute afrigov-db --local --file=schema.sql
npx wrangler pages dev
```
Puis ouvrir `http://localhost:8788` (mot de passe admin : celui de `.dev.vars`).

## Avant l'ouverture au public

- Compléter `public/privacy.html` : responsable du site, adresse, date. Faites-la relire par une personne compétente en protection des données, selon les pays de vos lecteurs.
- Compléter la section « Who we are » de `public/about.html` et l'email de contact dans `public/assets/config.js`.
- Remplacer `public/favicon.svg` par le logo retenu (l'icône actuelle reprend la piste « Blocs », provisoire).

## Coûts

Tout tient dans les offres gratuites de Cloudflare pour un site de cette taille (requêtes, stockage et écritures de la base ont des quotas gratuits journaliers, à vérifier sur la page des tarifs Cloudflare). Seul le nom de domaine est payant.

## Ce qui n'est pas inclus

- Plusieurs comptes rédacteurs : il y a un seul mot de passe admin, à partager avec l'équipe éditoriale.
- Envoi d'images depuis l'espace admin : les images s'ajoutent par un lien https.
- Envoi des emails de la newsletter (voir « Envoyer la revue »).

## Organisation des fichiers

```
public/            pages, styles, scripts et polices du site
  assets/config.js réglages (email de contact, jeton d'audience)
functions/api/     API : articles, vues, likes, commentaires, inscription, admin
lib/util.js        outils partagés (sessions, sécurité, validation)
schema.sql         structure de la base de données
wrangler.toml      configuration Cloudflare
```
