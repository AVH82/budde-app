# Component Library — Composants officiels Budd€

## Principes

Chaque composant doit ressembler à une pièce du terminal : plaque, bouton, écran, voyant, compartiment ou instrument. Réutiliser avant de créer.

## Frame System

Le Frame System définit l'enveloppe : largeur compacte, fond terminal, bords latéraux, scanlines, halo CRT et navigation basse. Toute vue doit s'inscrire dans ce cadre.

## Panneaux et cartes

Usage : regrouper les informations liées.

Caractéristiques :

- fond sombre `#050b05` ou `#071008` ;
- bord olive/laiton ;
- rayon modéré ;
- ombre interne ;
- texture légère type grille/CRT.

Interdiction : panneaux blancs, cartes flottantes SaaS, ombres douces non terminal.

## Boutons

Types officiels :

- bouton de module : navigation principale ;
- bouton d'action : ajouter, exporter, importer, sauvegarder ;
- bouton iconique : modifier, supprimer, fermer ;
- hotspot discret : zone technique invisible mais focus accessible.

Règles :

- texte en uppercase pour les actions majeures ;
- focus visible vert ;
- zone tactile suffisante ;
- état actif par halo et bord renforcé.

## Navigation

Bandeau fixe en bas, cinq modules principaux : accueil, dépenses, budget, statistiques, commerçants. Les icônes doivent conserver leur ratio et leur texture.

## Module pivotant

Composant mécanique de changement d'instrument. À utiliser pour les jauges, configurations ou états alternatifs qui justifient une rotation.

## Trustomètre

Instrument de confiance. Il doit être traité comme une jauge technique : graduations, état lisible, halo discret, libellé explicite.

## Budd€

Budd€ est un composant narratif et fonctionnel. Il peut apparaître comme assistant, indicateur d'état, confirmation ou avertissement. Son rendu est encadré par `BUDDE_CHARACTER_BIBLE.md`.

## Formulaires

- Champs sombres avec bord vert atténué.
- Labels courts, uppercase si cohérent avec le panneau.
- Messages d'erreur explicites.
- Validation avant création de dépense ou import.

## Listes de dépenses

Chaque ligne doit présenter : commerçant, métadonnées, montant et actions. Les montants doivent rester alignés et lisibles.

## Modales et sheets

Les modales sont des panneaux de maintenance ouverts au-dessus du terminal. Sur mobile, privilégier les sheets depuis le bas avec hauteur maximale contrôlée.

## États vides

Un état vide doit expliquer quoi faire ensuite. Budd€ peut l'accompagner, sans culpabiliser l'opérateur.

## États de chargement

Employer scanner, OCR, veille/réactivation ou voyant. Toujours afficher un libellé clair si l'attente dépasse une seconde.
