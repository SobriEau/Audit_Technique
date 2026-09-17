# Douche-baignoire1

Entité `douches_baignoires` — route `#/qte/douches-baignoires`.

54 champ(s), 13 section(s). Colonnes du tableau : `TypeDEquipement`, `Emplacement`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `G8` | Type d'équipement | Obligatoire | liste déroulante douche ou baignoire Affiche ensuite la partie "Douche" ou "Baignoire" |
| `E11` | Nombre d'équipements identiques | Obligatoire | Champ libre |
| `I11` | Numéro réseau ECS d'appartenance | Obligatoire | Liste déroulante avec les choix de la liste des réseaux ECS |

## Localisation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E14` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `E17` | Précision emplacement | Recommandé | champ libre |

## Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E21` | Usagers (personnels, public, enfants, patients, adultes, etc.) | Recommandé | Champ libre |
| `I21` | Nombre d'utilisation/semaine | Facultatif | Champ libre |

## Douche — Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E25` | Type de sol | Facultatif | liste déroulante receveur à l'italienne carrellée à l'italienne pierre naturelle chape béton étanche |
| `I25` | Adaptée PMR ? | Recommandé | liste déroulante Oui / Non |
| `E28` | Type d'emetteur | Obligatoire | case à cocher tête de douche ciel de pluie pommeau colonne hydromassante cascade Autre |
| `I28` | Jets de l'émetteur | Facultatif | liste déroulante aucune pluie laminaire, aéré, brumisé, pulsé/massage, concentré/puissant, multi-jets |
| `E41` | Présence d'un limiteur de débit | Obligatoire | Liste déroulante O/N |
| `H41` | Particularités de la douche (encastrée, rideau, parois, siège rabattable, etc.) | Facultatif | Champ libre |

## Douche — Mesures

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E44` | Débit en sortie de l'émetteur (L/min) | Recommandé | — |
| `G45` | Temps (s) | — | champ libre |
| `I45` | Volume (L) | — | champ libre |
| `K45` | Débit (L/min) | — | Calcul automatique : Débit = volume/temps/60 |
| `L45` | Mesure directe débit (L/min) - bol | — | champ libre |
| `E50` | Température max ECS (°C) | Recommandé | Champ libre |
| `I50` | Temps d'obtention (s) ECS | Recommandé | Champ libre |

## Douche — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E53` | Etat général | Recommandé | Liste déroulante Bon Moyen Mauvais |
| `I53` | Date dernière maintenance | Facultatif | Champ Libre |
| `E56` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, tartre, etc,…) | Recommandé | Champ Libre |
| `E59` | Remarques | — | Champ libre |

## Baignoire — Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E66` | Type de baignoire | Facultatif | liste déroulante sur pied, autoportante encastrée sabot îlot autre |
| `I66` | Adaptée PMR ? | Recommandé | liste déroulante Oui / Non |
| `E69` | Baignoire - Indiquer ses dimensions (cm) | Recommandé | Champ libre |
| `I69` | Baignoire - Indiquer son volume (L) | Recommandé | Champ libre |
| `E72` | Type d'émetteur | Obligatoire | cases à cocher Robinet seul Robinet + pommeau Pommeau seul Robinet + colonne de douche Robinet + buses hydromassante |
| `I72` | Jets de l'émetteur | Facultatif | liste déroulante aucune pluie laminaire, aéré, brumisé, pulsé/massage, concentré/puissant, multi-jets |
| `E80` | Présence d'un limiteur de débit | Obligatoire | Liste déroulante O/N |
| `H80` | Particularités de la baignoire (porte latérale, forme ronde ou ovale, balnéo, etc.) | Facultatif | Champ libre |

## Baignoire — Mesures

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E83` | Débit en sortie de l'émetteur (L/min) | Recommandé | — |
| `G84` | Temps (s) | — | champ libre |
| `I84` | Volume (L) | — | champ libre |
| `K84` | Calcul débit (L/min) | — | Calcul automatique : Débit = volume/temps/60 |
| `L84` | Mesure directe débit (L/min) - bol | — | champ libre |
| `E89` | Température max ECS (°C) | Recommandé | Champ libre |
| `I89` | Temps d'obtention (s) ECS | Recommandé | Champ libre |

## Baignoire — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E92` | Etat général* | Recommandé | Liste déroulante Bon Moyen Mauvais |
| `I92` | Date dernière maintenance | Facultatif | Champ Libre |
| `E95` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, tartre, etc,…) | Recommandé | Champ Libre |
| `E98` | Remarques | — | Champ libre |

## Robinet — Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E105` | Type | Obligatoire | liste déroulante : Simple EF, Simple ECS Mélangeur, Mitigeur classique, Mitigeur thermostatique, |
| `I105` | Commande du robinet | Obligatoire | Liste déroulante : manuelle, à détection de présence à effleurement à détection RFID |
| `E108` | Temporisation | Obligatoire | Liste déroulante Aucune, Mécanique, Electronique |
| `I108` | Temps de la temporisation (s) | Recommandé | Champ libre |
| `E111` | Particularités du robinet (cold start, double butée, …) | Facultatif | Champ libre |
| `E114` | Diamètre Nominal de l'alimentation (mm) | Recommandé | Champ libre |
| `I114` | Matériau du tuyau d'alimentation | Recommandé | Liste déroulante : Cuivre, Multicouche PER, PEHD, PE, PVC pression inconnu |

## Robinet — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E117` | Etat général* | Recommandé | Liste déroulante Bon Moyen Mauvais |
| `I117` | Date dernière maintenance | Facultatif | Champ Libre |
| `E120` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, présences d'éclaboussures excessives, etc,…) | Recommandé | Champ Libre |
| `E123` | Remarques | — | Champ libre |
