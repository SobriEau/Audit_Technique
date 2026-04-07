#!/usr/bin/env python3
"""
fusionner.py — Fusionne un site HTML multi-pages en un seul fichier autonome.
Placez ce script à la racine de votre site et lancez : python fusionner.py
"""

import os
import re
import base64
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

# ─── Configuration ────────────────────────────────────────────────────────────

# Dossier racine du site (par défaut : dossier où se trouve ce script)
DOSSIER_RACINE = Path(__file__).parent

# Fichier de sortie
FICHIER_SORTIE = DOSSIER_RACINE / "index_fusionne.html"

# Extensions HTML à traiter comme des "pages"
EXTENSIONS_HTML = {".html", ".htm"}

# ─── Utilitaires ──────────────────────────────────────────────────────────────

def est_url_externe(url: str) -> bool:
    """Renvoie True si l'URL pointe vers un serveur externe."""
    return urlparse(url).scheme in ("http", "https", "data", "mailto", "tel", "javascript")

def fichier_en_base64(chemin: Path) -> str:
    """Encode un fichier binaire en URI data:base64."""
    mime, _ = mimetypes.guess_type(str(chemin))
    if mime is None:
        mime = "application/octet-stream"
    with open(chemin, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return f"data:{mime};base64,{data}"

def resoudre(base: Path, href: str) -> Path | None:
    """Résout un chemin relatif depuis une page de base. Renvoie None si externe."""
    if est_url_externe(href):
        return None
    # Ignorer les ancres pures
    if href.startswith("#"):
        return None
    # Séparer fragment éventuel
    href_propre = href.split("#")[0].split("?")[0]
    if not href_propre:
        return None
    chemin = (base.parent / href_propre).resolve()
    if chemin.exists():
        return chemin
    return None

# ─── Collecte des pages ───────────────────────────────────────────────────────

def collecter_pages(racine: Path) -> list[Path]:
    """Trouve tous les fichiers HTML du dossier racine (hors sous-dossiers cachés)."""
    pages = []
    for p in sorted(racine.rglob("*")):
        if p.suffix.lower() in EXTENSIONS_HTML and p != FICHIER_SORTIE:
            pages.append(p)
    return pages

def choisir_page_depart(pages: list[Path]) -> Path:
    """Demande à l'utilisateur de choisir la page de départ."""
    print("\n=== Pages HTML trouvées ===")
    for i, p in enumerate(pages):
        print(f"  {i + 1}. {p.relative_to(DOSSIER_RACINE)}")
    print()
    while True:
        choix = input("Numéro de la page de départ [1] : ").strip()
        if choix == "":
            return pages[0]
        try:
            n = int(choix) - 1
            if 0 <= n < len(pages):
                return pages[n]
        except ValueError:
            pass
        print("  → Entrez un numéro valide.")

# ─── Traitement du contenu HTML ───────────────────────────────────────────────

def integrer_css(contenu: str, base: Path) -> str:
    """Remplace les <link rel="stylesheet"> par des blocs <style> inline."""
    def remplacer(m):
        href = m.group(1)
        chemin = resoudre(base, href)
        if chemin and chemin.exists():
            try:
                css = chemin.read_text(encoding="utf-8", errors="replace")
                # Traiter les url() dans le CSS (images, fonts)
                css = integrer_url_css(css, chemin)
                return f"<style>\n{css}\n</style>"
            except Exception as e:
                print(f"  ⚠ CSS ignoré ({href}) : {e}")
        return m.group(0)  # Laisser tel quel si non trouvé

    return re.sub(
        r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\'][^>]*>',
        remplacer,
        contenu,
        flags=re.IGNORECASE,
    )

def integrer_url_css(css: str, base_css: Path) -> str:
    """Remplace les url(...) dans un CSS par des data URI."""
    def remplacer(m):
        url = m.group(1).strip("'\"")
        if est_url_externe(url) or url.startswith("data:"):
            return m.group(0)
        chemin = resoudre(base_css, url)
        if chemin and chemin.exists():
            try:
                return f"url('{fichier_en_base64(chemin)}')"
            except Exception:
                pass
        return m.group(0)

    return re.sub(r"url\(([^)]+)\)", remplacer, css)

def integrer_js(contenu: str, base: Path) -> str:
    """Remplace les <script src="..."> par des blocs <script> inline."""
    def remplacer(m):
        attrs_avant = m.group(1)
        src = m.group(2)
        attrs_apres = m.group(3)
        chemin = resoudre(base, src)
        if chemin and chemin.exists():
            try:
                js = chemin.read_text(encoding="utf-8", errors="replace")
                return f"<script{attrs_avant}{attrs_apres}>\n{js}\n</script>"
            except Exception as e:
                print(f"  ⚠ JS ignoré ({src}) : {e}")
        return m.group(0)

    return re.sub(
        r'<script([^>]*)\ssrc=["\']([^"\']+)["\']([^>]*)>(\s*)</script>',
        remplacer,
        contenu,
        flags=re.IGNORECASE,
    )

def integrer_images(contenu: str, base: Path) -> str:
    """Remplace les attributs src des <img> par des data URI base64."""
    def remplacer(m):
        src = m.group(1)
        if est_url_externe(src) or src.startswith("data:"):
            return m.group(0)
        chemin = resoudre(base, src)
        if chemin and chemin.exists():
            try:
                return f'src="{fichier_en_base64(chemin)}"'
            except Exception as e:
                print(f"  ⚠ Image ignorée ({src}) : {e}")
        return m.group(0)

    return re.sub(r'src=["\']([^"\']+)["\']', remplacer, contenu, flags=re.IGNORECASE)

def integrer_ressources(contenu: str, base: Path) -> str:
    """Applique toutes les intégrations de ressources."""
    contenu = integrer_css(contenu, base)
    contenu = integrer_js(contenu, base)
    contenu = integrer_images(contenu, base)
    return contenu

# ─── Extraction du corps de page ──────────────────────────────────────────────

def extraire_head_body(html: str) -> tuple[str, str]:
    """Retourne (contenu du <head>, contenu du <body>)."""
    head = ""
    body = html

    m_head = re.search(r"<head[^>]*>(.*?)</head>", html, re.IGNORECASE | re.DOTALL)
    if m_head:
        head = m_head.group(1)

    m_body = re.search(r"<body[^>]*>(.*?)</body>", html, re.IGNORECASE | re.DOTALL)
    if m_body:
        body = m_body.group(1)

    return head, body

# ─── Réécriture des liens inter-pages ─────────────────────────────────────────

def id_page(chemin: Path) -> str:
    """Génère un identifiant CSS valide à partir du chemin relatif de la page."""
    rel = chemin.relative_to(DOSSIER_RACINE)
    return "page-" + re.sub(r"[^a-zA-Z0-9_-]", "-", str(rel))

def réécrire_liens(contenu: str, base: Path, carte_pages: dict[Path, str]) -> str:
    """Transforme les href vers d'autres pages en appels JS showPage()."""
    def remplacer(m):
        href = m.group(1)
        fragment = ""
        if "#" in href:
            href_propre, fragment = href.split("#", 1)
        else:
            href_propre = href

        chemin = resoudre(base, href_propre)
        if chemin and chemin in carte_pages:
            cible = carte_pages[chemin]
            ancre = f"#{fragment}" if fragment else ""
            return f'href="javascript:void(0)" onclick="showPage(\'{cible}\',\'{ancre}\')"'
        return m.group(0)

    return re.sub(r'href=["\']([^"\'#][^"\']*)["\']', remplacer, contenu, flags=re.IGNORECASE)


def réécrire_scripts(contenu: str, base: Path, carte_pages: dict[Path, str]) -> str:
    """Réécrit le contenu des <script> pour le rendre scope-safe dans le bundle.

    - Encapsule chaque script dans une IIFE `(function(section){ ... })(document.currentScript.closest('section'))`
    - Remplace `document.getElementById('id')` par `(section && section.querySelector('#id')) || document.getElementById('id')`
    - Remplace `document.querySelector(All)?(` par `(section || document).querySelector(All)?(`
    - Remplace les affectations simples `location.href = './page.html'` par `showPage('page-id')` quand la cible est une page du bundle
    - Gère le pattern simple `location.href = './robinet.html?idx='+idx` en transformant en `window.__robinetIdx = idx; showPage('page-id')`
    """

    def remplacer_script(m):
        attrs = m.group(1) or ''
        code = m.group(2) or ''

        # If this script defines class Data and window.Data already exists, skip the definition
        if re.search(r"\bclass\s+Data\b", code):
            # Check if this is a script that ONLY defines Data class (Data.js)
            # If so, wrap it with a condition to only define once
            code = f"""
// Only define Data class once globally
if (typeof window.Data === 'undefined') {{
{code}
// Expose Data globally for the entire bundle
if (typeof Data !== 'undefined') {{ window.Data = Data; }}
}}
// Always use the global Data class (whether just defined or already existing)
const Data = window.Data;
"""

        # Replace DOM-global selectors with section-scoped fallbacks
        # Special case: when followed by .property assignment, wrap in extra parentheses
        code = re.sub(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)(\.[a-zA-Z_][a-zA-Z0-9_]*\s*=)",
                      r"((section && section.querySelector('#\1')) || document.getElementById('\1'))\2",
                      code)
        # Regular case: simple getElementById (but NOT if already transformed)
        # Use negative lookbehind to avoid double-transformation
        code = re.sub(r"(?<!\|\| )document\.getElementById\(['\"]([^'\"]+)['\"]\)",
                      r"(section && section.querySelector('#\1')) || document.getElementById('\1')",
                      code)

        code = re.sub(r"document\.querySelectorAll\(", r"(section || document).querySelectorAll(", code)
        code = re.sub(r"document\.querySelector\(", r"(section || document).querySelector(", code)

        # Replace simple location.href = '...page.html' cases
        def repl_href(m2):
            href = m2.group(1)
            # resolve relative href from base
            chemin = resoudre(base, href)
            if chemin and chemin in carte_pages:
                cible = carte_pages[chemin]
                return f"showPage('{cible}')"
            return m2.group(0)

        code = re.sub(r"location\.href\s*=\s*['\"]([^'\"]+\.html(?:\#[^'\"]*)?)['\"]", repl_href, code)

        # Handle pattern like: location.href = './robinet.html?idx='+idx or './robinet.html?idx='+(arr.length-1)
        def repl_href_concat(m3):
            base_href = m3.group(1)  # ./robinet.html?idx=
            var = m3.group(2).strip()  # variable or expression (possibly with parentheses)
            # strip query part
            path_only = base_href.split('?')[0]
            chemin = resoudre(base, path_only)
            if chemin and chemin in carte_pages:
                cible = carte_pages[chemin]
                return f"(window.__robinetIdx = {var}, showPage('{cible}'))"
            return m3.group(0)

        code = re.sub(r"location\.href\s*=\s*['\"]([^'\"]+\.html\?idx=)['\"]\s*\+\s*([^;]+)", repl_href_concat, code)

        # Handle dynamic href assignments like: a.href = './' + key + '.html'
        def repl_ahref_dynamic(m4):
            # Transform: a.href = './' + key + '.html'
            # into: a.href = 'javascript:void(0)'; a.onclick = function() { showPage('page-site-qte-' + key.replace(/_/g,'-') + '-html'); }
            return r"a.href = 'javascript:void(0)'; a.onclick = function() { showPage('page-site-qte-' + key.replace(/_/g,'-') + '-html'); }"

        code = re.sub(r"a\.href\s*=\s*['\"]\.\/['\"]?\s*\+\s*key\s*\+\s*['\"]\.html['\"];?", repl_ahref_dynamic, code)

        # Replace URLSearchParams reading of 'idx' parameter with window.__robinetIdx fallback
        # Pattern: const idx = parseInt(params.get('idx'),10);
        code = re.sub(
            r"const\s+idx\s*=\s*parseInt\s*\(\s*params\.get\s*\(\s*['\"]idx['\"]\s*\)\s*,\s*10\s*\)\s*;",
            r"const idx = window.__robinetIdx !== undefined ? window.__robinetIdx : parseInt(params.get('idx'), 10);",
            code
        )

        # Defer load() execution: only call if section is visible, or wait for visibility
        # Replace standalone load(); at the end of scripts with conditional execution
        code = re.sub(
            r"\n\s*load\(\);\s*$",
            r"""
    // Only execute load() when section becomes visible
    if (section && section.style.display !== 'none') {
      load();
    } else if (section) {
      // Set up observer to call load when section becomes visible
      const observer = new MutationObserver(function(mutations) {
        if (section.style.display !== 'none') {
          load();
          observer.disconnect();
        }
      });
      observer.observe(section, { attributes: true, attributeFilter: ['style'] });
    }
    """,
            code,
            flags=re.MULTILINE
        )

        # Wrap in IIFE that receives the section element
        wrapped = f"(function(section){{\ntry{{\n{code}\n}}catch(e){{console.error('script error in section', e);}}\n}})(document.currentScript && document.currentScript.closest ? document.currentScript.closest('section') : null);"

        return f"<script{attrs}>{wrapped}</script>"

    # Apply replacement to all script blocks (including ones with attributes)
    contenu = re.sub(r"<script([^>]*)>([\s\S]*?)</script>", remplacer_script, contenu, flags=re.IGNORECASE)
    return contenu

# ─── Assemblage final ─────────────────────────────────────────────────────────

SCRIPT_NAVIGATION = """
<script>
function showPage(id, anchor) {
  document.querySelectorAll('.page-section').forEach(function(s) {
    s.style.display = 'none';
  });
  var target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
    // Save current page and context to localStorage for recovery after refresh
    // BUT: don't save "detail" pages that require specific context (like robinet page)
    var isDetailPage = id.indexOf('-robinet-html') !== -1; // or other detail pages
    try {
      if (isDetailPage) {
        // Detail pages: save with context
        if (typeof window.__robinetIdx !== 'undefined') {
          localStorage.setItem('__currentPage', id);
          localStorage.setItem('__robinetIdx', window.__robinetIdx);
        } else {
          // No context, don't save
          localStorage.removeItem('__currentPage');
          localStorage.removeItem('__robinetIdx');
        }
      } else {
        // Regular pages: save normally and clear detail context
        localStorage.setItem('__currentPage', id);
        localStorage.removeItem('__robinetIdx');
        window.__robinetIdx = undefined;
      }
    } catch(e) { /* ignore */ }
    if (anchor) {
      var el = target.querySelector(anchor);
      if (el) { el.scrollIntoView(); }
    } else {
      window.scrollTo(0, 0);
    }
  }
}
window.addEventListener('DOMContentLoaded', function() {
  // Restore last page and context after refresh (only within same session)
  var savedPage = null;
  var isRefresh = performance.navigation && performance.navigation.type === 1;
  
  try {
    savedPage = localStorage.getItem('__currentPage');
    var savedIdx = localStorage.getItem('__robinetIdx');
    
    // Only restore if it's a page refresh (F5), not a new page load
    if (isRefresh && savedPage && document.getElementById(savedPage)) {
      if (savedIdx !== null && savedIdx !== 'undefined') {
        window.__robinetIdx = parseInt(savedIdx, 10);
      }
      showPage(savedPage);
      return;
    }
  } catch(e) { /* ignore */ }
  
  // New page load: always start at home and clear saved state
  try {
    localStorage.removeItem('__currentPage');
    localStorage.removeItem('__robinetIdx');
  } catch(e) { /* ignore */ }
  var first = document.querySelector('.page-section');
  if (first) { first.style.display = 'block'; }
});
</script>
"""

def assembler(pages: list[Path], page_depart: Path) -> str:
    """Construit le HTML final fusionné."""
    # Réordonner : page de départ en premier
    pages_ordonnées = [page_depart] + [p for p in pages if p != page_depart]

    carte_pages: dict[Path, str] = {p: id_page(p) for p in pages_ordonnées}

    blocs_head = []
    blocs_body = []

    for page in pages_ordonnées:
        pid = carte_pages[page]
        rel = page.relative_to(DOSSIER_RACINE)
        print(f"  → Traitement : {rel}")

        try:
            html = page.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            print(f"    ✗ Impossible de lire {rel} : {e}")
            continue

        html = integrer_ressources(html, page)
        html = réécrire_liens(html, page, carte_pages)
        # Réécrire et scope les scripts internes pour le bundle
        html = réécrire_scripts(html, page, carte_pages)

        head, body = extraire_head_body(html)
        blocs_head.append(f"<!-- HEAD : {rel} -->\n{head}")

        affichage = "block" if page == page_depart else "none"
        blocs_body.append(
            f'<section id="{pid}" class="page-section" style="display:{affichage}">'
            f"\n<!-- PAGE : {rel} -->\n{body}\n</section>"
        )

    head_fusionne = "\n".join(blocs_head)
    body_fusionne = "\n".join(blocs_body)

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Site fusionné</title>
{head_fusionne}
{SCRIPT_NAVIGATION}
</head>
<body>
{body_fusionne}
</body>
</html>"""

# ─── Point d'entrée ───────────────────────────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════╗")
    print("║         fusionner.py — HTML bundler      ║")
    print("╚══════════════════════════════════════════╝")
    print(f"\nDossier racine : {DOSSIER_RACINE}")

    pages = collecter_pages(DOSSIER_RACINE)
    if not pages:
        print("✗ Aucune page HTML trouvée dans ce dossier.")
        return

    page_depart = choisir_page_depart(pages)
    print(f"\nPage de départ : {page_depart.relative_to(DOSSIER_RACINE)}")
    print("\nFusion en cours...\n")

    html_final = assembler(pages, page_depart)

    FICHIER_SORTIE.write_text(html_final, encoding="utf-8")

    taille = FICHIER_SORTIE.stat().st_size / 1024
    print(f"\n✓ Fichier généré : {FICHIER_SORTIE.name}")
    print(f"  Taille : {taille:.1f} Ko")
    print(f"  Pages fusionnées : {len(pages)}")

if __name__ == "__main__":
    main()
