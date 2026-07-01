# Budd€

Application personnelle de gestion de budget.

## Architecture

Le dépôt GitHub contient uniquement le code de l'application :

- `index.html`
- `css/`
- `js/`
- `assets/`
- `manifest.webmanifest`
- `service-worker.js`
- `data/Budde.data.template.json`

Les données personnelles ne doivent pas être publiées dans GitHub.

## Données privées

Le fichier réel de données doit s'appeler :

```text
Budde.data.json
```

Il contient notamment :

- dépenses ;
- budgets ;
- reports ;
- commerçants ;
- catégories ;
- paramètres ;
- apprentissage OCR.

Ce fichier devra être stocké hors GitHub, par exemple dans Google Drive.

## Note technique

La persistance locale de la PWA est isolée dans `js/storage.local.js` via `LocalStorageAdapter`.
L'application accède désormais au stockage via `js/storage.service.js`, une couche `StorageService` indépendante du backend qui délègue par défaut à `LocalStorageAdapter`.
L'application continue d'utiliser le même format `Budde.data.json` et les mêmes clés `localStorage` (`budde-data-v1` et migration legacy `budde-v7`).
Cette séparation prépare l'ajout futur d'un adaptateur Google Drive sans modifier l'interface utilisateur ni le comportement hors ligne.

`GoogleDriveAdapter` est préparé dans `js/storage.google-drive.js` pour la sauvegarde manuelle Google Drive. Le stockage réel reste local via `localStorage`, orchestré par `StorageService` avec `LocalStorageAdapter` comme backend par défaut.

## Sauvegarde manuelle Google Drive appDataFolder

L'écran **Statistiques** propose désormais le bouton **Sauvegarder sur Google Drive** lorsque l'utilisateur est connecté avec Google. Cette action conserve `LocalStorageAdapter` comme source principale : elle copie seulement l'état JSON courant de Budd€ vers Google Drive en sauvegarde supplémentaire.

La sauvegarde utilise l'API Google Drive v3 avec le scope OAuth suivant :

```text
https://www.googleapis.com/auth/drive.appdata
```

Le fichier est stocké uniquement dans l'espace applicatif masqué Google Drive `appDataFolder`, et jamais dans le Drive visible de l'utilisateur. Le nom du fichier est :

```text
budde-data.json
```

À chaque sauvegarde manuelle, `GoogleDriveAdapter` recherche ce fichier dans `appDataFolder` :

- si `budde-data.json` existe déjà, il est mis à jour avec une requête `PATCH` ;
- s'il n'existe pas, il est créé dans `appDataFolder` ;
- aucun doublon n'est volontairement créé, car la recherche précède toujours la création.

Après succès, l'interface affiche la date et l'heure de la dernière sauvegarde. En cas d'erreur Google Auth ou Drive, un message clair est affiché dans l'écran **Statistiques**.

La restauration depuis Google Drive n'est pas encore implémentée. Le démarrage de l'application continue de charger uniquement le stockage local via `StorageService` et `LocalStorageAdapter`. La synchronisation automatique n'est pas encore implémentée non plus.

## Installation PWA

Une fois le dépôt publié via GitHub Pages :

1. Ouvrir l'URL dans Safari sur iPhone.
2. Appuyer sur Partager.
3. Choisir Ajouter à l'écran d'accueil.

## Authentification Google active

La connexion Google est active dans l'écran **Statistiques** via `js/google-auth.service.js` et Google Identity Services pour navigateur/PWA. Le bouton **Connexion Google** lance le consentement OAuth, puis affiche l'état connecté ainsi que l'e-mail et le nom du compte lorsque Google les fournit. Une action **Déconnexion Google** révoque le jeton en mémoire.

L'identifiant client OAuth Web public est renseigné dans `js/google-auth.service.js`. Aucun secret client et aucune clé API ne sont nécessaires ni stockés dans le dépôt.

Le scope OAuth prévu est :

```text
https://www.googleapis.com/auth/drive.appdata
```

Ce scope donne accès au dossier applicatif Google Drive (`appDataFolder`) utilisé par la sauvegarde manuelle `budde-data.json`. À ce stade, l'application ne restaure pas les données depuis Drive et ne synchronise pas automatiquement : le stockage réel reste local via `StorageService` et `LocalStorageAdapter`, afin de conserver le fonctionnement hors ligne.
