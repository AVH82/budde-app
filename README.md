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

`GoogleDriveAdapter` est préparé dans `js/storage.google-drive.js`, mais il n'est pas encore actif et n'appelle pas Google Drive. Le stockage réel reste local via `localStorage`, orchestré par `StorageService` avec `LocalStorageAdapter` comme backend par défaut.

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

Ce scope prépare l'accès futur au dossier applicatif Google Drive (`appDataFolder`). À ce stade, la connexion Google est active mais la synchronisation Drive n'est pas encore implémentée : l'application ne lit pas Google Drive, n'écrit pas dans Google Drive et ne connecte pas `GoogleAuthService` à `GoogleDriveAdapter`. Le stockage réel reste local via `StorageService` et `LocalStorageAdapter`, afin de conserver le fonctionnement hors ligne.
