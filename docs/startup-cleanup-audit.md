# Audit de nettoyage du démarrage

## Constat

Deux moteurs d’animation contrôlaient simultanément l’ouverture du terminal :

- `js/startup-gate.js` construisait la scène et déclenchait encore l’ancienne séquence via `markOpening()` ;
- `js/startup-sequence-layering-fix.js` interceptait les mêmes actions et déclenchait la séquence actuelle.

Le second script était par ailleurs injecté par deux mécanismes distincts :

- le workflow GitHub Pages ;
- une réécriture HTML effectuée par le Service Worker.

Cette architecture permettait un premier état ou une ancienne animation avant la prise de contrôle par la couche corrective.

## Décision

- `startup-gate.js` devient uniquement le bootstrap de la scène : construction, affichage et remise à zéro ;
- `startup-sequence-layering-fix.js` devient l’unique propriétaire de la transition d’ouverture ;
- le Service Worker ne modifie plus le HTML ;
- le workflow GitHub Pages reste l’unique mécanisme temporaire d’injection du script de séquence dans l’artifact déployé ;
- aucune géométrie du dock, des volets ou de la safe area n’est modifiée dans cette PR.

## Code supprimé

- ancienne fonction `markOpening()` ;
- ancienne rotation `startupAccessRotor.is-open` déclenchée par JavaScript ;
- anciens temporisateurs de transition du bootstrap ;
- anciens écouteurs locaux et Google concurrents ;
- mutation HTML du Service Worker ;
- duplication de la responsabilité de finalisation et d’activation du dock.

## Validation attendue

Le lancement ne doit plus montrer une ancienne animation avant la séquence actuelle. Le comportement fonctionnel des modes Network et Local reste inchangé.
