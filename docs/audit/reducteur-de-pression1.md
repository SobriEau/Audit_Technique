# Réducteur de Pression1

> Spécification extraite de `audit_technique.xlsx`, onglet « Réducteur de Pression1 ».
> 28 cellules, 17 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B9` | Emplacement (colonne montante, proche du compteur général, en regard, etc.) | Nombre (colonne montante, proche du compteur général, en regard, etc.) | — |
| `B13` | Condition d'accès | Texte libre | — |
| `B16` | Marque | Texte libre | — |
| `F16` | Modèle | Texte libre | — |
| `B19` | Type | Liste déroulante | Réducteur de pression à membrane · Réducteur de pression à piston · Réducteur de pression à cartouche · Inconnu |
| `F19` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `B22` | Année de pose | Texte libre | — |
| `F22` | Pression affichée s'il y a un manomètre (bar) | Nombre (bar) | — |
| `B25` | Pression de consigne actuelle (bar) | Nombre (bar) | — |
| `F25` | Plage de réglage de la pression (bar) | Nombre (bar) | — |
| `B28` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- Réducteur de pression à membrane
- Réducteur de pression à piston
- Réducteur de pression à cartouche
- Inconnu

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `E5` **Réducteur de Pression** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `G5` **Réducteur de Pression** — Retour à la page "Liste Réducteur de Pression"  / - Message avertissement enregistrement
- `C33` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `F34` **Enregistrer** — Ajout d'un page pour réducteur de pression / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `G34` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Réducteur de Pression |
| `E5` | Numéro |
| `B12` | Condition d'accès |
| `K14` | Qu'est ce qu'on met dans "type" pour les réducteurs de pression ? |
| `B15` | Marque |
| `F15` | Modèle |
| `B18` | Type |
| `F18` | Diamètre Nominal (mm) |
| `B21` | Année de pose |
| `F21` | Pression affichée s'il y a un manomètre (bar) |
| `B24` | Pression de consigne actuelle (bar) |
| `F24` | Plage de réglage de la pression (bar) |
| `B27` | Remarques |
| `C33` | Enregistrer |

</details>
