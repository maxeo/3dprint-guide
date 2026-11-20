// Supporto Muro Tablet T65: il supporto si smonta seguendo i passaggi della guida (viti, cornice, tablet, metà) e si rimonta.
window.SCENA = {
  yaw: -0.5, pitch: 0.25, swing: 0.35, zoom: 1.1,
  pose(t, P) {
    P.disassemble(t, P.steps(s => !s.anim), 1.2);
  },
};
