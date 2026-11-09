import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { EntityDef } from '../../models/field.models';
import { AppData, AssetRef, AuditEntity, Batiment, Piece, PlanLocation } from '../../models/data.models';
import { uid } from './uid';

/**
 * Réunion de deux copies d'un même audit, pour que deux auditeurs se
 * répartissent un grand bâtiment.
 *
 * Le parcours visé : l'un prépare l'audit — plans, pièces, points d'eau
 * attendus — et l'envoie à l'autre ; chacun relève ses pièces de son côté,
 * hors connexion ; l'un reçoit le fichier de l'autre et l'intègre à l'audit
 * qu'il a ouvert. Sans cela il fallait créer deux audits distincts et
 * recopier à la main.
 *
 * **Trois règles, et elles sont le contrat de ce module.**
 *
 * 1. **Rien n'est jamais écrasé.** Un élément présent des deux côtés et
 *    modifié de part et d'autre n'est pas arbitré : il est **ajouté en
 *    double**, avec un numéro neuf, et signalé. Un doublon se supprime en
 *    deux clics ; une saisie de terrain écrasée ne se retrouve jamais.
 * 2. **L'identité fait foi, pas le numéro.** Le rapprochement se fait sur
 *    `Id` — celui des pièces, des plans, des éléments. C'est ce qui permet de
 *    reconnaître la base préparée en commun au lieu de la dupliquer. Le
 *    `Numero`, simple libellé, est renuméroté à la suite de la liste
 *    d'accueil, et le rapport dit lequel est devenu lequel.
 * 3. **La fonction est pure.** `fusionner()` ne touche ni à l'un ni à l'autre
 *    de ses arguments : elle rend un audit neuf et un rapport. C'est ce qui
 *    permet de **montrer le résultat avant de l'appliquer** — on n'intègre pas
 *    un fichier de terrain à l'aveugle — et de l'éprouver hors navigateur
 *    (`tools/check-fusion.js`).
 *
 * Les images ne transitent pas par ici : le module dit seulement quels
 * identifiants reprendre, et sous quel nouvel identifiant quand il y a
 * collision (voir `RapportFusion.assets`). Le binaire reste l'affaire de
 * `AssetStoreService`.
 */

type Objet = Record<string, unknown>;

const estObjet = (v: unknown): v is Objet => !!v && typeof v === 'object' && !Array.isArray(v);

/** Rien à reprendre : ni réponse, ni structure. « Non » et 0 sont des réponses. */
export function vide(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

/** Égalité de valeurs, insensible à l'ordre des clés d'un objet. */
export function egal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (vide(a) && vide(b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => egal(x, b[i]));
  }
  if (estObjet(a) && estObjet(b)) {
    const cles = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of cles) {
      // Une clé absente d'un côté et vide de l'autre ne fait pas une différence.
      if (!egal(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

const texte = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// ── Rapport ────────────────────────────────────────────────────────────────

/** Un champ renseigné des deux côtés, avec deux valeurs différentes. */
export interface Divergence {
  libelle: string;
  local: string;
  recu: string;
}

/** Ce qu'une entité a reçu du fichier intégré. */
export interface ApportEntite {
  /** Clé de stockage sous `Qte`. */
  entite: string;
  /** Intitulé pluriel, pour l'affichage. */
  libelle: string;
  /** Éléments repris du fichier reçu. */
  ajoutes: number;
  /**
   * Éléments déjà là, **complétés** par le fichier reçu : l'autre auditeur a
   * rempli des champs laissés vides ici, ou ajouté des photos. Rien n'était en
   * concurrence, il n'y avait donc rien à arbitrer.
   */
  completes: number;
  /** Éléments déjà présents, et rien à y ajouter. */
  identiques: number;
  /**
   * Éléments renseignés **différemment** des deux côtés sur un même champ :
   * ajoutés en double, pour que l'auditeur compare et tranche.
   */
  dupliques: number;
}

export interface RapportFusion {
  /** Nom de l'audit reçu, pour que l'auditeur reconnaisse le bon fichier. */
  nomRecu: string;
  /**
   * Les deux fichiers sont deux copies du même audit (même `Id`) — le cas
   * normal d'un travail réparti. Sinon, c'est un **autre** audit qu'on
   * intègre : possible, mais il faut le dire avant.
   */
  memeAudit: boolean;
  /** Champs vides ici, remplis par le fichier reçu. */
  champsRepris: string[];
  /** Champs renseignés des deux côtés : la valeur locale est conservée. */
  divergences: Divergence[];
  /** Noms des bâtiments repris du fichier reçu. */
  batimentsAjoutes: string[];
  /** Bâtiments déjà présents, reconnus à leur identité. */
  batimentsDeja: number;
  /** Noms des pièces reprises du fichier reçu. */
  piecesAjoutees: string[];
  /** Pièces déjà présentes, reconnues à leur identité. */
  piecesDeja: number;
  /**
   * Pièces ajoutées portant le nom d'une pièce déjà présente, sans partager
   * son identité : les deux auditeurs l'ont créée chacun de son côté. On les
   * garde toutes deux — fusionner deux pièces homonymes supposerait de choisir
   * laquelle des deux localisations est la bonne.
   */
  piecesHomonymes: string[];
  /** Noms des plans repris. */
  plansAjoutes: string[];
  plansDeja: number;
  photosAjoutees: number;
  /** Apport de chaque entité technique, les entités sans apport exclues. */
  entites: ApportEntite[];
  /**
   * Fiches renseignées différemment des deux côtés, et les champs en cause.
   * Ce sont elles qui sont ajoutées en double : la liste dit où regarder.
   */
  conflitsFiches: { libelle: string; champs: string[] }[];
  /** Éléments renumérotés à la suite de la liste d'accueil. */
  renumerotes: { libelle: string; de: string; vers: string }[];
  /**
   * Images à reprendre : `source` est l'identifiant dans le fichier reçu,
   * `cible` celui sous lequel l'enregistrer ici. Les deux diffèrent quand
   * l'identifiant est déjà pris par une autre image de ce poste.
   */
  assets: { source: string; cible: string }[];
  /** Images référencées par ce qui a été ajouté, mais absentes du fichier. */
  imagesManquantes: number;
  /** Éléments repris qui désignent une pièce introuvable des deux côtés. */
  piecesIntrouvables: number;
}

/** Rien n'a été repris : le fichier n'apportait rien que l'audit n'ait déjà. */
export function rapportVide(r: RapportFusion): boolean {
  return (
    r.champsRepris.length === 0 &&
    r.batimentsAjoutes.length === 0 &&
    r.piecesAjoutees.length === 0 &&
    r.plansAjoutes.length === 0 &&
    r.photosAjoutees === 0 &&
    r.entites.every((e) => e.ajoutes === 0 && e.dupliques === 0 && e.completes === 0)
  );
}

/** Nombre d'éléments techniques repris, doublons compris. */
export function totalElements(r: RapportFusion): number {
  return r.entites.reduce((n, e) => n + e.ajoutes + e.dupliques, 0);
}

// ── Libellés ───────────────────────────────────────────────────────────────

/**
 * Intitulés des champs de l'accueil du projet, pour que le rapport parle la
 * langue de l'écran. Une clé absente de cette table est reprise quand même,
 * sous son nom : le rapport ne décide pas de ce qui est fusionné.
 */
const LIBELLES: Record<string, string> = {
  NomProjet: 'Nom du projet',
  NomSite: 'Nom du site audité',
  Adresse: 'Adresse',
  Date: 'Date de début de la visite terrain',
  Auditeur: "Nom de l'auditeur",
  Accompagnant: "Nom et fonction de l'accompagnant",
  Effectif: 'Effectif',
  Info: 'Informations complémentaires',
  NiveauRemplissage: 'Niveau de remplissage des fiches',
};

/** Clés de l'audit qui ont leur propre traitement ci-dessous. */
const PARTIES = new Set([
  'Id',
  'AdresseKey',
  '__assets',
  'Plans',
  'Batiments',
  'Pieces',
  'Photos',
  'Documents',
  'UtilisationsEau',
  'EquipementsPresents',
  'Qge',
  'Qus',
  'Qte',
]);

/** Champs en texte libre, assez longs pour qu'on les mette bout à bout. */
const TEXTES_LONGS = new Set(['Info']);

const SEPARATEUR_TEXTE = '<hr /><p><em>— ajouté depuis un audit reçu —</em></p>';

/**
 * Réunion de deux textes libres.
 *
 * Les deux auditeurs partent en général du même préambule : le recopier
 * donnerait deux fois le même paragraphe. On ne met bout à bout que ce qui
 * diverge vraiment, et jamais au prix d'une perte.
 */
function fusionnerTexte(local: string, recu: string): string | null {
  const a = local.trim();
  const b = recu.trim();
  if (!b || a === b) return null;
  if (!a) return recu;
  if (a.includes(b)) return null;
  if (b.includes(a)) return recu;
  return a + SEPARATEUR_TEXTE + b;
}

// ── Numérotation ───────────────────────────────────────────────────────────

const NUMERO_RE = /^\s*(\d+)\s*$/;

/**
 * Numéro suivant dans une liste : le plus grand numéro lu, plus un.
 *
 * Deux listes tenues en parallèle numérotent toutes deux à partir de 1 : les
 * éléments repris sont donc renumérotés à la suite de ceux déjà là. Sans
 * risque pour les relations entre fiches, qui désignent l'`Id` — c'est
 * précisément pourquoi `Numero` n'en est pas une (voir `AuditEntity`).
 *
 * Sert aussi à la création d'un élément (`DataService.createEntity`) : le rang
 * dans la liste ne convient pas, puisqu'une suppression le fait reculer et
 * redonnerait un numéro déjà porté.
 */
export function prochainNumero(liste: readonly AuditEntity[]): number {
  let max = 0;
  for (const e of liste) {
    const m = NUMERO_RE.exec(String(e?.Numero ?? ''));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

// ── Images ─────────────────────────────────────────────────────────────────

/** Attribue aux images reprises un identifiant libre sur ce poste. */
class Images {
  readonly remap = new Map<string, string>();

  constructor(
    private readonly pris: ReadonlySet<string>,
    private readonly disponibles: ReadonlySet<string>
  ) {}

  manquantes = 0;

  /**
   * Identifiant sous lequel reprendre cette image.
   *
   * Conservé tel quel dans le cas courant : les deux fichiers descendent du
   * même audit préparé, et un plan partagé doit se reconnaître. Changé
   * seulement s'il désigne déjà **une autre** image de ce poste — sans quoi
   * la reprise écraserait une image étrangère au fichier reçu.
   */
  cible(source: string): string {
    const connu = this.remap.get(source);
    if (connu) return connu;
    if (!this.disponibles.has(source)) this.manquantes++;
    const cible = this.pris.has(source) ? uid() : source;
    this.remap.set(source, cible);
    return cible;
  }

  /** Réécrit les références d'un objet repris (photos, localisation sur plan). */
  reprendre(valeur: unknown): void {
    if (Array.isArray(valeur)) {
      valeur.forEach((v) => this.reprendre(v));
      return;
    }
    if (!estObjet(valeur)) return;

    // Une référence d'image : { id, name, … }
    if (typeof valeur['id'] === 'string' && typeof valeur['name'] === 'string') {
      valeur['id'] = this.cible(valeur['id'] as string);
    }
    // Une punaise sur un plan : { planId, x, y }
    if (typeof valeur['planId'] === 'string') {
      const connu = this.remap.get(valeur['planId'] as string);
      if (connu) valeur['planId'] = connu;
    }
    for (const v of Object.values(valeur)) this.reprendre(v);
  }

  get lignes(): { source: string; cible: string }[] {
    return [...this.remap].map(([source, cible]) => ({ source, cible }));
  }
}

/** Identifiants d'images que cet audit référence, plans et photos compris. */
export function assetsReferences(data: AppData): Set<string> {
  const ids = new Set<string>();
  const parcourir = (v: unknown): void => {
    if (Array.isArray(v)) {
      v.forEach(parcourir);
      return;
    }
    if (!estObjet(v)) return;
    if (typeof v['id'] === 'string' && typeof v['name'] === 'string') ids.add(v['id'] as string);
    Object.values(v).forEach(parcourir);
  };
  parcourir(data.Plans);
  parcourir(data.Photos);
  parcourir(data.Qte);
  parcourir(data.Pieces);
  parcourir(data.Batiments);
  return ids;
}

// ── Fusion ─────────────────────────────────────────────────────────────────

export interface OptionsFusion {
  /** Schéma des entités, pour nommer les listes et reconnaître celles connues. */
  schema?: readonly EntityDef[];
  /**
   * Identifiants d'images déjà utilisés sur ce poste — pas seulement ceux de
   * l'audit ouvert : une collision avec l'image d'un **autre** audit ferait
   * autant de dégâts. `AssetStoreService.allIds()` les fournit.
   */
  assetsPris?: ReadonlySet<string>;
}

/**
 * Intègre `recu` dans `local`, sans toucher ni à l'un ni à l'autre.
 *
 * @returns l'audit réuni et le rapport de ce qui a été fait. Les images
 * restent à reprendre par l'appelant, d'après `rapport.assets`.
 */
export function fusionner(
  local: AppData,
  recu: AppData & { __assets?: Record<string, { name: string; data: string }> },
  options: OptionsFusion = {}
): { data: AppData; rapport: RapportFusion } {
  const schema = options.schema ?? AUDIT_SCHEMA;
  const data = clone(local);
  const source = clone(recu) as AppData & { __assets?: Record<string, unknown> };
  // Les images que le fichier transporte réellement. Un export antérieur à
  // `__assets` n'en porte aucune : ses références seront reprises — elles
  // restent dans le JSON — mais le rapport dit combien d'images manquent,
  // plutôt que de laisser l'auditeur découvrir des vignettes vides.
  const images = new Images(
    options.assetsPris ?? assetsReferences(local),
    new Set(Object.keys(recu.__assets ?? {}))
  );

  const rapport: RapportFusion = {
    nomRecu: nomDe(source),
    memeAudit: !!source.Id && source.Id === local.Id,
    champsRepris: [],
    divergences: [],
    batimentsAjoutes: [],
    batimentsDeja: 0,
    piecesAjoutees: [],
    piecesDeja: 0,
    piecesHomonymes: [],
    plansAjoutes: [],
    plansDeja: 0,
    photosAjoutees: 0,
    entites: [],
    conflitsFiches: [],
    renumerotes: [],
    assets: [],
    imagesManquantes: 0,
    piecesIntrouvables: 0,
  };

  const libelle = (cle: string): string => LIBELLES[cle] ?? cle;

  /** Reprend une valeur simple : le vide se remplit, le reste est signalé. */
  const reprendreChamp = (cible: Objet, cle: string, valeur: unknown, nom: string): void => {
    if (vide(valeur)) return;
    if (vide(cible[cle])) {
      cible[cle] = valeur;
      rapport.champsRepris.push(nom);
      return;
    }
    if (egal(cible[cle], valeur)) return;

    if (TEXTES_LONGS.has(cle) && typeof cible[cle] === 'string' && typeof valeur === 'string') {
      const reuni = fusionnerTexte(cible[cle] as string, valeur);
      if (reuni !== null) {
        cible[cle] = reuni;
        rapport.champsRepris.push(nom);
      }
      return;
    }
    rapport.divergences.push({ libelle: nom, local: texte(cible[cle]), recu: texte(valeur) });
  };

  // ── Généralités ──────────────────────────────────────────────────────────
  const brut = source as unknown as Objet;
  for (const cle of Object.keys(brut)) {
    if (PARTIES.has(cle)) continue;
    reprendreChamp(data as unknown as Objet, cle, brut[cle], libelle(cle));
  }

  // ── Cases à cocher : une case cochée par l'un vaut pour les deux ─────────
  for (const cle of ['UtilisationsEau', 'EquipementsPresents'] as const) {
    const recues = brut[cle];
    if (!estObjet(recues)) continue;
    const ici = ((data as unknown as Objet)[cle] ??= {}) as Objet;
    for (const [k, v] of Object.entries(recues)) {
      // `true` l'emporte : une section que l'un a eu besoin d'afficher doit
      // rester atteignable, et décocher ne masque jamais une saisie.
      if (v === true || vide(ici[k])) ici[k] = v;
    }
  }

  // ── Documents collectés ──────────────────────────────────────────────────
  const docsRecus = brut['Documents'];
  if (estObjet(docsRecus)) {
    const ici = (data.Documents ??= {});
    for (const [id, etat] of Object.entries(docsRecus)) {
      if (!estObjet(etat)) continue;
      const mien = (ici[id] ??= {});
      if (etat['coche'] === true) mien.coche = true;
      const precision = etat['precision'];
      if (typeof precision === 'string' && precision.trim()) {
        if (vide(mien.precision)) mien.precision = precision;
        else if (mien.precision !== precision) {
          rapport.divergences.push({
            libelle: `Document « ${id} » — précision`,
            local: texte(mien.precision),
            recu: precision,
          });
        }
      }
    }
  }

  // ── Plans : reconnus à leur identité, jamais recopiés deux fois ──────────
  const plans = (data.Plans ??= []);
  for (const plan of (source.Plans ?? []) as AssetRef[]) {
    if (!plan?.id) continue;
    if (plans.some((p) => p.id === plan.id)) {
      rapport.plansDeja++;
      continue;
    }
    const repris = clone(plan);
    images.reprendre(repris);
    plans.push(repris);
    rapport.plansAjoutes.push(repris.name || 'plan sans nom');
  }

  // ── Bâtiments ────────────────────────────────────────────────────────────
  //
  // Reconnus à leur identité, comme les pièces et les plans : c'est ce qui
  // permet de retrouver la base préparée en commun. Un bâtiment homonyme mais
  // d'identité différente est conservé à part — les deux auditeurs l'ont créé
  // chacun de leur côté, et fusionner supposerait de choisir laquelle des deux
  // années de construction est la bonne.
  const batiments = (data.Batiments ??= []);
  for (const batiment of (source.Batiments ?? []) as Batiment[]) {
    if (!batiment?.Id) continue;
    if (batiments.some((b) => b.Id === batiment.Id)) {
      rapport.batimentsDeja++;
      continue;
    }
    const repris = clone(batiment);
    batiments.push(repris);
    rapport.batimentsAjoutes.push((repris.Nom || '').trim() || 'bâtiment sans nom');
  }

  // ── Pièces ───────────────────────────────────────────────────────────────
  const pieces = (data.Pieces ??= []);
  for (const piece of (source.Pieces ?? []) as Piece[]) {
    if (!piece?.Id) continue;
    if (pieces.some((p) => p.Id === piece.Id)) {
      rapport.piecesDeja++;
      continue;
    }
    const repris = clone(piece);
    images.reprendre(repris.Localisation as PlanLocation | null | undefined);
    const nom = (repris.Nom || '').trim();
    if (nom && pieces.some((p) => (p.Nom || '').trim().toLowerCase() === nom.toLowerCase())) {
      rapport.piecesHomonymes.push(nom);
    }
    pieces.push(repris);
    rapport.piecesAjoutees.push(nom || 'pièce sans nom');
  }

  // ── Galerie générale ─────────────────────────────────────────────────────
  const photos = (data.Photos ??= []);
  for (const photo of (source.Photos ?? []) as AssetRef[]) {
    if (!photo?.id || photos.some((p) => p.id === photo.id)) continue;
    const repris = clone(photo);
    images.reprendre(repris);
    photos.push(repris);
    rapport.photosAjoutees++;
  }

  // ── Audit technique ──────────────────────────────────────────────────────
  const qteRecu = brut['Qte'];
  if (estObjet(qteRecu)) {
    const qte = ((data.Qte ??= {}) as unknown as Objet);
    const parEntite = new Map(schema.map((d) => [d.key, d]));

    for (const cle of Object.keys(qteRecu)) {
      const valeur = qteRecu[cle];
      const def = parEntite.get(cle);

      if (cle === 'Info') {
        reprendreChamp(qte, cle, valeur, 'Audit technique — informations');
        continue;
      }

      if (Array.isArray(valeur)) {
        fusionnerListe(qte, cle, valeur, def, { data, rapport, images });
        continue;
      }

      // Une fiche unique reçue pour une entité devenue répétable : le compteur
      // général était un objet jusqu'en 2026-09. `ensureEntityIds` convertit
      // l'audit d'accueil au chargement, mais un fichier reçu peut être plus
      // ancien — sans cette ligne, sa fiche était signalée en divergence et
      // laissée de côté.
      if (estObjet(valeur) && def && !def.single) {
        fusionnerListe(qte, cle, [valeur], def, { data, rapport, images });
        continue;
      }

      if (estObjet(valeur)) {
        // Fiche unique (la zone piscine), tableau de bord, tables héritées.
        const ici = (qte[cle] ??= {}) as Objet;
        if (!estObjet(ici)) {
          reprendreChamp(qte, cle, valeur, cle);
          continue;
        }
        const prefixe = def?.singular ?? (cle === 'TableauDeBord' ? 'Le bâtiment' : cle);
        for (const [k, v] of Object.entries(valeur)) {
          reprendreChamp(ici, k, v, `${prefixe} — ${k}`);
        }
        continue;
      }

      reprendreChamp(qte, cle, valeur, cle);
    }
  }

  // ── Questionnaires en JSON libre ─────────────────────────────────────────
  for (const cle of ['Qge', 'Qus'] as const) {
    const recues = brut[cle];
    if (!estObjet(recues)) continue;
    const ici = ((data as unknown as Objet)[cle] ??= {}) as Objet;
    for (const [k, v] of Object.entries(recues)) reprendreChamp(ici, k, v, `${cle}.${k}`);
  }

  // ── Renvois introuvables ─────────────────────────────────────────────────
  //
  // Une pièce ou un bâtiment désigné des deux côtés mais absent des deux
  // fichiers : la valeur est conservée — on n'efface pas une saisie — et le
  // rapport le dit, parce qu'une vignette orpheline ne s'explique pas d'elle-même.
  const connues = new Set((data.Pieces ?? []).map((p) => p.Id));
  const batimentsConnus = new Set((data.Batiments ?? []).map((b) => b.Id));
  for (const piece of data.Pieces ?? []) {
    if (typeof piece.Batiment === 'string' && piece.Batiment && !batimentsConnus.has(piece.Batiment)) {
      rapport.piecesIntrouvables++;
    }
  }
  for (const v of Object.values((data.Qte ?? {}) as Objet)) {
    if (!Array.isArray(v)) continue;
    for (const item of v as AuditEntity[]) {
      const ref = item?.Piece;
      if (typeof ref === 'string' && ref && !connues.has(ref)) rapport.piecesIntrouvables++;
      const bat = item?.Batiment;
      if (typeof bat === 'string' && bat && !batimentsConnus.has(bat)) rapport.piecesIntrouvables++;
    }
  }

  rapport.assets = images.lignes;
  rapport.imagesManquantes = images.manquantes;
  rapport.entites = rapport.entites.filter((e) => e.ajoutes || e.identiques || e.dupliques);

  // L'identité de l'audit d'accueil ne change jamais : c'est lui qui reçoit.
  data.Id = local.Id;
  return { data, rapport };
}

/**
 * Réunit une liste d'éléments.
 *
 * Trois sorts possibles pour un élément reçu, selon ce qu'on trouve sous la
 * même identité :
 *
 *  - **rien** : il est ajouté, avec son identité et un numéro à la suite ;
 *  - **la même fiche, moins remplie** : elle est **complétée**. Les deux
 *    auditeurs partent de la même base préparée ; que l'un remplisse une fiche
 *    que l'autre a laissée vide est le cas le plus courant, et le dupliquer
 *    serait absurde ;
 *  - **la même fiche, remplie autrement** : elle est ajoutée **en double**, et
 *    la fiche d'accueil n'est pas touchée. Les deux versions restent lisibles
 *    côte à côte ; on n'arbitre pas à la place de l'auditeur.
 *
 * Les photos sont le seul champ réuni plutôt qu'arbitré : deux photos d'un
 * même robinet ne sont pas deux réponses concurrentes.
 */
function fusionnerListe(
  qte: Objet,
  cle: string,
  recue: unknown[],
  def: EntityDef | undefined,
  ctx: { data: AppData; rapport: RapportFusion; images: Images }
): void {
  const existante = qte[cle];
  const liste = (Array.isArray(existante) ? existante : []) as AuditEntity[];
  if (!Array.isArray(existante)) {
    // Une fiche unique devenue liste (le compteur général) : `ensureEntityIds`
    // la convertit au chargement, mais un fichier reçu peut être plus ancien.
    if (estObjet(existante)) liste.push(existante as unknown as AuditEntity);
    qte[cle] = liste;
  }

  const nom = def?.plural ?? cle;
  const apport: ApportEntite = {
    entite: cle,
    libelle: nom,
    ajoutes: 0,
    completes: 0,
    identiques: 0,
    dupliques: 0,
  };
  let numero = prochainNumero(liste);

  const libelleChamp = (k: string): string => def?.fields.find((f) => f.key === k)?.label ?? k;

  for (const brut of recue) {
    if (!estObjet(brut)) continue;
    const item = clone(brut) as AuditEntity;
    const jumeau = item.Id ? liste.find((e) => e.Id === item.Id) : undefined;

    if (jumeau) {
      const { conflits, appliquer } = confronter(jumeau, item);

      if (!conflits.length) {
        const touche = appliquer(ctx.images);
        if (touche) apport.completes++;
        else apport.identiques++;
        continue;
      }

      // Déjà réglé lors d'une intégration précédente : le doublon est là.
      // L'auditeur peut se tromper de fichier, ou reprendre après une
      // coupure ; sans cette reconnaissance, chaque hésitation rajouterait
      // une copie de la même fiche.
      if (liste.some((e) => e !== jumeau && memeContenu(e, item))) {
        apport.identiques++;
        continue;
      }

      // Renseigné différemment des deux côtés : on ajoute, on ne remplace pas.
      ctx.rapport.conflitsFiches.push({
        libelle: `${def?.singular ?? cle} n° ${jumeau.Numero ?? '?'}`,
        champs: conflits.map(libelleChamp),
      });
      item.Id = uid();
      apport.dupliques++;
    } else {
      item.Id ||= uid();
      apport.ajoutes++;
    }

    ctx.images.reprendre(item);

    const ancien = String(item.Numero ?? '').trim();
    const neuf = String(numero++);
    if (ancien !== neuf) {
      ctx.rapport.renumerotes.push({
        libelle: `${def?.singular ?? cle} ${ancien || '(sans numéro)'}`,
        de: ancien || '—',
        vers: neuf,
      });
    }
    item.Numero = neuf;
    liste.push(item);
  }

  ctx.rapport.entites.push(apport);
}

/**
 * Deux fiches portent-elles les mêmes réponses ?
 *
 * L'identité et le numéro sont écartés — ils sont refaits pour un doublon — et
 * les photos aussi : celles d'un doublon sont recopiées sous de nouveaux
 * identifiants, pour que supprimer l'une des deux fiches n'efface pas les
 * images de l'autre (voir `DataService.deleteEntity`). Les comparer ferait
 * donc échouer la reconnaissance qu'on cherche ici.
 *
 * Sert à reconnaître un doublon posé par une intégration précédente, et
 * seulement dans ce cas : on sait déjà qu'une fiche porte la même identité, si
 * bien qu'une fiche de même contenu ne peut être qu'une copie de celle-là.
 */
function memeContenu(a: AuditEntity, b: AuditEntity): boolean {
  const reponses = (e: AuditEntity): Objet => {
    const c = { ...(e as unknown as Objet) };
    delete c['Id'];
    delete c['Numero'];
    delete c['Photos'];
    return c;
  };
  return egal(reponses(a), reponses(b));
}

/**
 * Confronte deux versions d'une même fiche, sans rien modifier.
 *
 * @returns les clés en concurrence, et de quoi appliquer les compléments s'il
 * n'y en a aucune. Le calcul et l'écriture sont séparés parce que la décision
 * dépend du résultat entier : un seul champ en concurrence suffit à renoncer à
 * tous les compléments, pour que les deux versions restent telles quelles.
 */
function confronter(
  jumeau: AuditEntity,
  recu: AuditEntity
): { conflits: string[]; appliquer: (images: Images) => boolean } {
  const conflits: string[] = [];
  const remplir: [string, unknown][] = [];
  let photos: AssetRef[] | null = null;
  let neuves: AssetRef[] = [];

  for (const [k, v] of Object.entries(recu)) {
    // L'identité ne se discute pas, et le numéro n'est qu'un libellé : celui
    // de la fiche d'accueil est conservé.
    if (k === 'Id' || k === 'Numero') continue;

    if (k === 'Photos') {
      const ici = (jumeau['Photos'] as AssetRef[] | undefined) ?? [];
      const recues = (Array.isArray(v) ? v : []) as AssetRef[];
      neuves = recues.filter((r) => r?.id && !ici.some((p) => p.id === r.id));
      if (neuves.length) photos = [...ici, ...neuves];
      continue;
    }

    if (egal(jumeau[k], v)) continue;
    if (vide(jumeau[k])) remplir.push([k, v]);
    else conflits.push(k);
  }

  const appliquer = (images: Images): boolean => {
    // `reprendre` n'est appelé que sur les valeurs **reçues** : passée la fiche
    // entière, elle réécrirait aussi les références d'images déjà locales —
    // qui sont, par construction, des identifiants « déjà pris » — et les
    // ferait pointer dans le vide.
    for (const [k, v] of remplir) {
      images.reprendre(v);
      (jumeau as unknown as Objet)[k] = v;
    }
    if (photos) {
      images.reprendre(neuves);
      jumeau['Photos'] = photos;
    }
    return remplir.length > 0 || photos !== null;
  };

  return { conflits, appliquer };
}

/** Nom lisible de l'audit reçu, pour que l'auditeur reconnaisse son fichier. */
function nomDe(data: AppData): string {
  for (const v of [data.NomSite, data.NomProjet, data.Adresse]) {
    if (typeof v === 'string' && v.trim()) return v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return 'audit sans nom';
}
