// Stand Controller PS5: lo stand in uso; cuffie, controller, penne, telecomando e FreeBuds escono e tornano al loro posto
window.SCENA = {
  yaw: 2.45, pitch: 0.3, swing: 0.45, zoom: 1.1,
  pose(t, P) {
    // [inizio del nome, spostamento]: ogni oggetto esce nella direzione da cui si mette sullo stand
    const gruppi = [['Cuffie', [35, 0, 45]], ['Controller DualSense', [0, 0, 50]], ['Penna', [0, 0, 45]],
                    ['Telecomando', [0, 0, 45]], ['Custodia FreeBuds 3', [0, 0, 40]]];
    const acc = P.parts().filter(p => p.acc);
    gruppi.forEach(([nome, v], i) => {
      const k = P.seq(t, i, gruppi.length);
      for (const p of acc) if (p.label.startsWith(nome)) P.move(p.id, v.map(x => x * k));
    });
  },
};
