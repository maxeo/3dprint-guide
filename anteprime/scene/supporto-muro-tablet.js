// Supporto Muro Tablet T65, in verticale come sul muro: il fondo (P01) e le sue viti restano fermi. Si smonta come
// nella realtà: escono le due viti da sotto, la cornice col tablet si stacca in avanti, il tablet esce dal retro della
// cornice, le viti dei giunti escono dal retro e le due metà si separano; poi si rimonta all'inverso.
// Coordinate della guida: z esce dal muro, y in alto sul muro. Qui il muro diventa verticale: (x, y, z) -> (x, -z, y),
// quindi "avanti" (fuori dal muro) è -y e "giù" è -z.
window.SCENA = {
  yaw: -1.0, pitch: 0.22, swing: 0.2, zoom: 1.05,
  pose(t, P) {
    const muro = v => [v[0], -v[2], v[1]];
    for (const p of P.parts()) { P.alone(p.id); P.xf(p.id, muro) }
    const n = 5, k = i => P.seq(t, i, n);
    const TAB = ['TAB1', 'TAB2', 'TAB3', 'TAB4'], CORNICE = ['P02', 'P03', 'V1', 'V2'];
    for (const id of ['V3', 'V4']) P.move(id, [0, 0, -30 * k(0)]);                 // viti da sotto, verso il basso
    for (const id of CORNICE.concat(TAB)) P.move(id, [0, -90 * k(1), 0]);         // cornice e tablet in avanti
    for (const id of ['V3', 'V4']) P.move(id, [0, -90 * k(1), 0]);                // le viti restano allineate alla cornice
    for (const id of TAB) P.move(id, [0, 45 * k(2), 0]);                          // tablet fuori dal retro
    for (const id of ['V1', 'V2']) P.move(id, [0, 18 * k(3), 0]);                 // viti dei giunti, dal retro
    P.move('P02', [-35 * k(4), 0, 0]); P.move('P03', [35 * k(4), 0, 0]);           // metà che si separano
    P.move('V1', [35 * k(4), 0, 0]); P.move('V2', [35 * k(4), 0, 0]);             // le viti stanno nella metà destra
  },
};
