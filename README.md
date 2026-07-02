# Budd€

Application personnelle de gestion de budget.

## Architecture

Le dépôt GitHub contient uniquement le code de l'application :

- `index.html`
- `css/`
- `js/`
- `assets/`
- `manifest.webmanifest`
- `service-worker.js`
- `data/Budde.data.template.json`

Les données personnelles ne doivent pas être publiées dans GitHub.

## Données privées

Le fichier réel de données doit s'appeler :

```text
Budde.data.json
```

Il contient notamment :

- dépenses ;
- budgets ;
- reports ;
- commerçants ;
- catégories ;
- paramètres ;
- apprentissage OCR.

Ce fichier devra être stocké hors GitHub, par exemple dans Google Drive.

## Note technique

La persistance locale de la PWA est isolée dans `js/storage.local.js` via `LocalStorageAdapter`.
L'application accède désormais au stockage via `js/storage.service.js`, une couche `StorageService` indépendante du backend qui délègue par défaut à `LocalStorageAdapter`.
L'application continue d'utiliser le même format `Budde.data.json` et les mêmes clés `localStorage` (`budde-data-v1` et migration legacy `budde-v7`).
Cette séparation prépare l'ajout futur d'un adaptateur Google Drive sans modifier l'interface utilisateur ni le comportement hors ligne.

`GoogleDriveAdapter` est préparé dans `js/storage.google-drive.js` pour la sauvegarde manuelle Google Drive. Le stockage réel reste local via `localStorage`, orchestré par `StorageService` avec `LocalStorageAdapter` comme backend par défaut.


## Sauvegarde locale JSON

L'écran **Paramètres** contient une section **Sauvegarde locale** avec les actions **Exporter Budde.data.json** et **Importer Budde.data.json**. Ces contrôles utilisent le même format JSON `Budde.data.json` que précédemment : l'export télécharge l'état courant de l'application, et l'import remplace le stockage local après normalisation des données.

## Sauvegarde manuelle Google Drive appDataFolder

L'écran **Paramètres**, accessible depuis la roue dentée en haut à droite de la bannière, propose désormais le bouton **Sauvegarder sur Google Drive** lorsque l'utilisateur est connecté avec Google. Cette action conserve `LocalStorageAdapter` comme source principale : elle copie seulement l'état JSON courant de Budd€ vers Google Drive en sauvegarde supplémentaire.

La sauvegarde utilise l'API Google Drive v3 avec le scope OAuth suivant :

```text
https://www.googleapis.com/auth/drive.appdata
```

Le fichier est stocké uniquement dans l'espace applicatif masqué Google Drive `appDataFolder`, et jamais dans le Drive visible de l'utilisateur. Le nom du fichier est :

```text
budde-data.json
```

À chaque sauvegarde manuelle, `GoogleDriveAdapter` recherche ce fichier dans `appDataFolder` :

- si `budde-data.json` existe déjà, il est mis à jour avec une requête `PATCH` ;
- s'il n'existe pas, il est créé dans `appDataFolder` ;
- aucun doublon n'est volontairement créé, car la recherche précède toujours la création.

Après succès, l'interface affiche la date et l'heure de la dernière sauvegarde. En cas d'erreur Google Auth ou Drive, un message clair est affiché dans l'écran **Paramètres**.

La restauration depuis Google Drive n'est pas encore implémentée. Le démarrage de l'application continue de charger uniquement le stockage local via `StorageService` et `LocalStorageAdapter`. La synchronisation automatique n'est pas encore implémentée non plus.


Les fichiers applicatifs critiques sont chargés en network-first pour éviter les anciennes versions PWA en cache.

## Installation PWA

Une fois le dépôt publié via GitHub Pages :

1. Ouvrir l'URL dans Safari sur iPhone.
2. Appuyer sur Partager.
3. Choisir Ajouter à l'écran d'accueil.

## Authentification Google active

La connexion Google est active dans l'écran **Paramètres** via `js/google-auth.service.js` et Google Identity Services pour navigateur/PWA. Le bouton **Connexion Google** lance le consentement OAuth, puis affiche l'état connecté ainsi que l'e-mail et le nom du compte lorsque Google les fournit. Une action **Déconnexion Google** révoque le jeton en mémoire.

L'identifiant client OAuth Web public est renseigné dans `js/google-auth.service.js`. Aucun secret client et aucune clé API ne sont nécessaires ni stockés dans le dépôt.

Le scope OAuth prévu est :

```text
https://www.googleapis.com/auth/drive.appdata
```

Ce scope donne accès au dossier applicatif Google Drive (`appDataFolder`) utilisé par la sauvegarde manuelle `budde-data.json`. À ce stade, l'application ne restaure pas les données depuis Drive et ne synchronise pas automatiquement : le stockage réel reste local via `StorageService` et `LocalStorageAdapter`, afin de conserver le fonctionnement hors ligne.

## Socle OCR de reçus

Le module `js/receipt-ocr.service.js` prépare l'analyse locale de reçus dans le navigateur. Il expose un `ReceiptOcrService` isolé avec initialisation, reconnaissance d'image, extraction de champs simples et état de disponibilité.

L'OCR s'appuie sur Tesseract.js chargé depuis un CDN navigateur lorsque la bibliothèque est disponible. Aucun moteur OCR lourd n'est ajouté au dépôt. Si Tesseract.js ne peut pas être chargé, le service retourne un statut d'indisponibilité propre au lieu de bloquer l'application.

L'analyse est prévue pour rester locale : les images de reçus sont traitées côté navigateur et aucune donnée de reçu n'est envoyée à un serveur par ce socle. Cette première PR n'ajoute pas encore d'interface Scanner complète et ne crée aucune dépense automatiquement ; l'intégration UI et la validation d'une dépense préremplie sont prévues dans la PR suivante.
