# AI Collaboration Guide — Budd€

Ce guide décrit la méthode attendue pour toute IA intervenant sur Budd€. Il est volontairement générique afin de pouvoir être réutilisé dans de futurs projets documentés de manière similaire.

## Commencer une tâche

Avant toute modification :

1. Lire le point d'entrée documentaire du projet.
2. Vérifier que le dépôt ouvert correspond bien au projet demandé.
3. Identifier le périmètre exact de la demande.
4. Vérifier les contraintes explicites : fichiers autorisés, fichiers interdits, impact fonctionnel, impact graphique, tests attendus.
5. Inspecter l'état Git afin de distinguer les changements existants des changements à produire.
6. Ne jamais écraser une modification existante sans raison claire et sans validation si elle ne vient pas de la tâche en cours.

## Documents à consulter

Pour Budd€, l'ordre de lecture de référence est maintenu dans `docs/START_HERE.md`.

De manière générale, une IA doit consulter :

- le document d'entrée du projet ;
- l'identité du projet ;
- la vision produit ;
- les règles de design, de terminologie et de composants ;
- les conventions techniques ;
- l'historique des décisions ;
- tout document spécialisé lié à la tâche.

Une IA ne doit pas supposer qu'un document ancien est obsolète. Si un document semble contradictoire, elle doit appliquer la règle la plus spécifique ou demander validation humaine.

## Réaliser un audit

Un audit doit être proportionné à la tâche. Il peut inclure :

- lecture des documents applicables ;
- vérification de la structure du dépôt ;
- recherche des fichiers concernés ;
- comparaison avec les conventions existantes ;
- contrôle des données sensibles ;
- identification des risques fonctionnels, visuels ou documentaires ;
- vérification des tests disponibles.

Un audit doit produire une conclusion claire : conforme, non conforme, incomplet ou bloqué par une information indisponible.

## Quand demander une validation humaine

Demander une validation humaine lorsque :

- la demande contredit un document de référence ;
- deux règles applicables sont incompatibles ;
- une décision produit, graphique, légale, financière ou de confidentialité dépasse la tâche ;
- une information essentielle est indisponible et ne peut pas être laissée `À compléter` ;
- une modification risquerait de supprimer ou remplacer un choix validé ;
- l'impact utilisateur est incertain ou irréversible.

L'absence de remote Git, de branche principale connue ou d'information administrative n'est pas un motif d'arrêt si la tâche peut avancer en documentant explicitement l'information comme `À compléter`.

## Quand créer une PR

Créer une PR lorsque la tâche produit un changement cohérent, vérifiable et terminé dans le périmètre demandé.

Une PR doit idéalement :

- avoir un objectif unique ;
- éviter de mélanger documentation, code, assets et refactorings sans nécessité ;
- inclure seulement les fichiers nécessaires ;
- documenter les tests ou vérifications réalisés ;
- mentionner les informations laissées volontairement incomplètes.

Ne pas créer une PR pour un travail abandonné, non vérifié ou explicitement bloqué, sauf si le processus du projet demande une PR de diagnostic.

## Quand enrichir un document existant

Enrichir un document existant lorsque la tâche :

- ajoute une règle durable ;
- valide un nouveau terme, composant, comportement ou principe ;
- clarifie une ambiguïté rencontrée pendant l'implémentation ;
- ajoute une contrainte nécessaire aux futures contributions ;
- documente une décision qui doit rester traçable.

Ne jamais remplacer un document existant sans justification. Préférer une modification ciblée, datée si nécessaire, et cohérente avec la structure déjà présente.

## Informations indisponibles

Une IA ne doit jamais inventer une information indisponible. Si une information ne peut pas être vérifiée, utiliser une mention explicite comme :

```text
À compléter
```

Exemples :

- repository Git inconnu ;
- remote Git absent ;
- branche principale non identifiable ;
- propriétaire produit non renseigné ;
- plateforme cible non confirmée.

Lorsque l'information indisponible n'empêche pas la tâche, continuer en signalant l'hypothèse ou le champ incomplet dans le résumé final.

## Résumé attendu d'une PR

Le résumé de PR doit être clair et auditable. Format recommandé :

```md
## Résumé

- Changement principal 1.
- Changement principal 2.

## Vérifications

- Commande ou contrôle réalisé.
- Résultat notable.

## Notes

- Hypothèses.
- Informations laissées `À compléter`.
- Limites connues.
```

Pour une PR documentaire, préciser les documents créés ou modifiés et confirmer l'absence d'impact fonctionnel ou graphique.

## Règles de collaboration

- Privilégier les PR à objectif unique.
- Réutiliser les documents, composants et conventions existants avant d'en créer de nouveaux.
- Garder les modifications minimales par rapport au besoin.
- Ne pas modifier des fichiers hors périmètre.
- Ne pas remplacer un document existant sans justification.
- Préserver les données personnelles et secrets.
- Signaler explicitement toute hypothèse.
- Laisser les informations non vérifiables `À compléter`.
