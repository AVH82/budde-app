# Changelog Budd€

## 1.0.1 — Séparation des données personnelles

### Modifié
- Suppression de la dépendance à `data/seed.js` dans `index.html`.
- Ajout d'un modèle public `data/Budde.data.template.json`.
- Ajout de `.gitignore` pour exclure le futur fichier privé `data/Budde.data.json`.
- Neutralisation de `data/budget.json` et `data/seed.js` pour éviter toute donnée personnelle dans GitHub.
- Export renommé en `Budde.data.json`.

### Important
- Les dépenses, budgets, commerçants et paramètres réels ne doivent pas être publiés dans GitHub.
- Le vrai fichier de données devra s'appeler `Budde.data.json` et rester sur Google Drive ou localement.


## 1.1.0 — Ergonomie du budget

### Ajouté
- Popup de modification du budget depuis la carte Budget mensuel.
- Affichage du mois et du budget actuel dans le popup.
- Champ de saisie du nouveau montant.
- Choix entre modification du mois uniquement ou du mois affiché et de tous les mois suivants.
- Message de confirmation après validation.

### Règle métier
- Les mois précédents ne sont jamais modifiés lors d'une application aux mois suivants.
