# Sous-compteur1

Entité `sous_compteurs` — route `#/qte/sous-compteurs`.

15 champ(s), 3 section(s). Colonnes du tableau : `Emplacement`, `AnneeDePose`, `Teletransmission`.


## Localisation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `F12` | Utilisations d'eau desservis par le sous-compteur | — | champ libre |
| `F15` | Condition d'accès (colonne montante, derrière la chaudière, en regard, sous-clé, etc.) | Facultatif | Champ libre |
| `F18` | Type | Obligatoire | Liste déroulante : Compteur à jet unique, Compteur à jet multiple, Compteur à palettes, Compteur volumétrique, Compteur électromagnétique, Compteur ultrasonique |
| `J18` | Classe métrologique | Obligatoire | Liste déroulante : Classe A Classe B Classe C Classe D R40 R50 R63 R80 R100 R125 R160 R200 R250 R315 R400 R160 R200 R400 R500 R630 R800 Inconnue |
| `F21` | Année de pose | Recommandé | Champ Libre |
| `J21` | Propriétaire du compteur | Facultatif | Champ Libre |

## Connexion

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F24` | Télétransmission | Obligatoire | Liste déroulante O/N |
| `J24` | Précisions télétransmission (radio, filaire, 4G/5G) | Facultatif | Champ Libre |
| `F27` | Dispositif relié au GTB/GTC ? | Facultatif | Liste déroulante O/N |

## Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F30` | Présence de protection (chocs, gel) ? | Facultatif | Champ Libre |
| `J30` | Etat général* | Obligatoire | Liste déroulante Bon Moyen Mauvais |
| `F33` | En cas d'impossibilité de relevé le compteur général - Indiquer les raisons | Facultatif | Champ libre |
| `F36` | Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) | Obligatoire | Champ Libre |
| `F39` | Remarques | — | Champ libre |
