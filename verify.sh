#!/usr/bin/env bash
# Verification gate before claiming a task "done" -- see ~/.claude/CLAUDE.md's
# "Verify Before Claiming Done" rule. Run from the repo root.
set -uo pipefail

FAIL=0

echo "== git: working tree clean? =="
if [ -n "$(git status --short)" ]; then
  echo "FAIL: uncommitted changes present"
  git status --short
  FAIL=1
else
  echo "OK"
fi

echo
echo "== git: latest commit pushed to origin? =="
git fetch origin --quiet 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u} 2>/dev/null)
if [ -z "$REMOTE" ]; then
  echo "SKIP: no upstream tracking branch configured"
elif [ "$LOCAL" != "$REMOTE" ]; then
  echo "FAIL: HEAD ($LOCAL) differs from upstream ($REMOTE) -- not pushed"
  FAIL=1
else
  echo "OK: HEAD matches origin"
fi

echo
echo "== typecheck (informational -- not blocking, ~700 pre-existing errors as of 2026-08-15) =="
TSC_OUT=$(npx tsc --noEmit 2>&1)
TSC_COUNT=$(echo "$TSC_OUT" | grep -c ": error TS")
echo "$TSC_COUNT type error(s)"
if [ "$TSC_COUNT" -gt 0 ]; then
  echo "(not blocking verify -- run 'npx tsc --noEmit' directly to see them; this repo has known pre-existing debt, see git log for '196fa9b')"
fi

echo
if [ "$FAIL" -eq 1 ]; then
  echo "VERIFY FAILED"
  exit 1
else
  echo "VERIFY PASSED (git checks only -- typecheck is informational, jest is not wired in yet)"
  exit 0
fi
