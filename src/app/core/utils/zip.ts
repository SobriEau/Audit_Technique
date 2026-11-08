/**
 * Écriture d'une archive ZIP, sans dépendance.
 *
 * **Pourquoi pas RAR, qui était la demande.** Le format RAR est propriétaire :
 * son algorithme de compression n'est pas publié, et aucune bibliothèque ne
 * sait en *produire* — celles qui existent ne font que lire. Un navigateur ne
 * peut donc pas écrire de `.rar`, et aucun contournement ne changerait cela.
 * ZIP rend le même service : un fichier unique, une arborescence à l'intérieur,
 * et l'Explorateur de Windows comme le Finder l'ouvrent d'un double-clic, sans
 * rien installer.
 *
 * **Pourquoi à la main plutôt qu'une bibliothèque.** Le livrable est un fichier
 * autonome : toute dépendance y est inlinée et pèse sur les deux mégaoctets que
 * les auditeurs téléchargent. Un écrivain ZIP tient en deux cents lignes, et la
 * compression est fournie par le navigateur — `CompressionStream('deflate-raw')`
 * est présent en `file://` (mesuré). Faute de lui, les fichiers sont stockés
 * tels quels : l'archive est plus grosse, elle s'ouvre pareil.
 *
 * Fonctions pures, sans Angular : éprouvées hors navigateur par
 * `tools/check-zip.js`, qui relit l'archive avec `unzip`.
 */

/** Un fichier à placer dans l'archive. */
export interface EntreeZip {
  /** Chemin dans l'archive, séparé par « / ». Jamais de « .. » ni de « / » initial. */
  chemin: string;
  /** Contenu. Une chaîne est encodée en UTF-8. */
  contenu: Uint8Array | string;
  /**
   * Ranger tel quel, sans tenter de compresser. À poser sur un JPEG ou un PNG :
   * ils sont déjà compressés, la tentative ne gagne rien et coûte le temps de
   * parcourir chaque octet — sur une centaine de photos, cela se sent.
   */
  stocker?: boolean;
}

/** Table CRC-32, calculée une fois. */
const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(octets: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Compresse en deflate brut, ou rend `null` si le navigateur ne sait pas le
 * faire — ou si le résultat n'est pas plus petit, ce qui arrive sur un JPEG.
 */
async function deflate(octets: Uint8Array): Promise<Uint8Array | null> {
  const Flux = (globalThis as { CompressionStream?: typeof CompressionStream }).CompressionStream;
  if (!Flux) return null;
  try {
    const flux = new Flux('deflate-raw');
    const ecrivain = flux.writable.getWriter();
    void ecrivain.write(octets);
    void ecrivain.close();
    const morceaux: Uint8Array[] = [];
    const lecteur = flux.readable.getReader();
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      if (value) morceaux.push(new Uint8Array(value as ArrayBufferLike));
    }
    const taille = morceaux.reduce((n, m) => n + m.length, 0);
    if (taille >= octets.length) return null; // déjà compressé : on stocke
    const out = new Uint8Array(taille);
    let i = 0;
    for (const m of morceaux) {
      out.set(m, i);
      i += m.length;
    }
    return out;
  } catch {
    return null;
  }
}

/** Écriture d'octets en petit-boutien, comme le format l'exige. */
class Tampon {
  private readonly morceaux: Uint8Array[] = [];
  taille = 0;

  pousser(m: Uint8Array): void {
    this.morceaux.push(m);
    this.taille += m.length;
  }

  u16(v: number): void {
    this.pousser(new Uint8Array([v & 0xff, (v >>> 8) & 0xff]));
  }

  u32(v: number): void {
    this.pousser(new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]));
  }

  blob(type: string): Blob {
    return new Blob(this.morceaux as BlobPart[], { type });
  }
}

/**
 * Chemin acceptable dans une archive : relatif, résolu, non vide.
 *
 * Un segment `..` est **résolu** — il retire le segment précédent — et ne
 * descend jamais sous la racine : une archive ne doit pas pouvoir écrire hors
 * du dossier où on la déplie. Le chemin est corrigé plutôt que refusé : perdre
 * toute l'archive pour un nom mal formé serait disproportionné, alors que la
 * seule chose à empêcher est l'évasion.
 */
function cheminValide(chemin: string): string {
  const segments: string[] = [];
  for (const s of chemin.replace(/\\/g, '/').split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') segments.pop();
    else segments.push(s);
  }
  const propre = segments.join('/');
  if (!propre) throw new Error(`Chemin d'archive vide : « ${chemin} »`);
  return propre;
}

/**
 * Nombre maximal d'entrées et taille maximale d'une archive **sans ZIP64**.
 *
 * Au-delà, le format exige des champs étendus que cet écrivain ne pose pas.
 * Plutôt que de produire une archive qu'aucun outil n'ouvrira, on refuse et on
 * le dit : un audit de plus de quatre gigaoctets de photos se transmet par
 * paquets.
 */
const MAX_ENTREES = 0xffff;
const MAX_OCTETS = 0xfffffffe;

/**
 * Assemble les entrées en une archive ZIP.
 *
 * Les dates sont celles de l'appel : un ZIP sans horodatage s'ouvre, mais
 * affiche 1980 partout, ce qui ressemble à une anomalie.
 */
export async function creerZip(entrees: readonly EntreeZip[]): Promise<Blob> {
  if (entrees.length > MAX_ENTREES) {
    throw new Error(
      `${entrees.length} fichiers : au-delà de ${MAX_ENTREES}, l'archive exigerait le format ZIP64.`
    );
  }

  const encodeur = new TextEncoder();
  const corps = new Tampon();
  const index = new Tampon();
  const maintenant = dateMsDos(new Date());
  const vus = new Set<string>();

  for (const entree of entrees) {
    const chemin = cheminValide(entree.chemin);
    if (vus.has(chemin)) throw new Error(`Deux fichiers au même chemin : « ${chemin} »`);
    vus.add(chemin);

    const nom = encodeur.encode(chemin);
    const brut =
      typeof entree.contenu === 'string' ? encodeur.encode(entree.contenu) : entree.contenu;
    const comprime = entree.stocker ? null : await deflate(brut);
    const donnees = comprime ?? brut;
    const methode = comprime ? 8 : 0;
    const somme = crc32(brut);
    const debut = corps.taille;

    if (debut + donnees.length > MAX_OCTETS) {
      throw new Error("L'archive dépasse 4 Go : le format ZIP64 serait nécessaire.");
    }

    // En-tête local
    corps.u32(0x04034b50);
    corps.u16(20); // version minimale
    // Bit 11 : le nom est en UTF-8. Sans lui, les accents d'un nom de pièce
    // sont illisibles sous Windows.
    corps.u16(0x0800);
    corps.u16(methode);
    corps.u16(maintenant.heure);
    corps.u16(maintenant.jour);
    corps.u32(somme);
    corps.u32(donnees.length);
    corps.u32(brut.length);
    corps.u16(nom.length);
    corps.u16(0);
    corps.pousser(nom);
    corps.pousser(donnees);

    // Entrée d'index
    index.u32(0x02014b50);
    index.u16(20); // version d'écriture
    index.u16(20);
    index.u16(0x0800);
    index.u16(methode);
    index.u16(maintenant.heure);
    index.u16(maintenant.jour);
    index.u32(somme);
    index.u32(donnees.length);
    index.u32(brut.length);
    index.u16(nom.length);
    index.u16(0);
    index.u16(0);
    index.u16(0);
    index.u16(0);
    index.u32(0);
    index.u32(debut);
    index.pousser(nom);
  }

  const fin = new Tampon();
  fin.u32(0x06054b50);
  fin.u16(0);
  fin.u16(0);
  fin.u16(entrees.length);
  fin.u16(entrees.length);
  fin.u32(index.taille);
  fin.u32(corps.taille);
  fin.u16(0);

  return new Blob(
    [corps.blob('application/octet-stream'), index.blob('application/octet-stream'), fin.blob('application/octet-stream')],
    { type: 'application/zip' }
  );
}

/** Date et heure au format MS-DOS, que le ZIP exige. */
function dateMsDos(d: Date): { jour: number; heure: number } {
  const annee = Math.max(1980, d.getFullYear());
  return {
    jour: ((annee - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    heure: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  };
}

/**
 * Rend un nom unique dans un dossier, en numérotant les suivants.
 *
 * Deux photos peuvent porter le même nom de fichier — « image.jpg » venu de
 * deux téléphones — et un ZIP à deux entrées identiques est refusé par la
 * plupart des outils.
 */
export function nomUnique(pris: Set<string>, souhaite: string): string {
  if (!pris.has(souhaite)) {
    pris.add(souhaite);
    return souhaite;
  }
  const point = souhaite.lastIndexOf('.');
  const base = point > 0 ? souhaite.slice(0, point) : souhaite;
  const ext = point > 0 ? souhaite.slice(point) : '';
  for (let i = 2; ; i++) {
    const essai = `${base}-${i}${ext}`;
    if (!pris.has(essai)) {
      pris.add(essai);
      return essai;
    }
  }
}
