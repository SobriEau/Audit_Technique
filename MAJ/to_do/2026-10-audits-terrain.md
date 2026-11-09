# À faire — retours des audits de terrain (2026-10)

Retour brut : [retours/retours-cumules.html](../retours/retours-cumules.html),
sections « Retours audit Stade le Parco », « Retours audit Camping Au port
Punay » et « Retours audit port de plaisance ».

Demandes courtes et précises, nées de bâtiments que le classeur n'avait pas
anticipés — un stade, un camping, un port. **Presque toutes passent par le
classeur** (`MAJ/classeurs/audit_technique.xlsx` puis `npm run gen`) : le schéma
est généré, une retouche à la main serait perdue (CLAUDE.md §8).

## Stade le Parco

| # | Demande | État | Vérifié |
|---|---|---|---|
| 1 | Ventilation des WC : ajouter le choix « naturelle » | **fait** | `WC1!F45`, en deuxième position de la liste. |
| 2 | Champ « remarques générales » dans la pièce | **fait** | `Piece.Remarques` existe, affiché en tête de la page d'une pièce. |
| 3 | Choix « impossible » au test de la feuille (bouche d'extraction WC) | **fait** | « test impossible » ajouté (`WC1!J45`). |
| 4 | « Opportunités à documenter » : passer d'obligatoire à recommandé | **fait** | `REQUIREMENT_OVERRIDES`, `Opportunités1!I11`. |
| 5 | Ajouter « autre » aux appareils de lavage (Karcher) | **fait** | `Appareils de lavage!E8`. Aucune rubrique conditionnelle ne s'ouvre sur « autre » : la fiche se limite aux champs communs, les remarques accueillent le détail. |
| 6 | Adapter « lavage manuel » aux véhicules | **fait** | « véhicules » ajouté au type de zone lavée, « carrosserie de véhicule » au type de surface (`E138`, `H138`). |
| 7 | Plusieurs réponses au « pilotage de l'arrosage » | **fait** | `MULTIPLES_IMPOSES`, `Extérieur1!I41`. Une réponse unique déjà saisie est relue comme une case cochée. |
| 8 | Adapter la partie arrosage aux stades | **à arbitrer — toujours ouvert** | Demande large : pelouse sportive, arrosage enterré, volumes sans commune mesure avec un espace vert. À préciser avant de toucher au classeur. Non tranché au 2026-11-09. |

## Camping Au port Punay

| # | Demande | État | Vérifié |
|---|---|---|---|
| 1 | Douchette dans les WC | **fait** | `PresenceDUneDouchette`, oui/non, facultatif (`WC1!F34`). |

## Port de plaisance (Elisa)

| # | Demande | État | Vérifié |
|---|---|---|---|
| 1 | Champ « remarques » dans les mesures de débit, surtout avec plusieurs équipements identiques | **à faire** | Les trois essais ne portent que temps, volume et mesure directe (`kind: 'mesures-debit'`). Une remarque par série demande d'étendre le type dans `field.models.ts` **et** dans `audit-field`, puis de l'éprouver à l'export — ce n'est pas un ajout de classeur. Le champ « Remarques » de la fiche accueille le détail en attendant. |
