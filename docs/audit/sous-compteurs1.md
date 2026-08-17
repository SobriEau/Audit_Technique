# Sous-compteurs1

> Spécification extraite de `audit_technique.xlsx`, onglet « Sous-compteurs1 ».
> 30 cellules, 24 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `B8` | Emplacement | Texte libre | — |
| `B12` | Condition d'accès | Texte libre | — |
| `B15` | Marque | Texte libre | — |
| `F15` | Modèle | Texte libre | — |
| `B18` | Type | Liste déroulante | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| `F18` | Classe métrologique | Liste déroulante | Classe A · Classe B · Classe C · Classe D · Inconnue |
| `B21` | Numéro de série | Nombre | — |
| `F21` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `B24` | Année de pose | Texte libre | — |
| `F24` | Index le jour de l'audit (m3) | Nombre (m3) | — |
| `B27` | Télétransmission | Texte libre | — |
| `F27` | Présence de protection ? | Texte libre | — |
| `B30` | Précisions télétransmission | Texte libre | — |
| `F30` | Etat général | Texte libre | — |
| `B33` | Propriétaire du compteur | Texte libre | — |
| `F33` | Organes de réseau à proximité | Texte libre | — |
| `B36` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons | Texte libre | — |
| `B39` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Type**

- Compteur à jet unique
- Compteur à jet multiple
- Compteur à palettes
- Compteur volumétrique
- Compteur électromagnétique
- Compteur ultrasonique
- Compteur à pression différentielle
- Compteur à insertion
- Inconnu

**Classe métrologique**

- Classe A
- Classe B
- Classe C
- Classe D
- Inconnue

## Valeurs inscrites directement dans les cellules

Contrairement aux listes ci-dessus, ces valeurs sont écrites dans la cellule elle-même plutôt que dans une note. Le classeur ne portant aucune validation de données, elles restent indicatives : à confirmer au cas par cas.

| Cellule | Rattaché à | Valeurs |
|---|---|---|
| `B27` | Télétransmission | Oui · Non |

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `A1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `E5` **Sous-compteurs** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `G6` **Numéro** — Retour à la page "Liste des sous-compteurs"  / - Message avertissement enregistrement
- `C41` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste
- `F42` **Enregistrer** — Ajout d'un page pour sous compteur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `G42` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `B1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `D4` | Sous-compteurs |
| `E5` | Numéro |
| `B7` | Emplacement |
| `B11` | Condition d'accès |
| `B14` | Marque |
| `F14` | Modèle |
| `B17` | Type |
| `F17` | Classe métrologique |
| `B20` | Numéro de série |
| `F20` | Diamètre Nominal (mm) |
| `B23` | Année de pose |
| `F23` | Index le jour de l'audit (m3) |
| `B26` | Télétransmission |
| `F26` | Présence de protection ? |
| `B27` | Oui / Non |
| `B29` | Précisions télétransmission |
| `F29` | Etat général |
| `B32` | Propriétaire du compteur |
| `F32` | Organes de réseau à proximité |
| `K33` | vannes amont |
| `K34` | vanne aval |
| `K35` | clapet anti-retour |
| `K36` | disconnecteur |
| `K37` | réducteur de pression |
| `B38` | Remarques |
| `K38` | filtre à tamis ? |
| `C41` | Enregistrer |

</details>
