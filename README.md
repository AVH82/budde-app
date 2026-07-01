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
