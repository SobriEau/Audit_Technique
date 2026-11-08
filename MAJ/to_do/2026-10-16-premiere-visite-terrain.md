# À faire — première visite terrain (2026-10-16)

Retour brut : [retours/2026-10-16-premiere-visite-terrain.md](../retours/2026-10-16-premiere-visite-terrain.md)
Réalisation : [realisations/2026-11-08-pieces-archive-images.md](../realisations/2026-11-08-pieces-archive-images.md)

| # | Demande | État | Où |
|---|---|---|---|
| 1 | Intégrer un JSON dans un audit en cours, pour que deux auditeurs se répartissent un grand bâtiment | fait | [fusion.ts](../../src/app/core/utils/fusion.ts), `prepareMerge` / `applyMerge`, `fusion-audit` |
| 2 | Travailler par pièce : définir les pièces sur les plans, y déclarer les points d'eau, puis relever pièce par pièce | fait, **deux lectures tranchées** | `AppData.Pieces`, clé `Piece`, `piece-manager`, `#/pieces` |
| 3 | Photos mal affichées jusqu'au rechargement de la page | fait | `PhotoEditorComponent.source` |

## Les deux lectures tranchées sur la demande 2

- **« au lieu de rentrer élément par élément »** se lisait comme un
  remplacement. Les listes par type sont **conservées** : sept entités ne sont
  dans aucune pièce, un audit commencé avant n'en a pas, et la colonne
  « Pièce » d'une liste est le seul endroit où l'on voit qu'un point d'eau n'en
  a pas.
- **« définir les pièces sur les plans »** pouvait vouloir dire tracer leur
  contour. Une pièce porte une **punaise**, comme un élément : même dialogue,
  déjà éprouvé sur téléphone. Si le contour est attendu, c'est
  `Piece.Localisation` qu'il faut étendre — les écrans ne changent pas.
