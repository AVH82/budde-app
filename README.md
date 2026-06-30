# Budd€

Application personnelle de gestion de budget Budd€.

## Installation GitHub Pages

1. Envoyer tous les fichiers et dossiers de ce projet dans le dépôt GitHub `budde-app`.
2. Dans GitHub : `Settings` → `Pages`.
3. Source : `Deploy from a branch`.
4. Branch : `main` / dossier `/root`.
5. Attendre la publication de GitHub Pages.
6. Ouvrir l'URL générée dans Safari sur iPhone.
7. Utiliser `Partager` → `Ajouter à l’écran d’accueil`.

## Notes

- L'ouverture directe de `index.html` depuis l'application Fichiers iOS n'est pas le mode cible.
- Les données existantes sont conservées dans `data/seed.js` et copiées dans `data/budget.json` pour préparer la séparation données/code.
- Le stockage actif actuel reste local au navigateur via `localStorage`.
