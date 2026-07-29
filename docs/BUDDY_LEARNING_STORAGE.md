# Stockage du corpus Buddy

## Objectif

Le corpus Buddy regroupe les éléments nécessaires à l’analyse et à l’amélioration future de la reconnaissance des justificatifs, sans alourdir ni fragiliser la sauvegarde budgétaire principale.

## Séparation des responsabilités

- `budde-data.json` reste la sauvegarde fonctionnelle principale : budgets, dépenses, réglages, commerçants et apprentissages opérationnels.
- `budde-buddy-learning.json` contient l’index structuré des diagnostics OCR et les métadonnées des justificatifs.
- Chaque image de justificatif est stockée dans un fichier Drive distinct nommé `budde-receipt-<ticketId>.<extension>`.

Les images ne sont jamais regroupées en base64 dans le fichier budgétaire principal.

## Fonctionnement local-first

Safari et la WebApp installée conservent chacun leur stockage local. Ils peuvent donc posséder des archives différentes avant synchronisation.

Lorsqu’un compte Google est connecté :

1. la sauvegarde Budd€ principale est enregistrée ;
2. les diagnostics et justificatifs locaux sont fusionnés avec le corpus Drive par identifiant ;
3. seules les images absentes du corpus distant sont créées ;
4. l’index commun est mis à jour après les images ;
5. lors d’un chargement Drive, les diagnostics et justificatifs absents localement sont rapatriés puis fusionnés sans effacer les archives locales.

## Règles de fusion

- L’identifiant `id` est la clé d’unicité.
- Un élément présent uniquement localement est ajouté au corpus distant.
- Un élément présent uniquement sur Drive est ajouté localement.
- En cas de doublon, l’enregistrement portant la date `updatedAt` ou `createdAt` la plus récente est conservé.
- Une absence sur un appareil ne constitue jamais une demande de suppression sur les autres appareils.
- Les suppressions globales restent des actions explicites de l’opérateur ; elles ne sont pas propagées implicitement par une fusion.

## Confidentialité et consentement

Le corpus n’est envoyé que lorsque l’opérateur utilise la connexion et la synchronisation Google. Le mode hors ligne continue de fonctionner sans Drive.

Les données restent dans le dossier applicatif privé `appDataFolder` du compte Google de l’opérateur. Elles ne sont pas publiées dans le dépôt et ne sont pas transmises à un service d’analyse tiers.

## Évolution future

Le corpus structuré pourra servir à analyser :

- les champs fréquemment corrigés ;
- les écarts entre OCR brut, proposition Buddy et validation finale ;
- la calibration du score de confiance ;
- les commerçants, formats et montants difficiles à reconnaître.

Toute automatisation d’analyse future devra rester explicable, contrôlable et soumise à une action ou un consentement explicite de l’opérateur.
