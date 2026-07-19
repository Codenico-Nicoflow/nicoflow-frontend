#!/usr/bin/env bash
# Idempotent E2E seed for the dedicated staging test account (NIC-1338).
#
# What it guarantees (converges to this state from anything):
#   1. The E2E account exists (register; "already exists" is fine).
#   2. YOU manually flip it to verified + Pro in the DB (this script can't —
#      staging runs REQUIRE_EMAIL_VERIFICATION=true and plan lives in the DB).
#      See STEP 2 block below; the script pauses and prints the exact SQL.
#   3. Login succeeds and the JWT claim says "plan":"pro" (verified here).
#   4. The two permanent sentinel fixtures exist, created only if absent:
#        __E2E_DEFAULT_AREA__      (area)
#        __E2E_DEFAULT_PROJECT__   (project, nested in that area)
#      Journeys NEVER select/edit/delete these; the nightly sweep spares them.
#
# Re-run any time (DB reset, migration wipe, account rotation). Safe to repeat.
#
# Requires: bash, curl, jq. Env (or CI secrets):
#   E2E_API_STAGING    e.g. https://nicoflow-api-staging.onrender.com/v1
#   E2E_TEST_EMAIL     e.g. e2e@nicoflow.test
#   E2E_TEST_PASSWORD  8+ chars, one upper, one lower
set -euo pipefail

API="${E2E_API_STAGING:?set E2E_API_STAGING (…/v1)}"
EMAIL="${E2E_TEST_EMAIL:?set E2E_TEST_EMAIL}"
PASSWORD="${E2E_TEST_PASSWORD:?set E2E_TEST_PASSWORD}"

AREA_SENTINEL="__E2E_DEFAULT_AREA__"
PROJECT_SENTINEL="__E2E_DEFAULT_PROJECT__"

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ─── STEP 1 — ensure account exists ──────────────────────────────────────────
say "1/4  Register (idempotent — 'already exists' is fine)"
reg_code=$(curl -sS -o /tmp/e2e-reg.json -w '%{http_code}' \
  -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg e "$EMAIL" --arg p "$PASSWORD" \
        '{email:$e,password:$p,username:"e2ebot",platform:"web"}')")
case "$reg_code" in
  2*)      echo "   created." ;;
  409|422) echo "   already exists (code $reg_code) — continuing." ;;
  *)       cat /tmp/e2e-reg.json; die "register failed (HTTP $reg_code)" ;;
esac

# ─── STEP 2 — manual DB flip (verified + Pro) ────────────────────────────────
# Cannot be automated: no API to self-verify or self-upgrade. users.plan is the
# column the JWT claim reads (migration 014); user_plans.plan is the billing
# mirror (migration 007). Flip BOTH. Run in Render's psql shell / your DB client:
cat <<SQL

  ── STEP 2 (manual, once per fresh DB) ─────────────────────────────
  UPDATE users
     SET email_verified = true, plan = 'pro'
   WHERE email = '$EMAIL';

  UPDATE user_plans
     SET plan = 'pro'
   WHERE user_id = (SELECT id FROM users WHERE email = '$EMAIL');
  ───────────────────────────────────────────────────────────────────
SQL
if [ -t 0 ] && [ "${SEED_ASSUME_VERIFIED:-}" != "1" ]; then
  read -r -p "   Ran the SQL above? Press Enter to continue (Ctrl-C to abort) "
fi

# ─── STEP 3 — login + assert the claim is Pro ────────────────────────────────
say "3/4  Login and verify JWT claim plan=pro"
login_code=$(curl -sS -o /tmp/e2e-login.json -w '%{http_code}' \
  -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg i "$EMAIL" --arg p "$PASSWORD" \
        '{identifier:$i,password:$p,remember:true}')")
[ "${login_code:0:1}" = "2" ] || { cat /tmp/e2e-login.json; die "login failed (HTTP $login_code) — did you run STEP 2?"; }

TOKEN=$(jq -r '.data.token' /tmp/e2e-login.json)
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] || die "no token in login response"

# Decode the JWT payload (2nd segment); pad base64url so `base64 -d` accepts it.
claim_b64=$(printf '%s' "$TOKEN" | cut -d. -f2 | tr '_-' '/+')
case $(( ${#claim_b64} % 4 )) in 2) claim_b64="${claim_b64}==";; 3) claim_b64="${claim_b64}=";; esac
plan=$(printf '%s' "$claim_b64" | base64 -d 2>/dev/null | jq -r '.plan // empty')
[ "$plan" = "pro" ] || die "JWT claim plan='$plan', expected 'pro' — you likely flipped the wrong table (users.plan is the one that matters)"
echo "   ✓ claim plan=pro"

auth=(-H "Authorization: Bearer $TOKEN")

# ─── STEP 4 — ensure sentinel fixtures (create only if absent) ───────────────
say "4/4  Ensure sentinel fixtures"

# areas/with-projects returns areas each carrying their projects — one call
# tells us whether both sentinels already exist.
curl -sS "${auth[@]}" "$API/areas/with-projects" > /tmp/e2e-tree.json \
  || die "GET /areas/with-projects failed"

AREA_ID=$(jq -r --arg n "$AREA_SENTINEL" \
  '.data[]? | select(.name==$n) | .id' /tmp/e2e-tree.json | head -n1)

if [ -z "$AREA_ID" ]; then
  echo "   creating $AREA_SENTINEL"
  AREA_ID=$(curl -sS "${auth[@]}" -H 'Content-Type: application/json' \
    -X POST "$API/areas" -d "$(jq -nc --arg n "$AREA_SENTINEL" '{name:$n}')" \
    | jq -r '.data.id')
  [ -n "$AREA_ID" ] && [ "$AREA_ID" != "null" ] || die "could not create default area"
else
  echo "   $AREA_SENTINEL exists ($AREA_ID)"
fi

PROJECT_ID=$(jq -r --arg n "$PROJECT_SENTINEL" \
  '.data[]?.projects[]? | select(.name==$n) | .id' /tmp/e2e-tree.json | head -n1)

if [ -z "$PROJECT_ID" ]; then
  echo "   creating $PROJECT_SENTINEL under $AREA_ID"
  PROJECT_ID=$(curl -sS "${auth[@]}" -H 'Content-Type: application/json' \
    -X POST "$API/areas/$AREA_ID/projects" \
    -d "$(jq -nc --arg n "$PROJECT_SENTINEL" '{name:$n}')" \
    | jq -r '.data.id')
  [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ] || die "could not create default project"
else
  echo "   $PROJECT_SENTINEL exists ($PROJECT_ID)"
fi

say "Seed complete."
echo "   area   $AREA_SENTINEL    → $AREA_ID"
echo "   project $PROJECT_SENTINEL → $PROJECT_ID"
echo "   (Specs resolve these by sentinel NAME at runtime, never by these IDs.)"
