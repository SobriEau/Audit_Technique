/**
 * Clé de rapprochement d'une adresse.
 *
 * Sert **uniquement à retrouver** un audit existant, jamais d'identité : chaque
 * audit garde un `Id` technique stable. Sans quoi, affiner ces règles un jour
 * rendrait orphelins tous les audits déjà enregistrés.
 *
 * Volontairement conservatrice : on n'étend pas les abréviations
 * (« r. » vers « rue », « av. » vers « avenue »). Une fausse équivalence
 * fusionnerait deux bâtiments distincts, ce qui est bien plus grave que de ne
 * pas rapprocher deux écritures d'un même. C'est la liste des adresses connues
 * qui traite ce cas : on choisit au lieu de retaper.
 *
 * Les caractères ciblés sont écrits en séquences d'échappement, jamais
 * littéralement : U+2028 et U+2029 termineraient la ligne de code source.
 */

/** Signes diacritiques, une fois le texte décomposé en NFD. */
const DIACRITIQUES = /[\u0300-\u036f]/g;

/**
 * Caractères invisibles : trait d'union conditionnel, largeurs nulles, marques
 * directionnelles, séparateurs de ligne, liant sans chasse, marque d'ordre des
 * octets. Un copier-coller depuis un document bureautique en apporte
 * régulièrement, et ils feraient diverger deux adresses identiques à l'œil.
 */
const INVISIBLES = /[\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff]/g;

/** Espaces exotiques ramenés à une espace ordinaire. */
const ESPACES = /[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g;

/** Ponctuation : « 12, rue » et « 12 rue » désignent la même adresse. */
const PONCTUATION = /[.,;:!?'"«»()[\]{}/\_\u2013\u2014-]/g;

export function addressKey(raw: string | null | undefined): string {
  if (!raw) return '';

  return raw
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    .replace(INVISIBLES, '')
    .replace(ESPACES, ' ')
    .toLowerCase()
    .replace(PONCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Texte brut d'une valeur pouvant contenir du HTML.
 *
 * L'adresse était autrefois un champ en texte enrichi ; les audits enregistrés
 * à cette époque contiennent du balisage qu'il faut retirer avant de normaliser.
 */
export function htmlToText(value: string | null | undefined): string {
  if (!value) return '';
  if (!/[<&]/.test(value)) return value.replace(/\s+/g, ' ').trim();

  const holder = document.createElement('div');
  holder.innerHTML = value;
  return (holder.textContent ?? '').replace(/\s+/g, ' ').trim();
}
