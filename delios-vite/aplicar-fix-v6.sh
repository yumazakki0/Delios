#!/usr/bin/env bash
set -euo pipefail

# Confere as rotas reconhecidas pela Vercel antes da limpeza.
for arquivo in \
  api/_lib/firebase-admin.ts \
  api/_lib/http.ts \
  api/_lib/triage.ts \
  api/admin/import-students.ts \
  api/admin/reveal-identity.ts \
  api/student/activate.ts \
  api/student/submit-report.ts
do
  if [[ ! -f "$arquivo" ]]; then
    echo "Arquivo ausente: $arquivo"
    echo "Extraia o ZIP na raiz do projeto delios-vite e tente novamente."
    exit 1
  fi
done

rm -f \
  api/package.json \
  api/_lib/firebase-admin.cts \
  api/_lib/http.cts \
  api/_lib/triage.cts \
  api/admin/import-students.cts \
  api/admin/reveal-identity.cts \
  api/student/activate.cts \
  api/student/submit-report.cts

npm run build

echo "Fix aplicado e build validado. Agora execute: git add -A && git commit && git push"
