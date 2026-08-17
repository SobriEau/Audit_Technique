# Agencement des pages et liens entre données

Synthèse de la structure décrite par `audit_technique.xlsx` : comment les pages
s'enchaînent, et comment les données se référencent entre elles.

---

## 1. Hiérarchie des pages

Le classeur décrit une arborescence à trois niveaux, parfaitement régulière.

```
Accueil (Visuel)
└── Partie Technique (Visuel)
    ├── Compteur général                    page unique
    ├── Liste SS-compteurs        ──▶ Sous-compteurs1
    ├── Liste Réducteurs de Pression ──▶ Réducteur de Pression1
    ├── Liste Réseaux EF-EC       ──▶ Réseau distribution EFS
    │                              ──▶ Réseau distribution ECS
    │                              ──▶ Production ECS
    │                              ──▶ Stockage ECS
    ├── Liste équipement ECS      ──▶ équipements ECS (v0)
    ├── Liste Robinets            ──▶ Robinet1
    ├── Liste douches-baignoires  ──▶ Douche-baignoire1
    ├── Liste WC                  ──▶ WC1
    ├── Liste Ventilation         ──▶ Ventilation
    ├── Liste Piscine             ──▶ Piscine
    ├── Liste Extérieur           ──▶ Extérieur1
    ├── Collecte eau de pluie              page unique
    ├── Appareils de nettoyage             onglet vide
    ├── Optimisation                       onglet vide
    └── Tableau bord                       synthèse
```

Chaque page porte en `A1` la même note : *« Bouton Home pour retour à la page
d'accueil — Message avertissement enregistrement »*.

---

## 2. Le motif « Liste / Fiche »

C'est le motif structurant, répété à l'identique pour dix entités.

**Page liste** — index des éléments saisis :

- retour vers « Partie Technique » ;
- *« Données reprises sur les pages [Fiche] »* : les colonnes sont alimentées
  par les fiches, ce n'est pas une saisie ;
- *« nombre de ligne à incrémenter au fur et à mesure »* ;
- *« si on clique sur la ligne on revient à la page du [élément] en question »* ;
- un bouton d'ajout, avec message de confirmation.

**Page fiche** — formulaire d'un élément :

- retour vers la page liste correspondante ;
- *« Incrémenter à chaque nouvelle page et l'inverse en cas de suppression »* ;
- *« Enregistrement des données / bascule des infos dans la page liste »* ;
- suppression avec confirmation. Pour les robinets, une question ouverte :
  *« Ajouter l'impossibilité de supprimer la 1ère page ? »*

### Colonnes remontées par entité

| Page liste | Colonnes affichées |
|---|---|
| Liste SS-compteurs | Numéro · Emplacement · Année de pose · Télétransmission · Remarques |
| Liste Réducteurs de Pression | Numéro · Emplacement · Type · Remarques |
| Liste équipement ECS | Numéro · Système ECS · Emplacement · Espaces alimentés · Classe énergétique · Volume ballon · Température ballon · Bouclage · Remarques |
| Liste Robinets | Numéro · Emplacement · Type · Débit (l/min) · Remarques |
| Liste douches-baignoires | Numéro · Type d'équipement · Emplacement · **Robinet correspondant** · Remarques |
| Liste WC | Numéro · Type d'équipement · Emplacement · Particularité · Remarques |
| Liste Ventilation | Numéro · Espaces concernés · Type · Débit (m3/h) · Remarques |
| Liste Piscine | Numéro · Nom · Emplacement · Volume (m3) · Remarques |
| Liste Extérieur | Numéro · Emplacement · Arrosage · Nettoyage · Autre |

---

## 3. Liens entre données

Les entités se référencent **par leur numéro**. C'est le premier champ de chaque
fiche et la première colonne de chaque liste.

| Depuis | Champ | Vers | Cardinalité |
|---|---|---|---|
| Robinet | `Numéro réseau ECS d'appartenance` (G23) | Réseau ECS | 1 → 1 |
| Douche / Baignoire | `Numéro robinet correspondant` (B14) | Robinet | 1 → 1 |
| Piscine | `Numéros des robinets correspondants` (H35) | Robinet | 1 → N |
| Extérieur | `Numéros des robinets correspondants` (H30, H43, H56) | Robinet | 1 → N, par bloc |
| Production ECS | `Numéro de réseau associé` (B9) | Réseau | 1 → 1 |
| Stockage ECS | `Numéro réseau ECS associé` (B10) | Réseau ECS | 1 → 1 |

### Questions laissées ouvertes par les auteurs

- Robinet `I24` : *« préciser le n° d'équipement d'ECS auquel le robinet est
  relié ? Même raisonnement pour les compteurs ? »* — deux relations
  supplémentaires envisagées, non tranchées.
- Liste Piscine `L29` : *« ou ne pas mettre cet encart ici mais juste un appel
  aux numéros des feuilles des espaces extérieurs correspondants ? »*

---

## 4. ⚠️ Le numéro ne peut pas servir de clé

La fiche prescrit : *« Incrémenter à chaque nouvelle page et **l'inverse en cas
de suppression** »*, c'est-à-dire une renumérotation après suppression.

Or toutes les relations du §3 pointent vers ce même numéro. Supprimer le
robinet 2 ferait glisser le robinet 3 en position 2, et **toutes les douches,
piscines et espaces extérieurs qui référençaient le robinet 3 pointeraient
silencieusement vers le mauvais équipement**.

C'est le même piège que celui déjà rencontré sur la localisation des robinets
sur plan, où l'index de tableau a été écarté au profit d'un stockage dans
l'élément.

**Recommandation** : donner à chaque élément un identifiant interne stable,
jamais renuméroté, et ne traiter le « Numéro » que comme un libellé d'affichage.
Les relations pointent vers l'identifiant, pas vers le numéro.

> ✅ **Mis en œuvre.** L'interface `AuditEntity` porte désormais un champ `Id`
> stable, distinct de `Numero`. Les fiches sont adressées par identité
> (`#/qte/robinet/<Id>`), le type `EntityRef` est prévu pour les relations, et
> les audits existants reçoivent leurs identifiants au chargement.
> Voir « Identité des éléments » dans [CLAUDE.md](../../CLAUDE.md).

---

## 5. Correspondance avec l'application Angular

Le motif « Liste / Fiche » **est déjà implémenté**, mais une seule fois :

| Classeur | Angular | État |
|---|---|---|
| Accueil (Visuel) | `/home` — `HomeComponent` | conforme |
| Partie Technique (Visuel) | `/qte` — `QteIndexComponent` | conforme |
| Liste Robinets | `/qte/robinets` — `RobinetsComponent` | conforme |
| Robinet1 | `/qte/robinet/:idx` — `RobinetComponent` | conforme |
| **Toutes les autres entités** | `/qte/:section` — `QteEditorComponent` | **éditeur JSON brut** |

Autrement dit : l'architecture cible existe et fonctionne pour les robinets ; il
reste à l'appliquer aux neuf autres entités, qui présentent aujourd'hui à
l'auditeur un `<textarea>` de JSON.

### Entités du classeur absentes de l'application

`QTE_SECTIONS` ne déclare ni **Piscine**, ni **Collecte eau de pluie**, ni
**Tableau bord**, alors que ces onglets sont renseignés (27, 27 et 7 cellules).

À l'inverse, l'application déclare `appareils_nettoyage_lavage` et
`potentiel_optimisation`, dont les onglets sont **vides** : la spécification
reste à écrire.

---

## 6. Erreurs de copier-coller dans le classeur

À ne pas reproduire telles quelles — une lecture littérale câblerait une
navigation fausse :

- `Liste SS-compteurs` B8 et `Liste Réseaux EF-EC` B8 annoncent *« Données
  reprises sur les pages "Robinet" »* : il faut lire « Sous-compteur » et
  « Réseau ».
- `Douche-baignoire1` G5 indique *« Retour à la page "Liste Robinet" »* : il faut
  lire « Liste douches-baignoires ».
- `Liste Robinets` F34, `Liste SS-compteurs` F34 et `Liste Réseaux EF-EC` F34
  parlent toutes d'*« ajout d'une page pour un réducteur de pression »*.
