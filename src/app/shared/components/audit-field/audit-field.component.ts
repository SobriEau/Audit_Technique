import { Component, EventEmitter, Input, Output, forwardRef, OnInit } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldDef, MesureDebit, debitCalcule } from '../../../models/field.models';
import { ILLUSTRATIONS, Illustration } from '../../../models/illustrations';
import { DataService } from '../../../core/services/data.service';
import { AuditEntity } from '../../../models/data.models';
import { RichEditorComponent } from '../rich-editor/rich-editor.component';
import { DictationFieldComponent } from '../dictation-field/dictation-field.component';
import { PhotoEditorComponent } from '../photo-editor/photo-editor.component';
import { REQUIREMENT_LABEL } from '../../../models/field-priority';

/**
 * Aide affichée quand le classeur n'en porte pas, pour un champ générique
 * partagé par (presque) toutes les entités. Écrit ici plutôt que répété dans
 * `audit_technique.xlsx` pour une quinzaine d'onglets.
 */
const GENERIC_HELP: Record<string, string> = {
  Emplacement: 'Reprendre le nom de la pièce indiqué sur le plan.',
};

/** Un choix possible, quel que soit le type sous-jacent du champ. */
export interface Choice {
  label: string;
  value: unknown;
}

/**
 * En deçà de ce nombre de choix, la liste déroulante cède la place à des
 * boutons radio : tout est visible d'un coup d'œil et sélectionnable en un
 * seul geste, ce qui compte sur une tablette en intervention.
 */
export const RADIO_THRESHOLD = 4;

/** Compteur pour donner un nom unique à chaque groupe de boutons radio. */
let uniqueId = 0;

/** Nombre d'essais du tableau de mesure de débit, comme dans le classeur. */
const NB_MESURES = 3;

/**
 * Une option « Autre », « autre », « Autre (préciser dans remarques) »,
 * « autre précisé dans remarques ». Le mot doit être seul ou suivi de sa
 * consigne : « Autres adultes » (utilisateurs des WC) et « Autre information »
 * (onglet Autre) sont des réponses à part entière, qui ouvraient à tort le
 * champ de précision.
 */
const AUTRE_RE = /^autres?(?:$|\s*\(|\s+pr[ée]cis)/i;

/** Comparaison insensible à la casse et aux accents : « melangeur » trouve « Mélangeur ». */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Composant de saisie unique de l'audit.
 *
 * Toutes les entrées — texte, nombre, choix, oui/non, référence vers un autre
 * élément, texte enrichi, photos — passent par ici. Faire évoluer un type de
 * champ se fait donc à un seul endroit, pour l'ensemble des formulaires.
 *
 * Les champs à choix adoptent deux formes selon le nombre d'options :
 *   - moins de quatre : boutons radio ;
 *   - au-delà : une liste filtrable à la saisie.
 *
 * Usage : <app-audit-field [def]="champ" [(ngModel)]="valeur" />
 */
@Component({
  selector: 'app-audit-field',
  standalone: true,
  imports: [FormsModule, RichEditorComponent, DictationFieldComponent, PhotoEditorComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AuditFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './audit-field.component.html',
  styleUrl: './audit-field.component.scss',
})
export class AuditFieldComponent implements ControlValueAccessor, OnInit {
  @Input({ required: true }) def!: FieldDef;

  /**
   * Précision saisie quand « Autre » est choisi. Stockée par le formulaire
   * sous une clé voisine (`<clé>Autre`), et non dans la valeur du champ : la
   * valeur reste une option de la liste, que la liste des éléments et les
   * blocs conditionnels savent lire.
   */
  @Input() autre: string | null = null;
  @Output() autreChange = new EventEmitter<string | null>();

  /**
   * Saisies du champ libre ouvert pour chaque option cochée (`def.parOption`),
   * par option. Stockées par le formulaire sous la clé que le schéma déclare.
   */
  @Input() parOption: Record<string, string> | null = null;
  @Output() parOptionChange = new EventEmitter<Record<string, string> | null>();

  value: unknown = null;

  /** Choix normalisés du champ, tous types confondus. */
  choices: Choice[] = [];

  /** Éléments proposés pour un champ de type `entity-ref`. */
  refOptions: AuditEntity[] = [];

  readonly uid = `af-${++uniqueId}`;

  /** Aide effective : celle du classeur, sinon celle d'un champ générique connu. */
  get effectiveHelp(): string | null {
    return this.def.help ?? GENERIC_HELP[this.def.key] ?? null;
  }

  /**
   * Pastille d'exigence du classeur (« Obligatoire », « Recommandé »,
   * « Facultatif »), ou `null` si le classeur ne dit rien pour ce champ.
   *
   * Une seule pastille, dans la palette orange. Les deux migrations V3 menées
   * en parallèle en affichaient deux — une pastille orange tirée d'une table
   * curée à la main, un badge neutre tiré du classeur — pour la même donnée.
   * Le badge neutre visait à ne pas confondre exigence et validation ; le rouge
   * de l'encadré des champs manquants s'en charge, et l'orange ne se lit pas
   * comme une erreur. Voir `MAJ/done/fusion-origin-main.md`.
   */
  get requirementLabel(): string | null {
    return this.def.requirement ? REQUIREMENT_LABEL[this.def.requirement] : null;
  }

  /** Images du classeur qui expliquent les choix proposés (types de WC…). */
  get illustrations(): Illustration[] {
    return (this.def.source && ILLUSTRATIONS[this.def.source]) || [];
  }

  // ── État de la liste filtrable ───────────────────────────────────────────
  comboOpen = false;
  comboQuery = '';
  activeIndex = -1;

  onChangeFn: (v: unknown) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(private data: DataService) {}

  ngOnInit(): void {
    if (this.def.kind === 'boolean') {
      this.choices = [
        { label: 'Oui', value: true },
        { label: 'Non', value: false },
      ];
    } else if (this.def.kind === 'select') {
      this.choices = (this.def.options ?? []).map((o) => ({ label: o, value: o }));
    } else if (this.def.kind === 'entity-ref' && this.def.refTo) {
      this.refOptions = this.data.getEntities(this.def.refTo);
    }
  }

  // ── Choix : radio ou liste filtrable ─────────────────────────────────────

  get isChoice(): boolean {
    return this.def.kind === 'boolean' || (this.def.kind === 'select' && !this.def.multiple);
  }

  // ── Choix multiple : cases à cocher ──────────────────────────────────────

  get isMulti(): boolean {
    return this.def.kind === 'select' && !!this.def.multiple;
  }

  /**
   * Valeurs cochées. Une chaîne seule — saisie quand le champ n'acceptait
   * qu'une réponse — est relue comme une case cochée, pas perdue.
   */
  get coches(): string[] {
    const v = this.value;
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
    return typeof v === 'string' && v ? [v] : [];
  }

  estCoche(c: Choice): boolean {
    return this.coches.includes(c.value as string);
  }

  basculer(c: Choice): void {
    const actuelles = this.coches;
    const v = c.value as string;
    const suivantes = actuelles.includes(v) ? actuelles.filter((x) => x !== v) : [...actuelles, v];
    this.value = suivantes.length ? suivantes : null;
    this.onChangeFn(this.value);
    this.onTouchedFn();
    // La saisie d'une option décochée part avec elle : une fréquence
    // d'utilisation sans son utilisateur n'aurait plus de sens à l'export.
    if (actuelles.includes(v) && this.parOption?.[v] !== undefined) this.onParOption(v, '');
  }

  /** Valeurs cochées absentes de la liste : conservées et signalées. */
  get orphelinsMulti(): string[] {
    if (!this.isMulti) return [];
    return this.coches.filter((v) => !this.def.options?.includes(v));
  }

  // ── Option « Autre » ─────────────────────────────────────────────────────

  /** Une option « Autre » est retenue : un champ libre permet de préciser. */
  get autreChoisi(): boolean {
    if (this.def.kind !== 'select') return false;
    const retenues = this.isMulti ? this.coches : typeof this.value === 'string' ? [this.value] : [];
    return retenues.some((v) => AUTRE_RE.test(v));
  }

  onAutre(texte: string): void {
    this.autre = texte.trim() === '' ? null : texte;
    this.autreChange.emit(this.autre);
  }

  // ── Champ libre par option cochée ────────────────────────────────────────

  /** Options cochées qui ouvrent chacune leur champ libre, dans l'ordre de la liste. */
  get optionsDetaillees(): string[] {
    if (!this.isMulti || !this.def.parOption) return [];
    const coches = this.coches;
    return (this.def.options ?? []).filter((o) => coches.includes(o));
  }

  parOptionDe(option: string): string {
    return this.parOption?.[option] ?? '';
  }

  onParOption(option: string, texte: string): void {
    const suivant = { ...(this.parOption ?? {}) };
    if (texte.trim() === '') delete suivant[option];
    else suivant[option] = texte;
    this.parOption = Object.keys(suivant).length ? suivant : null;
    this.parOptionChange.emit(this.parOption);
  }

  // ── Tableau de mesure de débit ───────────────────────────────────────────

  /**
   * Les trois essais. Une valeur numérique — l'ancien champ « Débit en sortie »
   * d'avant le tableau — est reprise comme mesure directe du premier essai.
   */
  get mesures(): MesureDebit[] {
    const v = this.value;
    const lignes: MesureDebit[] = Array.isArray(v)
      ? (v as MesureDebit[]).map((m) => ({ ...m }))
      : typeof v === 'number'
        ? [{ direct: v }]
        : [];
    while (lignes.length < NB_MESURES) lignes.push({});
    return lignes.slice(0, NB_MESURES);
  }

  debit(m: MesureDebit): number | null {
    return debitCalcule(m);
  }

  /** Moyenne des débits calculés, puis des mesures directes, sur les essais renseignés. */
  get moyenneCalculee(): number | null {
    return moyenne(this.mesures.map((m) => debitCalcule(m)));
  }

  get moyenneDirecte(): number | null {
    return moyenne(this.mesures.map((m) => m.direct ?? null));
  }

  onMesure(i: number, champ: keyof MesureDebit, raw: string): void {
    const n = raw === '' ? null : Number(raw);
    const lignes = this.mesures;
    lignes[i] = { ...lignes[i], [champ]: n !== null && Number.isNaN(n) ? null : n };
    this.value = lignes;
    this.onChangeFn(this.value);
  }

  /** Peu d'options : on les montre toutes plutôt que de les cacher. */
  get useRadio(): boolean {
    return this.isChoice && this.choices.length > 0 && this.choices.length < RADIO_THRESHOLD;
  }

  get useCombo(): boolean {
    return this.isChoice && this.choices.length >= RADIO_THRESHOLD;
  }

  isSelected(c: Choice): boolean {
    return this.value === c.value;
  }

  selectChoice(c: Choice): void {
    this.value = c.value;
    this.onChangeFn(this.value);
    this.onTouchedFn();
  }

  clear(): void {
    this.value = null;
    this.comboQuery = '';
    this.onChangeFn(null);
    this.onTouchedFn();
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  // ── Liste filtrable ──────────────────────────────────────────────────────

  /**
   * Le champ affiche la valeur retenue au repos, et la saisie en cours dès que
   * la liste est ouverte.
   */
  get comboDisplay(): string {
    if (this.comboOpen) return this.comboQuery;
    return typeof this.value === 'string' ? this.value : '';
  }

  get filtered(): Choice[] {
    const q = normalize(this.comboQuery);
    if (!q) return this.choices;
    return this.choices.filter((c) => normalize(c.label).includes(q));
  }

  openCombo(): void {
    this.comboOpen = true;
    this.comboQuery = '';
    this.activeIndex = this.choices.findIndex((c) => c.value === this.value);
  }

  onComboInput(text: string): void {
    this.comboQuery = text;
    this.comboOpen = true;
    this.activeIndex = this.filtered.length ? 0 : -1;
  }

  /**
   * Fermeture sans validation : on ne conserve pas la saisie libre, le champ
   * n'accepte que des valeurs de la liste. L'affichage revient donc à la
   * valeur enregistrée.
   */
  closeCombo(): void {
    this.comboOpen = false;
    this.comboQuery = '';
    this.activeIndex = -1;
    this.onTouchedFn();
  }

  onComboKeydown(event: KeyboardEvent): void {
    const options = this.filtered;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.comboOpen) this.openCombo();
        else this.activeIndex = Math.min(this.activeIndex + 1, options.length - 1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        break;

      case 'Enter':
        if (this.comboOpen && options[this.activeIndex]) {
          event.preventDefault();
          this.selectChoice(options[this.activeIndex]);
          this.closeCombo();
        }
        break;

      case 'Escape':
        if (this.comboOpen) {
          event.preventDefault();
          this.closeCombo();
        }
        break;
    }
  }

  chooseFromList(c: Choice): void {
    this.selectChoice(c);
    this.closeCombo();
  }

  /**
   * Valeur enregistrée absente de la liste : elle est conservée et signalée.
   * Une liste de valeurs qui évolue ne doit jamais effacer en silence une
   * saisie déjà faite sur le terrain.
   */
  get orphanValue(): string | null {
    if (this.def.kind !== 'select') return null;
    const v = this.value;
    if (typeof v !== 'string' || !v) return null;
    return this.def.options?.includes(v) ? null : v;
  }

  // ── Autres types ─────────────────────────────────────────────────────────

  /** Libellé lisible d'un élément référencé. */
  refLabel(item: AuditEntity): string {
    const extra = item['Emplacement'];
    const num = item.Numero ? `n° ${item.Numero}` : 'sans numéro';
    return extra ? `${num} — ${extra}` : num;
  }

  onInput(v: unknown): void {
    this.value = v === '' ? null : v;
    this.onChangeFn(this.value);
  }

  /** Les champs numériques ne doivent pas stocker une chaîne. */
  onNumber(raw: string): void {
    const n = raw === '' ? null : Number(raw);
    this.value = n !== null && Number.isNaN(n) ? null : n;
    this.onChangeFn(this.value);
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(v: unknown): void {
    this.value = v ?? null;
  }

  registerOnChange(fn: (v: unknown) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}

function moyenne(valeurs: (number | null)[]): number | null {
  const n = valeurs.filter((x): x is number => typeof x === 'number');
  if (!n.length) return null;
  return Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 100) / 100;
}
