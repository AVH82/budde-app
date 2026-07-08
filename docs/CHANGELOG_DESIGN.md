# Changelog Design — Budd€

Journal des validations graphiques, UX et terminologiques du projet.

## Format obligatoire

Chaque entrée doit suivre ce modèle :

```md
## YYYY-MM-DD — Titre de validation

- Décision : description courte.
- Portée : composants, modules ou assets concernés.
- Raison : justification de cohérence.
- Documents mis à jour : fichiers `docs/` concernés.
```


## 2026-07-08 — AST-004.3 Stabilisation dock et cache

- Décision : restaurer le comportement fixe du dock inférieur après l’intégration responsive du Frame Core et forcer un rafraîchissement de cache.
- Portée : `css/frame-core.css`, clé de cache Service Worker `budde-3-6-6` et paramètre `frame-core.css?v=ast0043`.
- Raison : éviter que les règles de z-index/position de la couche Frame Core ne remplacent le `position: fixed` du bandeau de navigation, tout en forçant le chargement du CSS corrigé.
- Documents mis à jour : `CHANGELOG_DESIGN.md`.

## 2026-07-08 — AST-004.2 Responsive Frame Fit

- Décision : rendre le Frame Core pleinement responsive avec un cadre décoratif superposé qui ne réduit pas la largeur utile de l'application, en affinant les montants latéraux sur téléphone et en conservant une présence renforcée sur tablette et desktop.
- Portée : `css/frame-core.css`, clé de cache Service Worker `budde-3-6-5` et paramètre de cache `frame-core.css?v=ast0042`.
- Raison : préserver les assets PNG de production validés tout en améliorant l'ajustement mobile-first, notamment en portrait iPhone, sans étirement vertical des côtés ni déformation proportionnelle des bandes hautes et basses.
- Documents mis à jour : `CHANGELOG_DESIGN.md`.

## 2026-07-08 — AST-004.1 Correction d'affichage Frame Core

- Décision : ajustement de la couche `frame-core.css` pour afficher les assets Frame Core comme des éléments visuels complets plutôt que comme de simples textures répétées.
- Portée : `css/frame-core.css`, clé de cache Service Worker `budde-3-6-4` et paramètre de cache `frame-core.css?v=ast0041`.
- Raison : rendre visibles les nouveaux assets de production `FRM-001` à `FRM-004` dans la PWA et forcer le rafraîchissement du cache.
- Documents mis à jour : `CHANGELOG_DESIGN.md`.

## 2026-07-08 — AST-004 Frame Core Production Assets

- Décision : validation et dépôt direct des quatre assets de production du Frame Core dans `assets/frame/`.
- Portée : `FRM-001_frame-top.png`, `FRM-002_frame-bottom.png`, `FRM-003_frame-left.png` et `FRM-004_frame-right.png`.
- Raison : remplacer les assets techniques/provisoires par les visuels de production validés au fil de l'eau, sans repasser par `assets/_incoming/`.
- Documents mis à jour : `CHANGELOG_DESIGN.md`.

## 2026-07-07 — Branchement visuel AST-002 Frame Core

- Décision : activation visuelle progressive des assets AST-001.1 Frame Core comme cadre périphérique du terminal.
- Portée : couche CSS `css/frame-core.css`, Service Worker et assets `FRM-001` à `FRM-004`.
- Raison : rendre le Frame System visible dans la PWA mobile-first sans modifier la structure HTML ni les données applicatives.
- Documents mis à jour : `CHANGELOG_DESIGN.md`.

## 2026-07-07 — Intégration AST-001.1 Frame Core

- Décision : intégration du pack validé AST-001.1 Frame Core dans la destination officielle du Frame System.
- Portée : assets structurels `FRM-001_frame-top.png`, `FRM-002_frame-bottom.png`, `FRM-003_frame-left.png` et `FRM-004_frame-right.png` rangés dans `assets/frame/`.
- Raison : transférer les éléments de cadre validés depuis la zone temporaire `assets/_incoming/` vers leur emplacement durable, sans impact UI ni branchement fonctionnel.
- Documents mis à jour : `ASSET_LIBRARY.md`, `CHANGELOG_DESIGN.md`.

## 2026-07-06 — Création de la Constitution du projet

- Décision : création du dossier `docs/` comme référentiel officiel de Budd€.
- Portée : design, terminologie, composants, animations, personnage Budd€, conventions techniques et historique des validations.
- Raison : permettre à toute IA ou tout développeur d'intervenir sans diluer l'identité graphique, ergonomique et technique du terminal.
- Documents mis à jour : `START_HERE.md`, `DESIGN_BIBLE.md`, `TERMINOLOGY.md`, `COMPONENT_LIBRARY.md`, `ANIMATION_GUIDE.md`, `BUDDE_CHARACTER_BIBLE.md`, `CODING_GUIDELINES.md`, `CHANGELOG_DESIGN.md`.
