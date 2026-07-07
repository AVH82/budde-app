# Asset Library — Budd€

Ce document décrit le rôle des espaces d'assets graphiques du terminal Budd€ et leurs règles d'utilisation.

## Principe général

Un asset graphique final ne doit pas être inventé par une IA de développement pendant une tâche de code. Il doit être conçu, validé visuellement, livré sous forme de pack, puis intégré dans le repository selon un cycle de vie traçable.

Le repository GitHub doit rester un espace de production : il contient les assets validés et nécessaires à l'application, pas les essais graphiques abandonnés.

## Zone d'entrée des assets validés

`assets/_incoming/` est l'espace tampon officiel pour les assets graphiques validés avant leur rangement définitif dans l'arborescence du projet.

Règles obligatoires :

- `assets/_incoming/` sert uniquement de zone de dépôt temporaire.
- Les fichiers déposés dans ce dossier doivent déjà être des assets validés visuellement.
- Codex doit ensuite déplacer chaque asset validé vers son dossier définitif approprié.
- `assets/_incoming/` doit rester vide après traitement, sauf le fichier `.keep` qui conserve le dossier dans Git.
- Aucun asset final ne doit rester durablement dans `assets/_incoming/`.

## Pack d'assets validés

Chaque livraison graphique validée doit être préparée comme un pack jetable de transport. Le ZIP peut être supprimé après intégration : la mémoire officielle du pack doit être transférée dans les documents du repository.

Format recommandé du ZIP :

```text
AST-00X_Nom_Du_Pack_vX.Y.zip
└── AST-00X_Nom_Du_Pack_vX.Y/
    ├── README.md
    ├── MANIFEST.json
    ├── preview.webp
    ├── asset_01.webp
    ├── asset_02.webp
    └── ...
```

Règles :

- Le ZIP contient un seul dossier racine.
- Tous les fichiers du pack doivent être dans ce dossier unique pour faciliter l'upload depuis iPhone.
- Le contenu du dossier racine peut être déposé dans `assets/_incoming/`.
- `preview.webp` sert à vérifier visuellement le pack avant intégration.
- `README.md` décrit le pack pour lecture humaine.
- `MANIFEST.json` décrit le pack pour lecture automatique par une IA de développement.

## README de pack

Le `README.md` du pack doit contenir au minimum :

```md
# AST-00X — Nom du pack

## Statut

Validé graphiquement : oui/non
Intégré au repository : en attente/oui

## Version

X.Y

## Destination prévue

assets/.../

## Contenu

- fichier_1.webp — rôle
- fichier_2.webp — rôle

## Notes de validation

- décision visuelle ;
- contraintes ;
- points à vérifier après intégration.
```

Après intégration, la traçabilité utile du README doit être reprise dans `docs/ASSET_LIBRARY.md` ou dans un document d'historique dédié si le pack devient important.

## MANIFEST.json de pack

Le `MANIFEST.json` sert à guider le rangement automatique.

Structure recommandée :

```json
{
  "assetPack": "AST-00X",
  "name": "Nom du pack",
  "version": "X.Y",
  "status": "validated",
  "destination": "assets/.../",
  "files": [
    {
      "path": "asset_01.webp",
      "role": "description courte",
      "destination": "assets/.../asset_01.webp"
    }
  ]
}
```

Règles :

- Ne pas inventer de destination si elle n'est pas validée.
- Si la destination est incertaine, la tâche doit demander confirmation avant déplacement.
- Le manifeste ne remplace pas la validation humaine de l'asset.

## Destinations officielles actuelles

- `assets/budde/` — rendus, expressions, postures ou variantes de Budd€.
- `assets/frame/` — éléments du Frame System, cadre, bords, plaques et pièces structurelles.
- `assets/pivot/` — éléments liés au module pivotant, au bouton configuration radioactivité et au Trustomètre.
- `assets/nav-new/` — nouvelle génération d'icônes ou boutons de navigation terminal avant remplacement de `assets/nav/`.
- `assets/_incoming/` — zone temporaire de dépôt, jamais destination finale.


## Assets intégrés validés

### AST-001.1 — Frame Core

- Statut : intégré au repository.
- Version : 1.0.
- Destination : `assets/frame/`.
- Fichiers :
  - `assets/frame/FRM-001_frame-top.png` — bande structurelle supérieure du Frame System.
  - `assets/frame/FRM-002_frame-bottom.png` — bande structurelle inférieure / dock du Frame System.
  - `assets/frame/FRM-003_frame-left.png` — bande structurelle latérale gauche compacte.
  - `assets/frame/FRM-004_frame-right.png` — bande structurelle latérale droite compacte.
- Notes : pack validé graphiquement et rangé sans branchement UI, CSS ou JavaScript. `assets/_incoming/` est nettoyé après intégration et ne conserve que `.keep`.

## Cycle de vie d'un asset

1. Conception graphique hors repository.
2. Validation visuelle par l'opérateur.
3. Livraison dans un pack versionné.
4. Dépôt du contenu du pack dans `assets/_incoming/`.
5. Lecture du README et du MANIFEST par l'IA de développement.
6. Déplacement vers les dossiers définitifs.
7. Mise à jour de `docs/ASSET_LIBRARY.md` si l'asset devient durable.
8. Mise à jour de `docs/CHANGELOG_DESIGN.md` si la validation est une décision graphique durable.
9. Nettoyage de `assets/_incoming/`, en conservant seulement `.keep`.
10. Rapport final indiquant les fichiers déplacés, destinations, documents mis à jour et impact applicatif.

## Responsabilité d'intégration

Une IA de développement ne crée pas d'asset graphique final pour Budd€. Elle intègre uniquement les assets validés déposés dans `assets/_incoming/`, puis documente leur rangement si la décision devient durable.

Une tâche d'intégration d'assets ne doit pas modifier l'interface en même temps, sauf instruction explicite. Le rangement des assets et leur branchement visuel doivent rester séparés lorsque cela facilite la revue.
