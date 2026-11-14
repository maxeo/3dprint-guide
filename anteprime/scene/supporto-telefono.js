// Supporto Telefono senza prolunghe (la slitta direttamente nella guaina). La cerniera bassa scatta di 10° alla volta:
// in avanti (verso chi guarda, sopra la base) fino a 30°, poi indietro fino a uno scatto oltre il dritto, la posa d'uso
// della guida. La cerniera alta tiene il telefono alla stessa inclinazione; col braccio in avanti il piatto si reclina e la slitta sfila.
// Il baricentro del telefono deve restare sopra la base: clip.py stampa dove arriva.
window.SCENA = {
  yaw: -0.9, pitch: 0.3, swing: 0.2, zoom: 1.0,
  pose(t, P) {
    const deg = Math.PI / 180;
    // la guida si apre nella sua configurazione predefinita (oggi una prolunga): la slitta senza prolunghe parte
    // da z 53, quindi quello che sta sopra scende di quanto la slitta è più in alto
    const S = Math.min(...P.orig(P.parts().find(p => p.id === 'P03')).map(v => v[2])), GIU = S - 53;
    for (const id of ['P07', 'P07·2', 'P07·3', 'P11·2', 'P12·2', 'P11·3', 'P12·3', 'P11·4', 'P12·4']) { P.alone(id); P.hide(id) }
    const BASE = [30, 17.5], TESTA = [30, 149.5];           // assi delle cerniere (x, z) senza prolunghe
    // braccio: + in avanti; scatti di 10° come i denti della cerniera bassa
    const libero = 30 * P.seq(t, 0, 3) - 40 * P.seq(t, 2, 3), n = Math.floor(libero / 10), f = libero / 10 - n;
    const a = 10 * (n + P.ease(P.clamp((f - .2) / .6))) * deg;
    // piatto indietro sulla cerniera alta (a frizione), solo col braccio in avanti: col braccio indietro il
    // telefono reclinato porterebbe il baricentro fuori dalla base
    const reclina = 20 * P.seq(t, 1, 3) * P.clamp(a / (30 * deg)) * deg;
    const E = 20 * P.seq(t, 1, 3);                          // sfilo della slitta: da 20 a 40 mm
    const braccio = P.rotY(BASE[0], BASE[1], -a);           // rotY positivo porta la cima verso -X (indietro)
    const su = d => v => [v[0], v[1], v[2] + d];
    for (const id of ['P02', 'P11', 'P12']) { P.alone(id); P.xf(id, braccio) }
    P.alone('P03'); P.xf('P03', su(E - GIU)); P.xf('P03', braccio);
    // piatto e quello che porta: scende al posto della slitta, gira sulla cerniera alta (compensa il braccio e
    // reclina), poi col braccio
    const testa = P.rotY(TESTA[0], TESTA[1] + E, a - reclina);
    const piatto = ['P04', 'P05', 'P09', 'P10', 'P08B', 'P06B', 'RIF_Cavo_Spina_prolunghe',
                    'RIF_Telefono_prolunghe', 'RIF_Telefono_Schermo_prolunghe', 'RIF_Telefono_Tasti_prolunghe'];
    for (const id of piatto) { P.alone(id); P.xf(id, su(E - GIU)); P.xf(id, testa); P.xf(id, braccio) }
    // il cavo sale dal tavolo lungo il braccio: si accorcia e gira solo il tratto sopra la cerniera bassa
    P.alone('RIF_Cavo_prolunghe');
    P.stretch('RIF_Cavo_prolunghe', 50, 375 - (353 - S), E - GIU);   // tratto che si allunga, già accorciato dalla guida
    P.xf('RIF_Cavo_prolunghe', v => v[2] > 35 ? braccio(v) : v);
    // controllo del baricentro del telefono (base da x 0 dietro a 185 davanti; piedini a 15 e 170)
    const tel = P.parts().find(p => p.id === 'RIF_Telefono_prolunghe');
    const V = P.orig(tel).map(su(E - GIU)).map(testa).map(braccio), x = V.reduce((s, v) => s + v[0], 0) / V.length;
    window._bx = [Math.min((window._bx || [1e9])[0], x), Math.max((window._bx || [0, -1e9])[1], x)];
    P.note('baricentro del telefono: x da ' + window._bx[0].toFixed(1) + ' a ' + window._bx[1].toFixed(1) + ' (base 0..185)');
  },
};
