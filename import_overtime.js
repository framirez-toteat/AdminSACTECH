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

async function addEmployee(name) {
  const r = await request('POST', '/api/employees', { name, balance_initial: 0, balance_date: '2025-06-01', accrual_rate: 15 });
  return r.id;
}

async function addOvertime(employee_id, date, hours, reason) {
  const r = await request('POST', '/api/overtime', { employee_id, date, hours, reason });
  if (r.id) await request('PATCH', `/api/overtime/${r.id}/status`, { status: 'approved' });
  return r.id;
}

const records = [
  // JUNIO 2025
  [3,'2025-06-05',1,'Instalaciones/implementacion'],
  [3,'2025-06-07',5,'Reunion y seguimiento Terra'],
  [3,'2025-06-16',2,'ETL - La Dicha'],
  [3,'2025-06-18',3,'ETL - Recetas La Dicha'],
  [3,'2025-06-24',1,'ETL - KDS Beasty Burgers'],
  [3,'2025-06-25',1,'ETL - KDS Beasty Burgers'],
  [3,'2025-06-27',2,'ETL - Lovers'],
  [4,'2025-06-01',2,'ETL - Buffet Express CC'],
  [4,'2025-06-02',1,'Visita Tecnica Sicily Pizzeria'],
  [4,'2025-06-04',8,'Carga Recetas Millefleur'],
  [4,'2025-06-05',1.5,'Visita Tecnica Mestiere'],
  [4,'2025-06-06',4,'Visita Tecnica Teatro Alicia'],
  [4,'2025-06-09',2.5,'ETL - KDS Living Cafe'],
  [4,'2025-06-18',2.5,'ETL - Recetas La Dicha'],
  [4,'2025-06-25',1.5,'Visita Tecnica Casa Juliet'],
  [4,'2025-06-27',2,'ETL - Lovers'],
  [4,'2025-06-28',8,'Acompanamiento Buin Zoo'],
  [8,'2025-06-06',2,'Reunion - Nanking'],
  [8,'2025-06-06',2,'Tecnica - Big blue'],
  [8,'2025-06-12',2,'Contingencia - Caida Google'],
  [8,'2025-06-20',4,'Reunion y Gestion por feriado CL'],
  // JULIO 2025
  [3,'2025-07-03',1,'ETL - Kross Bar Antofagasta'],
  [3,'2025-07-08',1,'ETL - LAMAEST_T2_DEP'],
  [3,'2025-07-10',1,'ETL - KROSSBAR_T2_DEP'],
  [3,'2025-07-14',1,'ETL - PISCO_BAR'],
  [3,'2025-07-15',2,'ETL - KROSSBAR Y CECILIA BISTRO'],
  [3,'2025-07-17',1,'ETL - KANT'],
  [3,'2025-07-18',1,'ETL - CAFE PUBLICO'],
  [3,'2025-07-18',1,'ETL - POLLO STOP_T1_LLEGADA'],
  [3,'2025-07-19',1,'BUG - URBAN PIZZAS'],
  [3,'2025-07-21',1,'ETL - CAFE DEL TEATRO'],
  [3,'2025-07-22',2,'INSTALACION - MULATO - TIO RUCAHUE'],
  [3,'2025-07-24',3,'ETL - OAKBERRY 3 LOCALES'],
  [3,'2025-07-24',1,'REVISION - THE CREPE CAFE CHICUREO'],
  [3,'2025-07-25',3,'ETL - CECILIA B, VAIVEN, SABOR X2'],
  [3,'2025-07-29',1,'REVISION - CASA JULIET'],
  [3,'2025-07-31',2,'VISITA CLUB AMANDA'],
  [4,'2025-07-05',8,'Acompanamiento Buin Zoo'],
  [4,'2025-07-31',3,'Carga Ingredientes Don Carlos'],
  [8,'2025-07-02',2,'CAIDA RAPPI'],
  [8,'2025-07-25',5,'REVISION LA DICHA + MARQUESITAS'],
  [8,'2025-07-26',2,'MARQUESITAS'],
  [8,'2025-07-31',2,'MULTISUCURSAL SODEXO'],
  // AGOSTO 2025
  [3,'2025-08-01',1,'Reglas Exc. Mulato'],
  [3,'2025-08-05',1,'ETL - Camogli'],
  [3,'2025-08-13',1,'ETL - Oakberrey Truck'],
  [3,'2025-08-14',2,'VISITA Tataki'],
  [3,'2025-08-18',2,'KDS - EL MUELLE'],
  [3,'2025-08-19',1,'ETL - Bresto Boulevard'],
  [3,'2025-08-25',1,'REVISION IMIN Los foquitos'],
  [3,'2025-08-28',1,'ETL - Maria Maria'],
  [4,'2025-08-08',3,'Config Claro arena'],
  [4,'2025-08-11',2,'Instalacion Cassis Trapenses'],
  [4,'2025-08-12',2,'Config Claro arena'],
  [8,'2025-08-07',3,'Reunion Chiringuito Wey'],
  [8,'2025-08-25',4,'Config Claro arena'],
  [8,'2025-08-28',2,'MULTISUCURSAL SODEXO'],
  // SEPTIEMBRE 2025
  [3,'2025-09-05',1,'ETL - Chocolat Antofagasta'],
  [3,'2025-09-22',6,'ETL - Lady Focaccia'],
  [3,'2025-09-27',2,'Seguimiento Pollos Brosty'],
  [3,'2025-09-29',2,'ETL - Cooper Cafeteria'],
  [3,'2025-09-29',1,'ETL - Chocolate norte'],
  [3,'2025-09-30',1,'ETL - Cooper Restaurante'],
  [4,'2025-09-01',3,'Instalacion Oakberry'],
  [4,'2025-09-01',2,'Acompanamiento Cassis'],
  [8,'2025-09-05',4,'MULTISUCURSAL SODEXO'],
  // OCTUBRE 2025
  [3,'2025-10-01',1,'Visita Club Providencia'],
  [3,'2025-10-01',1,'Reglas de Impresion Grupo Jaka'],
  [3,'2025-10-03',1,'Revision local la dicha'],
  [3,'2025-10-14',1,'Reinstalacion Dunkin Costanera'],
  [3,'2025-10-22',1,'Revision reportes local Black Boss'],
  [3,'2025-10-27',1,'ETL Cafe La oveja'],
  [3,'2025-10-28',1,'ETL Positano Coffee Shop & Bar'],
  [4,'2025-10-24',1,'La Dicha'],
  [4,'2025-10-28',3,'Caleuche'],
  [4,'2025-10-30',2,'Caleuche'],
  [8,'2025-10-02',2,'Acompanamiento Reglas impresion'],
  // NOVIEMBRE 2025
  [3,'2025-11-04',1,'ETL - You Food Vitacura'],
  [3,'2025-11-05',1,'ETL - You Food La Dehesa'],
  [3,'2025-11-12',1,'ETL - Helados Pudu - Puerto Varas'],
  [3,'2025-11-12',1,'ETL - Helados Pudu - Puerto Montt'],
  [3,'2025-11-19',2,'Instalacion Sodexo'],
  [3,'2025-11-20',2,'Instalacion Sodexo'],
  [4,'2025-11-12',4,'Instalacion ETL 5 am'],
  [8,'2025-11-02',2,'Revision impuestos'],
  [8,'2025-11-26',2,'Visita Sodexo'],
  // DICIEMBRE 2025
  [3,'2025-12-03',1,'ETL - Plaza victoria'],
  [3,'2025-12-11',1,'KDS'],
  [3,'2025-12-12',2,'Beasty Burgers'],
  [3,'2025-12-12',7,'DUNKIN APOYO ENERO'],
  [3,'2025-12-30',1,'Sazon Peruana'],
  [4,'2025-12-05',6,'La dicha - Stock Control'],
  [8,'2025-12-04',2,'Visita Sodexo davila'],
  [8,'2025-12-09',2,'Reglas Imp Cassis'],
  [5,'2025-12-30',2,'Visita tecnica'],
  // ENERO 2026
  [3,'2026-01-06',2,'Refuerzo bajada GAE2'],
  [3,'2026-01-06',1,'ETL - Millefleur Renaca'],
  [3,'2026-01-20',1,'ETL - Frozen'],
  [3,'2026-01-21',1,'Confg Cassis los dominicos'],
  [4,'2026-01-06',2,'Refuerzo bajada GAE2'],
  [4,'2026-01-14',4,'Visita Club Palestino'],
  [4,'2026-01-23',5,'Configuracion terminales Fiebre Cumbia'],
  [4,'2026-01-31',5,'Recorrido Presencial DD'],
  [8,'2026-01-06',2,'Refuerzo bajada GAE2'],
  [8,'2026-01-19',1,'Sodexo Multi'],
  [5,'2026-01-06',2,'Refuerzo bajada GAE2'],
  [5,'2026-01-10',3,'Instalacion DD'],
  [2,'2026-01-06',2,'Refuerzo bajada GAE2'],
  [2,'2026-01-20',2,'Arepas VIP DIDI'],
  [2,'2026-01-31',3,'Recorrido DD Presencial'],
  // FEBRERO 2026
  [4,'2026-02-13',3,'Instalacion DD Remota'],
  [2,'2026-02-01',4,'Recorrido DD presencial'],
  [3,'2026-02-16',3,'Fuente Mardoqueo'],
  [3,'2026-02-20',1,'Chillis'],
  [4,'2026-02-20',1,'Configuracion KDS Chillis'],
  [8,'2026-02-05',5,'Reportaria Incidencias'],
  [8,'2026-02-10',1,'Configuracion Achoclonados'],
  [8,'2026-02-17',1,'Configuracion Achoclonados'],
  [8,'2026-02-18',2,'Configuracion Achoclonados'],
];

async function main() {
  const israelId = await addEmployee('Israel Bermejo');
  console.log('Israel Bermejo agregado con ID:', israelId);
  let ok = 0, fail = 0;
  for (const [eid, date, hours, reason] of records) {
    const id = await addOvertime(eid, date, hours, reason);
    if (id) { ok++; } else { fail++; console.log('FALLO:', date, reason); }
  }
  console.log(`\nCompletado: ${ok} registros importados, ${fail} fallidos`);
}

main().catch(console.error);
