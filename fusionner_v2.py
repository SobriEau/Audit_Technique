#!/usr/bin/env python3
"""
fusionner_v2.py — Version simplifiée et logique du bundler HTML
Fusionne toutes les pages HTML en un seul fichier avec navigation par sections.
"""

import re
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

RACINE = Path(__file__).parent / "site"
SORTIE = Path(__file__).parent / "index.html"
SHARED_JS = RACINE / "shared" / "Data.js"

# ═══════════════════════════════════════════════════════════════════════════
# 1. Collecte des fichiers
# ═══════════════════════════════════════════════════════════════════════════

def collecter_pages():
    """Trouve toutes les pages HTML dans site/"""
    pages = []
    for p in sorted(RACINE.rglob("*.html")):
        pages.append(p)
    return pages

def page_id(chemin: Path) -> str:
    """Génère un ID unique pour une page : page-site-home-html"""
    rel = chemin.relative_to(RACINE.parent)
    return "page-" + re.sub(r"[^a-z0-9]+", "-", str(rel).lower())

# ═══════════════════════════════════════════════════════════════════════════
# 2. Extraction head/body
# ═══════════════════════════════════════════════════════════════════════════

def extraire_head_body(html: str) -> tuple[str, str, str]:
    """Extrait le contenu de <head>, <style> et <body>"""
    head_match = re.search(r"<head[^>]*>(.*?)</head>", html, re.DOTALL | re.IGNORECASE)
    body_match = re.search(r"<body[^>]*>(.*?)</body>", html, re.DOTALL | re.IGNORECASE)
    
    head = head_match.group(1) if head_match else ""
    body = body_match.group(1) if body_match else html
    
    # Extraire les <style> du head pour les traiter séparément
    styles = ""
    style_matches = re.findall(r"<style[^>]*>(.*?)</style>", head, re.DOTALL | re.IGNORECASE)
    if style_matches:
        styles = "\n".join(style_matches)
        # Retirer les <style> du head
        head = re.sub(r"<style[^>]*>.*?</style>\s*", "", head, flags=re.DOTALL | re.IGNORECASE)
    
    return head, styles, body

# ═══════════════════════════════════════════════════════════════════════════
# 3. Nettoyage et transformation
# ═══════════════════════════════════════════════════════════════════════════

def scoper_styles(styles: str, section_id: str) -> str:
    """Scope les styles CSS à une section spécifique"""
    if not styles.strip():
        return ""
    
    # Ajouter le préfixe #section-id à chaque sélecteur
    # On traite les règles CSS : sélecteur { propriétés }
    def prefixer_selecteur(match):
        selecteur = match.group(1).strip()
        props = match.group(2)
        
        # Split par virgule pour gérer les sélecteurs multiples
        selecteurs = [s.strip() for s in selecteur.split(',')]
        selecteurs_scopes = []
        
        for sel in selecteurs:
            # Si c'est un sélecteur simple (body, label, etc.), le préfixer
            if sel in ['body', 'html']:
                # body/html → remplacer par #section-id
                selecteurs_scopes.append(f"#{section_id}")
            elif sel.startswith('@'):
                # Media query ou @keyframes - ne pas scoper
                selecteurs_scopes.append(sel)
            else:
                # Préfixer avec #section-id
                selecteurs_scopes.append(f"#{section_id} {sel}")
        
        return f"{', '.join(selecteurs_scopes)}{{{props}}}"
    
    # Regex pour capturer sélecteur { propriétés }
    styles_scopes = re.sub(
        r'([^{}]+)\{([^{}]+)\}',
        prefixer_selecteur,
        styles,
        flags=re.MULTILINE
    )
    
    return f"<style>\n{styles_scopes}\n</style>"

def nettoyer_head(head: str) -> str:
    """Supprime les imports de Data.js du head"""
    # Supprimer <script src="../shared/Data.js"></script> et variants
    head = re.sub(
        r'<script[^>]*src=["\']\.\.?/shared/Data\.js["\'][^>]*></script>\s*',
        '',
        head,
        flags=re.IGNORECASE
    )
    return head

def transformer_navigation(body: str, page_courante: Path, carte_pages: dict) -> str:
    """Transforme location.href = 'page.html' en showPage('page-id')"""
    
    def resoudre_chemin(href_relatif: str) -> str | None:
        """Résout un chemin relatif depuis la page courante vers une page cible"""
        # Nettoyer
        href_propre = href_relatif.split('?')[0].split('#')[0]
        
        # Résoudre depuis le dossier de la page courante
        try:
            chemin_absolu = (page_courante.parent / href_propre).resolve()
            
            # Trouver dans la carte
            for chemin, pid in carte_pages.items():
                if chemin.resolve() == chemin_absolu:
                    return pid
        except:
            pass
        
        return None
    
    def remplacer_simple(m):
        href = m.group(1)
        pid = resoudre_chemin(href)
        if pid:
            return f"showPage('{pid}')"
        return m.group(0)
    
    # location.href = './page.html'
    body = re.sub(
        r"location\.href\s*=\s*['\"]([^'\"]+\.html)['\"]",
        remplacer_simple,
        body
    )
    
    # location.href = './robinet.html?idx=' + expr (avec ou sans parenthèses)
    def remplacer_idx(m):
        href = m.group(1)
        # Capturer toute l'expression jusqu'au point-virgule
        var = m.group(2).strip()
        # Enlever les parenthèses extérieures si présentes
        if var.startswith('(') and var.endswith(')'):
            var = var[1:-1]
        pid = resoudre_chemin(href)
        if pid:
            return f"(window.__robinetIdx = {var}, showPage('{pid}'))"
        return m.group(0)
    
    body = re.sub(
        r"location\.href\s*=\s*['\"]([^'\"]+\.html)\?idx=['\"]?\s*\+\s*(.+?);",
        remplacer_idx,
        body
    )
    
    # a.href = './' + key + '.html' (dynamic)
    # On ne peut pas résoudre dynamiquement, mais on sait que c'est dans qte/
    def remplacer_ahref_dynamic(m):
        # Pour qte/index.html, les liens dynamiques pointent vers des pages qte/*.html
        return "a.onclick = () => showPage('page-site-qte-' + key.replace(/_/g, '-') + '-html'); a.href = 'javascript:void(0)';"
    
    body = re.sub(
        r"a\.href\s*=\s*['\"]\.\/['\"]?\s*\+\s*key\s*\+\s*['\"]\.html['\"];?",
        remplacer_ahref_dynamic,
        body
    )
    
    return body

def encapsuler_scripts(body: str) -> str:
    """Encapsule chaque script dans une IIFE avec accès à section"""
    
    def encapsuler(m):
        attrs = m.group(1) or ''
        code = m.group(2) or ''
        
        # Rendre les sélecteurs scope-safe (ordre important : du plus spécifique au plus général)
        # 1. document.getElementById('id').addEventListener(...) → (...).addEventListener(...)
        code = re.sub(
            r"document\.getElementById\(['\"]([^'\"]+)['\"]\)(\.addEventListener\()",
            r"((section?.querySelector('#\1')) || document.getElementById('\1'))\2",
            code
        )
        
        # 2. document.getElementById('id').property = ... → (...).property = ...
        code = re.sub(
            r"document\.getElementById\(['\"]([^'\"]+)['\"]\)(\.[a-zA-Z_]\w*\s*=)",
            r"((section?.querySelector('#\1')) || document.getElementById('\1'))\2",
            code
        )
        
        # 3. Autres cas (assignments à variables, etc.) - mais pas ceux déjà transformés
        # Utilise un lookbehind négatif pour ignorer les cas déjà entre parenthèses
        code = re.sub(
            r"(?<!\|\| )document\.getElementById\(['\"]([^'\"]+)['\"]\)",
            r"((section?.querySelector('#\1')) || document.getElementById('\1'))",
            code
        )
        
        # document.querySelector → (section || document).querySelector
        code = re.sub(r"\bdocument\.querySelector(All)?\(", r"(section || document).querySelector\1(", code)

        # Si une page instancie Data localement, permettre reset au changement de page
        code = re.sub(
            r"\bconst\s+db\s*=\s*new\s+Data\s*\(",
            "let db = new Data(",
            code
        )
        
        # Gérer le paramètre idx dans robinet.html
        code = re.sub(
            r"const\s+idx\s*=\s*parseInt\s*\(\s*params\.get\s*\(['\"]idx['\"]\s*\)\s*,\s*10\s*\);",
            "const idx = window.__robinetIdx !== undefined ? window.__robinetIdx : parseInt(params.get('idx'), 10);",
            code
        )
        
        # Encapsuler + enregistrer hooks show/hide pilotés par showPage()
        wrapped = f"""(function(section){{
{code}

        if (section) {{
            window.__pageHooks = window.__pageHooks || {{}};
            window.__pageHooks[section.id] = {{
                onShow: function() {{
                    if (typeof load === 'function') load();
                }},
                onHide: function() {{
                    if (typeof cleanup === 'function') cleanup();
                    if (typeof db !== 'undefined') db = null;
                }}
            }};
        }}
}})(document.currentScript?.closest('section'));"""
        
        return f"<script{attrs}>{wrapped}</script>"
    
    body = re.sub(r"<script([^>]*)>(.*?)</script>", encapsuler, body, flags=re.DOTALL | re.IGNORECASE)
    return body

# ═══════════════════════════════════════════════════════════════════════════
# 4. Assemblage
# ═══════════════════════════════════════════════════════════════════════════

def creer_script_navigation():
    """Génère le script de navigation simple"""
    return """
<script>
// Classe Data globale
""" + SHARED_JS.read_text(encoding='utf-8') + """

// Navigation simple
function showPage(id) {
    const hooks = window.__pageHooks || {};

    // Nettoyer TOUTES les pages non actives pour éviter plusieurs Data simultanés
    Object.keys(hooks).forEach((pid) => {
        if (pid !== id && hooks[pid] && typeof hooks[pid].onHide === 'function') {
            try { hooks[pid].onHide(); } catch (e) { console.warn('onHide error:', e); }
        }
    });

  document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
        window.__activePageId = id;

        if (hooks[id] && typeof hooks[id].onShow === 'function') {
            try { hooks[id].onShow(); } catch (e) { console.warn('onShow error:', e); }
        }

    window.scrollTo(0, 0);
  }
}

// Démarrage : afficher la première page
window.addEventListener('DOMContentLoaded', () => {
  const first = document.querySelector('.page-section');
    if (first) showPage(first.id);
});
</script>
"""

def assembler(pages: list[Path]):
    """Assemble tout en un seul fichier HTML"""
    
    # Créer la carte des pages
    carte = {p: page_id(p) for p in pages}
    
    # Home en premier
    home = next((p for p in pages if p.name == 'home.html'), pages[0])
    pages_ordonnees = [home] + [p for p in pages if p != home]
    
    heads = []
    sections = []
    
    print("\n📄 Traitement des pages :")
    
    for page in pages_ordonnees:
        pid = carte[page]
        rel = page.relative_to(RACINE.parent)
        print(f"  • {rel}")
        
        try:
            html = page.read_text(encoding='utf-8')
        except Exception as e:
            print(f"    ⚠️  Erreur lecture : {e}")
            continue
        
        head, styles, body = extraire_head_body(html)
        
        # Nettoyer et transformer
        head = nettoyer_head(head)
        styles_scopes = scoper_styles(styles, pid)
        body = transformer_navigation(body, page, carte)
        body = encapsuler_scripts(body)
        
        # Collecter head (sans les styles)
        if head.strip():
            heads.append(f"<!-- HEAD: {rel} -->\n{head}")
        
        display = 'block' if page == home else 'none'
        sections.append(f'''
<section id="{pid}" class="page-section" style="display:{display}">
<!-- PAGE: {rel} -->
{styles_scopes}
{body}
</section>''')
    
    # Assembler le HTML final
    html_final = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SobriEau — Site Fusionné</title>
{chr(10).join(heads)}
{creer_script_navigation()}
</head>
<body>
{chr(10).join(sections)}
</body>
</html>'''
    
    return html_final

# ═══════════════════════════════════════════════════════════════════════════
# 5. Main
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("╔════════════════════════════════════════════════╗")
    print("║  fusionner_v2.py — Bundler HTML simplifié     ║")
    print("╚════════════════════════════════════════════════╝")
    
    if not RACINE.exists():
        print(f"\n❌ Dossier '{RACINE}' introuvable")
        return
    
    if not SHARED_JS.exists():
        print(f"\n❌ Fichier '{SHARED_JS}' introuvable")
        return
    
    print(f"\n📂 Dossier source : {RACINE}")
    
    # Collecter les pages
    pages = collecter_pages()
    print(f"\n✓ {len(pages)} pages HTML trouvées")
    
    # Assembler
    html = assembler(pages)
    
    # Écrire
    SORTIE.write_text(html, encoding='utf-8')
    taille_ko = SORTIE.stat().st_size / 1024
    
    print(f"\n✅ Fichier généré : {SORTIE.name}")
    print(f"   Taille : {taille_ko:.1f} Ko")
    print(f"   Pages fusionnées : {len(pages)}\n")

if __name__ == "__main__":
    main()
