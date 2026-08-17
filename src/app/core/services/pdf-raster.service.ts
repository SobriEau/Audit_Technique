import { Injectable } from '@angular/core';
// Import de type uniquement : effacé à la compilation, sans effet sur le
// chargement différé de la bibliothèque.
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfLib, loadPdfWorker } from './pdf-lib-loader';

/** Une page de PDF convertie en image. */
export interface RasterPage {
  blob: Blob;
  page: number;
}

/** Au-delà de ce nombre de pages, on demande confirmation avant d'importer. */
export const PDF_PAGE_CONFIRM_THRESHOLD = 20;

/**
 * Plus grande dimension du rendu, en pixels. Assez pour rester lisible en
 * zoomant sur un plan, tout en bornant la mémoire et le poids de l'export.
 */
const MAX_DIMENSION = 2000;

/**
 * Conversion des plans PDF en images.
 *
 * Pourquoi rasteriser plutôt qu'afficher le PDF : un PDF ne s'affiche pas dans
 * une balise <img>, et un <embed> isole le document dans son propre visualiseur
 * — les clics n'en ressortent pas, donc impossible d'y poser une punaise. En
 * convertissant la page en image dès le chargement, tout l'aval (punaise,
 * coordonnées fractionnaires, export) fonctionne sans modification.
 *
 * PDF.js est importé dynamiquement : sur la version hébergée, il ne part dans
 * un chunk séparé que si l'auditeur charge réellement un PDF.
 *
 * Le rendu se fait sur le fil principal, sans worker. C'est délibéré : un
 * worker ne peut pas être chargé depuis une page file://, ce qui est le mode de
 * diffusion du fichier autonome. Renseigner globalThis.pdfjsWorker fait que
 * PDF.js utilise directement son gestionnaire interne, sans aller chercher de
 * fichier. La conversion étant ponctuelle (au chargement du plan), bloquer
 * brièvement le fil principal est acceptable.
 */
@Injectable({ providedIn: 'root' })
export class PdfRasterService {
  private libPromise?: Promise<typeof import('pdfjs-dist')>;

  isPdf(file: File): boolean {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  }

  private load(): Promise<typeof import('pdfjs-dist')> {
    this.libPromise ??= (async () => {
      const pdfjs = await loadPdfLib();
      const worker = await loadPdfWorker();

      // Rend le gestionnaire disponible sur le fil principal : PDF.js s'en sert
      // tel quel et n'essaie jamais de télécharger un worker.
      (globalThis as Record<string, unknown>)['pdfjsWorker'] = worker;

      // Valeur de façade : PDF.js exige que workerSrc soit renseigné, mais ce
      // fichier n'est jamais réellement chargé grâce à la ligne ci-dessus.
      pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.mjs';

      return pdfjs;
    })();
    return this.libPromise;
  }

  /** Nombre de pages, pour prévenir l'utilisateur avant un import massif. */
  async countPages(file: File): Promise<number> {
    const pdfjs = await this.load();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n;
  }

  /**
   * Convertit chaque page en PNG.
   * `onPage` permet d'afficher une progression sur les documents épais.
   */
  async rasterize(
    file: File,
    onPage?: (done: number, total: number) => void
  ): Promise<RasterPage[]> {
    const pdfjs = await this.load();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;

    const pages: RasterPage[] = [];
    try {
      for (let n = 1; n <= doc.numPages; n++) {
        pages.push({ blob: await this.renderPage(doc, n), page: n });
        onPage?.(n, doc.numPages);
      }
    } finally {
      await doc.destroy();
    }
    return pages;
  }

  private async renderPage(doc: PDFDocumentProxy, pageNumber: number): Promise<Blob> {
    const page = await doc.getPage(pageNumber);

    // Échelle calée sur MAX_DIMENSION, sans jamais agrandir au-delà du besoin.
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_DIMENSION / Math.max(base.width, base.height), 3);
    const viewport = page.getViewport({ scale: Math.max(scale, 1) });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D indisponible pour le rendu du PDF.');

    // Fond blanc : un PDF transparent donnerait un plan illisible.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: context, viewport }).promise;
    page.cleanup();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Conversion de la page PDF en image impossible.');
    return blob;
  }
}
