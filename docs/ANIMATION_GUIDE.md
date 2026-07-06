# Animation Guide — Mouvements officiels Budd€

## Philosophie

Les animations simulent un terminal matériel : réveil, balayage, voyant, rotation, scanner. Elles doivent clarifier l'état et jamais ralentir la saisie.

## Durées de référence

- Micro-interaction bouton : 90–140 ms.
- Transition de panneau : 160–240 ms.
- Ouverture sheet/modale : 180–260 ms.
- Scanner/OCR : boucle 900–1600 ms.
- Réactivation terminal : 1200–2400 ms.
- Module pivotant : 450–750 ms.
- Expression Budd€ : 180–400 ms.

## Easing

- Entrée technique : `cubic-bezier(.2,.8,.2,1)`.
- Sortie rapide : `cubic-bezier(.4,0,1,1)`.
- Rotation mécanique : easing légèrement décéléré, sans rebond cartoon.

## Halos

Les halos pulsent lentement. Ne pas animer plusieurs halos forts simultanément. Le halo indique un état : actif, focus, succès, avertissement.

## OCR et scanner

Le scanner peut utiliser :

- ligne de balayage verticale ou horizontale ;
- clignotement de voyant ;
- grille CRT ;
- texte d'état court.

Interdiction : faire croire qu'une analyse serveur est en cours si le traitement reste local.

## Réactivation

Séquence recommandée : écran noir, faible phosphore, scanlines, apparition du cadre, activation des modules, état opérationnel. Budd€ peut apparaître après stabilisation.

## Module pivotant

- Rotation courte et lisible.
- L'état final doit être stable.
- Ne pas combiner rotation, zoom, flou et clignotement intense.

## Budd€

Budd€ peut cligner, incliner légèrement la tête, réagir à un succès ou signaler une anomalie. Les mouvements doivent rester mécaniques/doux, jamais agités.

## Accessibilité

Respecter `prefers-reduced-motion`. En mode mouvement réduit, remplacer les rotations longues et boucles par des fondus courts ou changements d'état statiques.
