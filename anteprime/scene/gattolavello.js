// GattoLavello: si smonta seguendo i passaggi della guida (ripiano, grate, testa del gatto, vasche) e si rimonta
window.SCENA = {
  yaw: -0.65, pitch: 0.42, swing: 0.25, zoom: 1.15,
  pose(t, P) { P.disassemble(t, P.steps(), 1.5) },
};
