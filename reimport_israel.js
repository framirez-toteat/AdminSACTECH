const http = require('http');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({ hostname: 'localhost', port: 3001, path, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const israelRecords = [
  // Junio 2025
  ['2025-06-05', 5, 'Big Blue Instalacion'],
  ['2025-06-09', 1, 'Instalaciones/implementacion'],
  ['2025-06-16', 1, 'Instalaciones/implementacion'],
  // Julio 2025
  ['2025-07-02', 2, 'Visita Presencial'],
  // Agosto 2025
  ['2025-08-02', 1, 'Abastur'],
  ['2025-08-28', 2, 'Visita Presencial'],
  // Septiembre 2025
  ['2025-09-16', 1, 'Implementacion'],
  // Octubre 2025
  ['2025-10-20', 1, 'Ichi Insurgentes'],
];

async function main() {
  const r = await request('POST', '/api/employees', {
    name: 'Israel Bermejo',
    position: 'Desvinculado',
    balance_initial: 0,
    balance_date: '2025-06-01',
    accrual_rate: 0
  });
  const id = r.id;
  console.log('Israel re-agregado ID:', id);

  for (const [date, hours, reason] of israelRecords) {
    const res = await request('POST', '/api/overtime', { employee_id: id, date, hours, reason });
    if (res.id) {
      await request('PATCH', `/api/overtime/${res.id}/status`, { status: 'approved' });
      console.log('OK:', date, hours + 'h', reason);
    }
  }
  console.log('Listo.');
}

main().catch(console.error);
