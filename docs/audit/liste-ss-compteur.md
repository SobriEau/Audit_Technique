# Liste SS-compteur

> Spécification extraite de `audit_technique.xlsx`, onglet « Liste SS-compteur ».
> 11 cellules, 7 notes.

## Rôle de la page

Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B29` | Remarques | Texte libre | — |

## Valeurs inscrites directement dans les cellules

Contrairement aux listes ci-dessus, ces valeurs sont écrites dans la cellule elle-même plutôt que dans une note. Le classeur ne portant aucune validation de données, elles restent indicatives : à confirmer au cas par cas.

| Cellule | Rattaché à | Valeurs |
|---|---|---|
| `F15` | Télétransmission | Oui · Non |

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `G4` **Liste des Sous-compteurs** — Retour à la page "Partie Technique"  / - Message avertissement enregistrement
- `E8` **Présence d'au moins un sous-compteur** — Présence ou non d'un sous compteur dans le bâtiment
- `B15` **Numéro** — Données reprises sur les pages "Sous-compteur"  / - nombre de ligne à incrémenter au fur et à mesure  / - si on clique sur la ligne on revient à la page du sous compteur en question
- `C32` **Enregistrer** — Enregistrement des données
- `F32` **Enregistrer** — Ajout d'une page pour un sous compteur / - Ajouter  un message de confirmation / - Message avertissement enregistrement

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `C4` | Liste des Sous-compteurs |
| `D8` | Présence d'au moins un sous-compteur |
| `B14` | Numéro |
| `C14` | Emplacement |
| `E14` | Année de pose |
| `F14` | Télétransmission |
| `G14` | Remarques |
| `F15` | Oui/Non |
| `B28` | Remarques |
| `C32` | Enregistrer |

</details>
