# WC1

Entité `wc` — route `#/qte/wc`.

22 champ(s), 7 section(s). Colonnes du tableau : `TypeDeToiletteOuUrinoir`, `Emplacement`, `NombreDEquipementsIdentiques`.


## Localisation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F8` | Emplacement (reprendre le nom de la pièce indiquée sur le plan) | Obligatoire | Champ libre |
| `F11` | Précision emplacement | Facultatif | champ libre |

## Utilisateurs

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F15` | Utilisateurs | Obligatoire | A cocher (plusieurs réponses possibles) Public extérieur Personnel Autres adultes Enfants Adolescents Personnes âgées PMR |
| `J15` | Mixte ou genré ? | Obligatoire | Liste déroulante Homme Femme Mixte |

## Caractéristiques

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F18` | Type de toilette ou urinoir | Obligatoire | Urinoir masculin à eau Urinoir masculin sans eau Urinoir féminin sans eau Urinoir féminin à eau Stalle d'urinoir Toilette à eau standard Toilette avec broyeur T |
| `J18` | Nombre d'équipements identiques | Obligatoire | Champ libre |
| `F33` | Type de chasse | Facultatif | Réservoir apparent Réservoir encastré Sans réservoir Non concerné |
| `J33` | Marque ou modèle si connu | Facultatif | Champ libre |
| `F36` | Commande de la chasse | Obligatoire | Liste déroulante : manuelle double chasse manuelle simple chasse manuelle poussoir temporisé à pédale à détection à pas de temps écoulement en continu non conce |
| `J36` | Origine de l'eau | Facultatif | A cocher : Eau potable Eau de pluie Eau forage brute Eau grise |

## Mesures

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F39` | Volume chasse estimé ou connu | Recommandé | Menu déroulant <3 2/4 3/6 6/9 6 9 >9 Inconnu Non concerné |
| `J39` | Volume chasse si mesuré | Recommandé | champs libre |
| `F42` | Teste de la feuille de papier toilette dans la cuvette | Recommandé | liste déroulante : feuille mouillée - fuite observée feuille semi-mouillée - fuite suspectée feuille sèche - pas de fuite |
| `J42` | Date dernier réglage chasse d'eau | Facultatif | champ libre |

## Ventilation

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F45` | Ventilation | Obligatoire | Menu déroulant : pas de ventilation en continu intermittente à détection indépendante du reste du bâtiment |
| `J45` | Test de la feuille de papier sur la bouche d'extraction | Recommandé | Menu déroulant : Feuille aspirée Feuille repoussée Rien ne se passe |

## Opportunités

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F48` | Est-ce que les toilettes ont un mur qui donne sur l'extérieur (sur la parcelle du bâtiment uniquement) ? | Recommandé | non oui oui toutes oui certaines |
| `J48` | Disponibilité d'un local à proximité pour accueillir un composteur | Recommandé | Caches à cocher : non oui à côté, derrière un des murs oui à l'aplomb aux étages inférieurs |

## Etat lors de la visite

| Cellule | Libellé | Priorité | Note du classeur |
|---|---|---|---|
| `F51` | Etat général | Recommandé | Bon Moyen Mauvais |
| `J51` | Date dernière maintenance | Facultatif | Champ Libre |
| `F54` | Dysfonctionnements observés | Recommandé | Cases à cocher : Fuite de la chasse Traces de fuite Bouton chasse cassé ou bloqué Bruits de la chasse en continu Entartrage Odeurs WC bouché Lunette cassée |
| `F57` | Remarques | — | Champ libre |
