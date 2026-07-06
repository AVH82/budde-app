# Design Tokens — Budd€

Ce document est la référence officielle des constantes graphiques de Budd€. Il consolide les choix validés par `docs/DESIGN_BIBLE.md` sans créer de nouvelle interface, de nouveau CSS, de nouvel asset ou de nouvelle animation.

## Statut et périmètre

- **Projet** : Budd€.
- **Rôle** : référentiel des tokens visuels et principes d'emploi.
- **Source principale** : `docs/DESIGN_BIBLE.md`.
- **Portée** : documentation uniquement.
- **Règle absolue** : aucun token ne doit contredire la Design Bible ; toute extension future doit être validée et documentée avant usage.

## 1. Palette officielle

La palette ci-dessous reprend uniquement les couleurs déjà validées. Elle décrit leur intention, pas une implémentation CSS obligatoire.

| Usage officiel | Couleur(s) autorisée(s) | Intention |
| --- | --- | --- |
| Vert principal Budd€ | `#9dff45` | Phosphore terminal, information active, focus, états lisibles, halos fonctionnels et confirmation. |
| Vert secondaire | `#79a929`, `#88bd42`, `#9ddc4a` | Libellés secondaires, métadonnées, états atténués, graduations et texte de moindre priorité. |
| Métal sombre | `#010201`, `#020402`, `#050b05`, `#071008`, `#071107` | Fond système, fond de panneau, profondeur du terminal, zones de repos visuel. |
| Métal clair | `#475313`, `#6b801e`, `#c7a044` | Lignes, bordures olive, détails laiton vieilli, contours mécaniques, séparateurs et repères matériels. |
| Couleur des textes | `#9dff45`, `#9ddc4a`, `#88bd42`, `#79a929` | Texte principal phosphore et texte secondaire atténué. Les montants et états critiques doivent rester prioritaires en lisibilité. |
| Couleur des alertes | `#ff7b3d` | Anomalie, tension budgétaire, action destructive ou signal nécessitant l'attention de l'opérateur. |
| Couleur des warnings | `#ff7b3d` | Avertissement calme, reste critique, incohérence ou risque à vérifier. Le warning ne doit pas devenir paniquant. |
| Couleur des succès | `#9dff45` | Validation, confirmation, état opérationnel ou action terminée. Le succès reste sobre et fonctionnel. |
| Couleur des arrière-plans | `#010201`, `#020402`, `#050b05`, `#071008`, `#071107` | Fonds de terminal, panneaux, écran CRT et enveloppe sombre du Frame System. |

### Règles d'usage de la palette

- Ne pas inventer de couleur hors palette sans validation documentaire.
- Réserver le vert principal aux informations actives ou vraiment importantes.
- Employer les verts secondaires pour réduire la hiérarchie sans perdre l'identité terminal.
- Utiliser l'alerte chaude uniquement pour une tension, une anomalie, un warning ou une action à risque.
- Éviter les aplats blancs, les gradients pastel et les couleurs vives étrangères à Budd€.

## 2. Métaux

Les matériaux décrivent l'impression physique du terminal. Ils guident le rendu futur, mais ne créent aucune texture dans ce document.

- **Métal usiné** : pièces structurelles, cadres, plaques et contours. Il doit sembler dense, précis et protecteur, avec une usure périphérique limitée aux bords, coins et zones de contact.
- **Métal brossé** : surfaces techniques et séparateurs. Le brossage doit rester subtil pour ne jamais gêner la lecture des montants, formulaires ou messages.
- **Métal peint** : panneaux sombres et pièces exposées. La peinture peut sembler légèrement usée, mais l'usure reste décorative et ne recouvre pas les informations.
- **Verre** : surface d'écran ou de voyant. Il suggère un reflet CRT, une profondeur légère et une séparation entre l'opérateur et le module affiché.
- **Écran CRT** : phosphore vert, scanlines, halo modéré et impression d'affichage terminal. L'effet CRT doit soutenir la lisibilité, pas la dégrader.
- **Joints** : caoutchouc, séparations et zones d'étanchéité visuelle. Ils renforcent l'idée d'un objet compact et robuste.
- **Vis** : fixation apparente, repère d'échelle et détail mécanique. Les vis doivent rester secondaires et ne pas attirer l'œil avant les données.

## 3. Lumière

La lumière de Budd€ provient du terminal : phosphore, voyants et reflets sur verre. Tous les halos restent discrets, fonctionnels et modérés.

| Halo | Couleur de référence | Usage |
| --- | --- | --- |
| Halo actif | `#9dff45` | Module actif, bouton engagé, focus clair ou état opérationnel. |
| Halo sélection | `#9dff45` avec intensité réduite | Choix courant, item sélectionné ou cible manipulable. |
| Halo validation | `#9dff45` | Confirmation d'une action réussie, stabilisation ou retour à l'état nominal. |
| Halo warning | `#ff7b3d` | Avertissement, reste critique, anomalie ou action destructive à confirmer. |

Règles :

- Ne pas superposer plusieurs halos forts simultanément.
- Préférer un halo lisible mais court à une lueur permanente excessive.
- Conserver une hiérarchie : le halo ne doit jamais concurrencer un montant critique.
- Les animations éventuelles de halo relèvent de `docs/ANIMATION_GUIDE.md`.

## 4. Espacements

La grille officielle suit une logique mécanique compacte. Elle doit protéger la lisibilité mobile et la sensation de terminal dédié.

### Grille de référence

- **Unité de base** : 4 px.
- **Espacement serré** : 4 px à 8 px, pour détails internes, icônes et métadonnées.
- **Espacement standard** : 8 px à 12 px, pour champs, boutons, lignes de liste et groupes simples.
- **Espacement de panneau** : 12 px à 16 px, pour padding interne et séparation entre blocs.
- **Espacement structurel** : 16 px à 24 px, pour respirations entre modules, sheets et zones majeures.

### Principes

- Les marges extérieures doivent maintenir le terminal compact dans le Frame System.
- Les paddings doivent donner une sensation de panneau matériel sans gaspiller l'espace mobile.
- Les espacements doivent regrouper les informations liées et séparer clairement les actions.
- Les montants, libellés et boutons principaux doivent rester alignés sur des axes stables.
- Les listes financières privilégient l'alignement des montants et la régularité des lignes.

## 5. Responsive

Budd€ est mobile-first. Le Frame System contient l'expérience comme un appareil dédié : largeur compacte, bords latéraux, fond terminal, scanlines, halo CRT et navigation basse.

- **iPhone prioritaire** : respecter les zones sûres iOS/PWA, garder la navigation accessible au pouce et empêcher les montants de déborder.
- **Android** : conserver des zones tactiles confortables, tenir compte des claviers mobiles et préserver la lisibilité sur petites largeurs.
- **Tablette** : maintenir un terminal compact plutôt que d'étirer tous les panneaux ; l'espace supplémentaire peut servir de marge protectrice.
- **Desktop** : centrer le terminal, conserver l'impression d'appareil autonome et éviter l'aspect dashboard bancaire générique.

Le Frame System doit rester stable entre les modules. Les vues s'adaptent à la largeur disponible, mais ne doivent pas casser l'enveloppe visuelle du terminal.

## 6. Typographie

La typographie doit évoquer un terminal technique tout en restant confortable pour des données financières.

- **Police principale** : monospace terminal, avec priorité à `Share Tech Mono` lorsqu'elle est disponible, puis fallback monospace tel que `Courier New` ou une police monospace système.
- **Hiérarchie** : titres de modules en uppercase, libellés courts et montants immédiatement visibles.
- **Tailles** : petites tailles pour métadonnées et labels ; tailles moyennes pour actions et listes ; tailles plus fortes pour montants, états budgétaires et titres critiques.
- **Graisse** : graisse renforcée pour montants, actions majeures et titres ; graisse normale ou semi-renforcée pour métadonnées.
- **Interlignage** : compact mais lisible. Les textes courts peuvent rester serrés ; les messages d'aide, erreurs et explications doivent respirer davantage.
- **Lettrage** : l'espacement des lettres peut renforcer l'effet terminal, mais ne doit pas réduire la lisibilité sur mobile.

## 7. Rayons

Les rayons doivent traduire des pièces mécaniques, pas des cartes SaaS molles.

| Rayon | Usage autorisé |
| --- | --- |
| 0 px à 4 px | Détails techniques, repères internes, séparateurs, éléments très mécaniques. |
| 6 px à 10 px | Boutons, champs, petites capsules, icônes et contrôles. |
| 12 px à 16 px | Panneaux, cartes terminal, modules et surfaces encadrées. |
| 18 px maximum | Sheets ou enveloppes larges nécessitant une transition tactile plus douce. |
| 999 px | Jauges, barres de progression ou formes volontairement cylindriques. |

Le terminal privilégie des angles mécaniques : arrondis contrôlés, coins robustes, jamais de formes excessivement molles ou décoratives.

## 8. Ombres

Les ombres donnent le relief du terminal et l'impression de pièces assemblées.

- **Ombre interne** : prioritaire pour les panneaux, boutons, champs et compartiments. Elle suggère une pièce encastrée ou un écran protégé.
- **Ombre externe** : réservée à la profondeur du cadre, aux sheets, modales et éléments qui se détachent réellement du terminal.
- **Relief métallique** : combinaison sobre de bordure olive/laiton, ombre interne sombre et léger halo fonctionnel. Le relief ne doit pas devenir brillant ou chromé.

Les ombres douces de carte flottante générique sont interdites lorsqu'elles brisent l'identité terminal.

## 9. Animations

Les règles d'animation ne sont pas dupliquées ici. Toute durée, easing, boucle, rotation, scanline, animation de Budd€ ou comportement de mouvement réduit doit se référer à `docs/ANIMATION_GUIDE.md`.

Ce document définit seulement les constantes visuelles qui peuvent être animées. L'animation elle-même doit rester fonctionnelle, courte, accessible et cohérente avec le terminal matériel.

## 10. Assets

Les futurs assets doivent respecter les dossiers de destination ci-dessous lorsqu'ils seront créés ou complétés :

- `assets/frame/` — éléments du Frame System, cadre, bords, plaques et pièces structurelles.
- `assets/nav-new/` — nouvelle génération d'icônes ou boutons de navigation terminal.
- `assets/pivot/` — éléments liés au module pivotant et aux instruments mécaniques rotatifs.
- `assets/budde/` — rendus, expressions, postures ou variantes de Budd€.

Aucun asset n'est créé par ce document. Tout asset futur doit respecter `docs/DESIGN_BIBLE.md`, `docs/COMPONENT_LIBRARY.md`, `docs/BUDDE_CHARACTER_BIBLE.md` si Budd€ est concerné, et être validé dans l'historique de design lorsque la décision devient durable.

## Informations volontairement ouvertes

Les points suivants restent à valider ultérieurement avant implémentation stricte :

- noms techniques définitifs des variables CSS ou design tokens ;
- table de tailles typographiques exacte par composant ;
- intensités numériques précises des halos et ombres ;
- éventuels exports multi-plateformes des tokens.

Ces informations ne doivent pas être inventées dans le code. Elles devront être complétées par une décision documentée lorsqu'elles deviendront nécessaires.
