// Agrega un usuario-dependencia para cada secretaría/oficina que aún no tenga uno.
// Idempotente: si el email ya existe, lo salta. No borra ni modifica nada más.
//
// Uso desde el container backend:
//   node src/scripts/seed_usuarios_dependencias.js

const db = require('../config/db');
const bcrypt = require('bcrypt');

const USUARIOS = [
  { email: 'desarrollo-inst@sopo.gov.co',  nombre: 'Funcionario Desarrollo Institucional', dependencia_id: 1 },
  { email: 'gobierno@sopo.gov.co',         nombre: 'Funcionario Gobierno',                 dependencia_id: 2 },
  { email: 'infra@sopo.gov.co',            nombre: 'Funcionario Infraestructura',          dependencia_id: 3 },
  { email: 'desarrollo-eco@sopo.gov.co',   nombre: 'Funcionario Desarrollo Económico',     dependencia_id: 4 },
  { email: 'ambiente@sopo.gov.co',         nombre: 'Funcionario Ambiente',                 dependencia_id: 5 },
  { email: 'movilidad@sopo.gov.co',        nombre: 'Funcionario Movilidad',                dependencia_id: 6 },
  { email: 'cultura@sopo.gov.co',          nombre: 'Funcionario Cultura',                  dependencia_id: 7 },
  { email: 'agropecuaria@sopo.gov.co',     nombre: 'Funcionario Agropecuaria',             dependencia_id: 8 },
  { email: 'deportes@sopo.gov.co',         nombre: 'Funcionario Deportes',                 dependencia_id: 9 },
  { email: 'alcalde@sopo.gov.co',          nombre: 'Despacho del Alcalde',                 dependencia_id: 10 },
  { email: 'salud@sopo.gov.co',            nombre: 'Funcionario Salud',                    dependencia_id: 11 },
  { email: 'desarrollo-social@sopo.gov.co', nombre: 'Funcionario Desarrollo Social',       dependencia_id: 12 },
  { email: 'educacion@sopo.gov.co',        nombre: 'Funcionario Educación',                dependencia_id: 13 },
  { email: 'almacen@sopo.gov.co',          nombre: 'Funcionario Almacén General',          dependencia_id: 14 },
  { email: 'urbanismo@sopo.gov.co',        nombre: 'Funcionario Urbanismo',                dependencia_id: 15 },
  { email: 'planeacion@sopo.gov.co',       nombre: 'Funcionario Planeación Estratégica',   dependencia_id: 16 },
  { email: 'vivienda@sopo.gov.co',         nombre: 'Funcionario Dirección de Vivienda',    dependencia_id: 17 },
  { email: 'turismo@sopo.gov.co',          nombre: 'Funcionario Dirección de Turismo',     dependencia_id: 18 },
  { email: 'comunicaciones@sopo.gov.co',   nombre: 'Oficina de Comunicaciones',            dependencia_id: 19 },
  { email: 'cienciaytech@sopo.gov.co',     nombre: 'Funcionario Ciencia y Tecnología',     dependencia_id: 20 },
  { email: 'policia@sopo.gov.co',          nombre: 'Inspección de Policía',                dependencia_id: 21 },
  { email: 'mujer@sopo.gov.co',            nombre: 'Mujer, Equidad y Género',              dependencia_id: 22 },
  { email: 'concejo@sopo.gov.co',          nombre: 'Concejo Municipal',                    dependencia_id: 23 },
  { email: 'comisaria1@sopo.gov.co',       nombre: 'Comisaría de Familia 1',               dependencia_id: 24 },
  { email: 'comisaria2@sopo.gov.co',       nombre: 'Comisaría de Familia 2',               dependencia_id: 25 },
  { email: 'atencion@sopo.gov.co',         nombre: 'Atención al Ciudadano',                dependencia_id: 26 },
  { email: 'hacienda@sopo.gov.co',         nombre: 'Funcionario Hacienda',                 dependencia_id: 27 },
  { email: 'sisben@sopo.gov.co',           nombre: 'Funcionario SISBÉN',                   dependencia_id: 28 },
];

async function main() {
  const hash = await bcrypt.hash('Sopo2026*', 10);

  let creados = 0, existian = 0, sinDep = 0;
  for (const u of USUARIOS) {
    // Validar que la dependencia exista
    const dep = await db('dependencias').where({ id: u.dependencia_id }).first();
    if (!dep) {
      console.log(`  ! SKIP (dep ${u.dependencia_id} no existe): ${u.email}`);
      sinDep++;
      continue;
    }

    // Saltar si ya existe (por email)
    const existe = await db('usuarios').where({ email: u.email }).first();
    if (existe) {
      console.log(`  - YA EXISTE: ${u.email}`);
      existian++;
      continue;
    }

    await db('usuarios').insert({
      nombre: u.nombre,
      email: u.email,
      password_hash: hash,
      rol: 'dependencia',
      dependencia_id: u.dependencia_id
    });
    console.log(`  ✓ CREADO: ${u.email}  (${dep.nombre})`);
    creados++;
  }

  console.log(`\n[seed-usuarios] creados=${creados}  ya_existian=${existian}  sin_dependencia=${sinDep}`);
  console.log('Password para todos: Sopo2026*');
  await db.destroy();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
