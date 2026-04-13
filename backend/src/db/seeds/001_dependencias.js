const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  await knex('transferencias').del();
  await knex('historial_solicitudes').del();
  await knex('encuestas').del();
  await knex('evidencias').del();
  await knex('documentos').del();
  await knex('novedades').del();
  await knex('mantenimientos').del();
  await knex('combustible').del();
  await knex('calendario_conductores').del();
  await knex('calendario_vehiculos').del();
  await knex('asignaciones').del();
  await knex('solicitudes').del();
  await knex('conductores').del();
  await knex('vehiculos').del();
  await knex('usuarios').del();
  await knex('dependencias').del();

  // Dependencias reales de la Alcaldía de Sopó (catálogo completo)
  await knex('dependencias').insert([
    { id: 1,  nombre: 'Secretaría de Desarrollo Institucional' },
    { id: 2,  nombre: 'Secretaría de Gobierno' },
    { id: 3,  nombre: 'Secretaría de Infraestructura' },
    { id: 4,  nombre: 'Secretaría de Desarrollo Económico' },
    { id: 5,  nombre: 'Secretaría de Ambiente' },
    { id: 6,  nombre: 'Secretaría de Movilidad' },
    { id: 7,  nombre: 'Secretaría de Cultura' },
    { id: 8,  nombre: 'Secretaría Agropecuaria' },
    { id: 9,  nombre: 'Secretaría de Deportes' },
    { id: 10, nombre: 'Despacho del Alcalde' },
    { id: 11, nombre: 'Salud' },
    { id: 12, nombre: 'Desarrollo Social' },
    { id: 13, nombre: 'Educacion' },
    { id: 14, nombre: 'Almacen General' },
    { id: 15, nombre: 'Urbanismo y Desarrollo Territorial' },
    { id: 16, nombre: 'Planeacion Estrategica' },
    { id: 17, nombre: 'Direccion de Vivienda' },
    { id: 18, nombre: 'Direccion de Turismo' },
    { id: 19, nombre: 'Oficina de Comunicaciones' },
    { id: 20, nombre: 'Ciencia, Tecnologia e Innovacion' },
    { id: 21, nombre: 'Inspeccion de Policia' },
    { id: 22, nombre: 'Mujer, Equidad y Genero' },
    { id: 23, nombre: 'Concejo Municipal' },
    { id: 24, nombre: 'Comisaria de Familia 1' },
    { id: 25, nombre: 'Comisaria de Familia 2' },
    { id: 26, nombre: 'Atencion al Ciudadano' },
    { id: 27, nombre: 'Hacienda' },
    { id: 28, nombre: 'Sisben' },
  ]);

  // Usuarios de prueba (password: Sopo2026*)
  const hash = await bcrypt.hash('Sopo2026*', 10);

  await knex('usuarios').insert([
    { id: 1, nombre: 'Administradora Transporte', email: 'admin@sopo.gov.co', password_hash: hash, rol: 'admin', dependencia_id: 1 },
    { id: 2, nombre: 'Funcionario Infraestructura', email: 'infra@sopo.gov.co', password_hash: hash, rol: 'dependencia', dependencia_id: 3 },
    { id: 3, nombre: 'Funcionario Gobierno', email: 'gobierno@sopo.gov.co', password_hash: hash, rol: 'dependencia', dependencia_id: 2 },
    { id: 4, nombre: 'Funcionario Cultura', email: 'cultura@sopo.gov.co', password_hash: hash, rol: 'dependencia', dependencia_id: 7 },
    { id: 5, nombre: 'Carlos Rodríguez', email: 'conductor1@sopo.gov.co', password_hash: hash, rol: 'conductor', dependencia_id: 1 },
    { id: 6, nombre: 'Miguel Ángel Torres', email: 'conductor2@sopo.gov.co', password_hash: hash, rol: 'conductor', dependencia_id: 1 },
  ]);

  // Conductores
  await knex('conductores').insert([
    { id: 1, usuario_id: 5, nombre: 'Carlos Rodríguez', telefono: '3101234567', licencia: 'C2', vencimiento_licencia: '2027-06-15', estado: 'activo' },
    { id: 2, usuario_id: 6, nombre: 'Miguel Ángel Torres', telefono: '3209876543', licencia: 'C2', vencimiento_licencia: '2027-03-20', estado: 'activo' },
  ]);

  // Reset sequences after manual ID inserts
  await knex.raw("SELECT setval('dependencias_id_seq', (SELECT MAX(id) FROM dependencias))");
  await knex.raw("SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))");
  await knex.raw("SELECT setval('conductores_id_seq', (SELECT MAX(id) FROM conductores))");

  // Vehículos reales de la flota activa
  await knex('vehiculos').insert([
    // Motocicletas
    { placa: 'JMT06', tipo: 'vehiculo', marca: 'YAMAHA', modelo: 'XTZ250 CC. 249', anio: 2013 },
    { placa: 'CTN81C', tipo: 'vehiculo', marca: 'SUZUKI', modelo: 'GS150R CC. 149', anio: 2015 },
    { placa: 'JOA02', tipo: 'vehiculo', marca: 'YAMAHA', modelo: 'XTZ250 CC. 249', anio: 2015 },
    { placa: 'JGX25E', tipo: 'vehiculo', marca: 'YAMAHA', modelo: 'SZ15RR', anio: 2023 },
    { placa: 'JGX26E', tipo: 'vehiculo', marca: 'YAMAHA', modelo: 'SZ15RR', anio: 2023 },
    { placa: 'LBE64G', tipo: 'vehiculo', marca: 'YAMAHA', modelo: 'XTZ125 CC. 124', anio: 2023 },
    { placa: 'CQB15H', tipo: 'vehiculo', marca: 'HONDA', modelo: 'XR190L', anio: 2024 },
    { placa: 'CQB16H', tipo: 'vehiculo', marca: 'HONDA', modelo: 'XR190L', anio: 2024 },
    { placa: 'IVP04H', tipo: 'vehiculo', marca: 'HONDA', modelo: 'XR 150L E3', anio: 2025 },
    { placa: 'JGX17E', tipo: 'vehiculo', marca: 'YAMAHA', modelo: 'FZN250-A', anio: 2022 },
    { placa: 'JGX06E', tipo: 'vehiculo', marca: 'HONDA', modelo: 'XRE300 ABS', anio: 2022 },
    // Automóviles
    { placa: 'KIK724', tipo: 'vehiculo', marca: 'VOLKSWAGEN', modelo: 'GOL CONFORTLINE HATCH BACK', anio: 2012 },
    { placa: 'RNU377', tipo: 'vehiculo', marca: 'CHEVROLET', modelo: 'OPTRA SEDAN CC. 1598', anio: 2012 },
    // Buses / Busetas
    { placa: 'OHK952', tipo: 'vehiculo', marca: 'HINO', modelo: 'FC9JKSZ CC. 5123', anio: 2014 },
    { placa: 'OHK682', tipo: 'vehiculo', marca: 'CHEVROLET', modelo: 'NPR CC. 4570', anio: 2002 },
    { placa: 'NMK066', tipo: 'vehiculo', marca: 'CHEVROLET', modelo: 'NQR CC. 5193', anio: 2024 },
    // Camión
    { placa: 'KNL412', tipo: 'vehiculo', marca: 'HINO', modelo: 'FURGON LINEA FC9JJ7A CC 5123', anio: 2023 },
    // Camionetas
    { placa: 'OHK863', tipo: 'vehiculo', marca: 'NISSAN', modelo: 'FRONTIER D22', anio: 2007 },
    { placa: 'LQY889', tipo: 'vehiculo', marca: 'NISSAN', modelo: 'URVAN', anio: 2023 },
    { placa: 'NLZ844', tipo: 'vehiculo', marca: 'NISSAN', modelo: 'FRONTIER', anio: 2024 },
    // Camperos
    { placa: 'MMZ558', tipo: 'vehiculo', marca: 'TOYOTA', modelo: 'PRADO SUMO CC. 2700', anio: 2004 },
    { placa: 'OHK933', tipo: 'vehiculo', marca: 'TOYOTA', modelo: 'FORTUNER WAGON CC. 2982', anio: 2013 },
    { placa: 'FSQ891', tipo: 'vehiculo', marca: 'TOYOTA', modelo: 'PRADO WAGON CC. 2982', anio: 2019 },
    // Volqueta
    { placa: 'OCD698', tipo: 'vehiculo', marca: 'INTERNATIONAL', modelo: '4300 CC 7636', anio: 2007 },
    // Maquinaria
    { placa: 'MC420300', tipo: 'maquinaria', marca: 'CATERPILLAR', modelo: 'MOTONIVELADORA LINEA 120', anio: 2021 },
    { placa: '467181', tipo: 'maquinaria', marca: 'CASE', modelo: 'RETROEXCAVADORA 590', anio: 2007 },
    { placa: 'WCT609', tipo: 'maquinaria', marca: 'KUBOTA', modelo: 'TRACTOR M9540DT', anio: 2018 },
    { placa: 'MC695969', tipo: 'maquinaria', marca: 'MICHIGAN', modelo: 'VIBROCOMPACTADOR MID8TN', anio: 2023 },
    { placa: 'MC695968', tipo: 'maquinaria', marca: 'MICHIGAN', modelo: 'VIBROCOMPACTADOR KX3-1.25', anio: 2023 },
    { placa: 'MC734025', tipo: 'maquinaria', marca: 'CASE', modelo: 'RETROEXCAVADORA 2024', anio: 2024 },
  ]);
};
