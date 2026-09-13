#!/usr/bin/env bash
# Copia guida.html di ogni progetto e i file che la guida richiama (STL, SVG, testi, .blend).
# Uso: ./aggiorna_guide.sh   (da D:\3D Print\3dprint-guide), poi commit e push.
set -euo pipefail
cd "$(dirname "$0")"

# cartella pubblicata : cartella del progetto in D:\3D Print
PROGETTI=(
  "sakura:Sakura"
  "supporto-tablet:Supporto per Tablet"
)

for voce in "${PROGETTI[@]}"; do
  slug="${voce%%:*}"
  sorgente="../${voce#*:}"
  rm -rf "$slug"
  mkdir -p "$slug"
  cp "$sorgente/guida.html" "$slug/"
  grep -oE "[\"'\`][A-Za-z0-9_./ -]+\.(stl|svg|txt|md|json|blend)[\"'\`]" "$sorgente/guida.html" \
    | tr -d "\"'\`" | sort -u | while read -r file; do
      mkdir -p "$slug/$(dirname "$file")"
      cp "$sorgente/$file" "$slug/$file"
    done
  echo "$slug: $(find "$slug" -type f | wc -l) file"
done
