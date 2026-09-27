// Stampa le misure dei pezzi (DATA.parts[].dims) di una guida, come JSON [[x,y,z],...].
// Serve ad aggiorna_guide.sh per il controllo dell'area di stampa nell'indice.
// Uso: node dimensioni.js <cartella>/guida.html
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const i = html.indexOf('const DATA=');
if (i < 0) { console.log('[]'); process.exit(0); }
const riga = html.slice(i, html.indexOf('\n', i));
// l'Organizer avvolge i dati in OrganizerCfg.patch(...): qui servono quelli standard
const DATA = vm.runInNewContext(riga + ';DATA', { OrganizerCfg: { patch: d => d } });
const dims = (DATA.parts || []).map(p => p.ghost ? null : p.dims || p.dimensions_mm).filter(Array.isArray).map(d => d.map(v => +(+v).toFixed(1)));
console.log(JSON.stringify(dims));
