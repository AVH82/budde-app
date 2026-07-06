# Coding Guidelines — Budd€

## Organisation du projet

Structure actuelle de référence :

- `index.html` : structure principale de la PWA.
- `css/` : styles de l'interface terminal.
- `js/` : logique applicative et services.
- `assets/` : visuels, icônes, matériaux, Budd€.
- `data/` : modèles de données sans données personnelles.
- `test/` : tests automatisés.
- `docs/` : Constitution et documentation de référence.

## Règle de démarrage

Avant toute modification, lire `docs/START_HERE.md` puis les documents applicables. Si la demande contredit la documentation, arrêter et demander confirmation.

## Nommage

- Garder les noms de fichiers existants en kebab-case ou convention déjà présente.
- Les classes JavaScript restent en PascalCase.
- Les fonctions et variables JavaScript restent en camelCase.
- Les clés de données existantes ne doivent pas être renommées sans migration.
- L'UI française doit respecter `TERMINOLOGY.md`.

## Architecture

- Isoler les services techniques dans `js/*.service.js` ou adaptateurs dédiés.
- Ne pas coupler l'interface à un backend unique.
- Préserver le fonctionnement hors ligne.
- Ne pas introduire de dépendance lourde sans justification.
- Ne jamais publier de données personnelles.

## Assets

- Placer les nouveaux visuels dans `assets/` ou un sous-dossier explicite.
- Conserver des noms descriptifs et versionnés si le visuel est une validation graphique.
- Optimiser les images destinées au mobile.
- Ne pas remplacer un asset validé sans mettre à jour `CHANGELOG_DESIGN.md`.
- Une IA de développement ne crée pas d'asset graphique final.
- Elle intègre uniquement des assets validés déposés dans `assets/_incoming/`.

## CSS et responsive

- Priorité mobile.
- Respecter les zones sûres (`env(safe-area-inset-bottom)`).
- Protéger les montants contre les débordements.
- Utiliser les variables de couleur existantes quand possible.
- Éviter les styles qui brisent le Frame System.

## JavaScript

- Favoriser les fonctions courtes et explicites.
- Gérer les erreurs avec messages compréhensibles.
- Ne pas entourer les imports avec des blocs `try/catch`.
- Ne pas bloquer l'interface si un service optionnel est indisponible.
- Les actions destructrices doivent être confirmées.

## Données et confidentialité

- Le fichier réel `Budde.data.json` ne doit pas être commité.
- Les sauvegardes externes doivent être explicites et déclenchées par l'opérateur.
- Les analyses de reçus doivent rester locales sauf validation contraire documentée.

## Tests et vérifications

À chaque changement :

- vérifier l'absence de données privées ;
- exécuter les tests disponibles ;
- contrôler les vues mobiles impactées ;
- mettre à jour la documentation si une règle durable change.
