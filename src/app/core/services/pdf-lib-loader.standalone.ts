import * as pdfjs from 'pdfjs-dist';
import * as pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

/**
 * Chargement de PDF.js — variante FICHIER AUTONOME.
 *
 * Ici les imports sont statiques, à dessein : le livrable hors ligne est un
 * unique index.html ouvert en file://, où un chunk chargé dynamiquement ne peut
 * pas être récupéré. Tout doit donc être inliné dans le fichier, au prix d'un
 * poids plus élevé (~2 Mo au lieu de 340 Ko).
 *
 * Ce fichier remplace `pdf-lib-loader.ts` via la configuration `standalone`
 * d'angular.json.
 */
export const loadPdfLib = async () => pdfjs;

export const loadPdfWorker = async () => pdfWorker;
