#!/usr/bin/env bash
# Recopie le dépôt GitLab du Cerema (branches et étiquettes) vers le dépôt
# GitHub du projet, avec un compte GitHub distinct de celui du poste.
#
#   ./miroir-github.sh [propriétaire/dépôt] [--force] [--dry-run]
#
# Le compte GitHub n'est utilisé que le temps du script :
#   - la connexion se fait par `gh auth login` dans un GH_CONFIG_DIR jetable,
#     jeton écrit dans ce dossier et non dans le trousseau du système
#     (`--insecure-storage`) — le trousseau, lui, est partagé avec le `gh`
#     habituel et l'entrée écraserait celle du compte personnel ;
#   - git reçoit ses identifiants par `-c credential.helper=…` sur la ligne de
#     commande : ni ~/.gitconfig ni la configuration du dépôt ne sont modifiés ;
#   - les variables par lesquelles VS Code ou un GH_TOKEN existant fourniraient
#     leurs propres identifiants sont neutralisées ;
#   - le dossier jetable est effacé en sortie, même sur erreur ou Ctrl-C.
#
# La source est GitLab, pas la copie de travail : ce qui n'est pas poussé sur
# GitLab n'est pas recopié. Le script le signale.

set -euo pipefail

# --- Réglages ---------------------------------------------------------------

# Dépôt GitHub cible, sous la forme propriétaire/dépôt. Peut être donné en
# argument ou par la variable d'environnement GITHUB_REPO.
GITHUB_REPO_DEFAUT=""

GITLAB_URL="git@gitlab.cerema.fr:groupe_batiment_idf/sobrieau.git"

# --- Arguments --------------------------------------------------------------

FORCE=0
DRY_RUN=0
CIBLE="${GITHUB_REPO:-$GITHUB_REPO_DEFAUT}"

for arg in "$@"; do
  case "$arg" in
    --force)   FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
      echo
      echo "  --force    écrase les branches divergentes côté GitHub"
      echo "  --dry-run  montre ce qui serait poussé, sans rien pousser"
      exit 0 ;;
    -*) echo "Option inconnue : $arg" >&2; exit 2 ;;
    *)  CIBLE="$arg" ;;
  esac
done

if [[ -z "$CIBLE" ]]; then
  read -r -p "Dépôt GitHub cible (propriétaire/dépôt) : " CIBLE
fi
CIBLE="${CIBLE#https://github.com/}"
CIBLE="${CIBLE%.git}"
if [[ ! "$CIBLE" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Dépôt cible invalide : « $CIBLE » (attendu : propriétaire/dépôt)" >&2
  exit 2
fi
GITHUB_URL="https://github.com/$CIBLE.git"

command -v git >/dev/null || { echo "git est introuvable." >&2; exit 1; }
command -v gh  >/dev/null || {
  echo "Le client GitHub « gh » est introuvable : https://cli.github.com/" >&2
  exit 1
}

# --- Isolement --------------------------------------------------------------

# Dossier jetable, lisible du seul utilisateur. XDG_RUNTIME_DIR est en mémoire
# vive : le jeton ne touche pas le disque.
TMP_BASE="${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}"
TRAVAIL="$(mktemp -d "$TMP_BASE/miroir-github.XXXXXX")"
chmod 700 "$TRAVAIL"

nettoyer() {
  if [[ -f "$TRAVAIL/gh/hosts.yml" ]]; then
    GH_CONFIG_DIR="$TRAVAIL/gh" gh auth logout --hostname github.com >/dev/null 2>&1 || true
  fi
  rm -rf "$TRAVAIL"
}
trap nettoyer EXIT
trap 'exit 130' INT TERM

export GH_CONFIG_DIR="$TRAVAIL/gh"
# Rien ne doit venir du compte habituel ni de VS Code.
unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN
unset GIT_ASKPASS SSH_ASKPASS VSCODE_GIT_ASKPASS_NODE VSCODE_GIT_ASKPASS_MAIN \
      VSCODE_GIT_ASKPASS_EXTRA_ARGS VSCODE_GIT_IPC_HANDLE
export GIT_TERMINAL_PROMPT=0
# gh ouvrirait le navigateur par défaut, où le compte personnel est connecté :
# on se contente d'afficher l'adresse.
export GH_BROWSER="echo"

# --- Récupération depuis GitLab --------------------------------------------

echo "==> Récupération de $GITLAB_URL"
git clone --quiet --bare "$GITLAB_URL" "$TRAVAIL/depot.git"

# Travail local non poussé sur GitLab : il ne partira pas sur GitHub.
ICI="$(cd "$(dirname "$0")" && pwd)"
if git -C "$ICI" rev-parse --git-dir >/dev/null 2>&1; then
  branche="$(git -C "$ICI" symbolic-ref --quiet --short HEAD || true)"
  if [[ -n "$branche" ]] && git -C "$TRAVAIL/depot.git" rev-parse --verify --quiet "refs/heads/$branche" >/dev/null; then
    distant="$(git -C "$TRAVAIL/depot.git" rev-parse "refs/heads/$branche")"
    if git -C "$ICI" cat-file -e "$distant^{commit}" 2>/dev/null; then
      en_avance="$(git -C "$ICI" rev-list --count "$distant..HEAD")"
      if [[ "$en_avance" -gt 0 ]]; then
        echo "   ⚠ $en_avance commit(s) de « $branche » ne sont pas sur GitLab et ne seront pas recopiés."
      fi
    fi
  fi
  if [[ -n "$(git -C "$ICI" status --porcelain)" ]]; then
    echo "   ⚠ La copie de travail a des modifications non commitées : elles ne seront pas recopiées."
  fi
fi

echo "   Branches : $(git -C "$TRAVAIL/depot.git" for-each-ref --format='%(refname:short)' refs/heads | tr '\n' ' ')"
echo "   Étiquettes : $(git -C "$TRAVAIL/depot.git" tag | wc -l)"

# --- Connexion au compte GitHub du projet ----------------------------------

echo
echo "==> Connexion au compte GitHub du projet"
echo "   Ouvrez l'adresse ci-dessous dans une FENÊTRE PRIVÉE (ou un autre"
echo "   navigateur), connectez-vous avec le compte du projet, puis saisissez"
echo "   le code affiché. Dans votre navigateur habituel, c'est votre compte"
echo "   personnel qui serait autorisé."
echo
# En HTTPS, gh propose d'inscrire son assistant d'identifiants dans la
# configuration git globale : on lui en donne une jetable, qui disparaît avec
# le reste.
GIT_CONFIG_GLOBAL="$TRAVAIL/gitconfig" \
  gh auth login --hostname github.com --git-protocol https --web \
  --insecure-storage --scopes repo

COMPTE="$(gh api user --jq .login)"
echo
echo "   Connecté en tant que : $COMPTE"

if ! droits="$(gh api "repos/$CIBLE" --jq '.permissions.push' 2>/dev/null)"; then
  echo "Le dépôt $CIBLE est introuvable pour le compte $COMPTE." >&2
  exit 1
fi
if [[ "$droits" != "true" ]]; then
  echo "Le compte $COMPTE n'a pas le droit d'écrire dans $CIBLE." >&2
  exit 1
fi

read -r -p "Pousser vers $GITHUB_URL avec le compte $COMPTE ? [o/N] " rep
[[ "$rep" =~ ^[oOyY]$ ]] || { echo "Abandon."; exit 1; }

# --- Envoi vers GitHub -----------------------------------------------------

options=(--porcelain)
[[ $FORCE -eq 1 ]]   && options+=(--force)
[[ $DRY_RUN -eq 1 ]] && options+=(--dry-run)

echo
echo "==> Envoi vers $GITHUB_URL"
# `credential.helper=` vide la liste des assistants hérités (trousseau,
# gestionnaire de VS Code…) ; seul gh, pointé sur le dossier jetable, répond.
set +e
git -C "$TRAVAIL/depot.git" \
  -c credential.helper= \
  -c "credential.https://github.com.helper=!gh auth git-credential" \
  -c credential.useHttpPath=false \
  push "${options[@]}" "$GITHUB_URL" \
  'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'
statut=$?
set -e

echo
if [[ $statut -ne 0 ]]; then
  echo "Échec de l'envoi (code $statut)."
  if [[ $FORCE -eq 0 ]]; then
    echo "Si des branches ont été refusées (« rejected »), GitHub contient des"
    echo "commits absents de GitLab. Relancez avec --force pour les écraser,"
    echo "après avoir vérifié qu'ils peuvent l'être."
  fi
  exit $statut
fi

if [[ $DRY_RUN -eq 1 ]]; then
  echo "Simulation terminée : rien n'a été poussé."
else
  echo "Copie terminée : https://github.com/$CIBLE"
fi
echo "La session GitHub est fermée et ses fichiers effacés."
