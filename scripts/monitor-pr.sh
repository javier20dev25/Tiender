#!/bin/bash

# Uso: ./scripts/monitor-pr.sh <PR_NUMBER>
# Ejemplo: ./scripts/monitor-pr.sh 1

PR_NUMBER=$1
REPO="javier20dev25/Tiender"

if [ -z "$PR_NUMBER" ]; then
  echo "Error: Proporciona el número del PR."
  exit 1
fi

echo "Monitoreando PR #$PR_NUMBER en GitHub y Vercel..."

# Chequear status del PR con gh
PR_STATUS=$(gh pr view $PR_NUMBER --json state,mergeable,headRefName --jq '{state: .state, mergeable: .mergeable, branch: .headRefName}')
echo "Status del PR:"
echo "$PR_STATUS" | jq

# Chequear checks/tests del PR
echo "Checks del PR:"
gh pr checks $PR_NUMBER

# Encontrar URL de preview de Vercel desde comentarios del PR
echo "Buscando URL de preview de Vercel..."
COMMENTS=$(gh api repos/$REPO/issues/$PR_NUMBER/comments)
VERCEL_URL=$(echo "$COMMENTS" | jq -r '.[] | select(.user.login == "vercel[bot]") | .body' | grep -o 'https://[^ ]*vercel.app' | head -1)

if [ -z "$VERCEL_URL" ]; then
  echo "No se encontró URL de preview de Vercel. Asegúrate de que la integración esté activa."
  exit 1
fi

echo "URL de preview encontrada: $VERCEL_URL"

# Pollear status del deployment en Vercel (espera hasta READY o ERROR, max 10 mins)
echo "Esperando build de Vercel (polling cada 30s)..."
MAX_ATTEMPTS=20  # ~10 mins
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(vercel inspect $VERCEL_URL --output json | jq -r '.readyState')
  echo "Status actual: $STATUS"
  if [ "$STATUS" = "READY" ] || [ "$STATUS" = "ERROR" ]; then
    break
  fi
  sleep 30
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$STATUS" = "READY" ]; then
  echo "¡Build exitoso! Preview lista en $VERCEL_URL"
elif [ "$STATUS" = "ERROR" ]; then
  echo "Error en build. Logs: $(vercel logs $VERCEL_URL)"
  exit 1
else
  echo "Timeout: Build no completó en 10 mins."
  exit 1
fi

echo "Visión unificada: PR listo para review/merge si checks pasan. No errores detectados."
