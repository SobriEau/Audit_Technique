# Liste Extérieur

> Spécification extraite de `audit_technique.xlsx`, onglet « Liste Extérieur ».
> 17 cellules, 10 notes.

## Rôle de la page

Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `G8` | Surface Espace extérieur (m2) | Texte libre | — |
| `J8` | Surface Espace Vert (m2) | Texte libre | — |
| `G11` | Fonctions de l'eau sur ces espaces | Liste déroulante | arrosage · arrosage et nettoyage · arrosage et autre · nettoyage · nettoyage et autre · autre · arrosage · nettoyage et autre |
| `J11` | Si autre - Précisez | Texte libre | — |
| `E30` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Fonctions de l'eau sur ces espaces**

- arrosage
- arrosage et nettoyage
- arrosage et autre
- nettoyage
- nettoyage et autre
- autre
- arrosage
- nettoyage et autre

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `D1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `L5` **Espace Vert / Extérieur** — Retour à la page "Partie Technique"  / - Message avertissement enregistrement
- `E15` **Numéro** — Données reprises sur les pages "Espace vert/extérieur"  / - nombre de ligne à incrémenter au fur et à mesure  / - si on clique sur la ligne on revient à la page du robinet en question
- `F33` **Enregistrer** — Enregistrement des données
- `K34` **Enregistrer** — Ajout d'une page pour espace vert/extérieur / - Ajouter  un message de confirmation / - Message avertissement enregistrement

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `E1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `G4` | Espace Vert / Extérieur |
| `E7` | Surface Espace extérieur (m2) |
| `J7` | Surface Espace Vert (m2) |
| `E10` | Fonctions de l'eau sur ces espaces |
| `J10` | Si autre - Précisez |
| `E13` | Numéro |
| `F13` | Emplacement |
| `I13` | Type de gestion des eaux pluviales |
| `J13` | Arrosage |
| `K13` | Nettoyage |
| `L13` | Autre |
| `J14` | Surface à arroser (m2) |
| `K14` | Utilisation |
| `L14` | Utilisation |
| `E29` | Remarques |
| `F33` | Enregistrer |

</details>
