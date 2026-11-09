# Établissements à plusieurs bâtiments (Martin Perrin) — fait

Retour brut : [retours/retours-cumules.html](../retours/retours-cumules.html),
section « Remarques Martin Perrin ». La même demande revient au n° 7 de
[l'échange du 16/10](2026-10-16-echange.md) et au n° 2 de la
[formation d'Angers](2026-10-06-formation-angers.md).

| # | Demande | État |
|---|---|---|
| 1 | Éviter la double saisie sur un établissement à plusieurs bâtiments | **fait** |
| 2 | Onglet « liste des bâtiments » : nom, date de construction, date de dernière rénovation, bouton d'ajout | **fait** — panneau « Bâtiments de l'établissement » sur l'accueil du projet |
| 3 | Dans cette configuration, où déclare-t-on les utilisations d'eau ? | **tranché le 2026-11-09 : pour l'établissement entier** |
| 4 | Faut-il intégrer les consommations d'eau et d'énergie globales ? | **hors périmètre** (décision du 2026-11-09) |

## L'arborescence retenue

`bâtiment → pièces → points d'eau` (arbitrage du 2026-11-09), posée **par
renvois**, exactement comme les pièces :

- `AppData.Batiments[]` — nom, année de construction, année et travaux de la
  dernière rénovation, remarques ;
- `Piece.Batiment` — identité du bâtiment ;
- `AuditEntity.Batiment` — **seulement** pour les éléments qui ne sont dans
  aucune pièce : réseau ECS, toiture, structure, ventilation, opportunités.
  Cela répond à la question surlignée « quid des réseaux ECS ? ».

**Le bâtiment d'un point d'eau se déduit de sa pièce**, il n'est pas recopié
(`DataService.batimentDeElement`). Une seule vérité par niveau : déplacer une
pièce d'un bâtiment à l'autre emmène ses points d'eau, sans rien à
resynchroniser.

## Ce qui reste comme avant, et c'est voulu

- **Un audit sans bâtiment est un audit d'un seul bâtiment.** C'est le cas
  d'origine et celui de tous les audits déjà en circulation : le JSON ne change
  pas de forme, une version qui ignore `Batiments` continue de le relire.
- **Les utilisations de l'eau restent déclarées pour l'établissement.** Elles ne
  décident que des sections *proposées* ; une section proposée mais vide ne
  coûte rien, là où dix cases à cocher par bâtiment coûteraient à chaque saisie.
- **Supprimer un bâtiment ne supprime ni ses pièces ni ses points d'eau** : ils
  sont détachés, et le nombre est annoncé avant.

## Les deux seuils d'affichage

Rien n'apparaît tant qu'il n'y a pas de raison :

| À partir de | Ce qui apparaît |
|---|---|
| 1 bâtiment | le contexte reste sur le tableau de bord ; une pièce créée lui est rattachée d'office |
| 2 bâtiments | le sélecteur de bâtiment sur une pièce, le filtre par bâtiment sur la liste des pièces, la colonne « Bâtiment » des listes par type, et l'année de construction / rénovation qui passe au niveau du bâtiment |

Les trois champs déplacés (`AnneeConstruction`, `AnneeDerniereRenovation`,
`TravauxDerniereRenovation`) **ne sont jamais effacés** : s'ils étaient déjà
remplis, ils restent consultables et modifiables dans un volet dépliable du
tableau de bord, intitulé « renseignés avant la création des bâtiments ». Une
saisie ne doit pas devenir inatteignable.

## Contrôles

| Commande | Ce qu'elle couvre |
|---|---|
| `npm run check:csv` | la section « Bâtiments de l'établissement », le renvoi d'une pièce vers son bâtiment, le bâtiment **déduit** d'un point d'eau via sa pièce, le renvoi direct d'un élément hors pièce, et un renvoi vers un bâtiment supprimé |
| `npm run check:fusion` | les bâtiments reconnus à leur identité, le bâtiment découvert par le second auditeur, aucune pièce orpheline, et la seconde intégration qui n'ajoute rien. *Vérifié en le cassant : ne plus reconnaître les bâtiments remonte 4 échecs.* |
| `npm run check:smoke` | la colonne « Bâtiment », le filtre des pièces, et le contexte qui passe par bâtiment — sur un audit amorcé à deux bâtiments |

L'export CSV ajoute une ligne calculée « Bâtiment (déduit de la pièce) » sur
chaque point d'eau : sans elle, compter les points d'eau par bâtiment dans un
tableur supposerait de rapprocher trois tables à la main.
