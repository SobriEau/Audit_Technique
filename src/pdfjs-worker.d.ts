/**
 * Le build minifié du worker PDF.js ne fournit pas de typage.
 * Il n'est jamais exécuté comme un vrai worker : on l'importe uniquement pour
 * exposer son gestionnaire sur globalThis, ce qui permet à PDF.js de rendre les
 * pages sur le fil principal — indispensable en file://, où un worker ne peut
 * pas être chargé. Voir PdfRasterService.
 */
declare module 'pdfjs-dist/build/pdf.worker.min.mjs';
