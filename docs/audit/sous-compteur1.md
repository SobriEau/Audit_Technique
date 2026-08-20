# Sous-compteur1

> Spécification extraite de `audit_technique.xlsx`, onglet « Sous-compteur1 ».
> 32 cellules, 28 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `F8` | Emplacement (colonne montante, local technique, en regard, longueurs droites amont/aval, etc.) | Nombre (colonne montante, local technique, en regard, longueurs droites amont/aval, etc.) | — |
| `F12` | Condition d'accès | Texte libre | — |
| `F15` | Marque | Texte libre | — |
| `J15` | Modèle | Texte libre | — |
| `F18` | Type | Liste déroulante | Compteur à jet unique · Compteur à jet multiple · Compteur à palettes · Compteur volumétrique · Compteur électromagnétique · Compteur ultrasonique · Compteur à pression différentielle · Compteur à insertion · Inconnu |
| `J18` | Classe métrologique | Liste déroulante | Classe A · Classe B · Classe C · Classe D · R40 · R50 · R63 · R80 · R100 · R125 · R160 · R200 · R250 · R315 · R400 · R160 · R200 · R400 · R500 · R630 · R800 · Inconnue |
| `F21` | Numéro de série | Nombre | — |
| `J21` | Diamètre Nominal (mm) | Nombre (mm) | — |
| `F24` | Année de pose | Texte libre | — |
| `J24` | Index le jour de l'audit (m3) | Nombre (m3) | — |
| `F27` | Télétransmission | Oui / Non | Oui · Non |
| `J27` | Précisions télétransmission (radio, filaire, 4G/5G) | Texte libre | — |
| `F30` | Présence de protection (chocs, gel) ? | Texte libre | — |
| `J30` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `F33` | Propriétaire du compteur | Texte libre | — |
| `J33` | Date dernière maintenance | Texte libre | — |
| `F36` | Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) | Nombre (tourne sans débit, bloqué, bruit,…) | — |
| `F39` | Organes de réseau à proximité (vanne amont/aval, clapet anti-retour, filtre …) | Nombre (vanne amont/aval, clapet anti-retour, filtre …) | — |
| `F42` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons | Texte libre | — |
| `F45` | Dispoisitif relié au GTB/GTC ? | Oui / Non | Oui · Non |
| `F48` | Remarques | Texte libre | — |

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
- R40
- R50
- R63
- R80
- R100
- R125
- R160
- R200
- R250
- R315
- R400
- R160
- R200
- R400
- R500
- R630
- R800
- Inconnue

**Etat général***

- Bon
- Moyen
- Mauvais

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `K4` **Sous-compteurs** — Retour à la page "Liste sous compteurs"  / - Message avertissement enregistrement
- `I5` **Sous-compteurs** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `G50` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste des sous compteurs
- `I50` **Enregistrer** — Prise de photo et ajout au dossier
- `J51` **Enregistrer** — Ajout d'une page pour un sous compteur / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `K51` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `H4` | Sous-compteurs |
| `I5` | Numéro |
| `F7` | Emplacement (colonne montante, local technique, en regard, longueurs droites amont/aval, etc.) |
| `F11` | Condition d'accès |
| `F14` | Marque |
| `J14` | Modèle |
| `F17` | Type |
| `J17` | Classe métrologique |
| `F20` | Numéro de série |
| `J20` | Diamètre Nominal (mm) |
| `F23` | Année de pose |
| `J23` | Index le jour de l'audit (m3) |
| `F26` | Télétransmission |
| `J26` | Précisions télétransmission (radio, filaire, 4G/5G) |
| `F29` | Présence de protection (chocs, gel) ? |
| `J29` | Etat général* |
| `F32` | Propriétaire du compteur |
| `J32` | Date dernière maintenance |
| `F35` | Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) |
| `F38` | Organes de réseau à proximité (vanne amont/aval, clapet anti-retour, filtre …) |
| `F41` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons |
| `F44` | Dispoisitif relié au GTB/GTC ? |
| `F47` | Remarques |
| `G50` | Enregistrer |
| `F53` | Bon état |
| `G53` | lisible, pas de corrosion significative, pas de fuite, index cohérent, plombage présent, installation stable. |
| `F54` | Etat moyen |
| `G54` | légère corrosion, partiellement lisible, léger vieillissement, vlégère vibration, doute sur la précision |
| `F55` | Mauvais état |
| `G55` | présence d'une fuite, forte corrosion, compteur bloqué ou illisible,, traces d'humiditées importantes |

</details>
