"""WebP animata per il README del profilo GitHub (maxeo/maxeo, assets/guide-3d.webp): le clip dell'indice in sequenza.

Uso (dalla cartella del repo):  python anteprime/profilo_webp.py <file .webp da scrivere>

Stesso disegno della vecchia card SVG (titolo, vista, elenco dei progetti con quello attivo evidenziato e la barra
che avanza), ma come immagine animata vera: il browser la decodifica come un video, quindi gira fluida, e mostra i
fotogrammi man mano che arrivano (il primo fa da immagine ferma mentre il resto si scarica).
"""
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

QUI = os.path.dirname(os.path.abspath(__file__))
# ordine e nomi come nell'indice (dal più recente); etichetta = quella della card
PROGETTI = [("calendario-avvento", "Calendario dell'Avvento", "Si smonta e si rimonta"),
            ("supporto-telefono", "Supporto per telefono", "Cerniere a scatti"),
            ("palline", "Palline traforate", "Si svitano"),
            ("stand-ps5", "Stand controller PS5", "In uso"),
            ("organizer", "Organizer modulare", "Moduli impilabili"),
            ("gattolavello", "GattoLavello", "Si smonta e si rimonta"),
            ("skinkocchiali", "SkinkOcchiali", "Vassoio che si solleva"),
            ("sakura", "Sakura", "Moduli a incastro"),
            ("supporto-tablet", "Supporto per tablet", "Si smonta e si rimonta")]
SLOT, FPS = 5.0, 12                   # secondi per progetto (= durata della clip), fotogrammi al secondo
S = 0.6                               # scala rispetto al disegno 944 × 600: la card nel profilo è piccola
X, Y, W, H = 48, 150, 600, 381        # riquadro della vista (coordinate del disegno)
QUALITA = 65
FONT = r"C:\Windows\Fonts\segoeui.ttf"
FONT_B = r"C:\Windows\Fonts\segoeuib.ttf"
ROSA, CHIARO, SPENTO, FONDO, VISTA = "#e38bab", "#f1eaed", "#8a7f84", "#161214", "#1f191c"


def s(v):
    return round(v * S)


def font(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT, s(size))


def fotogrammi(slug, cart):
    """Fotogrammi della clip a FPS, già ritagliati e scalati sul riquadro della vista."""
    out = os.path.join(cart, slug)
    os.makedirs(out)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(QUI, slug + '.mp4'),
                    '-vf', 'fps=%d,scale=%d:%d:force_original_aspect_ratio=increase:flags=lanczos,crop=%d:%d'
                    % (FPS, s(W), s(H), s(W), s(H)), os.path.join(out, 'f%03d.png')], check=True)
    return [Image.open(os.path.join(out, f)).convert('RGB') for f in sorted(os.listdir(out))]


def fondo():
    img = Image.new('RGB', (s(944), s(600)), FONDO)
    d = ImageDraw.Draw(img)
    x = s(48)
    for ch in "MAXEO · STAMPA 3D":                  # spaziatura delle lettere
        d.text((x, s(62)), ch, font=font(18), fill=ROSA, anchor='ls')
        x += d.textlength(ch, font=font(18)) + s(2)
    d.text((s(48), s(114)), "Guide di stampa 3D", font=font(46), fill=CHIARO, anchor='ls')
    d.rounded_rectangle((s(X), s(Y), s(X + W), s(Y + H)), s(16), fill=VISTA)
    d.text((s(48), s(568)), "Modello 3D da ruotare, esplodere e ispezionare pezzo per pezzo", font=font(19, False),
           fill="#b9adb2", anchor='ls')
    return img


def main():
    dest = sys.argv[1]
    base = fondo()
    maschera = Image.new('L', (s(W), s(H)), 0)
    ImageDraw.Draw(maschera).rounded_rectangle((0, 0, s(W) - 1, s(H) - 1), s(16), fill=255)
    n = len(PROGETTI)
    passo_y = (507 - 174) / (n - 1)
    per = int(SLOT * FPS)
    cart = tempfile.mkdtemp()
    out = []
    try:
        for i, (slug, _, etichetta) in enumerate(PROGETTI):
            clip = fotogrammi(slug, cart)
            for k in range(per):
                img = base.copy()
                img.paste(clip[min(k, len(clip) - 1)], (s(X), s(Y)), maschera)
                d = ImageDraw.Draw(img, 'RGBA')
                w = 22 + 9.6 * len(etichetta)       # etichetta in alto a sinistra nella vista
                d.rounded_rectangle((s(66), s(168), s(66 + w), s(200)), s(16), fill=(0, 0, 0, 191))
                d.text((s(66 + w / 2), s(190)), etichetta, font=font(17), fill=CHIARO, anchor='ms')
                for j, (_, nome, _) in enumerate(PROGETTI):   # elenco: attivo chiaro con la barra che avanza
                    y = 174 + j * passo_y
                    d.text((s(680), s(y)), nome, font=font(20), fill=CHIARO if j == i else SPENTO, anchor='ls')
                    d.rounded_rectangle((s(680), s(y + 9), s(916), s(y + 12)), s(1.5), fill="#2e2529")
                    if j == i:
                        d.rounded_rectangle((s(680), s(y + 9), s(680 + 236 * (k + 1) / per), s(y + 12)), s(1.5), fill=ROSA)
                out.append(img)
    finally:
        shutil.rmtree(cart, ignore_errors=True)
    out[0].save(dest, save_all=True, append_images=out[1:], duration=round(1000 / FPS), loop=0,
                quality=QUALITA, method=4, minimize_size=True, allow_mixed=True)
    print(dest, len(out), 'fotogrammi', os.path.getsize(dest) // 1024, 'kB')


if __name__ == '__main__':
    main()
