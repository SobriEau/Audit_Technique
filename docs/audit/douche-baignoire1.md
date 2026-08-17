# Douche-baignoire1

> Spécification extraite de `audit_technique.xlsx`, onglet « Douche-baignoire1 ».
> 16 cellules, 19 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `D8` | Choix de l'équipement | Liste déroulante | douche ou baignoire |
| `H8` | Emplacement | Texte libre | — |
| `B11` | Précision emplacement | Texte libre | — |
| `D15` | Numéro robinet correspondant | Nombre | — |
| `H15` | Type de pommeau | Liste déroulante | Pommeau de douche classique · Pommeau de douche hydroéconome · Pommeau de douche anti-légionnelle |
| `D18` | Usages | Texte libre | — |
| `H18` | Baignoire - Indiquer ses dimensions | Texte libre | — |
| `D21` | Débit en sortie du pommeau (L/min) | Nombre (L/min) | — |
| `H21` | Présence d'un réducteur de débit | Oui / Non | Oui · Non |
| `D24` | Nombre d'utlisation/semaine | Nombre | — |
| `H24` | Nombre d'équipement identique | Nombre | — |
| `B27` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Choix de l'équipement**

- douche ou baignoire

**Type de pommeau**

- Pommeau de douche classique
- Pommeau de douche hydroéconome
- Pommeau de douche anti-légionnelle

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `E5` **Douche-Baignoire** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `G5` **Douche-Baignoire** — Retour à la page "Liste Robinet"  / - Message avertissement enregistrement
- `N17` **Baignoire - Indiquer ses dimensions** — Mesurer la témpérature d'eau chaude au robinet  ?
- `C33` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `F34` **Enregistrer** — Ajout d'un page pour Douche / Baignoire / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `G34` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Douche-Baignoire |
| `E5` | Numéro |
| `B7` | Choix de l'équipement |
| `F7` | Emplacement |
| `B10` | Précision emplacement |
| `B14` | Numéro robinet correspondant |
| `F14` | Type de pommeau |
| `B17` | Usages |
| `F17` | Baignoire - Indiquer ses dimensions |
| `B20` | Débit en sortie du pommeau (L/min) |
| `F20` | Présence d'un réducteur de débit |
| `B23` | Nombre d'utlisation/semaine |
| `F23` | Nombre d'équipement identique |
| `B26` | Remarques |
| `C33` | Enregistrer |

</details>
