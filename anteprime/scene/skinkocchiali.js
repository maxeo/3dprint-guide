// SkinkOcchiali: il vassoio dei patch si solleva, poi il porta patch esce dal modulo; tornano giù in ordine inverso
window.SCENA = {
  yaw: -0.5, pitch: 0.35, swing: 0.3, zoom: 1.05,
  pose(t, P) {
    P.move('P05', [0, 0, 25 * P.seq(t, 0, 3)]);
    P.move('P05', [0, 0, 45 * P.seq(t, 1, 3)]);
    P.move('P04', [0, 0, 45 * P.seq(t, 1, 3)]);
    P.move('P06', [0, -45 * P.seq(t, 2, 3), 0]);
  },
};
