// Motore delle clip dell'indice: gira dentro una guida (vista 3D della skill guida-stampa-3d) caricata in Chrome headless.
// clip.py inietta questo file, la scena del progetto (scene/<slug>.js, che assegna window.SCENA) e lancia CLIP.run(n).
// Ogni fotogramma: la scena dice dove stanno i pezzi al tempo t (0..1, la clip gira in loop), il motore disegna e salva.
(function () {
  const C = window.CLIP = { b: null, lock: null, boundsOnly: false };
  const POSE = new Map();          // id del pezzo, id della copia o "#etichetta" -> {o, hide, rot, stretch, alone}
  const ORIG = new Map();          // vertici e normali originali dei pezzi che la scena deforma
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => (v = clamp(v), v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

  // Tempi comuni a tutte le clip: fermo sul montato, gli elementi escono uno dopo l'altro, pausa, rientrano
  // in ordine inverso, fermo sul montato. Il primo fotogramma è anche l'immagine della card.
  const T = { outA: .10, outB: .42, inA: .56, inB: .88, w: .16 };
  function seq(t, i, n) {
    const span = T.outB - T.outA, w = Math.min(T.w, span), d = n > 1 ? (span - w) / (n - 1) : 0;
    const k1 = ease((t - (T.outA + i * d)) / w), k2 = ease((t - (T.inA + (n - 1 - i) * d)) / w);
    return k1 * (1 - k2);
  }

  const add = (k, q) => { const p = POSE.get(k) || {}; if (q.o) p.o = (p.o || [0, 0, 0]).map((v, i) => v + q.o[i]); Object.assign(p, q, { o: p.o }); POSE.set(k, p) };
  const P = {
    seq, ease, clamp,
    move: (id, v) => add(id, { o: v }),
    hide: id => add(id, { hide: true }),
    alone: id => add(id, { alone: true }),            // la copia non segue più il pezzo principale
    rot: (id, c, ang) => add(id, { rot: { c, ang } }),           // rotazione attorno all'asse verticale per c
    stretch: (id, z0, z1, dz) => add(id, { stretch: { z0, z1, dz } }),
    // trasformazione qualsiasi dei vertici, applicata dopo stretch e rot (più chiamate: in ordine)
    xf: (id, f) => { const p = POSE.get(id) || {}; (p.fns = p.fns || []).push(f); POSE.set(id, p) },
    // rotazione di ang (radianti) attorno all'asse parallelo a Y che passa per (cx, cz): x verso z positivo
    rotY: (cx, cz, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return v => { const x = v[0] - cx, z = v[2] - cz; return [cx + x * c - z * s, v[1], cz + x * s + z * c] } },
    note: v => { document.body.dataset.note = String(v) },
    orig: p => (ORIG.get(p) || {}).v || p.vertices,          // vertici del pezzo prima delle deformazioni
    box0: p => (ORIG.get(p) || {}).b || p.box,               // ingombro del pezzo prima delle deformazioni
    parts: () => DATA.parts.concat(DATA.copies),
    copyPart: (p, o, tag) => C.copy(p, o, tag),
    // passaggi della guida che hanno un pezzo mobile, dall'ultimo al primo (ordine di smontaggio)
    steps: (filter) => DATA.steps.map((s, i) => Object.assign({ i }, s)).filter(s => (s.moving || []).length && (!filter || filter(s))).reverse(),
    // smonta seguendo i passaggi: ogni passaggio sposta i suoi pezzi mobili lungo dir per travel × mul
    disassemble(t, steps, mul = 1, slot = i => i, n = steps.length) {
      steps.forEach((s, i) => {
        const k = seq(t, slot(i), n), d = s.dir || [1, 0, 0], l = Math.hypot(...d) || 1, len = (s.travel || SIZE * .15) * mul * k;
        for (const id of s.moving) P.move(id, d.map(v => v / l * len));
      });
    },
  };

  function poseOf(p) {
    const a = POSE.get(p.id), b = p.main && !(a && a.alone) && !p.alone ? POSE.get(p.main) : null, c = p.tag ? POSE.get('#' + p.tag) : null;
    if (!a && !b && !c) return null;
    const o = [0, 0, 0];
    for (const q of [a, b, c]) if (q && q.o) for (let i = 0; i < 3; i++) o[i] += q.o[i];
    return { o, hide: (a && a.hide) || (b && b.hide) || (c && c.hide) };
  }
  const offBase = offsetP, visBase = visibleP;
  offsetP = p => { const q = poseOf(p), o = offBase(p); return q ? o.map((v, i) => v + q.o[i]) : o };
  visibleP = p => { const q = poseOf(p); return q && q.hide ? false : visBase(p) };

  // deformazioni dei vertici (rotazione, allungamento, funzioni della scena): si rifanno a ogni fotogramma dai
  // vertici originali; poi si ricalcolano normali e ingombro, così luce e inquadratura seguono il pezzo
  function deform() {
    for (const p of P.parts()) {
      const q = POSE.get(p.id), r = q && q.rot, s = q && q.stretch, fns = q && q.fns;
      let o = ORIG.get(p);
      if (!r && !s && !fns) {
        if (o) { p.vertices = o.v; p.box = o.b; Object.defineProperty(p, 'normals', o.nd); ORIG.delete(p) }
        continue;
      }
      if (!o) { o = { v: p.vertices, b: p.box, nd: Object.getOwnPropertyDescriptor(p, 'normals') }; ORIG.set(p, o) }
      let V = o.v;
      if (s) V = V.map(v => { const z = v[2]; return [v[0], v[1], z < s.z0 ? z : z < s.z1 ? s.z0 + (z - s.z0) * (s.z1 - s.z0 + s.dz) / (s.z1 - s.z0) : z + s.dz] });
      if (r) {
        const c = Math.cos(r.ang), n = Math.sin(r.ang), [cx, cy] = r.c;
        V = V.map(v => { const x = v[0] - cx, y = v[1] - cy; return [cx + x * c - y * n, cy + x * n + y * c, v[2]] });
      }
      if (fns) for (const f of fns) V = V.map(f);
      p.vertices = V;
      const N = p.triangles.map(t => { const a = V[t[0]], b = V[t[1]], c = V[t[2]]; return norm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]])) });
      Object.defineProperty(p, 'normals', { value: N, writable: true, configurable: true, enumerable: true });
      const mn = [0, 1, 2].map(i => Math.min(...V.map(v => v[i]))), mx = [0, 1, 2].map(i => Math.max(...V.map(v => v[i])));
      p.box = mn.concat(mx);
    }
  }

  function pose(t) {
    POSE.clear();
    const S = window.SCENA;
    yaw = S.yaw + (S.swing ?? .22) * Math.sin(2 * Math.PI * t);
    pitch = S.pitch; zoom = S.zoom || 1; panX = 0; panY = 0; showLabels = false; showConn = false;
    S.pose(t, P);
    deform();
  }

  // copia di un pezzo (o di una copia) spostata di o: serve per esempio ai livelli impilati dell'organizer
  C.copy = (p, o, tag) => {
    const m = p.main ? byId[p.main] : p, base = p.offset || [0, 0, 0];
    DATA.copies.push({ id: p.id + '@' + tag, main: m.id, tag, alone: true, offset: base.map((v, i) => v + o[i]), acc: p.acc, color: p.color, css_color: p.css_color, group: p.group, label: p.label });
  };

  C.pose = t => pose(t);                                 // per provare una posa dalla console

  C.run = n => {
    const S = window.SCENA;
    explode = 0; isolate = false;
    if (S.setup) { S.setup(P); initCopies() }
    // primo giro: solo l'inquadratura di ogni fotogramma, così la camera resta ferma per tutta la clip
    C.boundsOnly = true; let U = null;
    for (let f = 0; f < n; f++) {
      pose(f / n);
      try { draw() } catch (e) { if (e !== 'b') throw e }
      const b = C.b; U = U ? [Math.min(U[0], b[0]), Math.max(U[1], b[1]), Math.min(U[2], b[2]), Math.max(U[3], b[3])] : b.slice();
    }
    C.boundsOnly = false; C.lock = U; if (!document.body.dataset.note) document.body.dataset.note = "inquadratura " + U.map(v => v.toFixed(1));
    const out = [];
    for (let f = 0; f < n; f++) {
      pose(f / n); draw();
      const pre = document.createElement('pre'); pre.className = 'clipframe';
      pre.textContent = document.getElementById('model').toDataURL('image/jpeg', .93);
      out.push(pre);
    }
    out.forEach(e => document.body.appendChild(e));
  };
})();
