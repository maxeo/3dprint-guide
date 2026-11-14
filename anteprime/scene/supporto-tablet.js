// Supporto per tablet: si smonta seguendo i passaggi (appoggi, schienale, gambe) e si rimonta
window.SCENA = {
  yaw: -0.58, pitch: 0.5, swing: 0.25, zoom: 1.0,
  pose(t, P) { P.disassemble(t, P.steps(), 0.7) },
};
