#!/usr/bin/env bash
# Recopie le dépôt GitLab du Cerema (branches et étiquettes) vers le dépôt
# GitHub du projet, avec un compte GitHub distinct de celui du poste.
#
#   ./miroir-github.sh [--force] [--dry-run] [propriétaire/dépôt]
#
# Sans dépôt en argument, le script liste ceux où le compte connecté peut
# écrire, et l'on choisit dans la liste.
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
#     Pas de `gh auth logout` : il toucherait au trousseau du système.
#
# La source est GitLab, pas la copie de travail : ce qui n'est pas poussé sur
# GitLab n'est pas recopié. Le script le signale.

set -euo pipefail

# --- Réglages ---------------------------------------------------------------

GITLAB_URL="git@gitlab.cerema.fr:groupe_batiment_idf/sobrieau.git"

# --- Arguments --------------------------------------------------------------

FORCE=0
DRY_RUN=0
CIBLE=""

for arg in "$@"; do
  case "$arg" in
    --force)   FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
      echo
      echo "  --force    écrase les branches divergentes côté GitHub"
      echo "  --dry-run  montre ce qui serait poussé, sans rien pousser"
      exit 0 ;;
    -*) echo "Option inconnue : $arg" >&2; exit 2 ;;
    *)  CIBLE="$arg" ;;
  esac
done

CIBLE="${CIBLE#https://github.com/}"
CIBLE="${CIBLE%.git}"
if [[ -n "$CIBLE" && ! "$CIBLE" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "Dépôt cible invalide : « $CIBLE » (attendu : propriétaire/dépôt)" >&2
  exit 2
fi

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

PID_LOGIN=""
nettoyer() {
  [[ -n "$PID_LOGIN" ]] && kill "$PID_LOGIN" 2>/dev/null
  # Surtout pas de `gh auth logout` : il efface aussi l'entrée du trousseau
  # système qui porte le nom du compte, donc la connexion habituelle du poste
  # si c'est le même compte. Le jeton n'est écrit que dans $TRAVAIL.
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
# Le trousseau du système (Secret Service, joint par D-Bus) est partagé avec le
# gh habituel, qui y range ses jetons sous le nom du compte : avec le même
# compte, le gh du script écraserait ou effacerait celui du poste. On le lui
# rend inaccessible — seul gh est concerné, pas le navigateur ouvert plus bas.
SANS_TROUSSEAU="unix:path=/nonexistent"
gh() { DBUS_SESSION_BUS_ADDRESS="$SANS_TROUSSEAU" command gh "$@"; }

# Une fenêtre ordinaire du navigateur partagerait la session du compte
# personnel, déjà connecté à GitHub : c'est lui qui serait autorisé. La page
# s'ouvre donc en fenêtre privée.
ouvrir_prive() {
  local url="$1" nav
  for nav in firefox chromium chromium-browser google-chrome brave-browser microsoft-edge; do
    command -v "$nav" >/dev/null 2>&1 || continue
    case "$nav" in
      firefox)        nohup "$nav" --private-window "$url" >/dev/null 2>&1 & ;;
      microsoft-edge) nohup "$nav" --inprivate "$url" >/dev/null 2>&1 & ;;
      *)              nohup "$nav" --incognito "$url" >/dev/null 2>&1 & ;;
    esac
    echo "   Fenêtre privée ouverte ($nav) sur $url"
    return
  done
  if command -v xdg-open >/dev/null 2>&1; then
    nohup xdg-open "$url" >/dev/null 2>&1 &
    echo "   Navigateur ouvert sur $url — ce n'est PAS une fenêtre privée :"
    echo "   déconnectez-y votre compte GitHub personnel avant d'autoriser."
  else
    echo "   Ouvrez cette adresse dans une fenêtre privée : $url"
  fi
}

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
# gh est lancé sans terminal : il ne pose alors aucune question (Entrée pour
# ouvrir le navigateur, inscription dans la configuration git…), se contente
# d'afficher le code et attend l'autorisation. Le script lit le code, l'affiche
# et ouvre lui-même la page. GIT_CONFIG_GLOBAL jetable par précaution : gh ne
# doit rien écrire dans la configuration git du poste.
GIT_CONFIG_GLOBAL="$TRAVAIL/gitconfig" \
  gh auth login --hostname github.com --git-protocol https --web \
  --insecure-storage --scopes repo </dev/null >"$TRAVAIL/login.log" 2>&1 &
PID_LOGIN=$!

CODE=""
for _ in $(seq 1 30); do
  CODE="$(grep -oE '\b[A-Z0-9]{4}-[A-Z0-9]{4}\b' "$TRAVAIL/login.log" | head -1 || true)"
  [[ -n "$CODE" ]] && break
  kill -0 "$PID_LOGIN" 2>/dev/null || break
  sleep 1
done
if [[ -z "$CODE" ]]; then
  echo "Impossible d'obtenir un code de connexion de GitHub :" >&2
  cat "$TRAVAIL/login.log" >&2
  exit 1
fi

echo
echo "   ┌───────────────────────────────────────────┐"
echo "   │   Code à saisir sur GitHub :  $CODE   │"
echo "   └───────────────────────────────────────────┘"
echo
ouvrir_prive "https://github.com/login/device"
echo "   Connectez-vous avec le compte DU PROJET, saisissez le code, autorisez."
echo "   En attente de l'autorisation…"

if ! wait "$PID_LOGIN"; then
  PID_LOGIN=""
  echo "La connexion a échoué ou expiré :" >&2
  grep -v -i clipboard "$TRAVAIL/login.log" >&2
  exit 1
fi
PID_LOGIN=""

COMPTE="$(gh api user --jq .login)"
echo
echo "   Connecté en tant que : $COMPTE"

if [[ -z "$CIBLE" ]]; then
  # Dépôts personnels, d'organisation et ceux où le compte est invité ; seuls
  # ceux où il peut pousser sont proposés.
  mapfile -t DEPOTS < <(
    gh api --paginate \
      "user/repos?affiliation=owner,collaborator,organization_member&sort=full_name&per_page=100" \
      --jq '.[] | select(.permissions.push) | .full_name'
  )
  if [[ ${#DEPOTS[@]} -eq 0 ]]; then
    echo "Le compte $COMPTE n'a accès en écriture à aucun dépôt." >&2
    echo "Créez d'abord le dépôt sur GitHub, ou faites-vous inviter." >&2
    exit 1
  fi
  echo
  echo "Dépôts accessibles en écriture :"
  for i in "${!DEPOTS[@]}"; do
    printf '  %2d) %s\n' $((i + 1)) "${DEPOTS[$i]}"
  done
  while :; do
    read -r -p "Numéro du dépôt cible (q pour abandonner) : " choix
    [[ "$choix" == q ]] && { echo "Abandon."; exit 1; }
    if [[ "$choix" =~ ^[0-9]+$ ]] && (( choix >= 1 && choix <= ${#DEPOTS[@]} )); then
      CIBLE="${DEPOTS[$((choix - 1))]}"
      break
    fi
    echo "   Choix invalide."
  done
else
  if ! droits="$(gh api "repos/$CIBLE" --jq '.permissions.push' 2>/dev/null)"; then
    echo "Le dépôt $CIBLE est introuvable pour le compte $COMPTE." >&2
    exit 1
  fi
  if [[ "$droits" != "true" ]]; then
    echo "Le compte $COMPTE n'a pas le droit d'écrire dans $CIBLE." >&2
    exit 1
  fi
fi
GITHUB_URL="https://github.com/$CIBLE.git"

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
  -c credential.https://github.com.helper= \
  -c "credential.https://github.com.helper=!DBUS_SESSION_BUS_ADDRESS=$SANS_TROUSSEAU gh auth git-credential" \
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
echo "Les identifiants GitHub utilisés par le script sont effacés du poste."
