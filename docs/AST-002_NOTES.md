# AST-002 — Branchement visuel Frame Core

Cette note documente la première activation visuelle des assets AST-001.1.

## Périmètre

- Ajout de `css/frame-core.css`.
- Injection de cette couche CSS via le Service Worker en complément de `css/pipboy.css`.
- Utilisation des assets `FRM-001` à `FRM-004` depuis `assets/frame/`.

## Intention

Rendre le Frame System visible sans modifier la structure HTML existante et sans brancher de logique applicative nouvelle.

## Point d'attention

Cette intégration est volontairement progressive. Elle doit être testée sur iPhone après merge pour vérifier :

- lisibilité du contenu ;
- absence de masquage du dock ;
- bonne prise en compte des safe areas ;
- épaisseur perçue du haut, du bas et des côtés.
