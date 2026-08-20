# Autre1

> Spécification extraite de `audit_technique.xlsx`, onglet « Autre1 ».
> 11 cellules, 14 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F8` | Choix | Liste déroulante | ouvrant les champs à la suite en question : · Autre information · Autre utilisation de l'eau |
| `F11` | Nom | Texte libre | — |
| `F14` | Emplacement | Texte libre | — |
| `F17` | Précision emplacement | Texte libre | — |
| `M28` | _(non identifié)_ | Texte libre | — |
| `M45` | _(non identifié)_ | Texte libre | — |
| `F56` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Choix**

- ouvrant les champs à la suite en question :
- Autre information
- Autre utilisation de l'eau

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `J5` **Autres Informations / Utilisations de l'eau** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `M5` **Autres Informations / Utilisations de l'eau** — Retour à la page "Liste Autre"  / - Message avertissement enregistrement
- `G59` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste autre
- `J60` **Enregistrer** — Prise de photo et ajout au dossier
- `L60` **Enregistrer** — Ajout d'un page pour autre / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `M60` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `I4` | Autres Informations / Utilisations de l'eau |
| `J5` | Numéro |
| `F7` | Choix |
| `F10` | Nom |
| `F13` | Emplacement |
| `F16` | Précision emplacement |
| `F21` | Autre information (traitement de l'eau, adoucisseurs, fuites, …) |
| `F38` | Autre utilisation de l'eau (procédés particuliers,…) |
| `F55` | Remarques |
| `G59` | Enregistrer |

</details>
