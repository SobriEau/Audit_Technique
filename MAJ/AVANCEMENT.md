# Suivi des mises à jour

Point d'entrée du dossier `MAJ/`. Une ligne par série de demandes, de la plus
récente à la plus ancienne.

## La convention, et pourquoi elle tient en trois dossiers

| Dossier | Contenu | Règle |
|---|---|---|
| `retours/` | Les **éléments de retour bruts**, tels que reçus | Jamais modifiés. Ni reformulés, ni corrigés, ni réordonnés. C'est la seule pièce qu'on ne peut pas reconstituer. |
| `to_do/` | Ce qu'on en a **tiré** : une fiche par retour, chaque demande avec son état et l'endroit du code où elle a abouti | Le document de travail. C'est ici qu'on coche, et ici qu'on écrit les réserves et les lectures tranchées. |
| `realisations/` | Les **notes d'arbitrage** : ce qui a été fait, et pourquoi ce choix plutôt qu'un autre | À lire avant de défaire quelque chose. Plusieurs de ces notes expliquent un choix qui en annule un précédent. |
| `classeurs/` | Les versions du **classeur Excel** dont le schéma est généré | `audit_technique.xlsx` est la version courante. Voir `tools/README.md`. |

Trois raisons à cette séparation, chacune payée une fois :

- **Un retour reformulé perd sa demande.** « Pas pour le compteur général » ne
  se laisse lire que dans la phrase entière ; une fiche de tâches l'aurait
  résumé en « ne pas afficher », et l'arbitrage aurait porté sur autre chose.
- **Un retour sans fichier se perd.** Le second retour de test (2026-10) est
  arrivé hors fichier : sa fiche de tâches ne contient que ce que le code
  atteste, et nul ne sait ce qu'elle oublie. C'est la raison d'être de
  `retours/`.
- **Une réalisation sans note se défait.** Plusieurs choix du projet annulent
  explicitement un choix antérieur pris à dessein ; sans la note qui le dit, le
  suivant les rétablit de bonne foi.

Un fichier est nommé `AAAA-MM-JJ-sujet` : les dossiers se trient d'eux-mêmes, et
une date de retour ne se confond pas avec sa date de réalisation.

---

## 2026-11-08 — Demandes complémentaires

Chemins de photos, archive complète, garantie sur le JSON d'export,
restructuration de ce dossier.

- Retour : [retours/2026-11-08-demandes-complementaires.md](retours/2026-11-08-demandes-complementaires.md)
- À faire : [to_do/2026-11-08-demandes-complementaires.md](to_do/2026-11-08-demandes-complementaires.md) — **4 / 4 faites, 2 avec réserve**
- Réalisation : [realisations/2026-11-08-pieces-archive-images.md](realisations/2026-11-08-pieces-archive-images.md)

Les deux réserves sont des **impossibilités mesurées**, pas des renoncements :
un navigateur aplatit les séparateurs de l'attribut `download` (donc ne crée pas
le sous-dossier), et le format RAR est propriétaire (donc l'archive est un
ZIP). Les deux sont documentées là où le code les subit.

## 2026-10-16 — Première visite terrain

Travail à deux sur un même bâtiment, relevé par pièce, affichage des photos.

- Retour : [retours/2026-10-16-premiere-visite-terrain.md](retours/2026-10-16-premiere-visite-terrain.md)
- À faire : [to_do/2026-10-16-premiere-visite-terrain.md](to_do/2026-10-16-premiere-visite-terrain.md) — **3 / 3 faites**
- Réalisation : [realisations/2026-11-08-pieces-archive-images.md](realisations/2026-11-08-pieces-archive-images.md)

## 2026-10 — Second retour de test

Six corrections du formulaire, et deux demandes sans objet.

- Retour : **support non conservé** — arrivé hors fichier
- À faire : [to_do/2026-10-second-retour-de-test.md](to_do/2026-10-second-retour-de-test.md) — **6 / 6 faites**

## 2026-09 — Retour de test de Victor Ledoux

Seize corrections sur la partie technique, le formulaire et la navigation.

- Retour : [retours/2026-09-16-victor-ledoux-test-html.txt](retours/2026-09-16-victor-ledoux-test-html.txt)
- À faire : [to_do/2026-09-16-victor-ledoux.md](to_do/2026-09-16-victor-ledoux.md) — **16 / 16 faites, 2 points laissés ouverts**
- Vérification : [realisations/2026-09-29-verification-retours-victor.md](realisations/2026-09-29-verification-retours-victor.md)

Les deux points ouverts : les **renvois multiples** (« Numéros des robinets
correspondants »), qui attendent un type `entity-ref-multi`, et l'**ajout de
photos sous Firefox**, non repris puisque la dictée impose déjà Chrome ou Edge.

## 2026-08/09 — Passage à la V3 du classeur, mené deux fois en parallèle

Deux migrations conduites sur deux postes sans que l'une sache rien de l'autre,
fusionnées le 2026-09-16.

- Arbitrages soumis : [realisations/2026-08-21-arbitrages-v3.md](realisations/2026-08-21-arbitrages-v3.md)
- Fusion : [realisations/2026-09-16-fusion-origin-main.md](realisations/2026-09-16-fusion-origin-main.md)

⚠️ **À lire avant de toucher** à l'exigence des champs, au surpresseur ou à la
validation : plusieurs choix y défont explicitement ce qu'une des deux versions
avait écrit à dessein.
