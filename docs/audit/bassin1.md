# Bassin1

> Spécification extraite de `audit_technique.xlsx`, onglet « Bassin1 ».
> 45 cellules, 38 notes.

## Rôle de la page

Page de **saisie** : formulaire décrivant un élément de l'audit.

## Champs attendus

| Cellule | Libellé | Type attendu | Valeurs |
|---|---|---|---|
| `I8` | Nom | Texte libre | — |
| `N8` | Emplacement | Liste déroulante | Intérieure · Extérieure · Extérieure avec possibilté d'être couverte |
| `F11` | Précision emplacement et utilisation | Texte libre | — |
| `G14` | Type | Liste déroulante | Enterré · Semi-enterrée · Hors sol avec structure · Hors sol tubulaire · Hors sol autoportée |
| `I14` | Année de construction | Texte libre | — |
| `N14` | Matériaux de revêtement | Liste déroulante | Carrelage · Résine · Liner · Coque · Plaques aluminium |
| `G17` | Type de couverture | Liste déroulante | bâches à bulles (été) · bâche d'hivernage · couverture à barres (4saisons) · volet roulant automatique · volet roulant manuel · abri · terrasse mobile · autre précisé dans remarques |
| `H17` | Année dernière rénovation | Texte libre | — |
| `K17` | Travaux effectués | Texte libre | — |
| `G20` | Présence connue de fuites | Oui / Non | Oui · Non |
| `H20` | Volume estimé des fuites/an | Texte libre | — |
| `K20` | Dysfonctionnements (appoint ou lavage fréquent, pH, pannes régulières, etc.) | Nombre (appoint ou lavage fréquent, pH, pannes régulières, etc.) | — |
| `G23` | Etat général* | Liste déroulante | Bon · Moyen · Mauvais |
| `I23` | Volume du bassin (m3) | Nombre (m3) | — |
| `L23` | Nb de jour d'ouverture /an | Texte libre | — |
| `N23` | Fréquentation journalière | Texte libre | — |
| `H26` | Consigne apport quotidien / baigneur (L) | Texte libre | — |
| `K26` | Volume d'apport quotidien (L) | Texte libre | — |
| `N26` | Mode de remplissage du bassin | Liste déroulante | manuel · automatique avec flotteur |
| `F29` | Origine eau du bassin | Liste déroulante | eau potable · eau de mer · eau souterraine · eau de pluie · eau pluviale · eau de surface |
| `N29` | Température de consigne du bassin (°C) | Nombre (°C) | — |
| `I32` | Désinfection de l'eau (chlore, chlore stabilisé, électrolyse au sel..) | Texte libre | — |
| `L32` | Traitements automatisé | Oui / Non | Oui · Non |
| `N32` | Type de filtration | Texte libre | — |
| `G35` | Nb de lavage de filtre / mois | Texte libre | — |
| `I35` | Volume rejeté / mois (m3) | Nombre (m3) | — |
| `L35` | Nb de vidange/an | Texte libre | — |
| `N35` | Volume rejeté / an (m3) | Nombre (m3) | — |
| `F38` | Possibilité de créer une zone de stockage des eaux rejetées | Oui / Non | Oui · Non |
| `F41` | Remarques | Texte libre | — |

### Listes de valeurs

Ces énumérations sont écrites en toutes lettres dans les notes du classeur. Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence.

**Emplacement**

- Intérieure
- Extérieure
- Extérieure avec possibilté d'être couverte

**Type**

- Enterré
- Semi-enterrée
- Hors sol avec structure
- Hors sol tubulaire
- Hors sol autoportée

**Matériaux de revêtement**

- Carrelage
- Résine
- Liner
- Coque
- Plaques aluminium

**Type de couverture**

- bâches à bulles (été)
- bâche d'hivernage
- couverture à barres (4saisons)
- volet roulant automatique
- volet roulant manuel
- abri
- terrasse mobile
- autre précisé dans remarques

**Etat général***

- Bon
- Moyen
- Mauvais

**Mode de remplissage du bassin**

- manuel
- automatique avec flotteur

**Origine eau du bassin**

- eau potable
- eau de mer
- eau souterraine
- eau de pluie
- eau pluviale
- eau de surface

## Comportements attendus

Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, d'enregistrement ou une question laissée ouverte par les auteurs.

- `E1` Bouton Home pour retour à la page d'accueil - Message avertissement enregistrement
- `I5` **Bassin** — Incrémenter à chaque nouvelle page et l'inverse en cas de suppression
- `M5` **Bassin** — Retour à la page "Liste Piscines"  / - Message avertissement enregistrement
- `L14` **Matériaux de construction** — maçonnés en béton armé,  / maçonné en béton projeté,  / blocs à bancher ou parpaings,  / coque polyester, panneaux modulaires (acier, polymère, aluminium),  / bois, / inox, / composite, / pvc
- `H48` **Enregistrer** — Enregistrement des données / bascule des infos dans la page liste piscines
- `K48` **Enregistrer** — Prise de photo et ajout au dossier
- `L49` **Enregistrer** — Ajout d'un page pour un bassin / - Ajouter  un message de confirmation / - Message avertissement enregistrement
- `M49` **Enregistrer** — Suppression de la page ? / Ajouter un message de confirmation

## Contenu de l'onglet

<details><summary>Cellules non vides</summary>

| Cellule | Contenu |
|---|---|
| `F1` | Audit SOBRIEAU   PARTIE TECHNIQUE |
| `I4` | Bassin |
| `I5` | Numéro |
| `U6` | est-ce intéressant d'avoir le type de circulation des eaux dans le bassin ? Skimmer, à débordement périphérique, à débordemnt partiel, à goulotte |
| `F7` | Nom |
| `K7` | Emplacement |
| `U7` | pour les piscines individuelles, faut-il ajouter la période d'utilisation de la piscine dans l'année ? |
| `U8` | pour les piscines individuelles, faut-il ajouter le nombre de baigneur moyen ? |
| `F10` | Précision emplacement et utilisation |
| `F13` | Type |
| `H13` | Année de construction |
| `K13` | Matériaux de construction |
| `M13` | Matériaux de revêtement |
| `F16` | Type de couverture |
| `H16` | Année dernière rénovation |
| `K16` | Travaux effectués |
| `F19` | Présence connue de fuites |
| `H19` | Volume estimé des fuites/an |
| `K19` | Dysfonctionnements (appoint ou lavage fréquent, pH, pannes régulières, etc.) |
| `F22` | Etat général* |
| `H22` | Volume du bassin (m3) |
| `K22` | Nb de jour d'ouverture /an |
| `M22` | Fréquentation journalière |
| `F25` | Consigne apport quotidien / baigneur (L) |
| `I25` | Volume d'apport quotidien (L) |
| `L25` | Mode de remplissage du bassin |
| `F28` | Origine eau du bassin |
| `K28` | Température de consigne du bassin (°C) |
| `F31` | Désinfection de l'eau (chlore, chlore stabilisé, électrolyse au sel..) |
| `K31` | Traitements automatisé |
| `M31` | Type de filtration |
| `F34` | Nb de lavage de filtre / mois |
| `H34` | Volume rejeté / mois (m3) |
| `K34` | Nb de vidange/an |
| `M34` | Volume rejeté / an (m3) |
| `F37` | Possibilité de créer une zone de stockage des eaux rejetées |
| `F40` | Remarques |
| `F44` | Bon état |
| `G44` | équipement récent, pas de fuite, revêtement en bon état, pas de fissures visibles, pas de décollement, joints en bon état, niveau stable, propre, pas de débordement |
| `F45` | Etat moyen |
| `G45` | équipement plus ancien, revêtement vieillissant, joints localement dégradés, fissures ponctuelles, décollement local, traces d'entartrage, petutes reprises visibles, fuite/surverse intermittente, |
| `F46` | Mauvais état |
| `G46` | équipement ancien, plusieurs fissures significatives, revêtements très dégradés, revêtement percé/déchiré, carrelage décollé, joints dégradés, fuite avérée, baisse anormale du niveau d'eau, skimmer encrassé |
| `H48` | Enregistrer |

</details>
