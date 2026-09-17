# Appareils de lavage

Entité `appareils_lavage` — route `#/qte/appareils-lavage`.

77 champ(s), 18 section(s). Colonnes du tableau : `Emplacement`, `Type`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E8` | Type | — | liste déroulante : lave linge lave vaisselle autolaveuse lavage du sol manuel les rubriques ci-dessous apparaissent en fonction de ce qui a été sélectionné dans |
| `K8` | Nombre d'équipement identique | — | Champ libre |
| `E11` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `E14` | Précisions emplacement | — | Champ libre |

## Lave linge — Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E19` | Utilisations | Obligatoire | liste déroulante domestique collective professionnelle |
| `K19` | Nb d'utilisation / semaine | Recommandé | Champ libre |
| `E22` | Taux de remplissage | Facultatif | Liste déroulante peu rempli / semi-rempli / plein |
| `K22` | Température de lavage la plus fréquente | Facultatif | Champ libre |
| `E25` | Lister les programmes les plus utilisés (courts, éco, coton, mixte) | Facultatif | Champ libre |

## Lave linge — Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E28` | Capacité (kg) | Recommandé | Champ libre |
| `K28` | Classe énergétique (si visible) | Recommandé | liste déroulante A B C D E F G |
| `E31` | Marque et modèle | Facultatif | Champ libre |
| `K31` | Type d'alimentation en eau | Recommandé | liste déroulante EF seul EF + ECS Eau de pluie |
| `E34` | Date d'installation | Facultatif | Champ libre |
| `K34` | Type de textiles lavés | Recommandé | liste déroulante à cocher (plusieurs réponses possibles) : vêtements quotidien mixte (coton, mélange, soie, laine, synthétique) vêtements de sport (synthétique) |

## Lave linge — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E37` | Etat visuel de la machine* | Recommandé | Bon moyen mauvais |
| `I37` | Dysfonctionnements observés (cycles anormaux, mauvaises vidanges, mauvais lavage, arrêt prématuré, bruits anormaux, etc.) | Recommandé | Champ libre |
| `E40` | Procédures d'entretien réalisées (lavage à vide à 65°C, vinaigre blanc, etc.) et fréquence | Facultatif | Champ libre |
| `E43` | Remarques (eau adoucie, …) | — | champ libre |

## Lave vaisselle — Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E50` | Utilisations | Obligatoire | liste déroulante domestique collectif professionnel |
| `K50` | Nb d'utilisation / semaine | Recommandé | Champ libre |
| `E53` | Taux de remplissage | Facultatif | Champ libre |
| `J53` | Température de lavage la plus fréquente | Facultatif | Champ libre |
| `E56` | Lister les programmes les plus utilisés (courts, éco, autres) | Facultatif | Champ libre |

## Lave vaisselle — Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E59` | Capacité (Nb de couverts ou de paniers/heure) | Recommandé | Champ libre |
| `K59` | Type de chargement | Recommandé | liste déroulante frontal à capot à avancement automatique à convoyeur/tunnel |
| `E62` | Marque et modèle | Facultatif | Champ libre |
| `K62` | Type d'alimentation en eau | Recommandé | liste déroulante EF seul ECS seul EF + ECS |
| `E65` | Date d'installation | Facultatif | Champ libre |
| `K65` | Classe énergétique (si visible) | Recommandé | Champ libre |

## Lave vaisselle — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E68` | Etat visuel de la machine* | Recommandé | Bon moyen mauvais |
| `I68` | Dysfonctionnements observés (cycles anormaux, mauvaises vidanges, mauvais lavage, arrêt prématuré, bruits anormaux, etc.) | Recommandé | Champ libre |
| `E72` | Procédures d'entretien réalisées (lavage à vide à 65°C, vinaigre blanc, etc.) et fréquence | Facultatif | champ libre |
| `E75` | Remarques (eau adoucie, …) | — | Champ libre |

## Autolaveuse — Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E82` | Utilisations | Obligatoire | liste déroulante interne prestataire externe |
| `K82` | Nb d'utilisation / semaine | Recommandé | Champ libre |
| `E85` | Réglage le plus utilisé sur le débit d'eau (niveau de puissance : faible, moyen, fort, continu ou par niveaux) | Facultatif | Champ libre |
| `E88` | Dosage et nom du détergent utilisé (manuel ou automatique, % de produit injecté, etc.) | Facultatif | Champ libre |
| `E91` | Température de lavage la plus fréquente | Facultatif | Champ libre |
| `J91` | Nb de remplissage du réservoir eau propre à chaque utilisation | Facultatif | Champ libre |

## Autolaveuse — Surfaces nettoyées

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E94` | Surface nettoyée (m²) par utilisation | Facultatif | Champ libre |
| `K94` | Type de zone lavée | Recommandé | bureaux sanitaire salle de cours cuisine espace de restauration zone technique (garage, atelier, etc.) zone sportive circulation du publique |
| `E97` | Type de salissures retrouvées dans cette zone (sèches, grasses, humides, biologiques, lourdes (huile, boue)) | Facultatif | Champ libre |
| `K97` | Exigence de propreté de la zone | Recommandé | faible modéré forte réglementaire |

## Autolaveuse — Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E100` | Type d'autolaveuse | Recommandé | liste déroulante autotractée autoportée industrielle |
| `J100` | Type de brosses | Recommandé | liste déroulante disque rouleau autre |
| `E103` | Marque et modèle | Facultatif | Champ libre |
| `J103` | Largeur de travail | Recommandé | <40cm 40-70cm 70cm |
| `E106` | Date d'achat | Facultatif | Champ libre |
| `J106` | Type d'alimentation électrique | Facultatif | liste déroulante sur batterie câble d'alimentation |
| `E109` | Volume réservoir eau propre (L) | Recommandé | Champ libre |
| `J109` | Numéro du robinet utilisé pour le remplissage | Recommandé | Champ libre |
| `E112` | Volume réservoir eau sale (L) | Recommandé | Champ libre |
| `J112` | Lieu de vidange des eaux sales | Recommandé | Champ libre |

## Autolaveuse — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E115` | Etat visuel de la machine | Recommandé | Bon moyen mauvais |
| `I115` | Dysfonctionnements observés (buses bouchées, fuites, mauvaise répartition de l'eau, traces au sol, brosses usées, mauvaise rotation, lames du suceur usées, aspiration défaillante, interruption, etc.) | Recommandé | Champ libre |
| `E118` | Procédures d'entretien de la machine et fréquence | Facultatif | champ libre |
| `E121` | Remarques | — | Champ libre |

## Lavage manuel du sol — Matériel

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E129` | Type de matériel de lavage | Obligatoire | liste déroulante balai serpillère à franges (ou balai espagnol) balai à plat classique balai à plat avec microfibres pré-imprégnées balai à plat avec microfibre |
| `I129` | Présence d'un protocole de nettoyage | Obligatoire | liste déroulante Oui/Non |
| `E132` | Lister les équipements associés au matériel de lavage (seau, double seau, press d'essorage, chariot de ménage, etc.) | Obligatoire | champ libre |
| `E135` | Lister le nom du détergent utilisé et son dosage | Recommandé | Champ libre |

## Lavage manuel du sol — Surfaces nettoyées

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E138` | Type de zone lavée | Recommandé | logement bureaux sanitaire salle de cours cuisine espace de restauration zone technique (garage, atelier, etc.) zone sportive circulation du publique |
| `H138` | Type de surface | Facultatif | liste déroulante carrelage (grès, faïence), pierre (marbre, granit, travertin) résine époxy / polyuréthane béton ciré béton brut, parquet massif parquet contrec |
| `K138` | Surface nettoyée (m²) par utilisation | Facultatif | champ libre |
| `E141` | Type de salissures retrouvées dans cette zone (sèches, grasses, humides, biologiques, lourdes (huile, boue)) | Facultatif | Champ libre |
| `J141` | Exigence de propreté de la zone | Recommandé | faible modéré forte réglementaire |

## Lavage manuel du sol — Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E144` | Nb de lavage par semaine | Recommandé | Champ libre |
| `J144` | Nb de seaux utilisés à chaque lavage | Recommandé | Champ libre |
| `E147` | Volume des seaux utilisés (L) | Recommandé | champ libre |
| `J147` | Numéro du robinet utilisé pour le remplissage | Recommandé | même numéro indiqué dans la liste des robinets |
| `E150` | Rinçage du sol | Facultatif | liste déroulante pas de rinçage rinçage systématique rinçage ponctuel |
| `J150` | Lieu de vidange des eaux sales | Facultatif | champ libre |

## Lavage manuel du sol — Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `E153` | Etat visuel des équipements* | Recommandé | Bon moyen mauvais |
| `I153` | Dysfonctionnements observés (surconsommation d'eau, traces visibles, saletées déplacées, mauvais essorage, matériels deffectueux, etc.) | Recommandé | Champ libre |
| `E156` | Procédures de remplacement des équipements et d'achat des consommables | Facultatif | champ libre |
| `E159` | Remarques | — | Champ libre |
