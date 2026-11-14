// Calendario dell'Avvento: l'albero si smonta seguendo i passaggi della guida (bussolotti, palline, telai, corpi
// del nastro, tronco...) e si rimonta
window.SCENA = {
  yaw: -0.8, pitch: 0.3, swing: 0.3, zoom: 1.1,
  pose(t, P) { P.disassemble(t, P.steps(), 2.4) },
};
