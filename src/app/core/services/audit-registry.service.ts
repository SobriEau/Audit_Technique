import { Injectable } from '@angular/core';
import { AppData, AuditSummary } from '../../models/data.models';
import { addressKey, htmlToText } from '../utils/address-key';
import { uid } from '../utils/uid';
import { safeStorage } from '../utils/safe-storage';

const INDEX_KEY = 'sobrieau.index';
const CURRENT_KEY = 'sobrieau.current';
const AUDIT_PREFIX = 'sobrieau.audit.';

/** Clé de l'ancienne version, mono-audit. */
const LEGACY_KEY = 'sobrieau';
/** L'audit hérité est conservé sous ce nom après reprise, par précaution. */
const LEGACY_BACKUP_KEY = 'sobrieau.legacy-backup';

/**
 * Registre des audits.
 *
 * Un auditeur enchaîne plusieurs bâtiments : chaque audit est stocké à part et
 * repéré par un identifiant technique, l'adresse ne servant qu'à l'affichage et
 * au rapprochement. Le registre lui-même reste léger — il est relu à chaque
 * démarrage et ne charge pas les données complètes.
 *
 * Disposition en localStorage :
 *   sobrieau.index        → AuditSummary[]
 *   sobrieau.current      → identifiant de l'audit ouvert
 *   sobrieau.audit.<Id>   → données complètes d'un audit
 */
@Injectable({ providedIn: 'root' })
export class AuditRegistryService {
  constructor() {
    this.migrateLegacy();
  }

  // ── Registre ─────────────────────────────────────────────────────────────

  list(): AuditSummary[] {
    try {
      const raw = safeStorage.getItem(INDEX_KEY);
      const parsed = raw ? (JSON.parse(raw) as AuditSummary[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeIndex(list: AuditSummary[]): void {
    safeStorage.setItem(INDEX_KEY, JSON.stringify(list));
  }

  /** Audits du plus récemment modifié au plus ancien. */
  listByRecency(): AuditSummary[] {
    return [...this.list()].sort((a, b) => (b.UpdatedAt ?? '').localeCompare(a.UpdatedAt ?? ''));
  }

  find(id: string): AuditSummary | undefined {
    return this.list().find((a) => a.Id === id);
  }

  /** Audit portant cette adresse normalisée, hors celui qu'on est en train de modifier. */
  findByAddressKey(key: string, exceptId?: string): AuditSummary | undefined {
    if (!key) return undefined;
    return this.list().find((a) => a.AdresseKey === key && a.Id !== exceptId);
  }

  // ── Audit courant ────────────────────────────────────────────────────────

  get currentId(): string {
    const id = safeStorage.getItem(CURRENT_KEY);
    if (id && this.find(id)) return id;

    // Registre vide ou pointeur cassé : on repart sur le plus récent, sinon
    // on crée un audit vierge — l'application doit toujours en avoir un.
    const first = this.listByRecency()[0];
    if (first) {
      safeStorage.setItem(CURRENT_KEY, first.Id);
      return first.Id;
    }
    return this.create().Id;
  }

  setCurrent(id: string): void {
    if (this.find(id)) safeStorage.setItem(CURRENT_KEY, id);
  }

  // ── Lecture / écriture d'un audit ────────────────────────────────────────

  load(id: string): AppData {
    try {
      const raw = safeStorage.getItem(AUDIT_PREFIX + id);
      const parsed = raw ? (JSON.parse(raw) as AppData) : null;
      if (parsed && typeof parsed === 'object') {
        parsed.Id = id;
        return parsed;
      }
    } catch {
      /* données illisibles : on repart d'un audit vide plutôt que de planter */
    }
    return { Id: id };
  }

  /** Enregistre l'audit et met à jour sa fiche dans le registre. */
  persist(data: AppData): void {
    const id = data.Id;
    if (!id) return;

    const adresse = htmlToText(data.Adresse);
    data.AdresseKey = addressKey(adresse);
    safeStorage.setItem(AUDIT_PREFIX + id, JSON.stringify(data));

    const list = this.list();
    const summary: AuditSummary = {
      Id: id,
      Adresse: adresse,
      AdresseKey: data.AdresseKey,
      Auditeur: data.Auditeur ?? null,
      Date: data.Date ?? null,
      UpdatedAt: new Date().toISOString(),
    };

    const i = list.findIndex((a) => a.Id === id);
    if (i === -1) list.push(summary);
    else list[i] = summary;
    this.writeIndex(list);
  }

  create(adresse = ''): AuditSummary {
    const summary: AuditSummary = {
      Id: uid(),
      Adresse: adresse,
      AdresseKey: addressKey(adresse),
      UpdatedAt: new Date().toISOString(),
    };

    const list = this.list();
    list.push(summary);
    this.writeIndex(list);
    safeStorage.setItem(
      AUDIT_PREFIX + summary.Id,
      JSON.stringify({ Id: summary.Id, Adresse: adresse } as AppData)
    );
    safeStorage.setItem(CURRENT_KEY, summary.Id);
    return summary;
  }

  /**
   * Supprime un audit du registre. Les images correspondantes sont purgées à
   * part, par l'appelant, faute de quoi elles resteraient en base sans
   * personne pour les référencer.
   */
  remove(id: string): void {
    safeStorage.removeItem(AUDIT_PREFIX + id);
    this.writeIndex(this.list().filter((a) => a.Id !== id));
    if (safeStorage.getItem(CURRENT_KEY) === id) safeStorage.removeItem(CURRENT_KEY);
  }

  /** Un audit sans aucune donnée saisie peut être renommé sans rien demander. */
  isEmpty(data: AppData): boolean {
    const qte = (data.Qte ?? {}) as Record<string, unknown>;
    const hasQte = Object.entries(qte).some(([k, v]) => {
      if (k === 'Info') return !!v;
      if (Array.isArray(v)) return v.length > 0;
      if (v && typeof v === 'object') return Object.keys(v).length > 0;
      return false;
    });

    return (
      !hasQte &&
      !data.Info &&
      !data.Auditeur &&
      !data.Date &&
      !(data.Plans ?? []).length &&
      !(data.Photos ?? []).length &&
      !Object.keys(data.Qge ?? {}).length &&
      !Object.keys(data.Qus ?? {}).length
    );
  }

  // ── Reprise de l'ancien format ───────────────────────────────────────────

  /**
   * Convertit l'unique audit de l'ancienne version en premier élément du
   * registre. L'ancienne clé est renommée plutôt que supprimée : si la reprise
   * s'avérait fautive, les données restent récupérables.
   */
  private migrateLegacy(): void {
    if (safeStorage.getItem(INDEX_KEY)) return;

    const raw = safeStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as AppData;
      if (!data || typeof data !== 'object') return;

      // L'adresse était un champ en texte enrichi : on ne garde que le texte.
      const adresse = htmlToText(data.Adresse);
      data.Id = uid();
      data.Adresse = adresse;
      data.AdresseKey = addressKey(adresse);

      safeStorage.setItem(AUDIT_PREFIX + data.Id, JSON.stringify(data));
      this.writeIndex([
        {
          Id: data.Id,
          Adresse: adresse,
          AdresseKey: data.AdresseKey,
          Auditeur: data.Auditeur ?? null,
          Date: data.Date ?? null,
          UpdatedAt: new Date().toISOString(),
        },
      ]);
      safeStorage.setItem(CURRENT_KEY, data.Id);

      safeStorage.setItem(LEGACY_BACKUP_KEY, raw);
      safeStorage.removeItem(LEGACY_KEY);
    } catch {
      /* illisible : on laisse l'ancienne clé en place et on repart à vide */
    }
  }
}
