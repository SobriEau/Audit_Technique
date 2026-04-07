/**
 * Data.js — Classe de gestion d'état persistant
 *
 * Fonctionnalités :
 *  1. Chargement depuis cookie au démarrage
 *  2. Sauvegarde automatique dans le cookie à chaque modification
 *  3. Accès libre aux données via Proxy (lecture/écriture/suppression)
 *  4. Détection automatique des modifications (Proxy récursif)
 *  5. Export des données en fichier JSON téléchargeable
 *  6. Import des données depuis un fichier JSON
 *
 * Usage :
 *   const db = new Data("mon_app");
 *   db.data.utilisateur = { nom: "Alice", age: 30 };
 *   db.data.panier = [{ id: 1, produit: "Stylo", qte: 2 }];
 *   db.data.panier.push({ id: 2, produit: "Cahier", qte: 1 });
 */

class Data {

  /**
   * @param {string} nom        - Nom du cookie (et du fichier JSON à l'export)
   * @param {number} expireDans - Durée de vie du cookie en jours (défaut : 30)
   * @param {boolean} debug     - Affiche les opérations dans la console
   */
  constructor(nom = "appdata", expireDans = 30, debug = false) {
    this._nom        = nom;
    this._expireDans = expireDans;
    this._debug      = debug;
    this._callbacks  = [];   // écouteurs de modifications

    // Charge depuis localStorage si disponible, sinon depuis cookie
    let brut = this._lireStorage();
    if (!brut || Object.keys(brut).length === 0) {
      brut = this._lireCookie();
      // si on a trouvé des données dans le cookie, on migre vers localStorage
      if (brut && Object.keys(brut).length) {
        this._log('Migration cookie → localStorage', brut);
        try { localStorage.setItem(this._nom, JSON.stringify(brut)); } catch (e) { /* ignore */ }
      }
    }
    this._log("Chargement initial :", brut);

    // Expose les données via un Proxy qui détecte toute modification
    this.data = this._proxifier(brut);
  }

  // ── 1. Chargement depuis cookie ──────────────────────────────────────────

  _lireCookie() {
    const match = document.cookie.match(
      new RegExp("(?:^|;\\s*)" + encodeURIComponent(this._nom) + "=([^;]*)")
    );
    if (!match) return {};
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
      console.warn(`[Data] Cookie "${this._nom}" illisible, réinitialisé.`, e);
      return {};
    }
  }

  // Lecture depuis localStorage (si possible)
  _lireStorage() {
    try {
      const raw = localStorage.getItem(this._nom);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      this._log('localStorage indisponible ou données invalides', e);
      return {};
    }
  }

  // ── 2. Sauvegarde dans le cookie ─────────────────────────────────────────

  _sauvegarder() {
    // Sérialise les données brutes (sans le Proxy)
    const brut     = this._deproxifier(this.data);
    const serialise = encodeURIComponent(JSON.stringify(brut));

    // Avertissement si on approche la limite des 4 Ko
    if (serialise.length > 3800) {
      console.warn(`[Data] Cookie "${this._nom}" : ${serialise.length} octets — proche de la limite 4 Ko.`);
    }

    // On préfère stocker dans localStorage (plus d'espace, stable sur file://)
    try {
      localStorage.setItem(this._nom, JSON.stringify(brut));
      this._log("localStorage sauvegardé :", brut);
    } catch (e) {
      this._log('localStorage non utilisable :', e);
    }

    // Et on conserve aussi le cookie pour compatibilité avec d'anciennes pages
    try {
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + this._expireDans);
      document.cookie =
        encodeURIComponent(this._nom) + "=" + serialise +
        "; expires=" + expiration.toUTCString() +
        "; path=/; SameSite=Lax";
      this._log("Cookie sauvegardé :", brut);
    } catch (e) {
      this._log('Impossible d\'écrire le cookie :', e);
    }

    // Notifie les écouteurs enregistrés
    this._callbacks.forEach(fn => fn(brut));

    // Émet un événement DOM global (pour les autres pages du fichier fusionné)
    document.dispatchEvent(new CustomEvent("data:change", {
      detail: { nom: this._nom, data: brut }
    }));
  }

  // ── 3 & 4. Proxy récursif — accès libre + détection des modifications ────

  /**
   * Enveloppe un objet (ou tableau) dans un Proxy.
   * Toute affectation, suppression ou modification imbriquée
   * déclenche automatiquement _sauvegarder().
   */
  _proxifier(cible) {
    if (typeof cible !== "object" || cible === null) return cible;

    // Proxifie récursivement les enfants existants
    for (const cle of Object.keys(cible)) {
      if (typeof cible[cle] === "object" && cible[cle] !== null) {
        cible[cle] = this._proxifier(cible[cle]);
      }
    }

    return new Proxy(cible, {

      // Lecture : transparente
      get: (obj, prop) => {
        return obj[prop];
      },

      // Écriture : proxifie la valeur si objet, puis sauvegarde
      set: (obj, prop, valeur) => {
        // Évite les propriétés internes de tableau (length, etc.)
        if (typeof prop === "symbol") {
          obj[prop] = valeur;
          return true;
        }
        if (typeof valeur === "object" && valeur !== null) {
          valeur = this._proxifier(valeur);
        }
        obj[prop] = valeur;
        this._log(`set [${String(prop)}] =`, valeur);
        this._sauvegarder();
        return true;
      },

      // Suppression : sauvegarde après delete
      deleteProperty: (obj, prop) => {
        if (prop in obj) {
          delete obj[prop];
          this._log(`delete [${String(prop)}]`);
          this._sauvegarder();
        }
        return true;
      }
    });
  }

  /**
   * Retire les couches Proxy pour obtenir un objet JSON sérialisable.
   * (JSON.stringify ignore silencieusement les handlers Proxy,
   *  mais cette méthode force une copie propre.)
   */
  _deproxifier(cible) {
    return JSON.parse(JSON.stringify(cible));
  }

  // ── 5. Export JSON (téléchargement fichier) ──────────────────────────────

  /**
   * Déclenche le téléchargement des données sous forme de fichier .json
   * @param {string} nomFichier - Nom du fichier (défaut : nom du cookie)
   */
  exporterJSON(nomFichier = null) {
    const brut    = this._deproxifier(this.data);
    const contenu = JSON.stringify(brut, null, 2);
    const blob    = new Blob([contenu], { type: "application/json" });
    const url     = URL.createObjectURL(blob);

    const lien = document.createElement("a");
    lien.href     = url;
    lien.download = (nomFichier || this._nom) + ".json";
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);

    this._log("Export JSON :", brut);
  }

  // ── 6. Import JSON (depuis fichier) ─────────────────────────────────────

  /**
   * Ouvre un sélecteur de fichier et charge le JSON sélectionné.
   * Les données remplacent entièrement l'état actuel et sont sauvegardées.
   * @param {Function} callback - Appelé avec les nouvelles données une fois chargées
   */
  importerJSON(callback = null) {
    const input    = document.createElement("input");
    input.type     = "file";
    input.accept   = ".json,application/json";

    input.addEventListener("change", (e) => {
      const fichier = e.target.files[0];
      if (!fichier) return;

      const lecteur = new FileReader();
      lecteur.onload = (ev) => {
        try {
          const nouvelles = JSON.parse(ev.target.result);

          // Remplace toutes les clés existantes
          const actuel = this._deproxifier(this.data);
          for (const cle of Object.keys(actuel)) {
            delete this.data[cle];
          }
          for (const [cle, val] of Object.entries(nouvelles)) {
            this.data[cle] = val;
          }

          this._log("Import JSON :", nouvelles);
          if (typeof callback === "function") callback(nouvelles);

        } catch (err) {
          console.error("[Data] Fichier JSON invalide :", err);
          alert("Fichier JSON invalide : " + err.message);
        }
      };
      lecteur.readAsText(fichier);
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  // ── Utilitaires publics ───────────────────────────────────────────────────

  /**
   * Réinitialise toutes les données et efface le cookie.
   */
  reinitialiser() {
    const brut = this._deproxifier(this.data);
    for (const cle of Object.keys(brut)) {
      delete this.data[cle];
    }
    // Expire immédiatement le cookie
    document.cookie =
      encodeURIComponent(this._nom) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    this._log("Réinitialisé.");
  }

  /**
   * Enregistre un écouteur appelé à chaque sauvegarde.
   * @param {Function} fn - Reçoit une copie brute des données
   */
  onChange(fn) {
    if (typeof fn === "function") this._callbacks.push(fn);
  }

  /**
   * Retourne une copie brute des données (sans Proxy), utile pour débogage.
   */
  snapshot() {
    return this._deproxifier(this.data);
  }

  // ── Interne ───────────────────────────────────────────────────────────────

  _log(...args) {
    if (this._debug) console.log(`[Data:${this._nom}]`, ...args);
  }
}
