#!/bin/bash
# ============================================================
# SYGFP — RECOVERY SCRIPT — Relance après crash
# Usage : chmod +x RECOVERY.sh && ./RECOVERY.sh
# ============================================================

set -uo pipefail
PROJECT_DIR="$HOME/sygfp-artis-g-re"
SESSION="sygfp"

# ── Couleurs ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # Reset

ok()   { echo -e "  ${GREEN}OK${NC}  $1"; }
fail() { echo -e "  ${RED}FAIL${NC}  $1"; }
warn() { echo -e "  ${YELLOW}WARN${NC}  $1"; }
info() { echo -e "  ${BLUE}INFO${NC}  $1"; }

ERRORS_COUNT=0
WARNINGS_COUNT=0

# ── En-tête ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     SYGFP RECOVERY — $(date '+%Y-%m-%d %H:%M')          ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ══════════════════════════════════════════════════════════
# PHASE 1 : LANCEMENT TMUX
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}[Phase 1] Lancement tmux${NC}"
echo -e "${DIM}──────────────────────────────────────────────────${NC}"

# Vérifier le dossier projet
cd "$PROJECT_DIR" || { fail "Dossier projet introuvable : $PROJECT_DIR"; exit 1; }
ok "Dossier projet"

# Tuer l'ancienne session tmux si elle existe
tmux kill-session -t $SESSION 2>/dev/null || true
info "Ancienne session tmux nettoyée"

# Créer la nouvelle session tmux (4 panes agents + 1 fenêtre dev)
tmux new-session -d -s $SESSION -n agents -c "$PROJECT_DIR"
tmux split-window -h -t $SESSION -c "$PROJECT_DIR"
tmux split-window -v -t $SESSION:0.0 -c "$PROJECT_DIR"
tmux split-window -v -t $SESSION:0.1 -c "$PROJECT_DIR"
tmux select-layout -t $SESSION tiled

# Serveur dev dans une 2ème fenêtre
tmux new-window -t $SESSION -n dev -c "$PROJECT_DIR"
tmux send-keys -t $SESSION:1 'npm run dev' Enter

# Lancer Claude Code dans chaque pane
for pane in 0 1 2 3; do
  tmux send-keys -t $SESSION:0.$pane "export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1" Enter
  sleep 0.3
  tmux send-keys -t $SESSION:0.$pane "claude --dangerously-skip-permissions" Enter
  sleep 1
done

# Revenir aux agents
tmux select-window -t $SESSION:0
tmux select-pane -t $SESSION:0.0

ok "Session tmux '$SESSION' créée (4 panes agents + 1 fenêtre dev)"
echo ""

# ══════════════════════════════════════════════════════════
# PHASE 2 : VÉRIFICATIONS FRONTEND
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}[Phase 2] Vérifications frontend${NC}"
echo -e "${DIM}──────────────────────────────────────────────────${NC}"

# ── 2.1 node_modules ─────────────────────────────────────
echo -e "\n${CYAN}2.1 node_modules${NC}"
if [ -d "node_modules" ]; then
  PKG_COUNT=$(ls -1 node_modules | wc -l)
  ok "node_modules présent ($PKG_COUNT packages)"
else
  warn "node_modules absent — installation en cours..."
  npm install 2>&1 | tail -5
  if [ -d "node_modules" ]; then
    ok "npm install terminé"
  else
    fail "npm install échoué"
    ERRORS_COUNT=$((ERRORS_COUNT + 1))
  fi
fi

# ── 2.2 Build (npm run build) ────────────────────────────
echo -e "\n${CYAN}2.2 Build de production${NC}"
BUILD_OUTPUT=$(npm run build 2>&1) && BUILD_EXIT=0 || BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  # Extraire la taille du build
  BUILD_SIZE=$(echo "$BUILD_OUTPUT" | grep -oP 'dist.*?kB' | head -1 || echo "")
  ok "Build réussi${BUILD_SIZE:+ ($BUILD_SIZE)}"
else
  fail "Build échoué (exit code $BUILD_EXIT)"
  ERRORS_COUNT=$((ERRORS_COUNT + 1))
  echo -e "${RED}  Dernières lignes :${NC}"
  echo "$BUILD_OUTPUT" | tail -10 | while IFS= read -r line; do
    echo -e "    ${RED}$line${NC}"
  done
fi

# ── 2.3 TypeScript (tsc --noEmit) ────────────────────────
echo -e "\n${CYAN}2.3 TypeScript strict${NC}"
TS_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
TS_ERROR_COUNT=$(echo "$TS_OUTPUT" | grep -c "error TS" || true)

if [ "$TS_ERROR_COUNT" -eq 0 ]; then
  ok "TypeScript : 0 erreur"
else
  fail "TypeScript : $TS_ERROR_COUNT erreur(s)"
  ERRORS_COUNT=$((ERRORS_COUNT + TS_ERROR_COUNT))
  echo -e "${RED}  Erreurs TS :${NC}"
  echo "$TS_OUTPUT" | grep "error TS" | head -15 | while IFS= read -r line; do
    # Colorier le fichier en cyan et l'erreur en rouge
    FILE=$(echo "$line" | grep -oP '^[^(]+' || echo "")
    ERROR=$(echo "$line" | grep -oP 'error TS\d+:.*' || echo "$line")
    echo -e "    ${CYAN}${FILE}${NC} ${RED}${ERROR}${NC}"
  done
  if [ "$TS_ERROR_COUNT" -gt 15 ]; then
    echo -e "    ${DIM}... et $((TS_ERROR_COUNT - 15)) erreur(s) supplémentaire(s)${NC}"
  fi
fi

# ── 2.4 Tests unitaires (vitest) ──────────────────────────
echo -e "\n${CYAN}2.4 Tests unitaires (vitest)${NC}"
TEST_OUTPUT=$(npx vitest run 2>&1 || true)
TEST_PASS=$(echo "$TEST_OUTPUT" | grep -oP '\d+ passed' | grep -oP '\d+' || echo "0")
TEST_FAIL=$(echo "$TEST_OUTPUT" | grep -oP '\d+ failed' | grep -oP '\d+' || echo "0")
TEST_TOTAL=$((TEST_PASS + TEST_FAIL))

if [ "$TEST_FAIL" -eq 0 ] && [ "$TEST_PASS" -gt 0 ]; then
  ok "Vitest : $TEST_PASS/$TEST_TOTAL tests passent"
else
  fail "Vitest : $TEST_FAIL echoue(s) sur $TEST_TOTAL"
  ERRORS_COUNT=$((ERRORS_COUNT + 1))
  echo "$TEST_OUTPUT" | grep "FAIL" | head -10 | while IFS= read -r line; do
    echo -e "    ${RED}$line${NC}"
  done
fi

# ── 2.5 Fichiers critiques ───────────────────────────────
echo -e "\n${CYAN}2.5 Fichiers critiques${NC}"
CRITICAL_FILES=(
  "CLAUDE.md"
  "AGENT_CONTEXT.md"
  "PROJECT_STATUS.md"
  "ARCHITECTURE.md"
  "CONVENTIONS.md"
  "TESTS_REGISTRY.md"
)

# .env ou .env.local (au moins un des deux)
ENV_FOUND=false
for env_file in ".env" ".env.local"; do
  if [ -f "$env_file" ]; then
    ENV_FOUND=true
    ok "$env_file"
    break
  fi
done
if [ "$ENV_FOUND" = false ]; then
  fail ".env / .env.local — AUCUN trouvé"
  ERRORS_COUNT=$((ERRORS_COUNT + 1))
fi

for f in "${CRITICAL_FILES[@]}"; do
  if [ -f "$f" ]; then
    LINES=$(wc -l < "$f")
    ok "$f (${LINES} lignes)"
  else
    fail "$f MANQUANT"
    ERRORS_COUNT=$((ERRORS_COUNT + 1))
  fi
done

# ── 2.6 Métriques codebase ───────────────────────────────
echo -e "\n${CYAN}2.6 Métriques frontend${NC}"

# Compteurs
COMP_COUNT=$(find src/components -name '*.tsx' 2>/dev/null | wc -l)
HOOK_COUNT=$(find src/hooks -name '*.ts' 2>/dev/null | wc -l)
PAGE_COUNT=$(find src/pages -name '*.tsx' 2>/dev/null | wc -l)
SVC_COUNT=$(find src/services -name '*.ts' 2>/dev/null | wc -l)
MIGRATION_COUNT=$(find supabase/migrations -name '*.sql' 2>/dev/null | wc -l)
E2E_COUNT=$(find e2e -name '*.spec.ts' 2>/dev/null | wc -l)
TOTAL_LINES=$(find src -name '*.ts' -o -name '*.tsx' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

info "Composants TSX :  $COMP_COUNT"
info "Hooks TS :        $HOOK_COUNT"
info "Pages TSX :       $PAGE_COUNT"
info "Services TS :     $SVC_COUNT"
info "Migrations SQL :  $MIGRATION_COUNT"
info "Tests E2E :       $E2E_COUNT"
info "Lignes total :    $TOTAL_LINES"

echo ""

# ══════════════════════════════════════════════════════════
# PHASE 3 : VÉRIFICATIONS BACKEND
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}[Phase 3] Vérifications backend${NC}"
echo -e "${DIM}──────────────────────────────────────────────────${NC}"

BACKEND_ERRORS=0
ENV_FILE="$PROJECT_DIR/.env"

# ── 3.1 Variables .env ─────────────────────────────────────
echo -e "\n${CYAN}3.1 Variables .env${NC}"

if [ ! -f "$ENV_FILE" ]; then
  fail ".env introuvable"
  BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
else
  # Variables obligatoires (frontend)
  for var in VITE_SUPABASE_PROJECT_ID VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY; do
    val=$(grep "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
    if [ -n "$val" ] && [ "$val" != "your_anon_key_here" ]; then
      ok "$var"
    else
      fail "$var MANQUANT ou placeholder"
      BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
    fi
  done

  # Variables optionnelles (edge functions / scripts)
  for var in SUPABASE_SERVICE_ROLE_KEY R2_ENDPOINT R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET RESEND_API_KEY; do
    val=$(grep "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
    if [ -n "$val" ] && [[ "$val" != your_* ]] && [[ "$val" != re_your_* ]]; then
      ok "$var"
    else
      warn "$var absent (optionnel -- requis pour Edge Functions)"
      WARNINGS_COUNT=$((WARNINGS_COUNT + 1))
    fi
  done
fi

# ── 3.2 Connexion Supabase ────────────────────────────────
echo -e "\n${CYAN}3.2 Connexion Supabase${NC}"

SUPABASE_URL=$(grep "^VITE_SUPABASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)
SUPABASE_KEY=$(grep "^VITE_SUPABASE_PUBLISHABLE_KEY=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || true)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  fail "Variables manquantes -- impossible de tester la connexion"
  BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
else
  info "URL: $SUPABASE_URL"

  # Test REST API
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    "${SUPABASE_URL}/rest/v1/" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    ok "REST API accessible (HTTP $HTTP_CODE)"
  elif [ "$HTTP_CODE" = "000" ]; then
    fail "REST API inaccessible (timeout/DNS)"
    BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
  else
    fail "REST API repond HTTP $HTTP_CODE (attendu 200)"
    BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
  fi

  # Test Auth API
  AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "apikey: ${SUPABASE_KEY}" \
    "${SUPABASE_URL}/auth/v1/settings" 2>/dev/null || echo "000")

  if [ "$AUTH_CODE" = "200" ]; then
    ok "Auth API accessible (HTTP $AUTH_CODE)"
  else
    fail "Auth API repond HTTP $AUTH_CODE"
    BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
  fi

  # Test Storage API
  STORAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    "${SUPABASE_URL}/storage/v1/bucket" 2>/dev/null || echo "000")

  if [ "$STORAGE_CODE" = "200" ]; then
    ok "Storage API accessible (HTTP $STORAGE_CODE)"
  else
    warn "Storage API HTTP $STORAGE_CODE (peut etre normal sans auth complete)"
  fi
fi

# ── 3.3 Edge Functions ─────────────────────────────────────
echo -e "\n${CYAN}3.3 Edge Functions (supabase/functions/)${NC}"

FUNCTIONS_DIR="$PROJECT_DIR/supabase/functions"

EXPECTED_FUNCTIONS=(
  "budget-alerts"
  "bulk-operations"
  "create-user"
  "generate-bordereau"
  "generate-dashboard-stats"
  "generate-export"
  "generate-report"
  "process-reglement"
  "r2-storage"
  "send-notification-email"
  "validate-workflow"
  "workflow-validation"
)

if [ ! -d "$FUNCTIONS_DIR" ]; then
  fail "Dossier supabase/functions/ introuvable"
  BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
else
  FN_FOUND=0
  FN_MISSING=0
  for fn in "${EXPECTED_FUNCTIONS[@]}"; do
    if [ -d "$FUNCTIONS_DIR/$fn" ] && [ -f "$FUNCTIONS_DIR/$fn/index.ts" ]; then
      FN_FOUND=$((FN_FOUND + 1))
    else
      fail "Edge Function manquante : $fn"
      FN_MISSING=$((FN_MISSING + 1))
      BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
    fi
  done

  if [ "$FN_MISSING" -eq 0 ]; then
    ok "12/12 Edge Functions presentes"
  fi

  info "Detail :"
  for fn in "${EXPECTED_FUNCTIONS[@]}"; do
    IDX="$FUNCTIONS_DIR/$fn/index.ts"
    if [ -f "$IDX" ]; then
      LINES=$(wc -l < "$IDX")
      printf "         %-30s %4d lignes\n" "$fn" "$LINES"
    fi
  done
fi

# ── 3.4 Etat DB — Tables chaine ELOP ──────────────────────
echo -e "\n${CYAN}3.4 Etat DB -- Tables chaine ELOP${NC}"

# Compteurs de reference (snapshot 2026-02-19)
CHAIN_TABLES=("notes_sef" "notes_dg" "imputations" "expressions_besoin" "passation_marche" "marches" "budget_engagements" "budget_liquidations" "ordonnancements" "reglements")
REF_COUNTS=(4845 9 1 3146 7 16 5663 4355 3363 0)

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_KEY:-}" ]; then
  warn "Variables manquantes -- compteurs de reference uniquement"
  for i in "${!CHAIN_TABLES[@]}"; do
    printf "    %2d. %-25s %6d lignes (ref. 2026-02-19)\n" "$((i+1))" "${CHAIN_TABLES[$i]}" "${REF_COUNTS[$i]}"
  done
else
  printf "\n    %-3s %-25s %8s %8s %s\n" "#" "Table" "Actuel" "Ref." "Statut"
  printf "    %-3s %-25s %8s %8s %s\n" "---" "-------------------------" "--------" "--------" "------"

  for i in "${!CHAIN_TABLES[@]}"; do
    tbl="${CHAIN_TABLES[$i]}"
    ref="${REF_COUNTS[$i]}"

    # HEAD request avec Prefer: count=exact
    RESPONSE=$(curl -s -I --max-time 10 \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" \
      -H "Prefer: count=exact" \
      -H "Range: 0-0" \
      "${SUPABASE_URL}/rest/v1/${tbl}?select=id" 2>/dev/null || echo "")

    # Extraire le count depuis content-range header
    COUNT=$(echo "$RESPONSE" | grep -i "content-range" | grep -oP '\d+$' || echo "?")

    if [ "$COUNT" = "?" ]; then
      STATUS="${YELLOW}?${NC}"
    elif [ "$COUNT" -ge "$ref" ]; then
      STATUS="${GREEN}OK${NC}"
    else
      STATUS="${RED}DIMINUE${NC}"
      BACKEND_ERRORS=$((BACKEND_ERRORS + 1))
    fi

    printf "    %2d. %-25s %8s %8d %b\n" "$((i+1))" "$tbl" "$COUNT" "$ref" "$STATUS"
  done
fi

# ── 3.5 Migrations ─────────────────────────────────────────
echo -e "\n${CYAN}3.5 Migrations SQL${NC}"

MIG_COUNT=0
if [ -d "$PROJECT_DIR/supabase/migrations" ]; then
  MIG_COUNT=$(ls -1 "$PROJECT_DIR/supabase/migrations/"*.sql 2>/dev/null | wc -l)
  ok "$MIG_COUNT migrations dans supabase/migrations/"
  LATEST_MIG=$(ls -1 "$PROJECT_DIR/supabase/migrations/"*.sql 2>/dev/null | sort | tail -1 | xargs basename)
  info "Derniere : $LATEST_MIG"
else
  warn "Dossier supabase/migrations/ introuvable"
fi

echo ""

# ══════════════════════════════════════════════════════════
# PHASE 4 : RÉSUMÉ
# ══════════════════════════════════════════════════════════
echo -e "${BOLD}[Phase 4] Résumé${NC}"
echo -e "${DIM}──────────────────────────────────────────────────${NC}"

TOTAL_ERRORS=$((ERRORS_COUNT + BACKEND_ERRORS))

if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e ""
  echo -e "${GREEN}${BOLD}  FRONTEND OK${NC}"
  echo -e "${GREEN}  Build OK / TS OK / $COMP_COUNT composants / $HOOK_COUNT hooks / $PAGE_COUNT pages${NC}"
  echo -e "${GREEN}${BOLD}  BACKEND OK${NC}"
  echo -e "${GREEN}  Supabase OK / 12 Edge Functions / $MIG_COUNT migrations${NC}"
  echo -e ""
else
  echo -e ""
  if [ "$ERRORS_COUNT" -gt 0 ]; then
    echo -e "${RED}${BOLD}  FRONTEND : $ERRORS_COUNT ERREUR(S)${NC}"
  else
    echo -e "${GREEN}${BOLD}  FRONTEND OK${NC}"
  fi
  if [ "$BACKEND_ERRORS" -gt 0 ]; then
    echo -e "${RED}${BOLD}  BACKEND : $BACKEND_ERRORS ERREUR(S)${NC}"
  else
    echo -e "${GREEN}${BOLD}  BACKEND OK${NC}"
  fi
  echo -e "${YELLOW}  Corriger les erreurs ci-dessus avant de continuer.${NC}"
  echo -e ""
fi

echo -e "${DIM}──────────────────────────────────────────────────${NC}"
echo -e "  ${BOLD}tmux attach -t $SESSION${NC}  pour entrer dans la session"
echo -e "  Module en cours : voir ${CYAN}AGENT_CONTEXT.md${NC}"
echo -e "  Chaque agent lira automatiquement ${CYAN}CLAUDE.md${NC}"
echo -e "${DIM}──────────────────────────────────────────────────${NC}"
echo ""

# Attacher
tmux attach-session -t $SESSION
