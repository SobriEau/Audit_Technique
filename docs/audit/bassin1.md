# Bassin1

Entité `piscines` — route `#/qte/piscines`.

30 champ(s), 5 section(s). Colonnes du tableau : `Emplacement`, `VolumeDuBassin`.


## Localisation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Nom usuel du bassin | Recommandé | Champ libre |
| `K8` | Emplacement | Obligatoire | Liste déroulante : Intérieure Extérieure Extérieure avec possibilté d'être couverte |

## Utilisations

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F11` | Nb de jour d'ouverture /an | Recommandé | Champ libre |
| `H11` | Fréquentation journalière | Recommandé | Champ libre |
| `K11` | Utilisateurs | Recommandé | A cocher (plusieurs réponses possibles) Tout public Adultes Enfants Adolescents Personnes âgées Patients |

## Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F14` | Type | Facultatif | Liste déroulante Enterré Semi-enterrée Hors sol avec structure Hors sol tubulaire Hors sol autoportée |
| `H14` | Année de construction | Facultatif | Champ libre |
| `K14` | Matériaux de construction | Facultatif | maçonnés en béton armé, maçonné en béton projeté, blocs à bancher ou parpaings, coque polyester, panneaux modulaires (acier, polymère, aluminium), bois, inox, c |
| `M14` | Matériaux de revêtement | Facultatif | Liste déroulante Carrelage Résine Liner Coque Plaques aluminium autre |
| `F17` | Type de couverture | Recommandé | liste déroulante aucune bâches à bulles (été), bâche d'hivernage, couverture à barres (4saisons), volet roulant automatique, volet roulant manuel, abri, terrass |
| `H17` | Volume du bassin (m3) | Recommandé | Champ libre |
| `K17` | Origine eau du bassin | Recommandé | liste déroulante eau potable, eau de mer, eau souterraine, eau de pluie, eau pluviale, eau de surface |
| `M17` | Mode de remplissage du bassin | Facultatif | liste déroulante manuel automatique avec flotteur |
| `F20` | Consigne apport quotidien / baigneur (L) | Obligatoire | Champ libre |
| `H20` | Volume d'apport quotidien (L) | Obligatoire | Champ libre |
| `K20` | Température de consigne de l’air (°C) | — | — |
| `M20` | Température de consigne du bassin (°C) | Recommandé | Champ libre |

## Traitement et vidange

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F23` | Désinfection de l'eau (chlore, chlore stabilisé, électrolyse au sel..) | Recommandé | Champ libre |
| `K23` | Traitements automatisé | Recommandé | Liste déroulante O/N |
| `M23` | Type de filtration | Recommandé | Champ libre |
| `F26` | Nb de lavage de filtre / mois | Recommandé | Champ libre |
| `H26` | Volume rejeté / mois (m3) | Recommandé | Champ libre |
| `K26` | Nb de vidange/an | Recommandé | Champ libre |
| `M26` | Volume rejeté / an (m3) | Recommandé | Champ libre |
| `F29` | Possibilité de créer une zone de stockage des eaux rejetées | Facultatif | Liste déroulante O/N/ existe déjà |

## Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F32` | Présence connue de fuites | Recommandé | Liste déroulante O/N |
| `H32` | Volume estimé des fuites/an | Recommandé | Champ libre |
| `L32` | Etat général* | Recommandé | Liste déroulante Bon Moyen Mauvais |
| `F35` | Dysfonctionnements (appoint ou lavage fréquent, pH, pannes régulières, etc.) | Recommandé | Champs libre |
| `F38` | Remarques | — | Champ libre |
