#!/usr/bin/env bash
# Fails if a direct dependency's locked version is deprecated on npm (allowlist excepted).
set -euo pipefail
allow="scripts/deprecated-allowlist.txt"
fail=0
for name in $(jq -r '(.dependencies//{}),(.devDependencies//{}) | keys[]' package.json); do
  ver=$(jq -r --arg n "node_modules/$name" '.packages[$n].version // empty' package-lock.json)
  [ -z "$ver" ] && continue
  msg=$(npm view "$name@$ver" deprecated 2>/dev/null || true)
  if [ -n "$msg" ] && ! grep -qx "$name" "$allow" 2>/dev/null; then
    echo "DEPRECATED $name@$ver: $msg"; fail=1
  fi
done
exit $fail
