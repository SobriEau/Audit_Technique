# Robinets

Entité `robinets` — route `#/qte/robinets`.

30 champ(s), 5 section(s). Colonnes du tableau : `Emplacement`, `Utilisation1`, `NombreDEquipementsIdentiques`.


## Localisation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `F11` | Précision emplacement (à droite de la porte, etc …) | Recommandé | Champ libre |

## Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F15` | Utilisation 1 | Obligatoire | Liste déroulante Evier Lave-main Fontaine Lavabo Ménage/lavage du sol Lavage poubelle Lavage matériel (pinceau, ...) Table à langer Poste de plonge Poste de rin |
| `I15` | Utilisation 2 | Recommandé | Liste déroulante Evier Lave-main Fontaine Lavabo Ménage/lavage du sol Lavage poubelle Table à langer Poste de plonge Poste de rinçage Robinet extérieur Arrosage |
| `L15` | Utilisation 3 | Facultatif | Liste déroulante Evier cuisine Lave-main Fontaine Lavabo Ménage/lavage du sol Lavage poubelle Lavage matériel (pinceau, ...) Table à langer Poste de plonge Post |
| `F18` | Usagers (personnels, public, enfants, patients, adultes, PMR, etc.) | Obligatoire | Champ libre |
| `K18` | Nombre d'utilisation/semaine | Facultatif | Champ libre |

## Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F21` | Nombre d'équipements identiques | Obligatoire | Champ libre |
| `K21` | Numéro réseau ECS d'appartenance | Obligatoire | Liste déroulante avec les choix de la liste des réseaux ECS |
| `F24` | Type de robinets | Obligatoire | liste déroulante : Simple EF, Simple ECS Mélangeur, Mitigeur classique, Mitigeur thermostatique. |
| `K24` | Commande du robinet | Obligatoire | Liste déroulante : manuelle, fémorale, à pédale, à détection |
| `F27` | Temporisation | Obligatoire | Liste déroulante Aucune, Mécanique, Electronique |
| `K27` | Temps de la temporisation (s) | Recommandé | Champ libre |
| `F30` | Diamètre Nominal de l'alimentation (mm) | Facultatif | Champ libre |
| `K30` | Matériau du tuyau d'alimentation | Facultatif | Liste déroulante : Cuivre, Multicouche PER, PEHD, PE, PVC pression inconnu |
| `F33` | Présence d'un limiteur de débit | Recommandé | Liste déroulante Oui/Non |
| `J33` | Particularité (cold start, double butée, encastré , antivol, accessibilité des organes du robinet…) | Recommandé | Champ libre |
| `F36` | Informations sur le bec du robinet (hauteur, bec fixe, orientable, col de cygne, extractible, douchette, rabatable) | Facultatif | Champ libre |

## Mesures

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F39` | Débit en sortie du robinet (L/min) | Recommandé | — |
| `H40` | Temps (s) | — | champ libre |
| `J40` | Volume (L) | — | champ libre |
| `L40` | Calcul débit (L/min) | — | Calcul automatique : Débit = volume/temps/60 |
| `N40` | Mesure directe débit (L/min) - bol | — | champ libre |
| `F45` | Température max ECS (°C) | Facultatif | Champ libre |
| `K45` | Temps d'obtention (s) ECS | Facultatif | Champ libre |

## Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F48` | Année de pose | Facultatif | Champ Libre |
| `K48` | Date dernière maintenance | Facultatif | Champ Libre |
| `F51` | Etat général* | Recommandé | Liste déroulante Bon Moyen Mauvais |
| `F54` | Dysfonctionnements observés (fuites, goutte à goutte, bloqué, mauvais mélange, retour d'eau chaude, entartrage, etc,…) | Recommandé | Champ Libre |
| `F57` | Remarques (infos complémentaires : présences d'éclaboussures excessives, eau adoucie, commande à tirette, etc..) | — | Champ libre |
