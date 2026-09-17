# Toiture1

Entité `toitures` — route `#/qte/toitures`.

37 champ(s), 4 section(s). Colonnes du tableau : `Emplacement`, `SurfaceDeToiture`, `ToitureAccessible`.


## En tête de fiche (aucune section)

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Emplacement (partie du bâtiment concernée) | Obligatoire | Champ libre |
| `F11` | Précision emplacement | Facultatif | Champ libre |

## Toiture

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F16` | Toiture accessible ? | Obligatoire | liste déroulante Oui/Non |
| `I16` | Type de toiture | Obligatoire | liste déroulante terrasse pente multiple pans |
| `L16` | Surface de toiture (m²) | Recommandé | Champ libre |
| `F19` | Matériau de couverture | Recommandé | liste déroulante tuiles terre cuite tuiles béton ardoises bac acier zinc aluminium membrane bitumineuse PVC/EPDM fibrociment toiture végétalisée chaume verre/vi |
| `I19` | Pente de toiture (% ou °) | Facultatif | Champ libre |
| `L19` | Nombre de pans de toiture | Recommandé | Champ libre |
| `F22` | Présence d'obstacles (cheminées, lanterneaux, équipements techniques, panneaux photovoltaïques, etc.) | Facultatif | Champ libre |
| `F25` | Si fibrociment, présence d'amiante ? | Recommandé | liste déroulante O/N |
| `I25` | Présence de plomb ou métaux lourds | Recommandé | Liste déroulante Oui/Non |
| `L25` | Présence de traitement (hydrofuge, biocide, cool roof) | Recommandé | Liste déroulante oui/non |
| `F28` | Etat de la toiture (accumulation de mousses, fientes, feuilles, poussières industrielles, etc) | Facultatif | Champ libre |
| `F31` | Arbres à proximité pouvant apporter des feuilles ? | Facultatif | liste déroulante Oui/Non |
| `J31` | Sources de pollution à proximité (axe routier, industries, cheminées, port, etc.) | Facultatif | Liste déroulante oui/non |

## Les gouttières et chéneaux

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F35` | Type de gouttières | Facultatif | plusieurs cases à cocher pendante nantaise havraise anglaise |
| `I35` | Accessibilité des gouttières | Recommandé | liste déroulante Oui / non |
| `L35` | Matériau des gouttières | Facultatif | liste déroulante PVC, Zinc, aluminium, béton acier galvanisé, plomb pierre terre cuite fonte, cuivre |
| `F45` | Type de cheneaux | Facultatif | plusieurs cases à cocher sur un versant contre un mur sur entablement entre deux pans de toiture |
| `I45` | Accessibilité des cheneaux | Recommandé | liste déroulante Oui / non |
| `L45` | Matériau des gouttières | Facultatif | liste déroulante PVC, Zinc, aluminium, béton acier galvanisé, plomb pierre terre cuite fonte, cuivre |
| `F56` | Etat des gouttières et chéneaux (déformation, affaissement, mauvaise pente, fixations dégradés, joints dégradés, corrosion, encrassement, etc.) | Recommandé | Champ libre |

## Les descentes

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F60` | Type de descentes | Obligatoire | liste déroulante apparente (façade), encastrée (mur ou gaine technique) |
| `I60` | Nombre de descentes | Obligatoire | champ libre |
| `L60` | Matériau | Facultatif | liste déroulante PVC, Zinc, aluminium, acier galvanisé, fonte, cuivre |
| `F63` | Etat des descentes (déformation, affaissement, mauvaise pente, fixations dégradésn joints dégradés, corrosion, encrassement, etc.) | Recommandé | Champ libre |
| `F66` | Hauteur des descentes (m) | Facultatif | Champ libre |
| `J66` | Diamètre des descentes (m) | Recommandé | champ libre |

## Autres

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F70` | Présence de regards accessibles en pied de descente | Facultatif | liste déroulante Oui/Non |
| `K70` | Présence d'avaloirs en pied de descente | Facultatif | liste déroulante Oui/Non |
| `F73` | Les évacuations des descentes se regoupent-elles en un seul point ? | Recommandé | liste déroulante Oui/Non |
| `L73` | Présence d'une grille ou crapaudine sur les gouttières | Recommandé | liste déroulante Oui/Non |
| `F76` | Dispositif de prétraitement existant | Facultatif | liste déroulante aucun, séparateur premières pluies, filtre sur descente, filtre au sein d'un regard |
| `L76` | Si dispositif de prétraitement, noter le modèle et la maille de filtration | Facultatif | champ libre |
| `F79` | Evacuation actuelle des eaux de pluie | Recommandé | liste déroulante réseau séparatif pluvial réseau unitaire rejet en surface rejet dans un fossé noue d'infiltration puits d'infiltrtion bassin autre |
| `L79` | Contraintes réglementaires locales (monuments, PLU,etc.) ? | Facultatif | Champ libre |
| `F82` | Remarques | — | Champ libre |
