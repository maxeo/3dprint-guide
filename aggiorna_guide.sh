#!/usr/bin/env bash
# Copia guida.html di ogni progetto (e aggiorna la data nella sua scheda di index.html) e i file che la guida richiama (STL, SVG, PNG, testi, .blend).
# I file oltre 95 MB restano fuori: GitHub rifiuta i file sopra i 100 MB.
# Uso: ./aggiorna_guide.sh   (da D:\3D Print\3dprint-guide), poi commit e push.
set -euo pipefail
cd "$(dirname "$0")"

# cartella pubblicata : cartella del progetto in D:\3D Print
PROGETTI=(
  "sakura:Sakura"
  "supporto-tablet:Supporto per Tablet"
  "gattolavello:GattoLavello"
  "skinkocchiali:Modulo SkinkOcchiali"
  "organizer:Organizer Modulare"
)

for voce in "${PROGETTI[@]}"; do
  slug="${voce%%:*}"
  sorgente="../${voce#*:}"
  rm -rf "$slug"
  mkdir -p "$slug"
  cp "$sorgente/guida.html" "$slug/"
  grep -oE "[\"'\`][A-Za-z0-9_./ -]+\.(stl|svg|png|txt|md|json|blend)[\"'\`]" "$sorgente/guida.html" \
    | tr -d "\"'\`" | sort -u | while read -r file; do
      # nomi citati nella guida ma non file del progetto (es. file interni allo ZIP generato)
      [ -f "$sorgente/$file" ] || continue
      if [ "$(stat -c %s "$sorgente/$file")" -gt 99614720 ]; then
        echo "$slug: salto $file (oltre 95 MB)"; continue
      fi
      mkdir -p "$slug/$(dirname "$file")"
      cp "$sorgente/$file" "$slug/$file"
    done
  # misure dei pezzi nella scheda, per il pulsante Stampante dell'indice (richiede Node)
  dims="$(node dimensioni.js "$slug/guida.html")"
  sed -i -E "s|(data-slug=\"$slug\"[^>]*data-dims=\")[^\"]*|\1$dims|" index.html
  # data di ultimo aggiornamento nella scheda dell'indice: conta solo il contenuto dei file 3D
  # (STL/3MF), non testi o spostamenti. Per ogni file si cerca il commit in cui e' comparso
  # quel contenuto preciso; se ci sono file 3D modificati e non committati vale oggi.
  aggiornata=""
  while IFS= read -r f; do
    ogg="$(git -C "$sorgente" rev-parse "HEAD:$f" 2>/dev/null)" || continue
    d="$(git -C "$sorgente" log --all --format=%as --find-object="$ogg" | tail -n 1)"
    # file creato prima di essere committato: vale la sua data di modifica, se piu' vecchia
    m="$(date -r "$sorgente/$f" +%F 2>/dev/null || true)"
    if [ -n "$m" ] && [[ "$m" < "$d" ]]; then d="$m"; fi
    if [[ "$d" > "$aggiornata" ]]; then aggiornata="$d"; fi
  done < <(git -C "$sorgente" ls-files -- '*.stl' '*.3mf' 2>/dev/null)
  if [ -n "$(git -C "$sorgente" status --porcelain -- '*.stl' '*.3mf' 2>/dev/null)" ]; then aggiornata="$(date +%F)"; fi
  if [ -n "$aggiornata" ]; then
    sed -i -E "s|(data-slug=\"$slug\"[^>]*data-aggiornata=\")[0-9-]+|\1$aggiornata|" index.html
  fi
  # data di creazione: la piu' vecchia fra primo commit e file del progetto, esclusi i modelli
  # 3D di partenza in originale/ (sono scaricati o ricevuti, non l'inizio del lavoro)
  creata="$(git -C "$sorgente" log --reverse --format=%as 2>/dev/null | head -n 1 || true)"
  while IFS= read -r f; do
    case "$f" in originale/*.stl|originale/*.3mf|originale/*.obj) continue ;; esac
    m="$(date -r "$sorgente/$f" +%F 2>/dev/null || true)"
    if [ -n "$m" ] && { [ -z "$creata" ] || [[ "$m" < "$creata" ]]; }; then creata="$m"; fi
  done < <(git -C "$sorgente" ls-files 2>/dev/null)
  if [ -n "$creata" ]; then
    sed -i -E "s|(data-slug=\"$slug\"[^>]*data-creata=\")[0-9-]+|\1$creata|" index.html
  fi
  echo "$slug: $(find "$slug" -type f | wc -l) file, creata $creata, aggiornata $aggiornata"
done
# le anteprime dell'indice (anteprime/<slug>_montato.png, _esploso.png) si rifanno a mano
# con shoot.py della skill guida-stampa-3d quando il modello cambia
