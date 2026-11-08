import { Injectable, inject } from '@angular/core';
import { AppData, AssetRef } from '../../models/data.models';
import { AssetStoreService } from './asset-store.service';
import { AuditRegistryService } from './audit-registry.service';
import { DataService } from './data.service';
import { nomAudit } from '../utils/csv-export';
import { dossierAudit, nomSeul, propre } from '../utils/photo-mode';
import { EntreeZip, creerZip, nomUnique } from '../utils/zip';
import { faisabilite, reconstituer } from '../utils/self-extract';

/** Ce que l'archive contient, à annoncer après coup. */
export interface RapportArchive {
  fichier: string;
  /** Taille de l'archive, en kilo-octets. */
  taille: number;
  /** L'application est-elle à la racine de l'archive ? */
  avecApplication: boolean;
  /** Pourquoi elle n'y est pas, le cas échéant. */
  raisonSansApplication?: string;
  audits: { dossier: string; nom: string; images: number; manquantes: number }[];
}

/** Images déjà compressées : inutile de les repasser au deflate. */
const DEJA_COMPRESSE = /\.(jpe?g|png|gif|webp|avif|heic|heif|pdf|zip)$/i;

/**
 * Archive de tout ce que ce poste contient : l'application et tous les audits.
 *
 * Elle répond à un besoin de terrain simple — tout emporter d'un coup, ou tout
 * remettre à quelqu'un — et elle est **autosuffisante** : on la déplie, on
 * ouvre `index.html`, et les chemins relatifs des photos tombent juste, parce
 * que l'arborescence est précisément celle que ces chemins décrivent.
 *
 * ```
 * sobrieau-2026-11-08.zip
 * ├── index.html                     ← l'application
 * ├── LISEZ-MOI.txt
 * └── ecole-jean-moulin-a1b2c3d4/    ← un dossier par audit
 *     ├── audit.json                 ← toutes les données de l'audit
 *     ├── 20261108T0930_robinet-3_1f2e3d4c.jpg
 *     └── plans/
 *         └── rdc.png
 * ```
 *
 * **Les images viennent de la base, pas des fichiers voisins.** Une page
 * `file://` ne peut pas lire ses voisins — `fetch` y est refusé, mesuré — si
 * bien que « prendre les photos depuis les liens relatifs » est impossible
 * depuis la page elle-même. Le binaire est de toute façon en base dans les deux
 * modes de rangement : c'est la même image, et elle est accessible.
 *
 * **Les chemins sont réécrits** sur l'arborescence réellement produite : un
 * audit renommé depuis la prise de vue a changé de dossier, et le chemin
 * enregistré dans la photo renvoie à l'ancien. L'archive est donc toujours
 * cohérente avec elle-même, quel que soit l'historique des renommages.
 */
@Injectable({ providedIn: 'root' })
export class ArchiveService {
  private readonly assets = inject(AssetStoreService);
  private readonly registry = inject(AuditRegistryService);
  private readonly data = inject(DataService);

  /**
   * Construit l'archive et la remet à l'auditeur.
   *
   * @param imagesDansJson embarquer aussi les images en base64 dans chaque
   * `audit.json`. L'archive double de volume, mais chaque dossier devient
   * réutilisable seul : le JSON s'importe ailleurs sans ses fichiers voisins.
   * @param avancement appelé à chaque étape — l'assemblage peut durer une
   * minute sur un téléphone, et une page muette passe pour bloquée.
   */
  async construire(
    imagesDansJson: boolean,
    avancement: (texte: string) => void = () => {}
  ): Promise<RapportArchive> {
    const entrees: EntreeZip[] = [];
    const rapport: RapportArchive = {
      fichier: `sobrieau-${new Date().toISOString().slice(0, 10)}.zip`,
      taille: 0,
      avecApplication: false,
      audits: [],
    };

    // ── L'application, à la racine ────────────────────────────────────────
    avancement("Reconstitution de l'application…");
    const etat = faisabilite();
    if (etat.possible) {
      entrees.push({ chemin: 'index.html', contenu: reconstituer() });
      rapport.avecApplication = true;
    } else {
      // La version hébergée et le serveur de développement chargent des
      // fichiers séparés : l'archive porte alors les audits seuls, et le dit.
      rapport.raisonSansApplication = etat.raison;
    }

    // ── Un dossier par audit ──────────────────────────────────────────────
    const fiches = this.registry.listByRecency();
    const dossiersPris = new Set<string>();

    for (const [rang, fiche] of fiches.entries()) {
      avancement(`Audit ${rang + 1} / ${fiches.length}…`);

      // L'audit ouvert est pris dans l'état du service, qui peut porter une
      // saisie plus récente que ce que le registre a déjà écrit.
      const audit =
        fiche.Id === this.data.currentAuditId ? this.data.snapshot() : this.registry.load(fiche.Id);
      const nom = nomAudit(audit) || fiche.Adresse || '';
      const dossier = nomUnique(dossiersPris, dossierAudit(nom, fiche.Id));

      const refs = this.imagesDe(audit);
      const plans = new Set((audit.Plans ?? []).map((p) => p.id));
      const nomsPris = new Set<string>();
      const nomsPlans = new Set<string>();
      let manquantes = 0;
      let images = 0;

      for (const ref of refs) {
        const stocke = await this.assets.get(ref.id);
        if (!stocke?.blob) {
          manquantes++;
          continue;
        }
        // Un plan va dans son sous-dossier : mêler quarante plans et cent
        // photos dans un même dossier le rendrait illisible.
        const dansPlans = plans.has(ref.id);
        const fichier = nomUnique(
          dansPlans ? nomsPlans : nomsPris,
          this.nomDeLImage(ref, stocke.type)
        );
        const chemin = dansPlans ? `${dossier}/plans/${fichier}` : `${dossier}/${fichier}`;

        entrees.push({
          chemin,
          contenu: new Uint8Array(await stocke.blob.arrayBuffer()),
          stocker: DEJA_COMPRESSE.test(fichier),
        });
        // Le chemin enregistré suit l'arborescence produite, et non l'inverse.
        if (!dansPlans) ref.path = `./${dossier}/${fichier}`;
        images++;
      }

      avancement(`Audit ${rang + 1} / ${fiches.length} — données…`);
      const json = imagesDansJson
        ? (await this.data.buildExportPayload(audit)).payload
        : audit;
      entrees.push({ chemin: `${dossier}/audit.json`, contenu: JSON.stringify(json, null, 2) });

      rapport.audits.push({ dossier, nom: nom || '(sans nom)', images, manquantes });
    }

    entrees.push({ chemin: 'LISEZ-MOI.txt', contenu: this.lisezMoi(rapport, imagesDansJson) });

    avancement("Compression de l'archive…");
    const blob = await creerZip(entrees);
    rapport.taille = Math.round(blob.size / 1024);
    this.data.telecharger(blob, rapport.fichier);
    return rapport;
  }

  /**
   * Toutes les images d'un audit, **sur l'objet donné** et non sur une copie :
   * leurs chemins sont réécrits en place, et le JSON écrit dans l'archive doit
   * porter la réécriture.
   */
  private imagesDe(audit: AppData): AssetRef[] {
    const vues = new Set<string>();
    const out: AssetRef[] = [];
    const parcourir = (v: unknown): void => {
      if (Array.isArray(v)) {
        v.forEach(parcourir);
        return;
      }
      if (!v || typeof v !== 'object') return;
      const o = v as Record<string, unknown>;
      if (typeof o['id'] === 'string' && typeof o['name'] === 'string') {
        if (!vues.has(o['id'] as string)) {
          vues.add(o['id'] as string);
          out.push(o as unknown as AssetRef);
        }
        return;
      }
      Object.values(o).forEach(parcourir);
    };
    // Les plans d'abord : ils donnent leur sous-dossier, et l'ordre de
    // l'archive suit celui de l'audit.
    parcourir(audit.Plans);
    parcourir(audit.Photos);
    parcourir(audit.Pieces);
    parcourir(audit.Qte);
    return out;
  }

  /**
   * Nom de l'image dans l'archive.
   *
   * Le nom déjà choisi au téléchargement est repris tel quel — c'est lui que le
   * chemin enregistré désigne, et le retrouver à l'identique dans l'archive est
   * ce qui rend le lien vérifiable. Sinon on compose depuis le nom d'origine.
   */
  private nomDeLImage(ref: AssetRef, type: string): string {
    if (ref.path) return nomSeul(ref.path);

    const point = (ref.name || '').lastIndexOf('.');
    const base = propre(point > 0 ? ref.name.slice(0, point) : ref.name) || 'image';
    const ext =
      (point > 0 ? ref.name.slice(point) : '').toLowerCase() ||
      '.' + (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    return `${base}-${ref.id.slice(0, 8)}${ext}`;
  }

  /** Mode d'emploi, à la racine : une archive sans notice se devine mal. */
  private lisezMoi(rapport: RapportArchive, imagesDansJson: boolean): string {
    const lignes = [
      'SobriEau — archive complète',
      `Produite le ${new Date().toLocaleString('fr-FR')}`,
      '',
      'CE QUE CONTIENT CETTE ARCHIVE',
      '',
    ];
    lignes.push(
      rapport.avecApplication
        ? "  index.html        l'application. Dépliez l'archive, ouvrez ce fichier"
        : "  (l'application n'est pas dans cette archive : " +
            (rapport.raisonSansApplication ?? 'version non autonome') +
            ')'
    );
    lignes.push('                    par double-clic : aucune installation.', '');
    lignes.push('  un dossier par audit, contenant :');
    lignes.push('    audit.json      toutes les données de cet audit' +
      (imagesDansJson
        ? ', images comprises.'
        : '. Les images sont'));
    if (!imagesDansJson) {
      lignes.push('                    à côté, en fichiers : ce JSON seul ne les porte pas.');
    }
    lignes.push('    les photos      aux chemins que les données indiquent.');
    lignes.push('    plans/          les plans du bâtiment.', '');
    lignes.push('REMETTRE CES AUDITS DANS SOBRIEAU', '');
    lignes.push("  Ouvrez index.html, puis « Charger depuis un fichier » sur l'accueil,");
    lignes.push('  et choisissez le audit.json voulu.');
    if (!imagesDansJson) {
      lignes.push('');
      lignes.push('  ⚠ Ces audit.json ne contiennent pas les images. Pour transmettre un');
      lignes.push('    audit seul, préférez « Sauvegarder l’audit » depuis l’application,');
      lignes.push('    qui les embarque.');
    }
    lignes.push('', 'AUDITS PRÉSENTS', '');
    for (const a of rapport.audits) {
      lignes.push(
        `  ${a.dossier}/` +
          `\n      ${a.nom} — ${a.images} image(s)` +
          (a.manquantes ? `, ${a.manquantes} introuvable(s) dans le navigateur` : '')
      );
    }
    return lignes.join('\n') + '\n';
  }
}
