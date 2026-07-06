# Asset Library — Budd€

Ce document décrit le rôle des espaces d'assets graphiques du terminal Budd€ et leurs règles d'utilisation.

## Zone d'entrée des assets validés

`assets/_incoming/` est l'espace tampon officiel pour les assets graphiques validés avant leur rangement définitif dans l'arborescence du projet.

Règles obligatoires :

- `assets/_incoming/` sert uniquement de zone de dépôt temporaire.
- Les fichiers déposés dans ce dossier doivent déjà être des assets validés visuellement.
- Codex doit ensuite déplacer chaque asset validé vers son dossier définitif approprié.
- `assets/_incoming/` doit rester vide après traitement, sauf le fichier `.keep` qui conserve le dossier dans Git.
- Aucun asset final ne doit rester durablement dans `assets/_incoming/`.

## Responsabilité d'intégration

Une IA de développement ne crée pas d'asset graphique final pour Budd€. Elle intègre uniquement les assets validés déposés dans `assets/_incoming/`, puis documente leur rangement si la décision devient durable.
