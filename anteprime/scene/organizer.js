// Organizer modulare: tre moduli impilati; i due sopra si sollevano, si apre il cassetto del primo, poi tutto torna
window.SCENA = {
  yaw: -0.66, pitch: 0.42, swing: 0.25, zoom: 1.1,
  setup(P) {
    const base = P.parts().slice();
    for (const L of [2, 3]) for (const p of base) P.copyPart(p, [0, 0, 112 * (L - 1)], 'L' + L);
  },
  pose(t, P) {
    const k3 = P.seq(t, 0, 3), k2 = P.seq(t, 1, 3), kc = P.seq(t, 2, 3);
    P.move('#L3', [0, 0, 150 * k3 + 75 * k2]);
    P.move('#L2', [0, 0, 75 * k2]);
    for (const id of ['C01', 'D01', 'R01', 'R02']) P.move(id, [0, -120 * kc, 0]);
  },
};
