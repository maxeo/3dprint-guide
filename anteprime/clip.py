"""Clip in loop per le card dell'indice: rende i fotogrammi con la vista 3D della guida (Chrome headless) e li monta con ffmpeg.

Uso (dalla cartella del repo):
  python anteprime/clip.py <slug> [<slug> ...]        es. python anteprime/clip.py stand-ps5 palline
  python anteprime/clip.py --tutte

Per ogni slug legge <slug>/guida.html e anteprime/scene/<slug>.js e scrive:
  anteprime/<slug>.mp4   clip di 5 s, 800 × 500, 24 fotogrammi al secondo
  anteprime/<slug>.jpg   primo fotogramma: l'immagine ferma della card (uguale all'inizio della clip)
"""
import base64
import glob
import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.expanduser('~/.claude/skills/guida-stampa-3d/scripts'))
from shoot import browser  # noqa: E402

QUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(QUI)
W, H, SCALA, FPS, SECONDI = 800, 500, 2, 24, 5

FIT = 'fit=Math.min(width*.86/(x1-x0||1),height*.84/(y1-y0||1))*zoom}'
FIT_CLIP = ('fit=Math.min(width*.86/(x1-x0||1),height*.84/(y1-y0||1))*zoom;'
            'if(window.CLIP){CLIP.b=[x0,x1,y0,y1];if(CLIP.boundsOnly)throw "b";if(CLIP.lock){const L=CLIP.lock;'
            'shift=[width/2-(L[0]+L[1])/2,height/2-(L[2]+L[3])/2];fit=Math.min(width*.86/(L[1]-L[0]),height*.84/(L[3]-L[2]))*zoom}}}')
STILE = ('<style>header,nav,section,footer,.sidebar,.viewbar,.viewcaption,.view-hint,#jsError{display:none!important}'
         '.workspace{display:block}main{max-width:none;padding:0}.canvas-wrap{height:%dpx}.viewer{border-radius:0;border:0}'
         'body{margin:0}</style>' % H)


def clip(slug):
    guida = os.path.join(REPO, slug, 'guida.html')
    html = open(guida, encoding='utf-8').read()
    assert html.count(FIT) == 1, 'motore di disegno diverso da quello atteso in ' + guida
    html = html.replace(FIT, FIT_CLIP)
    js = open(os.path.join(QUI, 'clip.js'), encoding='utf-8').read()
    scena = open(os.path.join(QUI, 'scene', slug + '.js'), encoding='utf-8').read()
    n = FPS * SECONDI
    avvio = ("<script>%s\n%s\naddEventListener('load',()=>setTimeout(()=>{try{resize();CLIP.run(%d)}"
             "catch(e){document.body.dataset.error=String(e&&e.stack||e)}document.body.dataset.shot='ok'},900))</script>"
             % (js, scena, n))
    tmp = tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8', dir=os.path.dirname(guida))
    tmp.write(html.replace('</body>', STILE + avvio + '</body>'))
    tmp.close()
    cmd = [browser(), '--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=60000',
           '--force-device-scale-factor=%d' % SCALA, '--window-size=%d,%d' % (W, H), '--dump-dom',
           'file:///' + tmp.name.replace('\\', '/')]
    try:
        dom = subprocess.run(cmd, capture_output=True, timeout=1800, text=True, encoding='utf-8', errors='ignore').stdout
    finally:
        os.remove(tmp.name)
    if 'data-error="' in dom:
        sys.exit(slug + ': errore JavaScript: ' + dom.split('data-error="', 1)[1].split('"', 1)[0][:800])
    if 'data-note="' in dom:
        print('  nota:', dom.split('data-note="', 1)[1].split('"', 1)[0])
    frames = dom.split('<pre class="clipframe">data:image/jpeg;base64,')[1:]
    if len(frames) != n:
        sys.exit('%s: %d fotogrammi invece di %d' % (slug, len(frames), n))
    cart = tempfile.mkdtemp()
    try:
        for i, f in enumerate(frames):
            with open(os.path.join(cart, 'f%04d.jpg' % i), 'wb') as o:
                o.write(base64.b64decode(f.split('<', 1)[0]))
        scala = 'scale=%d:%d:flags=lanczos' % (W, H)
        mp4, jpg = os.path.join(QUI, slug + '.mp4'), os.path.join(QUI, slug + '.jpg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(cart, 'f%04d.jpg'),
                        '-vf', scala, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', '-an', mp4], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(cart, 'f0000.jpg'), '-vf', scala,
                        '-q:v', '3', jpg], check=True)
        if '--fotogrammi' in sys.argv:          # copia dei fotogrammi per controllarli a occhio
            dest = os.path.join(tempfile.gettempdir(), 'clip_' + slug)
            shutil.rmtree(dest, ignore_errors=True)
            shutil.copytree(cart, dest)
            print('  fotogrammi in', dest)
    finally:
        shutil.rmtree(cart, ignore_errors=True)
    print('%s: %s (%d kB), %s' % (slug, os.path.relpath(mp4, REPO), os.path.getsize(mp4) // 1024, os.path.relpath(jpg, REPO)))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    slugs = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--tutte' in sys.argv:
        slugs = sorted(os.path.basename(f)[:-3] for f in glob.glob(os.path.join(QUI, 'scene', '*.js')))
    if not slugs:
        print(__doc__)
        sys.exit(1)
    for s in slugs:
        clip(s)


if __name__ == '__main__':
    main()
