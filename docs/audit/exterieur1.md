# Extérieur1

Entité `espace_vert_exterieur` — route `#/qte/espaces-exterieurs`.

37 champ(s), 2 section(s). Colonnes du tableau : `EmplacementDeLEspaceExterieur`, `TypeDeGestionDesEaux`, `SurfaceArrosee`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Emplacement de l'espace extérieur concerné | Obligatoire | Champ libre |
| `F11` | Précision emplacement | Recommandé | Champ libre |
| `F15` | Surface de cet espace (m2) | Recommandé | Champ libre |
| `I15` | Dont surface imperméable (m2) | Recommandé | Champ libre |
| `L15` | Type de gestion des eaux pluviales (ruissellement) | Recommandé | liste déroulante aucune (ruissellement libre) infiltration à la parcelle directe stockage + infiltraion à la parcelle stockage + réutilisation rejet au réseau p |
| `F18` | Précision (présences de noues, fossés, regards, bassins de récupérations, etc.) | Facultatif | — |
| `F22` | Possibilité de rediriger ces eaux pour infiltration sur la parcelle | Facultatif | liste déroulante O/N |
| `K22` | Précision | Facultatif | Champ libre |
| `F25` | Possibilité de rediriger ces eaux pour stockage sur la parcelle | Facultatif | liste déroulante O/N |
| `K25` | Précision | Facultatif | Champ libre |
| `I28` | Utilisations d'eau sur cet espace ? | Obligatoire | case à cocher : arrosage nettoyage les rubriques ci-dessous apparaissent en fonction de ce qui a été sélectionné dans ce menu déroulant. |

## Arrosage

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F32` | Surface arrosée (m2) | Recommandé | Champ libre |
| `I32` | Type de surface à arroser (pelouse stade ou hornement, massif, haies, potager, arbres, etc.) | Recommandé | Champ libre |
| `F35` | Précisions des végétaux sur cette surface | Facultatif | Champ libre |
| `F38` | Exposition de la parcelle | Facultatif | liste déroulante Ensoleillée Ombragée Mi-ombragée |
| `I38` | Pente de la parcelle | Facultatif | liste déroulante nulle, faible, moyenne, forte |
| `L38` | Présence de paillage | Facultatif | liste déroulante O/N |
| `N38` | Type de paillage | Facultatif | liste déroulante broyat minéral copeaux paille autre |
| `F41` | Mode d'arrosage | Recommandé | liste déroulante Tuyau manuel Arrosoir, Oyas Micro asperseur, Arrosage goutte à goutte Arrosage tuyaux poreux Tuyères Arrosage non sélectif Autre |
| `I41` | Pilotage de l'arrosage | Recommandé | liste déroulante Manuel En fonction de la météo Horloge Sonde humidité Connecté |
| `L41` | Période d'arrosage dans la journée | Recommandé | liste déroulante Matin Soir En pleine journée |
| `F44` | Origine eau pour l'arrosage | Recommandé | liste déroulante eau potable eau de pluie eau pluviale eau grise eau souterraine eau de surface |
| `L44` | Numéros des robinets correspondants | Recommandé | a cocher depuis la liste des robinets |
| `F47` | Nb de mois d'arrosage / an | Recommandé | Champ libre |
| `I47` | Durée d'un arrosage | Recommandé | Champ libre |
| `L47` | Nb d'arrosage / mois | Recommandé | Champ libre |
| `F50` | Remarques | Facultatif | Champ libre |

## Nettoyage

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F54` | Utilisation (nettoyage parking, façade,..) | Recommandé | Champ libre |
| `I54` | Mode de nettoyage | Recommandé | cases à cocher : auto laveuse nettoyeur haute pression tuyaux simple autre |
| `L54` | Motif du nettoyage | Recommandé | cases à cocher : esthétique, hygiène, sécurité, entretien, autre |
| `F57` | Précisions | Facultatif | Champ libre |
| `F60` | Origine de l'eau | Recommandé | liste déroulante eau potable eau de pluie eau pluviale eau grise eau souterraine |
| `L60` | Numéros des robinets correspondants | Recommandé | a cocher depuis la liste des robinets |
| `F63` | Durée d'un nettoyage | Recommandé | Champ libre |
| `L63` | Nb de nettoyage/mois | Recommandé | Champ libre |
| `F66` | Remarques | Facultatif | Champ libre |
| `F69` | Remarques générales | — | Champ libre |
