"""SVG animato per il README del profilo GitHub (maxeo/maxeo, assets/guide-3d-10p.svg; nome nuovo a ogni giro se GitHub tiene in cache quello vecchio): le clip dell'indice in sequenza.

Uso (dalla cartella del repo):  python anteprime/profilo_svg.py <file .svg da scrivere>

Per ogni progetto prende FOTOGRAMMI immagini da anteprime/<slug>.mp4 e le fa scorrere come un flipbook (solo CSS:
GitHub mostra gli SVG come immagini, senza script). A destra l'elenco dei progetti con quello attivo evidenziato.
"""
import base64
import os
import subprocess
import sys
import tempfile

QUI = os.path.dirname(os.path.abspath(__file__))
# ordine e nomi come nell'indice (dal più recente); etichetta = quella della card
PROGETTI = [("supporto-muro-tablet", "Tablet a muro", "Si smonta e si rimonta"),
            ("calendario-avvento", "Calendario dell'Avvento", "Si smonta e si rimonta"),
            ("supporto-telefono", "Supporto per telefono", "Cerniere a scatti"),
            ("palline", "Palline traforate", "Si svitano"),
            ("stand-ps5", "Stand controller PS5", "In uso"),
            ("organizer", "Organizer modulare", "Moduli impilabili"),
            ("gattolavello", "GattoLavello", "Si smonta e si rimonta"),
            ("skinkocchiali", "SkinkOcchiali", "Vassoio che si solleva"),
            ("sakura", "Sakura", "Moduli a incastro"),
            ("supporto-tablet", "Supporto per tablet", "Si smonta e si rimonta")]
SLOT, FOTOGRAMMI = 5.0, 30            # secondi per progetto (= durata della clip), immagini per progetto (6 al secondo)
LARGHEZZA_JPG = 480                   # fotogrammi più piccoli della vista: la card nel profilo è piccola e il file resta leggero
X, Y, W, H = 48, 150, 600, 381        # riquadro della vista


def fotogrammi(slug):
    cart = tempfile.mkdtemp()
    passo = 120 // FOTOGRAMMI
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(QUI, slug + '.mp4'),
                    '-vf', "select='not(mod(n\\,%d))',scale=%d:-2" % (passo, LARGHEZZA_JPG), '-fps_mode', 'vfr', '-q:v', '8',
                    os.path.join(cart, 'f%02d.jpg')], check=True)
    out = []
    for i in range(1, FOTOGRAMMI + 1):
        with open(os.path.join(cart, 'f%02d.jpg' % i), 'rb') as f:
            out.append(base64.b64encode(f.read()).decode())
        os.remove(os.path.join(cart, 'f%02d.jpg' % i))
    os.rmdir(cart)
    return out


def main():
    dest = sys.argv[1]
    n, tot = len(PROGETTI), SLOT * len(PROGETTI)
    q = 100 / n                                             # percentuale del ciclo per progetto
    df = SLOT / FOTOGRAMMI
    css = f""".p{{opacity:0;animation:p {tot:g}s linear infinite}}
@keyframes p{{0%{{opacity:0}}.6%,{q - .6:.2f}%{{opacity:1}}{q:.2f}%,100%{{opacity:0}}}}
.f{{opacity:0;animation:f {SLOT:g}s step-end infinite}}
@keyframes f{{0%{{opacity:1}}{100 / FOTOGRAMMI:.3f}%,100%{{opacity:0}}}}
.l{{fill:#8a7f84;animation:l {tot:g}s linear infinite}}
@keyframes l{{0%,{q:.2f}%{{fill:#f1eaed}}{q + .01:.2f}%,100%{{fill:#8a7f84}}}}
.b{{animation:b {tot:g}s linear infinite}}
@keyframes b{{0%{{width:0}}{q:.2f}%{{width:236px}}{q + .01:.2f}%,100%{{width:0}}}}
@media (prefers-reduced-motion:reduce){{.p,.f,.l,.b{{animation:none}}.d0,.d0 .f0{{opacity:1}}}}
text{{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}"""
    nomi = ', '.join(nome for _, nome, _ in PROGETTI)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 944 600" role="img" '
         f'aria-label="Guide di stampa 3D, un progetto alla volta in movimento: {nomi}">',
         f'<style>\n{css}</style>',
         f'<defs><clipPath id="c"><rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="16"/></clipPath></defs>',
         '<rect width="944" height="600" fill="#161214"/>',
         '<text x="48" y="62" font-size="18" font-weight="700" letter-spacing="2" fill="#e38bab">MAXEO · STAMPA 3D</text>',
         '<text x="48" y="114" font-size="46" font-weight="700" fill="#f1eaed">Guide di stampa 3D</text>',
         f'<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="16" fill="#1f191c"/>',
         '<g clip-path="url(#c)">']
    for i, (slug, nome, etichetta) in enumerate(PROGETTI):
        rit = (tot - i * SLOT) % tot
        st = f' style="animation-delay:-{rit:g}s"' if rit else ''
        s.append(f'<g class="p d{i}"{st}>')
        for k, b64 in enumerate(fotogrammi(slug)):
            fr = (SLOT - k * df) % SLOT                    # ogni immagine si vede per SLOT/FOTOGRAMMI, in ordine
            s.append(f'<image class="f f{k}" style="animation-delay:-{fr:.3f}s" x="{X}" y="{Y}" width="{W}" height="{H}" '
                     f'preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,{b64}"/>')
        w = 22 + 9.6 * len(etichetta)
        s.append(f'<g font-size="17" font-weight="700"><rect x="66" y="168" width="{w:.0f}" height="32" rx="16" fill="#000" opacity=".75"/>'
                 f'<text x="{66 + w / 2:.0f}" y="190" text-anchor="middle" fill="#f1eaed">{etichetta}</text></g>')
        s.append('</g>')
    s.append('</g>')
    passo_y = (507 - 174) / (n - 1)
    for i, (slug, nome, _) in enumerate(PROGETTI):
        rit = (tot - i * SLOT) % tot
        st = f' style="animation-delay:-{rit:g}s"' if rit else ''
        y = 174 + i * passo_y
        s += [f'<text class="l"{st} x="680" y="{y:.0f}" font-size="20" font-weight="700">{nome.replace("&", "&amp;")}</text>',
              f'<rect x="680" y="{y + 9:.0f}" width="236" height="3" rx="1.5" fill="#2e2529"/>',
              f'<rect class="b"{st} x="680" y="{y + 9:.0f}" width="0" height="3" rx="1.5" fill="#e38bab"/>']
    s.append('<text x="48" y="568" font-size="19" fill="#b9adb2">Modello 3D da ruotare, esplodere e ispezionare pezzo per pezzo</text>')
    s.append('</svg>')
    open(dest, 'w', encoding='utf-8', newline='\n').write('\n'.join(s))
    print(dest, os.path.getsize(dest) // 1024, 'kB')


if __name__ == '__main__':
    main()
