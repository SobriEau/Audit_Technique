# À faire — formation d'Angers (06/10/2026) et retours des groupes

Retour brut : [retours/retours-cumules.html](../retours/retours-cumules.html), sections
« Formation Angers 06/10 », « Groupe Elisa, Victor, Léana », « Groupe Élise
Pauline Louise » et « Notes REX ».

C'est le retour le plus volumineux du document, et le plus hétérogène : des
bugs, des demandes d'ergonomie, des champs manquants, et beaucoup de notes de
**méthode d'audit** qui ne concernent pas le logiciel. Les quatre sont séparées
ci-dessous — mélangées, les notes de méthode noieraient les six bugs.

---

## 1. Bugs signalés

Ces cinq points demandent **une confirmation de terrain** avant d'être traités :
plusieurs décrivent peut-être le même symptôme.

Le document brut porte, **en rouge, les questions de l'auteur aux auditrices** —
quel navigateur ? sur téléphone, autorisation totale ou restreinte ? quel mode
photo ? version du dépôt ou version téléchargée ? l'ancien audit figurait-il
encore dans la liste ? étaient-elles sur le même OS ? Ces rouges ne sont pas des
tâches : ce sont les réponses qui manquent pour savoir quoi corriger.

| # | Symptôme | État | Analyse |
|---|---|---|---|
| 1 | Photos : accès refusé malgré l'autorisation ; obligé de prendre puis télécharger | **à reconfirmer** | L'autorisation caméra **n'est pas mémorisée** en `file://` : une origine opaque n'a pas de fiche de permissions, elle est à redonner à chaque ouverture (CLAUDE.md §4, mesuré). Si c'est bien cela, c'est écrit à l'écran et il n'y a rien à corriger ; sinon, il faut le navigateur et l'OS. |
| 2 | Charger une photo depuis le navigateur ne marche pas, la prendre en direct marche | **à reconfirmer** | Deux chemins distincts dans le code : `getUserMedia` (prise de vue) et le champ de fichier natif. Le second a été signalé comme défaillant **sous Firefox** par Victor, fonctionnel sous Chrome. À confirmer : même navigateur ? |
| 3 | Connexion perdue pendant le questionnaire, tout à recommencer | **à reconfirmer** | L'application ne fait aucune requête réseau dans son chemin nominal (CLAUDE.md §2) : une perte de connexion ne devrait rien effacer. Décrit probablement le n° 4. |
| 4 | Retour au menu = redémarrer l'audit | **probablement corrigé** | Le registre des audits conserve chaque audit à part et retient celui qui est ouvert (`sobrieau.current`, CLAUDE.md §4). Revenir à l'accueil et rouvrir l'audit ne perd plus rien. **À reconfirmer sur le terrain** : le retour est antérieur au registre. |
| 5 | Interfaces différentes entre deux auditrices | **à reconfirmer** | Même OS, même navigateur, même version du fichier ? Une version téléchargée plus ancienne que celle du dépôt suffit à l'expliquer. |
| 6 | Export CSV : alerte quand un champ contient à la fois « ; » et des guillemets | **réglé** | Vérifié : la cellule est entourée de guillemets et les guillemets internes doublés (RFC 4180), et l'aller-retour est fidèle sur les quatre cas éprouvés. `npm run check:csv` porte ces cas. |

## 2. Structure et ergonomie

| # | Demande | État | Où / pourquoi |
|---|---|---|---|
| 1 | Repérage difficile : trier par zone ou par pièce | **fait** | Les pièces existent (`#/pieces`, CLAUDE.md §3bis). |
| 2 | `bâtiment → étages/réseaux ECS + opportunités + toiture + structure → pièces d'eau → type de point d'eau` | **fait** | Les bâtiments et les pièces existent ; une pièce se rattache à un bâtiment, un point d'eau à une pièce, et une entité qui n'est dans aucune pièce (réseau ECS, toiture, structure, ventilation, opportunités) se rattache directement au bâtiment — ce qui répond à la question surlignée « quid des réseaux ECS ? ». Le `Niveau` d'une pièce reste un champ libre : l'étage n'est pas un niveau de l'arborescence. |
| 3 | Barre de progression par ligne, pour voir qu'elle est validée | **fait** | Colonne « État » de chaque liste : deux pastilles — champs obligatoires restants, et présence d'une photo. La complétude s'appuie sur `champsManquants()`, la fonction même qui refuse l'enregistrement : l'indicateur ne peut pas annoncer « complet » là où la validation dirait l'inverse. |
| 4 | Pouvoir déplacer une ligne dans la liste | **fait** | Flèches ↑ ↓ sur chaque ligne (`DataService.moveEntity`). Les **numéros ne suivent pas** : `Numero` est un libellé que l'auditeur a peut-être noté sur place, et les renvois désignent l'`Id`. |
| 5 | Liste déroulante des emplacements à la création | **sans objet** | L'auteur du retour l'annote lui-même : disparaît avec le fonctionnement par pièce. |
| 6 | Accès extérieur à renseigner par bloc, pas par toilette | **sans objet** | Idem — annoté comme tel. |
| 7 | Fonction dupliquer, voir le pré-rempli, changer l'emplacement | **fait** | Bouton « Dupliquer » de chaque liste. Les photos ne sont pas recopiées, à dessein (CLAUDE.md §3). |
| 8 | Champs obligatoires en haut | **tranché le 2026-11-09 : rien à faire** | « On reste sur le format défini initialement avec l'Excel. » La position des champs **est** la spécification du classeur : chaque champ porte son numéro de ligne Excel, et ceux qui la partagent sont rendus côte à côte (CLAUDE.md §8). Les remonter séparerait des champs que le classeur apparie exprès, viderait des rubriques, et désynchroniserait l'écran de la fiche papier. Le besoin reste servi par le **niveau de remplissage** « Minimale », qui n'affiche que les champs obligatoires dans leur ordre et leurs rubriques. |
| 9 | Dire, sur un champ obligatoire, si on est confiant de l'information | **à faire** | Aucun mécanisme de confiance par champ. Demande structurante : une seconde donnée par réponse. |
| 10 | Prod ECS : caractéristiques découplées des robinets, gênant | **à faire** | Voir n° 3 de la section suivante. |

## 3. Champs et contenus manquants

**Tous ces points passent par le classeur**, pas par le code :
`audit-schema.ts` est **généré** depuis `MAJ/classeurs/audit_technique.xlsx`
(CLAUDE.md §8). Il faut corriger le classeur puis `npm run gen` — une
modification à la main serait perdue à la régénération.

| # | Demande | État | Vérifié |
|---|---|---|---|
| 1 | Marque du robinet | **fait** | `MarqueDuRobinet`, facultatif, rubrique Caractéristiques (`CHAMPS_AJOUTES`, `Robinets!F37`). |
| 2 | Pression au robinet | **fait** | `PressionMesureeAuRobinet` (bar), facultatif, rubrique Mesures (`Robinets!F46`). |
| 3 | Champ pression dans le compteur général (pression chaufferie) | **fait** | `PressionMesureeAuCompteurGeneral` (bar), facultatif (`Compteur général!H21`). |
| 4 | Classes métrologiques : ajouter 1, 2, 3, 4 | **fait** | En tête de `CLASSE_METROLOGIQUE` (`value-lists.ts`), devant les Classe A–D et les R. |
| 5 | Ventilation des WC : ajouter le choix « naturelle » | **fait** | `OPTION_OVERRIDES`, `WC1!F45`, placé en deuxième position. |
| 6 | Test de la feuille sur la bouche d'extraction : ajouter « impossible » | **fait** | « test impossible » ajouté (`WC1!J45`) : la bouche est souvent hors de portée, et « rien ne se passe » ne dit pas la même chose. |
| 7 | Temporisation des urinoirs | **fait** | `TemporisationDesUrinoirs` (s), facultatif (`WC1!F32`). |
| 8 | Supprimer « Présence d'un limiteur de débit » | **fait** | Retiré des **trois** fiches où il figurait : robinet, douche, baignoire (`CHAMPS_RETIRES`). ⚠️ Cela défait la demande de Victor Ledoux (2026-09) de le passer en facultatif ; le retour d'Angers est postérieur et explicite. Les réponses déjà saisies restent dans le JSON et sortent toujours à l'export, qui suit les données et non le schéma. |
| 9 | Supprimer « Informations sur le bec du robinet » (jamais renseigné) | **tranché le 2026-11-09 : on garde** | « Pas de suppression de bec du robinet. » Le champ reste, en `facultatif` : il n'est donc jamais exigé et disparaît des niveaux allégés. |
| 10 | Supprimer « forme des urinoirs », se fier à la photo | **sans objet** | Aucun champ de ce nom dans le schéma actuel. |
| 11 | Illustrations des robinets de douche ; ajouter « eau mitigée » | **à faire — bloqué** | `gen-illustrations.js` découpe les images **du classeur** : il faut d'abord que les photos y soient posées. Rien à coder en attendant. |
| 12 | Onglet « chaufferie » pour lister les appoints | **à faire — bloqué** | C'est une **nouvelle fiche du classeur** : son nom, ses rubriques, ses champs et leurs exigences sont à écrire là-bas. Les inventer ici reviendrait à décider du contenu d'un document qui ne m'appartient pas. |
| 13 | Demander le carnet de chaufferie dans les documents à collecter | **à faire — classeur** | `documents-collectes.ts` est généré depuis l'onglet « Documents collectés » : la ligne s'ajoute là. Six lignes « Autre, préciser » permettent d'y pourvoir en attendant. |
| 14 | Suivi des interventions de plomberie dans les documents | **fait** | Présent dans la liste. |
| 15 | Fontaine et machine à café | **fait** | Prévus dans l'entité « Autre », comme annoté. |
| 16 | Lier un petit ballon à un robinet ; lier une douche à un ballon **et** un réseau | **à faire — après l'arbitrage n° 17** | Seul `Numéro réseau ECS d'appartenance` existe. Lier à un ballon suppose un renvoi de plus ; lier à deux cibles suppose le type `entity-ref-multi` qui manque (CLAUDE.md §3). |
| 17 | Confusion ballon / réseau, appartenance ECS à revérifier | **à arbitrer — toujours ouvert** | Question de modèle, à trancher avant le n° 16 : quoi se rattache à quoi. Non tranché au 2026-11-09. |
| 18 | Enlever pente de toit et gouttières si toiture plate | **à faire — demande un arbitrage** | Un bloc conditionnel agit sur une **rubrique entière**, pas sur un champ. « Pente de toiture » est dans la rubrique « Toiture » avec la surface et le matériau : on ne peut pas la masquer seule. Et la rubrique « Les gouttières et chéneaux » mêle les deux — or un chéneau concerne précisément une toiture-terrasse. Masquer la rubrique ferait donc disparaître des questions pertinentes. À trancher : séparer les gouttières des chéneaux dans le classeur, ou ajouter une condition par champ. |
| 19 | Passer la température ECS en optionnel | **fait** | `TemperatureMaxEcs` est en `facultatif` sur les robinets. |
| 20 | Champ « arrivée d'eau tiède / chaude » pour le risque légionelle | **fait sur les robinets** | `ArriveeDeLEauChaude` : froide / tiède / chaude / très chaude / pas d'eau chaude (`Robinets!J46`), en complément de la température max déjà mesurée. L'équivalent sur les douches attend confirmation — la note REX dit « robinet/douche » sans trancher. |
| 21 | Points de vigilance (vide sanitaire, danger) | **à faire — bloqué** | Même nature que le n° 12 : il faut décider où cela vit dans le classeur. |
| 22 | Onglet opportunités pré-rempli depuis la prévisite | **abandonné le 2026-11-09** | « Oublie le préremplissage des opportunités. » Les notes REX hésitaient déjà (« pas sûr pour pré-remplir avec info questionnaire pré-audit »). |

## 4. Hors outil — méthode, protocole, matériel

Conservé ici parce que c'est la matière d'un **protocole d'audit**, pas d'un
développement : rien à faire dans le code, mais rien à jeter non plus.

- **Méthode** : commencer par Compteur, puis Ballon, puis Points d'eau ; commencer
  par les réseaux si on a les plans ; douches en partant de la plus éloignée du
  ballon ; être deux est nécessaire ; durées observées (20 min le 1er robinet,
  40 min par bloc sanitaire).
- **Préparation** : démarrer l'application avant la visite, demander les badges,
  savoir qui a les clés de la chaufferie, repérer l'arrivée d'eau, identifier les
  ballons ECS pour distinguer logique réseau et connexion ballon, reporter ce
  qu'on sait de la prévisite.
- **Matériel** : sacs séparés plans / matériel, torchon, serpillière, gants,
  pince (limiteur), thermomètre, cale-porte ; tablette plutôt non.
- **Protocole de mesure** : sécher le bol des WC puis poser le papier pendant les
  mesures de débit ; 2 mesures minimum, 4 ou 5 au pot ; débit des WC impossible
  au seau ; pression impossible avec mousseur ; température de ballon (min 55 °C)
  et étiquettes parfois illisibles ; protocole photo (prendre quand il y a une
  différence) ; attention aux étages « identiques » qui ne le sont pas.
- **Questions de fond** restées ouvertes : que fait-on de ces données et
  pourquoi ; faut-il tout mesurer ; comment analyser les remarques ; audit
  restauration ; formation sur les termes (mitigeur / ECS).
- **Observations pour les préconisations** (et non des champs) : petite chasse
  souvent hors service, ballon sous évier de 15 L minimum, doseur d'entretien,
  enjeu des fontaines à eau, CTA adiabatique ≈ 40 L/h, réseau d'alerte sur les
  variations de pression.

Le retour brut pose lui-même la question : « ces observations, ce sont des
constats pour les préconisations, ou des choses que l'outil devrait permettre de
saisir ? » Elle n'est pas tranchée.
