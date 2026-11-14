// Sakura: i sei moduli si staccano seguendo il montaggio (riga alta, riga centrale, poi le coppie) e tornano
window.SCENA = {
  yaw: -0.5, pitch: 0.85, swing: 0.18, zoom: 1.25,
  pose(t, P) { P.disassemble(t, P.steps(), 1.4) },
};
