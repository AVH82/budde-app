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

## 2026-07-06 — Création de la Constitution du projet

- Décision : création du dossier `docs/` comme référentiel officiel de Budd€.
- Portée : design, terminologie, composants, animations, personnage Budd€, conventions techniques et historique des validations.
- Raison : permettre à toute IA ou tout développeur d'intervenir sans diluer l'identité graphique, ergonomique et technique du terminal.
- Documents mis à jour : `START_HERE.md`, `DESIGN_BIBLE.md`, `TERMINOLOGY.md`, `COMPONENT_LIBRARY.md`, `ANIMATION_GUIDE.md`, `BUDDE_CHARACTER_BIBLE.md`, `CODING_GUIDELINES.md`, `CHANGELOG_DESIGN.md`.

## 2026-07-06 — Préparation architecturale Frame System et module pivotant

- Décision : création de points d’ancrage techniques inertes pour le futur Frame System et le futur module pivotant, sans branchement dans l’interface actuelle.
- Portée : architecture JavaScript préparatoire et dossiers d’assets `assets/budde/`, `assets/frame/`, `assets/pivot/`, `assets/nav-new/`.
- Raison : permettre une migration progressive vers la nouvelle identité Budd€ en gardant le rendu actuel strictement inchangé.
- Documents mis à jour : `CHANGELOG_DESIGN.md`.

## 2026-07-06 — Création de la zone d'entrée des assets validés

- Décision : création de `assets/_incoming/` comme espace tampon officiel pour les assets graphiques déjà validés visuellement avant leur rangement définitif.
- Portée : flux d'intégration des assets graphiques, documentation d'assets et règles de contribution IA.
- Raison : éviter la création directe d'assets finaux par une IA de développement et garantir que la zone d'entrée reste temporaire, vide après traitement sauf `.keep`.
- Documents mis à jour : `ASSET_LIBRARY.md`, `CODING_GUIDELINES.md`, `CHANGELOG_DESIGN.md`.
