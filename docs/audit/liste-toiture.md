# Liste Toiture

> Spécification extraite de `audit_technique.xlsx`, onglet « Liste Toiture ».
> 11 cellules, 8 notes.

## Rôle de la page

Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B28` | Remarques | Texte libre | — |

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `H5` **Toiture** — Retour à la page Partie technique / - Message avertissement enregistrement
- `D8` **Surface totale de toiture (m²)** — somme automatique de la colonne "surface raccordable"
- `F8` **Nombre de toiture** — somme automatique de la colonne "nombre de pans".
- `B13` **Numéro** — Données reprises sur la page "toiture"  / - nombre de ligne à incrémenter au fur et à mesure  / - si on clique sur la ligne on revient à la page de la toiture en question
- `C31` **Enregistrer** — Enregistrement des données
- `G32` **Enregistrer** — Ajout d'un page pour  toiture / - Ajouter  un message de confirmation / - Message avertissement enregistrement

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Toiture |
| `B7` | Surface totale de toiture (m²) |
| `F7` | Nombre de toiture |
| `B11` | Numéro |
| `C11` | Emplacement (bâtiment concerné) |
| `F11` | Surface (m2) |
| `G11` | Accessibilité |
| `H11` | Nombre de pans |
| `B27` | Remarques |
| `C31` | Enregistrer |

</details>
