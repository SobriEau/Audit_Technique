import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { DOCUMENTS_A_COLLECTER } from '../../models/documents-collectes';
import { EntityDef, FieldDef, MesureDebit, debitCalcule } from '../../models/field.models';
import { CHAMPS_CONTEXTE } from '../../models/tableau-de-bord';
import { UTILISATIONS_EAU } from '../../models/utilisations-eau';
import { cleAutre } from '../../qte/form-layout';

/**
 * Export CSV d'un audit, pour compiler et analyser plusieurs bâtiments.
 *
 * **Format long : une ligne par réponse.** Un audit n'est pas un tableau — dix-
 * sept types de fiches aux colonnes différentes, plus les généralités — et un
 * format large aurait changé de colonnes à chaque évolution du formulaire. Ici
 * les colonnes sont fixes, et c'est le nombre de lignes qui suit le contenu.
 *
 * **Le parcours suit les données, jamais le schéma.** C'est ce qui garantit
 * qu'aucune saisie ne manque quand le formulaire évolue : le schéma ne fait
 * qu'habiller une valeur (libellé, rubrique, unité) ; il ne décide pas de ce
 * qui sort. Un champ ajouté au classeur sort de lui-même ; un champ retiré
 * continue de sortir, sous sa clé, pour les audits qui l'avaient rempli ; une
 * structure inconnue est dépliée telle quelle. `tools/check-csv.js` le vérifie
 * en comparant, feuille par feuille, le JSON et le fichier produit.
 *
 * Seules exceptions, assumées : les images. La clé `__assets` du fichier
 * exporté n'est pas reprise, et une image restée en ligne dans un audit ancien
 * est remplacée par sa description — le CSV porte les références (nom,
 * identifiant), pas des mégaoctets de base64 dans une cellule.
 *
 * Fonctions pures, sans Angular : le même code sert le bouton de l'application
 * et `tools/json-to-csv.js`, qui convertit un JSON déjà exporté.
 */

type Scalaire = string | number | boolean;
type Objet = Record<string, unknown>;

export interface LigneCsv {
  /** Partie de l'audit : « Généralités », « Robinets », « Documents collectés »… */
  section: string;
  /** Numéro affiché de l'élément, pour une fiche ; vide ailleurs. */
  element: string;
  /** Identité stable de l'élément : c'est elle qu'un renvoi entre fiches désigne. */
  elementId: string;
  /** Rubrique de la fiche (« Calorifugeage », « Mesures »…). */
  rubrique: string;
  /** Intitulé de la question, tel qu'affiché. Peut changer d'une version à l'autre. */
  question: string;
  /**
   * Chemin de la valeur dans le JSON, sans le rang de l'élément :
   * `Qte.wc[].Utilisateurs`. Stable d'une version à l'autre — c'est la colonne
   * sur laquelle filtrer et croiser, pas `question`.
   */
  cle: string;
  valeur: Scalaire;
  unite: string;
  /** `saisie` : une valeur du JSON. `calcul` : déduite à l'export (débit, numéro d'un renvoi…). */
  origine: 'saisie' | 'calcul';
  /** Chemin complet de la valeur dans le JSON, pour le contrôle. Absent d'une ligne calculée. */
  chemin?: string;
}

/** En-têtes du fichier, sans accent ni espace : ils servent de noms de variables. */
export const COLONNES_CSV = [
  'AuditId',
  'Audit',
  'Section',
  'Element',
  'ElementId',
  'Rubrique',
  'Question',
  'Cle',
  'Valeur',
  'Unite',
  'Origine',
] as const;

export const SEPARATEUR_CSV = ';';

/** Sépare les réponses d'un choix multiple. Une virgule figure déjà dans des options. */
const SEPARATEUR_CHOIX = ' | ';

// ── Libellés des parties que le schéma ne décrit pas ───────────────────────
//
// Ce ne sont que des habillages : une clé absente de ces tables sort quand
// même, sous son nom. Les intitulés sont ceux de l'accueil du projet.

const GENERALITES: [string, string][] = [
  ['NomProjet', 'Nom du projet'],
  ['NomSite', 'Nom du site audité'],
  ['Date', 'Date de début de la visite terrain'],
  ['Auditeur', "Nom de l'auditeur"],
  ['Accompagnant', "Nom et fonction de l'accompagnant"],
  ['Adresse', 'Adresse'],
  ['AdresseKey', 'Adresse normalisée'],
  ['Effectif', 'Effectif'],
  ['Info', 'Informations complémentaires'],
  ['NiveauRemplissage', 'Niveau de remplissage des fiches'],
];

/** Parties de l'audit qui ont leur propre section dans l'export. */
const PARTIES = new Set(['UtilisationsEau', 'EquipementsPresents', 'Documents', 'Plans', 'Photos', 'Qge', 'Qus', 'Qte']);

/** Valeurs en texte enrichi : le balisage est retiré, le texte et ses retours à la ligne gardés. */
const TEXTE_ENRICHI = new Set(['Info', 'Adresse']);

const LIBELLES_IMAGE: Record<string, string> = {
  name: 'nom',
  id: 'identifiant',
  path: 'fichier',
  driveId: 'identifiant Drive',
  date: 'date',
};

const LIBELLES_LOCALISATION: Record<string, string> = {
  planId: 'identifiant du plan',
  x: 'position horizontale (0 à 1)',
  y: 'position verticale (0 à 1)',
};

/** Les trois saisies d'un essai de mesure de débit. */
const MESURE: Record<string, { libelle: string; unite: string }> = {
  temps: { libelle: 'temps', unite: 's' },
  volume: { libelle: 'volume', unite: 'L' },
  direct: { libelle: 'mesure directe au bol', unite: 'L/min' },
};

// ── Outils ─────────────────────────────────────────────────────────────────

const estObjet = (v: unknown): v is Objet => !!v && typeof v === 'object' && !Array.isArray(v);

const estScalaire = (v: unknown): v is Scalaire =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/** Rien à exporter : ni réponse, ni structure. « Non » et 0 sont des réponses. */
function estVide(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

const texteDe = (v: unknown): string => (estScalaire(v) && !estVide(v) ? String(v) : '');

/** Nombre à la française : la virgule décimale va de pair avec le séparateur « ; ». */
function formaterNombre(n: number): string {
  return Number.isFinite(n) ? String(n).replace('.', ',') : '';
}

function formaterScalaire(v: Scalaire): string {
  if (typeof v === 'number') return formaterNombre(v);
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  return v;
}

/** Accès à une sous-clé, à la manière d'un chemin JavaScript. */
function acces(cle: string): string {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(cle) ? '.' + cle : '[' + cle + ']';
}

const joindre = (base: string, cle: string): string => (base ? base + acces(cle) : cle);

/** Une image en ligne (`data:image/png;base64,…`), héritée d'avant IndexedDB. */
const IMAGE_EN_LIGNE_RE = /^data:([^;,]*)[;,]/;

function decrireImage(v: string): string {
  const type = (v.match(IMAGE_EN_LIGNE_RE) as RegExpMatchArray)[1] || 'données';
  const ko = Math.max(1, Math.round((v.length * 3) / 4 / 1024));
  return `[${type} en ligne, environ ${ko} Ko — non recopiée]`;
}

/**
 * Texte d'une valeur en texte enrichi.
 *
 * Le balisage n'a pas sa place dans une cellule ; le texte, si, avec ses
 * retours à la ligne. Une balise commence par une lettre : « débit < 3 L/min »
 * saisi dans une adresse n'en est pas une, et reste intact.
 */
export function texteDepuisHtml(html: string): string {
  if (!/<\/?[a-zA-Z][^<>]*>|&[a-zA-Z#]\w*;/.test(html)) return html;
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li(\s[^<>]*)?>/gi, '• ')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)\s*>/gi, '\n')
    .replace(/<\/?[a-zA-Z][^<>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Relevé des lignes ──────────────────────────────────────────────────────

/** Ce que toutes les lignes d'un même bloc partagent. */
interface Cadre {
  section: string;
  element: string;
  elementId: string;
  rubrique: string;
}

const cadreDe = (section: string): Cadre => ({ section, element: '', elementId: '', rubrique: '' });

/** Habillage d'une clé d'élément par le schéma. */
interface Habillage {
  question: string;
  rubrique: string;
  unite: string;
  /** Le champ du schéma, quand la clé est la sienne. */
  champ?: FieldDef;
  /** Table `{ option: texte }` d'un champ `parOption`. */
  parOption?: boolean;
}

/**
 * Habillage des clés d'une fiche : ses champs, puis leurs clés voisines —
 * la précision d'une option « Autre », le champ libre par option cochée.
 */
function habillages(champs: readonly FieldDef[]): Map<string, Habillage> {
  const table = new Map<string, Habillage>();
  for (const f of champs) {
    table.set(f.key, { question: f.label, rubrique: f.section ?? '', unite: f.unit ?? '', champ: f });
  }
  // Les clés voisines viennent après : un vrai champ garde toujours la main.
  for (const f of champs) {
    const rubrique = f.section ?? '';
    if (f.kind === 'select' && !table.has(cleAutre(f))) {
      table.set(cleAutre(f), { question: `${f.label} — préciser « autre »`, rubrique, unite: '' });
    }
    if (f.parOption && !table.has(f.parOption.cle)) {
      table.set(f.parOption.cle, { question: f.parOption.libelle, rubrique, unite: '', parOption: true });
    }
  }
  return table;
}

/** Ordre de sortie des clés d'une fiche : celui du formulaire, puis ce que le schéma ignore. */
function ordreDesCles(item: Objet, champs: readonly FieldDef[]): string[] {
  const prevues: string[] = [];
  for (const f of champs) {
    prevues.push(f.key, cleAutre(f));
    if (f.parOption) prevues.push(f.parOption.cle);
  }
  prevues.push('Localisation', 'Photos');
  const vues = new Set<string>();
  const ordre: string[] = [];
  for (const k of [...prevues, ...Object.keys(item)]) {
    if (k in item && !vues.has(k)) {
      vues.add(k);
      ordre.push(k);
    }
  }
  return ordre;
}

class Releve {
  readonly lignes: LigneCsv[] = [];
  private readonly parEntite = new Map<string, EntityDef>();
  private readonly tables = new Map<readonly FieldDef[], Map<string, Habillage>>();

  constructor(
    private readonly audit: Objet,
    schema: readonly EntityDef[]
  ) {
    for (const def of schema) this.parEntite.set(def.key, def);
  }

  entite(cle: string): EntityDef | undefined {
    return this.parEntite.get(cle);
  }

  private habillage(champs: readonly FieldDef[]): Map<string, Habillage> {
    let table = this.tables.get(champs);
    if (!table) {
      table = habillages(champs);
      this.tables.set(champs, table);
    }
    return table;
  }

  private saisie(cadre: Cadre, question: string, cle: string, valeur: Scalaire, unite: string, chemin: string): void {
    this.lignes.push({ ...cadre, question, cle, valeur, unite, origine: 'saisie', chemin });
  }

  private calcul(cadre: Cadre, question: string, cle: string, valeur: Scalaire, unite = ''): void {
    this.lignes.push({ ...cadre, question, cle, valeur, unite, origine: 'calcul' });
  }

  /**
   * Dépose une valeur, quelle que soit sa forme.
   *
   * C'est le filet : tout ce qu'aucune règle ne reconnaît passe par ici et
   * sort quand même. Un tableau de réponses simples — un choix multiple — tient
   * sur une ligne ; toute autre structure est dépliée, une ligne par feuille.
   */
  deposer(
    cadre: Cadre,
    v: unknown,
    chemin: string,
    cle: string,
    question: string,
    unite = '',
    libelles: Record<string, string> = {}
  ): void {
    if (estVide(v)) return;

    if (typeof v === 'string') {
      this.saisie(cadre, question, cle, IMAGE_EN_LIGNE_RE.test(v) ? decrireImage(v) : v, unite, chemin);
      return;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      this.saisie(cadre, question, cle, v, unite, chemin);
      return;
    }

    if (Array.isArray(v)) {
      if (v.every((x) => estScalaire(x) || estVide(x))) {
        const reponses = v.filter((x): x is Scalaire => estScalaire(x) && !estVide(x));
        if (!reponses.length) return;
        const texte = reponses.map(formaterScalaire).join(SEPARATEUR_CHOIX);
        this.saisie(cadre, question, cle, texte, unite, chemin);
        return;
      }
      v.forEach((x, i) => this.deposer(cadre, x, `${chemin}[${i}]`, `${cle}[${i}]`, `${question} ${i + 1}`, '', libelles));
      return;
    }

    for (const [k, x] of Object.entries(v as Objet)) {
      this.deposer(cadre, x, joindre(chemin, k), joindre(cle, k), `${question} — ${libelles[k] ?? k}`, '', libelles);
    }
  }

  /**
   * Dépose les clés d'une fiche, habillées par ses champs.
   *
   * Toutes les clés de l'élément sont visitées ; le schéma ne sert qu'à les
   * nommer et à reconnaître les quelques formes qui méritent mieux qu'un
   * dépliage brut (essais de débit, renvoi vers une autre fiche).
   */
  deposerChamps(base: Cadre, champs: readonly FieldDef[], item: Objet, chemin: string, cle: string, ignorer: string[] = []): void {
    const table = this.habillage(champs);

    for (const k of ordreDesCles(item, champs)) {
      if (ignorer.includes(k)) continue;
      const v = item[k];
      const h = table.get(k);
      const cadre = { ...base, rubrique: h?.rubrique ?? '' };
      const ch = joindre(chemin, k);
      const cl = joindre(cle, k);

      if (!h) {
        if (k === 'Photos') this.deposer(cadre, v, ch, cl, 'Photo', '', LIBELLES_IMAGE);
        else if (k === 'Localisation') this.deposerLocalisation(cadre, v, ch, cl);
        else this.deposer(cadre, v, ch, cl, k);
        continue;
      }

      if (h.parOption && estObjet(v)) {
        for (const [option, texte] of Object.entries(v)) {
          this.deposer(cadre, texte, joindre(ch, option), joindre(cl, option), `${h.question} — ${option}`);
        }
        continue;
      }

      const genre = h.champ?.kind;
      if (genre === 'mesures-debit' && Array.isArray(v)) {
        this.deposerMesures(cadre, v, ch, cl, h.question);
      } else if (genre === 'entity-ref' && typeof v === 'string') {
        this.deposer(cadre, v, ch, cl, h.question);
        this.deposerRenvoi(cadre, v, cl, h.question, h.champ?.refTo);
      } else if (genre === 'rich' && typeof v === 'string') {
        this.deposer(cadre, texteDepuisHtml(v), ch, cl, h.question);
      } else {
        this.deposer(cadre, v, ch, cl, h.question, h.unite);
      }
    }
  }

  /** Essais de mesure de débit : les saisies, puis le débit que l'écran en calcule. */
  private deposerMesures(cadre: Cadre, essais: unknown[], chemin: string, cle: string, question: string): void {
    essais.forEach((m, i) => {
      const titre = `${question} — essai ${i + 1}`;
      const ch = `${chemin}[${i}]`;
      const cl = `${cle}[${i}]`;
      if (!estObjet(m)) {
        this.deposer(cadre, m, ch, cl, titre);
        return;
      }
      for (const [k, x] of Object.entries(m)) {
        const connu = MESURE[k];
        this.deposer(cadre, x, joindre(ch, k), joindre(cl, k), `${titre} — ${connu?.libelle ?? k}`, connu?.unite ?? '');
      }
      if (typeof m['temps'] === 'number' && typeof m['volume'] === 'number') {
        const debit = debitCalcule(m as MesureDebit);
        if (debit !== null) this.calcul(cadre, `${titre} — débit calculé`, `${cl}.debitCalcule`, debit, 'L/min');
      }
    });
  }

  /**
   * Renvoi vers une autre fiche. La valeur stockée est l'identité de la cible —
   * à rapprocher de la colonne `ElementId` ; son numéro affiché est ajouté pour
   * la lecture, tant que la cible existe.
   */
  private deposerRenvoi(cadre: Cadre, id: string, cle: string, question: string, versEntite?: string): void {
    const qte = this.audit['Qte'];
    const liste = versEntite && estObjet(qte) ? qte[versEntite] : null;
    if (!Array.isArray(liste)) return;
    const cible = liste.find((e) => estObjet(e) && e['Id'] === id) as Objet | undefined;
    const numero = cible ? texteDe(cible['Numero']) : '';
    if (numero) this.calcul(cadre, `${question} — numéro`, `${cle}.Numero`, numero);
  }

  /** Punaise sur un plan : ses coordonnées, puis le nom du plan pour la lecture. */
  private deposerLocalisation(cadre: Cadre, v: unknown, chemin: string, cle: string): void {
    this.deposer(cadre, v, chemin, cle, 'Localisation sur plan', '', LIBELLES_LOCALISATION);
    const plans = this.audit['Plans'];
    if (!estObjet(v) || !Array.isArray(plans)) return;
    const plan = plans.find((p) => estObjet(p) && p['id'] === v['planId']) as Objet | undefined;
    const nom = plan ? texteDe(plan['name']) : '';
    if (nom) this.calcul(cadre, 'Localisation sur plan — nom du plan', `${cle}.planNom`, nom);
  }

  /**
   * Un élément d'une liste, ou une fiche unique.
   *
   * L'identité (`Id`) part dans la colonne `ElementId` de chacune de ses
   * lignes. Un élément de liste a toujours sa ligne « Numéro », même vide :
   * une fiche créée sans rien y saisir doit encore se compter.
   */
  deposerElement(section: string, champs: readonly FieldDef[], item: Objet, chemin: string, cle: string, dansListe: boolean): void {
    const numero = item['Numero'];
    const cadre: Cadre = { section, element: texteDe(numero), elementId: texteDe(item['Id']), rubrique: '' };
    // Seul un `Id` simple tient dans la colonne ; toute autre forme est dépliée.
    const ignorer = estScalaire(item['Id']) || estVide(item['Id']) ? ['Id'] : [];

    if (estScalaire(numero) && !estVide(numero)) {
      this.saisie(cadre, 'Numéro', joindre(cle, 'Numero'), numero, '', joindre(chemin, 'Numero'));
      ignorer.push('Numero');
    } else if (dansListe) {
      this.calcul(cadre, 'Numéro', joindre(cle, 'Numero'), '');
    }

    this.deposerChamps(cadre, champs, item, chemin, cle, ignorer);
  }
}

/**
 * Toutes les lignes d'un audit, dans l'ordre de l'application : généralités,
 * usages de l'eau, documents, plans et photos, puis l'audit technique fiche
 * par fiche. Ce que personne n'attend sort à la fin, sous sa clé.
 */
export function lignesAudit(audit: unknown, schema: readonly EntityDef[] = AUDIT_SCHEMA): LigneCsv[] {
  if (!estObjet(audit)) return [];
  const r = new Releve(audit, schema);

  const restantes = new Set(Object.keys(audit));
  const prendre = (cle: string): unknown => {
    restantes.delete(cle);
    return audit[cle];
  };

  // L'identité de l'audit est la colonne `AuditId` ; les images embarquées ne
  // sont pas des réponses.
  prendre('Id');
  prendre('__assets');

  // ── Généralités ──────────────────────────────────────────────────────────
  const generalites = cadreDe('Généralités');
  for (const [cle, libelle] of GENERALITES) {
    const v = prendre(cle);
    const texte = TEXTE_ENRICHI.has(cle) && typeof v === 'string' ? texteDepuisHtml(v) : v;
    r.deposer(generalites, texte, cle, cle, libelle);
  }
  // Une clé simple que cette version ne connaît pas encore. Les parties
  // traitées plus bas le sont à leur tour, quelle que soit leur forme.
  for (const cle of [...restantes]) {
    if (!PARTIES.has(cle) && estScalaire(audit[cle])) r.deposer(generalites, prendre(cle), cle, cle, cle);
  }

  // ── Usages de l'eau, équipements, documents ──────────────────────────────
  const usages = prendre('UtilisationsEau');
  if (estObjet(usages)) {
    const libelles = Object.fromEntries(UTILISATIONS_EAU.map((u) => [u.key, u.label]));
    for (const [k, v] of Object.entries(usages)) {
      r.deposer(cadreDe("Utilisations de l'eau"), v, joindre('UtilisationsEau', k), joindre('UtilisationsEau', k), libelles[k] ?? k);
    }
  } else {
    r.deposer(cadreDe("Utilisations de l'eau"), usages, 'UtilisationsEau', 'UtilisationsEau', 'UtilisationsEau');
  }

  const presents = prendre('EquipementsPresents');
  const cadrePresents = cadreDe('Équipements présents (ancien régime)');
  if (estObjet(presents)) {
    for (const [k, v] of Object.entries(presents)) {
      r.deposer(cadrePresents, v, joindre('EquipementsPresents', k), joindre('EquipementsPresents', k), r.entite(k)?.plural ?? k);
    }
  } else {
    r.deposer(cadrePresents, presents, 'EquipementsPresents', 'EquipementsPresents', 'EquipementsPresents');
  }

  const documents = prendre('Documents');
  const cadreDocuments = cadreDe('Documents collectés');
  if (estObjet(documents)) {
    const libelles = Object.fromEntries(DOCUMENTS_A_COLLECTER.map((d) => [d.id, d.libelle.replace(/\s*:\s*$/, '')]));
    for (const [id, etat] of Object.entries(documents)) {
      const libelle = libelles[id] ?? id;
      const base = joindre('Documents', id);
      if (!estObjet(etat)) {
        r.deposer(cadreDocuments, etat, base, base, libelle);
        continue;
      }
      for (const [k, v] of Object.entries(etat)) {
        const question = k === 'coche' ? libelle : `${libelle} — ${k === 'precision' ? 'précision' : k}`;
        r.deposer(cadreDocuments, v, joindre(base, k), joindre(base, k), question);
      }
    }
  } else {
    r.deposer(cadreDocuments, documents, 'Documents', 'Documents', 'Documents');
  }

  // ── Plans et photos : leurs références, pas les images ───────────────────
  r.deposer(cadreDe('Plans du bâtiment'), prendre('Plans'), 'Plans', 'Plans', 'Plan', '', LIBELLES_IMAGE);
  r.deposer(cadreDe("Photos de l'audit"), prendre('Photos'), 'Photos', 'Photos', 'Photo', '', LIBELLES_IMAGE);

  // ── Questionnaires en JSON libre ─────────────────────────────────────────
  for (const [cle, section] of [
    ['Qge', 'Questionnaire gestionnaire'],
    ['Qus', 'Questionnaire usagers'],
  ]) {
    const v = prendre(cle);
    if (estObjet(v)) {
      for (const [k, x] of Object.entries(v)) r.deposer(cadreDe(section), x, joindre(cle, k), joindre(cle, k), k);
    } else {
      r.deposer(cadreDe(section), v, cle, cle, cle);
    }
  }

  // ── Audit technique ──────────────────────────────────────────────────────
  const qte = prendre('Qte');
  if (estObjet(qte)) deposerQte(r, qte, schema);
  else r.deposer(cadreDe('Audit technique'), qte, 'Qte', 'Qte', 'Qte');

  // ── Ce que cette version ne connaît pas ──────────────────────────────────
  for (const cle of restantes) r.deposer(cadreDe(cle), audit[cle], cle, cle, cle);

  return r.lignes;
}

function deposerQte(r: Releve, qte: Objet, schema: readonly EntityDef[]): void {
  const restantes = new Set(Object.keys(qte));
  const prendre = (cle: string): unknown => {
    restantes.delete(cle);
    return qte[cle];
  };

  const info = prendre('Info');
  r.deposer(cadreDe('Audit technique'), typeof info === 'string' ? texteDepuisHtml(info) : info, 'Qte.Info', 'Qte.Info', 'Informations');

  const contexte = prendre('TableauDeBord');
  if (estObjet(contexte)) {
    r.deposerChamps(cadreDe('Tableau de bord'), CHAMPS_CONTEXTE, contexte, 'Qte.TableauDeBord', 'Qte.TableauDeBord');
  } else {
    r.deposer(cadreDe('Tableau de bord'), contexte, 'Qte.TableauDeBord', 'Qte.TableauDeBord', 'TableauDeBord');
  }

  // Les fiches du schéma dans l'ordre du classeur, puis ce qu'il ne décrit
  // plus (un onglet retiré) ou pas encore.
  const cles = [...schema.map((def) => def.key).filter((k) => restantes.has(k)), ...[...restantes].filter((k) => !r.entite(k))];
  for (const cle of cles) {
    const v = prendre(cle);
    const def = r.entite(cle);
    const section = def?.plural ?? cle;
    const champs = def?.fields ?? [];
    const chemin = joindre('Qte', cle);

    if (Array.isArray(v) && (def || v.some(estObjet))) {
      v.forEach((item, i) => {
        if (estObjet(item)) r.deposerElement(section, champs, item, `${chemin}[${i}]`, `${chemin}[]`, true);
        else r.deposer(cadreDe(section), item, `${chemin}[${i}]`, `${chemin}[${i}]`, `${section} ${i + 1}`);
      });
    } else if (estObjet(v) && def) {
      // Fiche unique (la zone piscine), ou fiche d'avant le passage en liste.
      r.deposerElement(section, champs, v, chemin, chemin, false);
    } else {
      r.deposer(cadreDe(section), v, chemin, chemin, cle);
    }
  }
}

// ── Écriture du fichier ────────────────────────────────────────────────────

/** Nom lisible de l'audit, repris sur chaque ligne pour compiler plusieurs bâtiments. */
export function nomAudit(audit: unknown): string {
  if (!estObjet(audit)) return '';
  for (const cle of ['NomSite', 'NomProjet', 'Adresse']) {
    const v = audit[cle];
    if (typeof v === 'string' && v.trim()) return texteDepuisHtml(v).replace(/\s+/g, ' ').trim();
  }
  return '';
}

/** Un texte qu'un tableur évaluerait comme une formule : « - fuite », « =A1 », « @… ». */
const FORMULE_RE = /^[=+\-@\t\r]/;
/** Chiffres et séparateurs seuls : fraction, date partielle, heure, code à zéros, pourcentage… */
const CHIFFRES_SEULS_RE = /^(?=[^\d]*\d)[\d\s/.:,%+\-]+$/;
/** « 5E3 » : une référence de matériel, qu'Excel lirait en notation scientifique. */
const SCIENTIFIQUE_RE = /^\d+(?:[.,]\d+)?[eE][+-]?\d+$/;
/** Nombre qu'Excel relit à l'identique : pas de zéro de tête, quinze chiffres au plus. */
const NOMBRE_FIDELE_RE = /^[+-]?(?:0|[1-9]\d{0,14})(?:[.,]\d+)?$/;
/** Date complète, qu'Excel relit comme la même date. */
const DATE_FIDELE_RE = /^(?:\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/;

/**
 * Ce texte serait-il réinterprété par Excel à l'ouverture du fichier ?
 *
 * Mesuré sur Excel 16 en français, à l'ouverture directe : « 2/4 » — une
 * option du volume de chasse des WC — devient le 2 avril, « 03/2024 » le
 * 1er mars, « 0123 » perd son zéro, un numéro de seize chiffres ses derniers
 * chiffres, « 5E3 » vaut 5000, « - fuite » s'affiche « #NOM? ». Rien ne le
 * signale, et la valeur d'origine n'est plus dans la feuille.
 *
 * Un nombre simple et une date complète sont relus à l'identique : ils ne
 * sont pas touchés. Un texte qui contient une lettre non plus, hors formule.
 */
export function reinterpreteParExcel(texte: string): boolean {
  if (NOMBRE_FIDELE_RE.test(texte) || DATE_FIDELE_RE.test(texte)) return false;
  return FORMULE_RE.test(texte) || CHIFFRES_SEULS_RE.test(texte) || SCIENTIFIQUE_RE.test(texte);
}

/**
 * Une cellule du fichier.
 *
 * Un texte qu'Excel réinterpréterait est précédé d'une apostrophe, qui le
 * garde tel quel : « '2/4 », « '- fuite au compteur ». **C'est la seule
 * altération que l'export fait subir à une valeur**, et elle est visible : qui
 * relit le fichier ailleurs que dans Excel la retire pour retrouver la saisie.
 * Les nombres du JSON, eux, restent des nombres.
 */
export function celluleCsv(v: Scalaire): string {
  let texte = formaterScalaire(v).replace(/\r\n?/g, '\n');
  if (typeof v === 'string' && reinterpreteParExcel(texte)) texte = "'" + texte;
  return /[";\n]|^\s|\s$/.test(texte) ? '"' + texte.replace(/"/g, '""') + '"' : texte;
}

export interface CsvAudit {
  /** Le fichier, en texte ; à encoder en cp-1252 (`encoderCp1252`). */
  texte: string;
  lignes: LigneCsv[];
}

/** Le CSV complet d'un audit : en-têtes, puis une ligne par réponse. */
export function csvAudit(audit: unknown, schema: readonly EntityDef[] = AUDIT_SCHEMA): CsvAudit {
  const lignes = lignesAudit(audit, schema);
  const id = estObjet(audit) ? texteDe(audit['Id']) : '';
  const nom = nomAudit(audit);

  const rangs = [COLONNES_CSV.join(SEPARATEUR_CSV)];
  for (const l of lignes) {
    rangs.push(
      [id, nom, l.section, l.element, l.elementId, l.rubrique, l.question, l.cle, l.valeur, l.unite, l.origine]
        .map(celluleCsv)
        .join(SEPARATEUR_CSV)
    );
  }
  // Fin de ligne Windows, y compris après la dernière : c'est le format du CSV.
  return { texte: rangs.join('\r\n') + '\r\n', lignes };
}
