# À faire — demandes complémentaires du 2026-11-08

Retour brut : [retours/2026-11-08-demandes-complementaires.md](../retours/2026-11-08-demandes-complementaires.md)
Réalisation : [realisations/2026-11-08-pieces-archive-images.md](../realisations/2026-11-08-pieces-archive-images.md)

| # | Demande | État | Où |
|---|---|---|---|
| 1 | Chemin d'une photo = dossier de la page + dossier au nom de l'audit + fichier | fait, **avec une réserve** | `cheminPhoto()`, `dossierAudit()` (`photo-mode.ts`) |
| 2 | Bouton d'export en archive : `index.html` à la racine, un dossier par audit avec ses photos et son JSON | fait, **en ZIP et non en RAR** | `ArchiveService`, `zip.ts`, panneau de `#/accueil` |
| 3 | S'assurer qu'une photo téléchargée reste enregistrée autrement que par son chemin | fait | binaire conservé en base ; compte des images non embarquées à l'export |
| 4 | Restructurer le suivi des mises à jour dans `MAJ/` | fait | ce dossier, et [AVANCEMENT.md](../AVANCEMENT.md) |

## Réserves à connaître

**1 — un navigateur ne peut pas créer le sous-dossier.** Mesuré sur Chromium 141
en pilotant le protocole DevTools : l'attribut `download` **aplatit** les
séparateurs. `mon-audit/photo.jpg` est écrit `mon-audit_photo.jpg`, et
`./mon-audit/photo.jpg` devient `_mon-audit_photo.jpg`. C'est une règle
d'assainissement du navigateur, pas un réglage.

Le fonctionnement retenu, après précision de la demande (2026-11-08) :

- **à plat est le cas normal.** Pendant tout l'audit, la photo est dans le
  dossier de téléchargement, à côté de la page — le navigateur n'a pas d'autre
  choix. C'est donc la **première** forme que l'affichage essaie.
- **le sous-dossier est le repli, et sert l'après.** Chacun exporte son
  archive, on les réunit, et les photos de plusieurs auditeurs se retrouvent
  chacune dans le dossier de son audit au lieu de se mélanger. C'est pour cela
  que le dossier porte aussi huit caractères de l'identité de l'audit : deux
  bâtiments homonymes ne doivent pas partager de dossier.

Un premier jet essayait le sous-dossier **avant** le fichier à plat : c'était
échouer à chaque affichage sur le poste de l'auditeur pour réussir sur un cas
qui n'arrive qu'après l'archivage. Corrigé, et `npm run check:photos` tient
désormais l'ordre.

L'alternative — l'API File System Access, qui sait écrire dans un dossier choisi
et rendrait les deux formes identiques — est présente en `file://` mais absente
de Chrome sur Android, c'est-à-dire de l'appareil de terrain ; elle n'a donc pas
été retenue.

**2 — le RAR n'est pas produisible.** Le format est propriétaire : son
algorithme de compression n'est pas publié, et aucune bibliothèque JavaScript ne
sait en *écrire* — celles qui existent ne font que lire. L'archive est donc un
ZIP, qui s'ouvre d'un double-clic sous Windows comme sous macOS.

**2 bis — les photos ne viennent pas des fichiers voisins** mais de la base du
navigateur. Une page `file://` ne peut pas lire ses voisins (`fetch` y est
refusé, mesuré de nouveau à cette occasion). C'est la même image, et elle est
accessible ; « depuis les liens relatifs » est donc respecté pour
l'*arborescence produite*, pas pour la *source lue*.
