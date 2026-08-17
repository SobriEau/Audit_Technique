/**
 * Chargement de PDF.js — variante HÉBERGÉE (par défaut).
 *
 * L'import dynamique fait sortir PDF.js du bundle initial : il n'est téléchargé
 * que si l'auditeur charge réellement un plan au format PDF.
 *
 * La variante `pdf-lib-loader.standalone.ts` lui est substituée à la
 * compilation du fichier autonome (voir la configuration `standalone` dans
 * angular.json), car un chunk séparé ne peut pas être chargé depuis file://.
 */
export const loadPdfLib = () => import('pdfjs-dist');

export const loadPdfWorker = () => import('pdfjs-dist/build/pdf.worker.min.mjs');
