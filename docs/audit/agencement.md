# Agencement des pages et liens entre données

Synthèse de la structure décrite par `audit_technique.xlsx` (V2, 2026-08) :
comment les pages s'enchaînent, et comment les données se référencent entre
elles.

> Ce fichier avait pris du retard sur le code même du temps de la V1 du
> classeur (il décrivait encore `QTE_SECTIONS` et un éditeur JSON brut,
> remplacés depuis par le moteur générique `entity-list` / `entity-form`).
> Cette version le remet à jour pour la V2 et pour l'état réel du code.

---

## 1. Hiérarchie des pages

Le classeur décrit une arborescence à trois niveaux. Dix-sept des dix-huit
entités suivent le motif liste puis fiche ; seul le compteur général est une
page unique (pas de « Liste »).

```
Accueil (Visuel)
└── Partie Technique
    ├── Compteur général                          page unique
    ├── Liste SS-compteur          ──▶ Sous-compteur1
    ├── Liste réducteurs de pression ──▶ Réducteur de pression1
    ├── Liste Surpresseurs         ──▶ Surpresseur1
    ├── Liste Réseaux ECS          ──▶ Réseaux ECS
    ├── Liste Prod Stock ECS       ──▶ Production Stockage ECS
    ├── Liste Robinets             ──▶ Robinets
    ├── Liste douches-baignoires   ──▶ Douche-baignoire1
    ├── Liste WC                   ──▶ WC1
    ├── Liste appareils de lavage  ──▶ Appareils de lavage
    ├── Liste Structure            ──▶ Structure1
    ├── Liste ventilation          ──▶ Ventilation1
    ├── Liste Incendie             ──▶ Incendie
    ├── Liste Toiture              ──▶ Toiture1
    ├── Liste Piscines             ──▶ Bassin1
    ├── Liste Extérieur            ──▶ Extérieur1
    ├── Liste Opportunités         ──▶ Opportunités1
    └── Liste Autre                ──▶ Autre1
```

`Liste des documents à collecter` est une page à part, hors de cette
arborescence (une checklist, pas une entité d'audit).

### Disparu depuis la V1

Cinq entités de la V1 n'ont plus d'onglet correspondant dans cette V2 :
**Réseau distribution EFS**, **Production ECS** et **Stockage ECS** (les deux
derniers fusionnés dans « Production Stockage ECS » ci-dessus, sous une
nouvelle clé — la fusion ne conserve les données d'aucun des deux anciens),
**équipements ECS (v0)**, et **Collecte eau de pluie**. Les clés de stockage
correspondantes (`reseaux_efs`, `production_ecs`, `stockage_ecs`,
`equipements_ecs`, `collecte_eau_pluie`) ne sont plus déclarées dans
`audit-schema.ts` : des données saisies sous ces clés resteraient dans le
JSON de l'audit sans qu'aucun écran ne les affiche plus.

### Apparu avec la V2

Six entités sont entièrement nouvelles : **Surpresseur**, **Appareils de
lavage**, **Structure**, **Incendie**, **Toiture**, **Opportunités**, et
**Autre** (sept, en fait — la liste s'allonge). Aucune n'a de clé héritée à
préserver.

---

## 2. Le motif « Liste / Fiche »

C'est le motif structurant, répété pour dix-sept entités (le compteur général
excepté). Rien n'a changé dans ce motif entre la V1 et la V2 :

**Page liste** — index des éléments saisis :

- retour vers « Partie Technique » ;
- les colonnes sont alimentées par les fiches, ce n'est pas une saisie ;
- « nombre de ligne à incrémenter au fur et à mesure » ;
- un clic sur la ligne ramène à la fiche de l'élément ;
- un bouton d'ajout.

**Page fiche** — formulaire d'un élément :

- retour vers la page liste correspondante ;
- « Incrémenter à chaque nouvelle page et l'inverse en cas de suppression » —
  voir §4 pour pourquoi ce numéro ne doit **pas** servir de clé ;
- suppression avec confirmation.

### Colonnes remontées par entité

Choisies parmi les champs que le générateur a effectivement retenus (voir
`listColumns` dans `audit-schema.ts`) ; « Numéro » est systématique et géré
hors de cette table (voir §5).

| Entité | Colonnes |
|---|---|
| Sous-compteur | Emplacement · Année de pose · Télétransmission |
| Réducteur de pression | Emplacement · Année de pose |
| Surpresseur | Emplacement · Année de pose |
| Réseaux ECS | Matériau principal des canalisations · Diamètre des gaines · Bouclage |
| Production / Stockage ECS | Type de système de production · Systèmes de production |
| Robinets | Emplacement · Type · Débit |
| Douche / Baignoire | Type d'équipement · Emplacement |
| WC | Type de toilette ou urinoir · Emplacement · Nombre d'équipements identiques |
| Appareils de lavage | Emplacement · Type |
| Structure | Emplacement · Type de la structure |
| Ventilation | Système de ventilation · Emplacement du système |
| Incendie | Emplacement · Précision emplacement |
| Toiture | Emplacement · Surface de toiture · Toiture accessible |
| Bassin | Nom · Emplacement · Volume du bassin |
| Espace extérieur | Emplacement |
| Opportunités | Emplacement |
| Autre | Choix · Nom · Emplacement |

---

## 3. Liens entre données

Les entités se référencent par un identifiant stable (`Id`), jamais par leur
numéro affiché — voir §4. Le générateur ne sait reconnaître qu'**une seule**
formulation de renvoi vers une autre entité dans les notes du classeur :
« *avec les choix de la liste des [entité]* » (voir `ENTITY_REF_RE` dans
`tools/gen-schema.js`) ; c'est ainsi que les champs ci-dessous sont devenus
des `entity-ref` plutôt que des listes déroulantes à une option absurde.

| Depuis | Champ | Vers | Cardinalité |
|---|---|---|---|
| Robinets | `Numéro réseau ECS d'appartenance` | Réseaux ECS | 1 → 1 |
| Douche / Baignoire | `Numéro réseau ECS d'appartenance` (×2 : douche, baignoire) | Réseaux ECS | 1 → 1 |

### Changement structurel : la douche/baignoire n'a plus de robinet distinct

La V1 référençait un robinet externe (« Numéro robinet correspondant »). La
V2 **décrit le robinet directement dans la fiche Douche/Baignoire** (sa
propre section « Robinet », en fin de fiche, avec Type, Temporisation, Débit,
Diamètre, Matériau, Etat général) : ce n'est plus une relation entre entités
sur cet écran, mais un sous-formulaire dupliqué.

### Relations que l'application ne sait pas encore représenter

`entity-ref` ne stocke qu'un seul `Id`. Or le classeur demande à plusieurs
endroits une référence à **plusieurs** robinets à la fois (« à cocher depuis
la liste des robinets ») :

- Espace extérieur → Robinets, trois fois (« Numéros des robinets
  correspondants », sections arrosage / nettoyage / autre usage) ;
- Appareils de lavage → Robinet, pour le remplissage de l'autolaveuse et du
  matériel de lavage manuel du sol.

Ces notes sont capturées comme un champ texte libre — la donnée n'est pas
perdue, mais rien n'empêche d'y taper autre chose qu'un numéro de robinet, et
rien ne la relie réellement à l'`Id` du robinet visé. Introduire une relation
« un vers plusieurs » suppose un nouveau `FieldKind` et un composant de
sélection multiple : à arbitrer, pas à contourner dans le générateur.

---

## 4. ⚠️ Le numéro ne peut pas servir de clé

Inchangé depuis la V1, et toujours vrai en V2 : la fiche prescrit
d'incrémenter le numéro à l'ajout et de l'inverser à la suppression, alors
que les relations du §3 pointent sur ce numéro dans le texte des notes.
Supprimer un élément ferait glisser silencieusement les références vers
la mauvaise cible.

> ✅ **Mis en œuvre.** L'interface `AuditEntity` porte un champ `Id` stable,
> distinct de `Numero`. Les fiches sont adressées par identité
> (`#/qte/<route>/<Id>`), le type de champ `entity-ref` stocke cet `Id`, et
> les audits antérieurs reçoivent leurs identifiants au chargement
> (`ensureEntityIds()`). Voir « Identité des éléments » dans
> [CLAUDE.md](../../CLAUDE.md).

---

## 5. Correspondance avec l'application Angular

Le motif « Liste / Fiche » est implémenté **une seule fois**, génériquement,
et sert les dix-huit entités :

| Classeur | Angular |
|---|---|
| Accueil (Visuel) | `/home` |
| Partie Technique | `/qte` — `QteIndexComponent`, une carte par entité de `AUDIT_SCHEMA` |
| Liste *(entité)* | `/qte/<route>` — `EntityListComponent`, générique |
| *(entité)* | `/qte/<route>/<Id>` — `EntityFormComponent`, générique |
| Compteur général | `/qte/compteur-general` — `EntityFormComponent` direct (`single: true`, pas de liste) |

Ajouter un champ ou une entité se fait dans le schéma (régénéré depuis le
classeur), jamais dans un composant : voir §8 de `CLAUDE.md`.

---

## 6. Erreurs de copier-coller dans le classeur

La V1 en portait plusieurs (listées dans une version antérieure de ce
fichier, récupérable dans l'historique git). **Cette régénération n'a pas
repassé chaque onglet de la V2 à la recherche du même défaut** — seuls ceux
remontés par les relectures par onglet (voir le rapport de régénération) ont
été vérifiés. Ne pas supposer la V2 indemne sans relecture.
