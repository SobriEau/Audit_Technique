# À faire — second retour de test (2026-10)

**Support brut non conservé** : ce retour est arrivé hors fichier. Les demandes
ci-dessous sont celles que le code et `CLAUDE.md` attestent, pas un relevé de
l'original. À garder en tête si une demande semble manquer — c'est la raison
pour laquelle les retours suivants sont déposés dans `retours/`.

| # | Demande | État | Où |
|---|---|---|---|
| 1 | « Continuité de l'isolation » retirée (réseau ECS) | fait | `CHAMPS_RETIRES` |
| 2 | « Autre » dans les utilisateurs des WC et les matériaux du bassin | fait | `OPTION_OVERRIDES` |
| 3 | Fréquence d'utilisation par utilisateur coché (WC) | fait | `CHAMPS_PAR_OPTION` → `FieldDef.parOption` |
| 4 | Colonne « Type de gestion des eaux pluviales » retirée de la liste | fait | `cols` de `ENTITIES` |
| 5 | « Autre information » et « Autre utilisation » cochables ensemble | fait | `MULTIPLES_IMPOSES` |
| 6 | Coquilles des indications (descentes, ventilation) | fait | `LABEL_FIXES` |

## Sans objet, vérifié dans Chrome

- Arrosage et nettoyage se cochaient **déjà** ensemble.
- La seule parenthèse des « Remarques » du réseau ECS que porte le classeur
  — « (circulateur double, …) » — s'affiche bien, mais dans la sous-partie
  bouclage, donc seulement à « Oui ».
