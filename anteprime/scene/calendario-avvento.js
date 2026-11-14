// Calendario dell'Avvento: l'albero si smonta seguendo i passaggi della guida (bussolotti, palline, telai, corpi
// del nastro, tronco...) e si rimonta. I passaggi animati a fotogrammi (cioccolatini nel cassetto, «Ogni giorno")
// restano fermi: il cioccolatino del giorno sta sul tavolo, quelli del cassetto escono con il cassetto. Nei passaggi
// dei bussolotti la guida ne fa scendere uno solo: qui escono tutti (le copie del corpo seguono il pezzo C).
window.SCENA = {
  yaw: -0.8, pitch: 0.3, swing: 0.3, zoom: 1.1,
  pose(t, P) {
    const passi = P.steps(s => !s.anim).map(s => s.track ? Object.assign({}, s, { moving: s.parts }) : s);
    P.disassemble(t, passi, 2.4);
  },
};
