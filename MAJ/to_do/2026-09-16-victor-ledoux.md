# À faire — retour de test de Victor Ledoux (2026-09)

Retour brut : [retours/2026-09-16-victor-ledoux-test-html.txt](../retours/2026-09-16-victor-ledoux-test-html.txt)
Vérification remarque par remarque : [realisations/2026-09-29-verification-retours-victor.md](../realisations/2026-09-29-verification-retours-victor.md)

Chaque correction est **sourcée dans le code**, et le générateur s'arrête si
l'une ne retrouve plus sa cellule du classeur : une demande satisfaite ne peut
pas se défaire en silence.

| # | Demande | État | Où |
|---|---|---|---|
| 1 | Indications entre parenthèses perdues | fait | `decouperLibelle()` → `FieldDef.help` |
| 2 | Légendes « Bon / Moyen / Mauvais état », « fort / moyen / faible » | fait | `lireFiche().legendes` → `FieldDef.legend` |
| 3 | Choix multiples (« à cocher ») | fait | `MULTI_RE`, `MULTIPLES_IMPOSES` → `FieldDef.multiple` |
| 4 | Exigences corrigées (réseau ECS, limiteur, combustible, DN) | fait | `REQUIREMENT_OVERRIDES` |
| 5 | Unités (%, minutes) et listes (matériaux du bassin, période d'arrosage) | fait | `UNIT_OVERRIDES`, `OPTION_OVERRIDES` |
| 6 | Trois mesures de débit calculées | fait | `MESURES_DEBIT`, `debitCalcule()` |
| 7 | Photos des types (jets, émetteurs, WC, gouttières, chéneaux) | fait | `ILLUSTRATIONS` → `illustrations.ts` |
| 8 | Champ libre sur « Autre » | fait | `audit-field`, clé `<clé>Autre` |
| 9 | Rubriques masquées selon le type, le bouclage, les usages | fait | blocs de `ENTITIES`, `blocActif()` |
| 10 | Totaux en tête des listes | fait | `src/app/qte/totaux.ts` |
| 11 | Compteur général répétable | fait | `ENTITIES` sans `single`, conversion dans `DataService` |
| 12 | Traçage (réseau ECS) et blocs « Autre » | fait | `CHAMPS_AJOUTES` |
| 13 | « Emplacement » en double (structure) | fait | `CHAMPS_RETIRES` |
| 14 | Localiser sur plan à côté de l'emplacement | fait | `entity-form` (`locatorApres`) |
| 15 | Arriver en haut de page | fait | `withInMemoryScrolling` (`main.ts`) |
| 16 | Bouton de téléchargement absent sur Chrome de bureau | fait | `self-extract.ts` ignore les ressources d'extensions |

## Resté ouvert

- **Les trois renvois multiples** — « Numéros des robinets correspondants », au
  pluriel, à cocher — restent en **texte libre avec un avertissement à
  l'écran** : `entity-ref` ne stocke qu'un seul identifiant. C'est la première
  chose à reprendre si un type `entity-ref-multi` est ajouté (CLAUDE.md §3).
- **Ajout de photos depuis Firefox sur ordinateur** : signalé par Victor comme
  ne fonctionnant pas, fonctionnel sous Chrome. Non repris — la dictée vocale
  impose déjà Chrome ou Edge (CLAUDE.md §7).
