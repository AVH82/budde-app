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

## Installation PWA

Une fois le dépôt publié via GitHub Pages :

1. Ouvrir l'URL dans Safari sur iPhone.
2. Appuyer sur Partager.
3. Choisir Ajouter à l'écran d'accueil.
