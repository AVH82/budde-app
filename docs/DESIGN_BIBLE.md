# Design Bible — Budd€

## Philosophie générale

Budd€ est un terminal personnel de budget : intime, robuste, tactile et légèrement mystérieux. L'application doit donner l'impression d'un appareil spécialisé, hérité d'un univers rétro-futuriste, mais suffisamment clair pour gérer des finances quotidiennes sans friction.

La priorité est la confiance : l'opérateur doit comprendre rapidement l'état de son budget, les dépenses, les alertes et les actions disponibles. L'esthétique ne doit jamais masquer une information critique.

## Identité visuelle

- Univers : terminal opérationnel, CRT, métal usé, bakélite noire, caoutchouc texturé, visserie apparente.
- Ambiance : atelier technique, équipement de terrain, cockpit financier personnel.
- Ton : sérieux, protecteur, un peu ludique grâce à Budd€.
- Format principal : mobile/PWA, largeur compacte proche d'un appareil dédié.

## Direction artistique

Budd€ ne doit pas ressembler à une application bancaire générique. Chaque écran doit évoquer un module matériel : cadre, panneau, écran, bouton, voyant, scanner ou compartiment.

À privilégier :

- cadres mécaniques ;
- surfaces sombres ;
- lueurs vertes contrôlées ;
- typographie monospace ;
- micro-usure et imperfections ;
- hiérarchie très lisible.

À éviter :

- aplats blancs ou interfaces SaaS classiques ;
- gradients pastel ;
- icônes trop plates sans intégration terminal ;
- animations rebondissantes ou cartoon non justifiées ;
- surcharge décorative qui réduit la lisibilité.

## Couleurs officielles

Palette de référence :

- Noir système : `#010201`, `#020402`.
- Vert terminal : `#9dff45`.
- Vert atténué : `#79a929`, `#88bd42`, `#9ddc4a`.
- Fond panneau : `#050b05`, `#071008`, `#071107`.
- Ligne/olive métallique : `#475313`, `#6b801e`.
- Alerte chaude : `#ff7b3d`.
- Or/laiton vieilli : `#c7a044`.

Règle : le vert terminal est réservé aux informations actives, états lisibles, focus et halos fonctionnels. L'orange/rouge signale une tension budgétaire ou une anomalie.

## Lumière

La lumière doit sembler provenir du terminal : phosphore CRT, voyants, reflets sur verre. Les halos sont fonctionnels et modérés.

- Halo vert : état actif, sélection, focus, confirmation.
- Halo orange : avertissement ou reste critique.
- Lumière diffuse : ambiance de fond uniquement.

## Matériaux

Matériaux validés :

- bakélite noire ;
- métal brut brossé ;
- métal peint usé ;
- caoutchouc texturé ;
- verre CRT ;
- vis, rivets, plaques et contours laiton/olive.

Les matériaux doivent renforcer l'idée d'objet physique. Les textures ne doivent pas gêner la lecture des montants.

## Métal et usure

Le métal est sombre, lourd, légèrement oxydé. L'usure doit être périphérique : bords, coins, cadres, boutons. Aucun effet de saleté ne doit recouvrir les chiffres ou formulaires.

## Cadre du terminal

Le cadre du terminal est l'enveloppe visuelle de Budd€. Il doit :

- contenir l'expérience ;
- donner une impression d'appareil dédié ;
- protéger les informations ;
- rester stable entre les vues.

La largeur maximale mobile doit rester compacte. Les bords latéraux, le bas de navigation et les panneaux doivent conserver une continuité visuelle.

## Navigation

La navigation est un bandeau matériel fixe, composé de boutons/icônes de module. Elle doit :

- rester accessible au pouce ;
- conserver les ratios des icônes ;
- indiquer clairement l'état actif ;
- ne jamais masquer un formulaire critique ;
- respecter les zones sûres iOS/PWA.

## Module pivotant

Le module pivotant est un élément de changement d'état ou de fonction. Il évoque une pièce mécanique qui tourne pour révéler un instrument, une jauge ou une configuration.

Règles :

- rotation courte et lisible ;
- pas d'effet spectaculaire gratuit ;
- état initial et final clairement identifiables ;
- chaque face du module doit avoir une fonction.

## Responsive

Budd€ est d'abord mobile. Les interfaces doivent être testées sur petites largeurs.

- Les montants ne doivent pas déborder.
- Les libellés peuvent être abrégés seulement si le sens reste clair.
- Les boutons principaux doivent rester manipulables au doigt.
- Les modales doivent rester accessibles avec le clavier mobile.

## Ergonomie

- Montrer d'abord l'état budgétaire, puis les actions.
- Limiter les choix simultanés.
- Confirmer les actions destructrices.
- Préserver la possibilité d'annuler ou de corriger une saisie.
- Rendre les erreurs explicites, non accusatrices.

## Principes UX

1. Lecture immédiate : le budget disponible et le reste doivent être visibles sans effort.
2. Action rapide : ajouter une dépense doit rester court.
3. Contrôle : l'opérateur valide ce qui touche aux données.
4. Confidentialité : aucune donnée personnelle ne quitte le navigateur sans action explicite.
5. Continuité : chaque écran appartient au même terminal.

## Règles de cohérence

- Toute nouvelle vue doit être décrite comme un module du terminal.
- Toute nouvelle couleur doit être justifiée et documentée.
- Toute nouvelle animation doit apparaître dans `ANIMATION_GUIDE.md`.
- Toute nouvelle icône doit respecter le style terminal/objet.
- Toute rupture graphique doit être validée dans `CHANGELOG_DESIGN.md`.
