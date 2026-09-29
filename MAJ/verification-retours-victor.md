# Vérification des retours de Victor Ledoux — test du fichier HTML (2026-09)

Source : [to_do/retours_test_html_victor.txt](to_do/retours_test_html_victor.txt).
Vérifié le 2026-09-29, remarque par remarque, sur l'état non commité de `main`
(schéma régénéré, `index.html` reconstruit).

**Méthode.** Chaque remarque a été contrôlée de deux façons :

- **un script de contrôle** qui lit le schéma généré et les sources, et vérifie
  la présence de ce qui est demandé — 135 contrôles, **135 satisfaits** ;
- **un parcours dans Chrome**, sur une copie du fichier autonome ouverte en
  `file://` avec un audit préparé : clics, saisies, lecture de l'écran et du
  stockage. Il couvre les comportements que le schéma seul ne prouve pas
  (masquage des rubriques, calcul du débit, champ « Autre », migration du
  compteur général, totaux).

Contrôles du projet, tous passés : génération (`npm run gen`),
`check:exigences`, `check:coverage`, `npm run build`, `check:extract`,
`check:smoke`.

Les lignes 16 et 22, ainsi que les incises de Sacha dans les lignes 62 et 91,
sont des réponses de Sacha à Victor : elles ne sont pas traitées comme des
demandes.

**Légende.** ✅ fait · 🔶 fait, avec une interprétation à confirmer ·
❌ non fait · ➖ rien à faire.

---

## Généralités

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 6 | Export JSON / import sur téléphone fonctionne | ➖ | Constat. |
| 7 | Bouton « Télécharger index » absent sur Chrome ordinateur | 🔶 | Cause probable corrigée : la page prenait les scripts injectés par les **extensions** du Chrome de bureau pour des fichiers externes et refusait la copie. Elles sont désormais ignorées, et retirées de la copie. Non reproduit faute du poste de Victor ; la copie reste identique au livrable (`check:extract`). |
| 8–9 | Photos « fichiers voisins » : échec sur Firefox (PC) et Chrome (téléphone) | ❌ | Non diagnostiqué : la capture d'écran jointe n'est pas disponible. Le mode reste expérimental. |
| 10 | Micro introuvable sur /e/OS | 🔶 | Limite du système : /e/OS n'a pas de service de reconnaissance vocale pour le navigateur. Le message d'erreur le dit désormais et renvoie au micro du clavier du téléphone. |
| 11 | Arriver en haut de la page suivante | ✅ | Chaque navigation ramène en haut ; « Précédent » retrouve la position quittée. |
| 12 | Légende bon / moyen / mauvais des « Etat général » | ✅ | Reprise du classeur et affichée sous le champ, sur les **17** champs d'état. |
| 13 | Exemples entre parenthèses des « dysfonctionnements » | ✅ | Le générateur jetait la parenthèse finale des libellés ; elle devient une aide en gris sous le champ. Vaut pour **tous** les champs (voir plus bas). Seul « Dégradations / dysfontionnement observés » (Ventilation) n'en a pas : le classeur n'en donne aucun. |
| 14 | Champ libre quand « autre » est coché | ✅ | Pour toute liste proposant « Autre » (cases à cocher **et** listes simples). La précision est stockée à part (`<clé>Autre`). |
| 15 | « Plusieurs choix possibles » ne fonctionne pas | ✅ | Cases à cocher sur les champs marqués « à cocher » / « plusieurs réponses possibles », plus ceux que Victor cite (26 champs en tout). Une ancienne réponse unique est relue comme une case cochée. |

## Documents collectés, Audit technique, Surpresseur

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 18 | Ajouter « Suivi des interventions de plomberie des 3 dernières années… » | ✅ | Ajouté après les données de sous-compteurs, identifiant stable. |
| 20 | Accès aux documents depuis l'audit technique (et le projet) | ✅ | Lien sous le glossaire de l'audit technique. L'accueil du projet avait déjà son bouton. |
| 21 | Surpresseur : pourquoi le garder ? | ✅ | Retiré du schéma, du tableau de bord et de l'accueil du projet. |

## Compteur général

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 24 | Réducteur de pression seulement si « Oui » | 🔶 | Rubrique masquée tant que « Présence d'un réducteur de pression à proximité ? » ≠ Oui. Victor écrit « présence d'un compteur général » : lu comme le réducteur. |
| 25 | Page intermédiaire : plusieurs compteurs généraux | ✅ | Le compteur devient une liste, comme les sous-compteurs. Un audit existant voit sa fiche convertie en premier élément (vérifié). |
| 26–28 | Parenthèses : condition d'accès, télétransmission, dysfonctionnements | ✅ | Aides affichées (compteur et réducteur). |
| 29 | Légende état général | ✅ | Compteur et réducteur, chacun sa légende. |

## Sous-compteurs

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 31 | Séparer Localisation / Caractéristiques ; plan à côté de l'emplacement | ✅ | Rubrique « Caractéristiques » ajoutée (type, année, classe, propriétaire). Les boutons « Localiser sur le plan » et « Prévisualisation » suivent la ligne de l'emplacement — **sur toutes les fiches**. |
| 32–35 | Parenthèses, légende état général | ✅ | |

## Réseaux ECS

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 37 | Plan à côté de l'emplacement | ✅ | Voir L31. |
| 38–40 | Parenthèses : précisions, traitement complémentaire, remarques, dysfonctionnements | ✅ | Y compris l'exemple écrit sous le libellé (« Exemple : Trace de fuite / corrosion etc… »). |
| 41 | Légende état | ✅ | Sur « Etat de l'isolant ». |
| 42 | Ajouter « Présence d'un traçage : Oui / Non / Ne sait pas » | ✅ | Dans Calorifugeage. Sans exigence (non précisée) : pas de pastille. |
| 43 | Bouclage : tout masquer sauf si « Oui » | ✅ | La rubrique bouclage et la sous-partie circulateurs n'apparaissent qu'à « Oui » ; la question « Bouclage » reste visible. |

## Production / stockage ECS

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 45 | Total générateurs et ballons en tête de liste | 🔶 | « Générateurs » = fiches dont le système de production est renseigné ; « Stockages » = fiches avec au moins un ballon, avec le total de ballons en détail. |
| 47 | Réseau ECS associé → recommandé | ✅ | |
| 48 | Combustible : parenthèse + facultatif | ✅ | |
| 49–52 | Parenthèses et légendes (générateur, ballon, isolant, volume, remarques) | ✅ | |

## Robinets

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 54 | Total robinets = lignes + équipements identiques | 🔶 | Appliqué tel que formulé, détail affiché (« 2 fiche(s) + 3 équipement(s) identique(s) »). **À confirmer** : si « identiques » compte déjà le robinet lui-même, le total est trop élevé. |
| 56, 59 | Réseau ECS d'appartenance → recommandé | ✅ | |
| 57–58, 60–61, 63, 65 | Parenthèses | ✅ | |
| 62 | 3 mesures temps + volume, 3 débits calculés | ✅ | Tableau de 3 essais : temps, volume, débit calculé (volume ÷ temps × 60, en L/min — la note du classeur écrit « /60 », ce qui est faux), mesure directe au bol, moyenne. Victor propose d'en reparler au téléphone. |
| 64 | Légende état général | ✅ | |

## Douches / baignoires

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 67 | Total douches et baignoires | 🔶 | Deux totaux (douches, baignoires), même règle que L54. La colonne « équipements identiques » a été ajoutée à la liste, qui ne l'avait pas. |
| 69 | Rubrique Douche / Baignoire selon le type | ✅ | Le bloc Robinet reste toujours affiché (note D104 du classeur). |
| 70 | Limiteur de débit → facultatif | ✅ | Étendu à la baignoire par cohérence (voir « hors remarques »). |
| 71 | Réseau ECS d'appartenance → recommandé | ✅ | |
| 72–73, 80 | Photos des types d'émetteur et de jet | ✅ | Reprises du classeur, recadrées comme dans Excel, sous « Voir les illustrations ». |
| 74–75, 77, 79, 82, 84, 86 | Parenthèses | ✅ | |
| 76, 81 | Mesures de débit | ✅ | Voir L62. |
| 78, 83, 87 | Légendes état général | ✅ | Douche, baignoire, robinet. |
| 85 | Diamètre nominal de l'alimentation → facultatif | ✅ | |

## WC

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 89 | Total toilettes | 🔶 | Même règle que L54. |
| 91 | Utilisateurs : plusieurs réponses | ✅ | |
| 92 | Photos des types de toilettes / urinoirs | ✅ | 7 illustrations. |
| 93 | Légende état général | ✅ | |
| 94 | Remarques : « le cas échéant, précisez le débit du lave-main… » | ✅ | Texte de Victor repris mot pour mot. |

## Appareils de lavage

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 96 | Totaux lave-linge / lave-vaisselle / autolaveuse | ✅ | Nombre de fiches par type. |
| 97 | Rubriques selon le type | ✅ | |
| 98–106 | Parenthèses (programmes, dysfonctionnements, remarques, capacité, réglage du débit, détergent) | ✅ | |
| 100 | Légende état visuel | ✅ | Sur les quatre appareils. |
| 107 | Type de zone lavée : plusieurs choix (autolaveuse et lavage manuel) | ✅ | |
| 108 | Type de surface : plusieurs choix | ✅ | |

## Incendie

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 110 | « e » en trop dans « réservie » | ✅ | Corrigé à l'affichage ; la clé de stockage est conservée pour ne pas perdre les saisies d'essai. |
| 111 | Parenthèses des dysfonctionnements | ✅ | |

## Espaces extérieurs

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 113–114 | Sommes des surfaces et des surfaces imperméables | ✅ | En tête de liste, en m². |
| 115 | Colonne « Emplacement » ; place pour les surfaces nettoyées | 🔶 | En-tête raccourci. Colonne « Surfaces nettoyées » ajoutée, alimentée par le champ « Utilisation (nettoyage parking, façade…) » de la rubrique Nettoyage — le seul qui décrive ce qui est nettoyé. |
| 117, 120, 126 | Parenthèses | ✅ | |
| 118 | Plan à côté de l'emplacement | ✅ | Voir L31. |
| 119 | Arrosage / nettoyage seulement si cochés | ✅ | |
| 121–122, 124, 127 | Plusieurs choix : paillage, mode d'arrosage, origine de l'eau, motif | ✅ | |
| 123 | Période d'arrosage : ajouter nuit et variable | ✅ | |
| 125, 128 | Durées en minutes | ✅ | |

## Piscines

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 130 | Durée d'un nettoyage en minutes | ✅ | Zone piscine (nettoyage des plages). |
| 131, 136–137 | Parenthèses | ✅ | |
| 133, 135 | Plusieurs choix : utilisateurs, type de couverture | ✅ | |
| 134 | Matériaux de construction en liste | ✅ | 9 matériaux repris de la note du classeur. |
| 138 | Légende état général | ✅ | |

## Toiture

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 140 | Surface totale et nombre de pans | ✅ | En tête de liste. |
| 141 | Unité % sur la pente | ✅ | Le classeur disait « % ou ° » : % retenu. |
| 142–145, 148–149 | Parenthèses | ✅ | |
| 146–147 | Photos des gouttières et des chéneaux | ✅ | 4 + 4 illustrations. |

## Structure

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 151 | Type : deux réponses, rubriques selon la réponse | ✅ | L'option parasite « Ouvrir la suite en fonction du choix » est retirée. |
| 152 | Réseau supplémentaire : Oui / Non | ✅ | |
| 153 | Parenthèses | ✅ | |
| 154 | Supprimer l'emplacement en double | ✅ | |

## Ventilation

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 156–157 | Parenthèses | ✅ | |
| 158 | Plan à côté de l'emplacement | ✅ | Voir L31. |

## Opportunités

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 160 | Rubriques selon les opportunités cochées | ✅ | L'option parasite « plusieurs possibles » est retirée. |
| 161, 163 | Parenthèses | ✅ | |
| 162, 165–166 | Légendes du potentiel technique | ✅ | Les trois. |
| 164 | Plusieurs choix : utilisations extérieures / intérieures | ✅ | Dans les deux rubriques. |

## Autre

| L. | Remarque | Statut | Ce qui a été fait |
|---|---|---|---|
| 168 | Choix : deux réponses, rubriques selon la réponse | ✅ | L'option parasite « ouvrant les champs à la suite… » est retirée. |
| 169 | Pas de rubrique « Autre information » | ✅ | Un champ de saisie ajouté dans chacune des deux rubriques (le classeur n'y posait qu'une zone sans libellé). |

---

## Récapitulatif

- **Faites** : toutes les remarques, sauf les deux suivantes.
- **Non faite** : photos en mode « fichiers voisins » (L8–9), faute de la
  capture d'écran de Victor.
- **Limite technique expliquée** : micro sur /e/OS (L10).
- **À confirmer avec Victor** :
  - le mode de calcul des totaux « fiches + équipements identiques » (L54,
    L67, L89) ;
  - la définition des générateurs et stockages (L45) ;
  - la colonne « Surfaces nettoyées » (L115) ;
  - l'exigence du traçage (L42), non précisée.

---

## Modifications hors remarques

Relecture de toutes les lignes retirées ou remplacées dans les fichiers écrits
à la main. Rien n'a été modifié hors des remarques, sauf ce qui suit.

**Aucun travail antérieur n'est perdu.** Le dernier commit (« dictée »,
2026-09-17) est intact. Dans les fichiers qu'il avait touchés, seule
l'infobulle du micro a changé de texte (L10) ; les trois lignes retirées
d'`audit-field` sont remplacées par des versions étendues.

### Conséquences directes d'une remarque

- **Remarques générales détachées** dans un bloc « Remarques » (compteur
  général, espaces extérieurs, structure, opportunités, autre). Le classeur
  les range sous la dernière rubrique : sans cela, elles disparaissaient avec
  elle une fois les rubriques masquées (L119, L151, L160, L168).
- **Aides tirées de toutes les parenthèses**, y compris pour des champs que
  Victor ne cite pas (« Année d'installation — par défaut : année de
  construction », « Classe énergétique — si visible »…) : application
  générale de L13.
- **Champs « à cocher » passés en choix multiple** sans être cités : types
  d'émetteur (douche, baignoire), origine de l'eau, local composteur et
  dysfonctionnements des WC, type de textiles, mode de nettoyage extérieur,
  types de gouttières et de chéneaux, possibilité d'implanter des cuves.
  C'est la lecture de L15 appliquée à tout le classeur.
- **Mesures de débit** : les quatre champs isolés qui ne permettaient qu'un
  essai sont remplacés par le tableau. Une valeur saisie dans l'ancien
  « Débit en sortie » est reprise comme mesure directe du premier essai.
- **Longueur totale du réseau ECS** devient un nombre en mètres : son libellé
  « (si connue) (en m) » n'était plus lu comme du texte une fois les
  parenthèses traitées.

### Corrections faites au passage

- « Bouton chasse cassé ou bloqué » manquait à la liste des dysfonctionnements
  des WC : le mot « bouton » faisait passer l'option pour une consigne.
- « oui à côté, derrière un des murs » (local composteur) était coupé en deux
  options.
- Coquilles affichées : « Entérée » → « Enterrée », « Type d'emetteur » →
  « Type d'émetteur ». Aucune clé de stockage ne change.

### Extensions par cohérence

- **Limiteur de débit de la baignoire** passé en facultatif, comme celui de
  la douche (L70) : même question, même raison.
- **Légende de l'exigence de propreté** (faible / modéré / fort /
  réglementaire), présente dans le classeur comme les autres légendes.
- **Colonnes de liste** : type pour les structures, opportunités cochées,
  emplacement / type / télétransmission pour la nouvelle liste des compteurs
  généraux.
- **« Précédent »** retrouve la position de défilement quittée (L11 ne
  demandait que l'arrivée en haut).
- **Illustrations repliées par défaut** (« Voir les illustrations »), pour ne
  pas allonger les fiches sur téléphone.

### Outillage et documentation

- `tools/gen-illustrations.js` (nouveau), ajouté à `npm run gen` : les images
  sont inlinées (+267 Ko) pour fonctionner en `file://`.
- `check-coverage.js` reconnaît légendes, illustrations et tableaux de
  mesure : 3 signalements au lieu de 45, tous légitimes.
- `check-exigences.js` et `smoke-test.js` adaptés aux choix multiples, aux
  rubriques-sections, au compteur en liste et au surpresseur retiré.
- `CLAUDE.md`, `tools/README.md` et `docs/audit/*.md` (régénérés) mis à jour.

### Clés de stockage

Seules disparaissent celles des champs retirés : surpresseur, emplacement en
double de la structure, et les quatre champs isolés de mesure de débit
(robinet, douche, baignoire). Toutes les autres clés sont inchangées,
coquille « réservie » comprise.
