# Agencement des pages et liens entre données

Synthèse de la structure décrite par `audit_technique.xlsx` (**V3, 2026-08**) :
comment les pages s'enchaînent, et comment les données se référencent entre
elles.

> **Écrit à la main**, contrairement aux autres fichiers de ce dossier. Il ne
> répète donc **aucun fait mécanique** — nombre de champs, colonnes de tableau,
> listes de valeurs. Ces éléments vivent dans les fichiers générés, qui sont
> toujours à jour ; les recopier ici les ferait diverger, ce qui est exactement
> ce qui était arrivé à la version précédente de ce document.
>
> Pour les faits : `README.md` (index par onglet), `referentiel-listes.md`
> (valeurs), et `src/app/models/audit-schema.ts` (schéma effectif).

---

## 1. Hiérarchie des pages

La V3 décrit son arborescence dans le fil d'Ariane que porte chaque onglet
(« Accueil - Généralités - Tableau de bord - Robinets - Robinet 1 »). Quatre
écrans encadrent les fiches :

```
 Accueil                     choix du projet          → #/accueil
└── Généralités              accueil du projet ouvert → #/home
    ├── Documents collectés  documents à réunir       → #/documents
    └── Tableau de bord      contexte + navigation    → #/qte
        ├── Compteur général                     fiche unique
        ├── Liste SS-compteur      ──▶ Sous-compteur1
        ├── Liste Réseaux ECS      ──▶ Réseaux ECS
        ├── Liste Prod Stock ECS   ──▶ Production Stockage ECS
        ├── Liste Robinets         ──▶ Robinets
        ├── Liste douches-baignoires ──▶ Douche-baignoire1
        ├── Liste WC               ──▶ WC1
        ├── Liste appareils de lavage ──▶ Appareils de lavage
        ├── Liste Incendie         ──▶ Incendie
        ├── Liste Espaces extérieurs ──▶ Extérieur1
        ├── Liste Piscines         ──▶ Bassin1
        ├── Liste Toiture          ──▶ Toiture1
        ├── Liste Structure        ──▶ Structure1
        ├── Liste ventilation      ──▶ Ventilation1
        ├── Liste Opportunités     ──▶ Opportunités1
        └── Liste Autre            ──▶ Autre1
```

Seize fiches du classeur, dont quinze suivent le motif « liste puis fiche » ;
seul le compteur général est une page unique.

### Ce que la V3 a retiré

Deux entités de la V2 n'ont plus d'onglet, et ne sont pas traitées de la même
façon :

- **Réducteur de pression** est replié dans la fiche « Compteur général », en
  bloc conditionnel (`H43` : « Présence d'un réducteur de pression à
  proximité ? », note `H44` : « Si oui, afficher les champs du dessous »). Six
  de ses dix-sept champs survivent, et il cesse d'être répétable. Sa fiche à
  part est retirée du schéma — décision Sacha, 2026-09.
- **Surpresseur** n'a aucun équivalent : il n'en reste qu'une question oui/non
  sur la fiche Incendie (`F19`). Il est **conservé**, champs figés depuis la V2,
  masqué par défaut sur l'accueil du projet et réactivable d'une case.

La migration locale du 2026-08-24 supprimait aussi le surpresseur ; celle
d'origin/main du 2026-09-14 le conservait. La fusion a retenu la seconde — voir
`fusion-origin-main.md` à la racine.

### Ce qui s'ajoute aux fiches du classeur

- **La zone piscine** — pédiluve et nettoyage des plages. L'onglet « Liste
  Piscines » porte ces champs sous le tableau des bassins, parce qu'ils valent
  pour toute la zone et non pour chaque bassin. Ils s'affichent en tête de la
  page « Piscines ».

---

## 2. Le motif « Liste / Fiche »

C'est le motif structurant, répété pour quinze entités. Rien n'y a changé
depuis la V1 :

**Page liste** — index des éléments saisis :

- retour vers le tableau de bord ;
- les colonnes sont alimentées par les fiches, ce n'est pas une saisie ;
- un clic sur la ligne ramène à la fiche de l'élément ;
- un bouton d'ajout, et la duplication d'un élément existant.

**Page fiche** — formulaire d'un élément :

- retour vers la page liste correspondante ;
- « Incrémenter à chaque nouvelle page et l'inverse en cas de suppression » —
  voir §4 pour pourquoi ce numéro ne doit **pas** servir de clé ;
- suppression avec confirmation.

Les colonnes de chaque tableau sont déclarées dans `cols`
(`tools/lib/classeur.js`) et reprises en `listColumns` dans le schéma.
`check-coverage.js` vérifie qu'elles désignent toutes un champ existant : une
colonne orpheline serait simplement omise, sans erreur ni trou visible.

### Ce que la V3 a ajouté au motif

- **Des sections.** Chaque fiche est découpée en blocs (« Localisation »,
  « Utilisations », « Caractéristiques », « Mesures », « Etat lors de la
  visite »…). Une fiche peut compter 77 champs ; d'un seul tenant, elle était
  illisible.
- **Une exigence par question** — obligatoire, recommandé, facultatif. Elle
  sert trois fois : pastille après l'intitulé, niveau de remplissage choisi
  sur l'accueil (qui masque les champs les moins exigés), et validation de la
  fiche (qui refuse un champ obligatoire vide, dans les blocs qui concernent
  l'élément).

Ni l'une ni l'autre n'est déclarée en toutes lettres : les sections se
reconnaissent à la mise en forme des cellules, les exigences à une cellule
placée à droite du libellé. Voir `tools/lib/classeur.js`.

---

## 3. Liens entre données

Les entités se référencent par un identifiant stable (`Id`), jamais par leur
numéro affiché — voir §4.

La V3 emploie **huit** tournures pour huit renvois. Cinq désignent une cible
unique et deviennent des champs `entity-ref` ; les trois autres sont au pluriel
(« Numéros des robinets correspondants », à cocher) et **aucun mécanisme ne les
couvre** : `entity-ref` ne stocke qu'un seul `Id`. Ils restent donc en texte,
mais portent un `warn` qui le dit à l'écran — plutôt qu'une référence qui
enregistrerait une cible sur trois sans prévenir.

Deux de ces tournures seulement passent par la note (« avec les choix de la
liste des réseaux ECS ») ; les autres ne sont annoncées que par le libellé, la
note se bornant à « Champ libre ».

---

## 4. `Id` contre `Numero`

Le classeur prescrit de renuméroter les éléments après une suppression. Les
relations qu'il décrit pointent pourtant sur ce numéro : s'y fier ferait
glisser silencieusement un élément vers la mauvaise cible dès la première
suppression.

L'application sépare donc les deux : `Id` est l'identité technique, attribuée
une fois et jamais réattribuée ; `Numero` n'est qu'un libellé affiché. Les URL
de fiche et toutes les références croisées passent par `Id`.

---

## 5. Affichage conditionnel des sections

L'accueil du projet fait cocher **dix utilisations de l'eau** (Généralités
`B33`), et le tableau de bord n'affiche que les sections correspondantes. La
correspondance n'est ni bijective ni déductible — trois usages de lavage
commandent la même section, l'eau chaude sanitaire en commande deux, et sept
sections s'affichent toujours. Elle est donc écrite à la main dans
`src/app/models/utilisations-eau.ts`.

Deux garde-fous : une section **déjà remplie** reste affichée même non cochée,
et les audits antérieurs à ce changement conservent l'ancien régime
(`EquipementsPresents`), où une clé absente valait « présent ».

Le classeur décrit d'autres affichages conditionnels **à l'intérieur** des
fiches : le bloc réducteur du compteur général, les parties Douche et
Baignoire, les quatre types d'appareils de lavage. Ils sont **déclarés** (les
`blocs` d'`ENTITIES`) et la validation en tient compte : un champ obligatoire
n'est exigé que si son bloc concerne l'élément. Ils ne sont pas encore
**appliqués à l'affichage** : tous les champs de la fiche restent visibles.
