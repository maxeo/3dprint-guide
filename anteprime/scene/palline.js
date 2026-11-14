// Palline Traforate: le palline a vite si svitano a onda (la metà sopra gira e sale) e si riavvitano
window.SCENA = {
  yaw: -0.3, pitch: 0.75, swing: 0.15, zoom: 1.1,
  pose(t, P) {
    const sopra = P.parts().filter(p => /^P\d+A$/.test(p.id)).sort((a, b) => (P.box0(b)[1] - P.box0(a)[1]) || (P.box0(a)[0] - P.box0(b)[0]));
    sopra.forEach((p, i) => {
      const k = P.seq(t, i, sopra.length), b = P.box0(p), c = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2];
      P.rot(p.id, c, -2 * Math.PI * 1.5 * k);          // un giro e mezzo per svitare
      P.move(p.id, [0, 0, 22 * k]);
    });
  },
};
