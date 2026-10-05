/**
 * Encodage Windows-1252 (cp-1252), celui qu'Excel attend d'un CSV en France.
 *
 * `TextEncoder` ne produit que de l'UTF-8 : la table est donc écrite ici. Elle
 * est courte — cp-1252 reprend Latin-1, sauf vingt-sept caractères logés entre
 * 0x80 et 0x9F (l'euro, « œ », les guillemets et tirets typographiques…).
 *
 * Fonctions pures, sans Angular : éprouvées hors navigateur par
 * `tools/check-csv.js`.
 */

/** Caractères de la plage 0x80–0x9F. Cinq octets y restent sans attribution. */
const PLAGE_HAUTE: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e,
  0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

/**
 * Caractères absents de cp-1252 qui ont un équivalent sans perte de sens.
 *
 * Volontairement courte : espaces et traits d'union typographiques, que les
 * claviers de téléphone et les copier-coller apportent sans qu'on les voie, et
 * trois signes que la saisie technique emploie. Tout le reste — un émoji, un
 * caractère d'un autre alphabet — devient « ? » **et est signalé** : mieux vaut
 * un remplacement annoncé qu'un fichier qu'Excel afficherait de travers.
 */
const EQUIVALENTS: Record<number, string> = {
  // Espaces insécables fines (devant « ? », « : » sur certains claviers).
  0x202f: ' ', 0x2007: ' ',
  // Autres espaces typographiques.
  0x2000: ' ', 0x2001: ' ', 0x2002: ' ', 0x2003: ' ', 0x2004: ' ', 0x2005: ' ', 0x2006: ' ',
  0x2008: ' ', 0x2009: ' ', 0x200a: ' ', 0x205f: ' ', 0x3000: ' ',
  // Caractères invisibles.
  0x200b: '', 0x200c: '', 0x200d: '', 0x200e: '', 0x200f: '', 0x2060: '', 0xfeff: '', 0xfe0f: '',
  // Séparateurs de ligne et de paragraphe.
  0x2028: '\n', 0x2029: '\n',
  // Traits d'union et signe moins.
  0x2010: '-', 0x2011: '-', 0x2012: '-', 0x2015: '-', 0x2212: '-',
  // Signes de la saisie technique.
  0x2264: '<=', 0x2265: '>=', 0x2192: '->',
};

const REMPLACEMENT = 0x3f; // « ? »

function octetDe(code: number): number | null {
  if (code < 0x80) return code;
  if (code >= 0xa0 && code <= 0xff) return code;
  return PLAGE_HAUTE[code] ?? null;
}

export interface TexteEncode {
  octets: Uint8Array;
  /** Caractères sans équivalent, remplacés par « ? » — chacun cité une fois. */
  remplaces: string[];
}

/**
 * Encode un texte en cp-1252.
 *
 * Le texte est d'abord recomposé (NFC) : un « é » saisi en deux caractères —
 * la lettre puis son accent, ce que produisent certains claviers et les noms de
 * fichiers venus d'un Mac — redevient le « é » unique que cp-1252 connaît.
 */
export function encoderCp1252(texte: string): TexteEncode {
  const octets: number[] = [];
  const remplaces = new Set<string>();

  for (const caractere of texte.normalize('NFC')) {
    const code = caractere.codePointAt(0) as number;
    const direct = octetDe(code);
    if (direct !== null) {
      octets.push(direct);
      continue;
    }
    const equivalent = EQUIVALENTS[code];
    if (equivalent !== undefined) {
      for (const c of equivalent) octets.push(octetDe(c.codePointAt(0) as number) as number);
      continue;
    }
    octets.push(REMPLACEMENT);
    remplaces.add(caractere);
  }

  return { octets: Uint8Array.from(octets), remplaces: [...remplaces] };
}
