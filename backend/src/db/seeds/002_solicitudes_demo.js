// Solicitudes de demo en distintos estados para poder probar:
// - Listado admin con filtros
// - Programación (PENDIENTE_PROGRAMACION → PROGRAMADA)
// - Confirmación por WhatsApp (PROGRAMADA → CONFIRMADA)
// - Ejecución del servicio (CONFIRMADA → EN_EJECUCION → FINALIZADA)
// - Cancelaciones y rechazos
//
// Requiere que 001_dependencias.js haya corrido antes.

exports.seed = async function (knex) {
  // Fecha base: hoy + hasta 15 días adelante (en timezone Bogotá)
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const dHoy = new Date(hoy);
  const dMasDias = (n) => {
    const d = new Date(dHoy);
    d.setDate(d.getDate() + n);
    return d.toISOString().substring(0, 10);
  };

  // Resolver IDs para que el seed no dependa de orden específico
  const admin = await knex('usuarios').where({ email: 'admin@sopo.gov.co' }).first();
  const cond1 = await knex('conductores').where({ nombre: 'Carlos Rodríguez' }).first();
  const cond2 = await knex('conductores').where({ nombre: 'Miguel Ángel Torres' }).first();

  const vehPrado = await knex('vehiculos').where({ placa: 'FSQ891' }).first();
  const vehVolqueta = await knex('vehiculos').where({ placa: 'OCD698' }).first();
  const vehCamioneta = await knex('vehiculos').where({ placa: 'NLZ844' }).first();

  const solicitudes = [
    // ═══ PENDIENTE_PROGRAMACION — bandeja del admin ═══
    {
      dependencia_id: 2, // Gobierno
      usuario_id: admin.id,
      fecha_servicio: dMasDias(2),
      horario_solicitud: '7am a 1pm',
      origen: 'Alcaldía Municipal de Sopó',
      destino: 'Gobernación de Cundinamarca, Bogotá',
      pasajeros: 3,
      estado: 'PENDIENTE_PROGRAMACION',
      canal: 'web',
      nombre_solicitante: 'María López Herrera',
      telefono_solicitante: '3114567890',
      identificacion_solicitante: '52456789',
      observaciones: 'Reunión con la Gobernación sobre presupuesto municipal'
    },
    {
      dependencia_id: 5, // Ambiente
      usuario_id: admin.id,
      fecha_servicio: dMasDias(3),
      horario_solicitud: '1pm a 6pm',
      origen: 'Parque Ecológico Pionono',
      destino: 'Vereda Meusa, Sopó',
      pasajeros: 5,
      estado: 'PENDIENTE_PROGRAMACION',
      canal: 'web',
      nombre_solicitante: 'Andrés Gómez Ruiz',
      telefono_solicitante: '3209876543',
      identificacion_solicitante: '80234567',
      descripcion_recorrido: 'Visita de inspección ambiental a fuentes hídricas del acueducto veredal',
      observaciones: 'Llevar equipo de muestreo de agua'
    },
    {
      dependencia_id: 11, // Salud
      usuario_id: admin.id,
      fecha_servicio: dMasDias(1),
      horario_solicitud: '8am a 12m',
      origen: 'Hospital Divino Salvador',
      destino: 'Vereda Aposentos',
      pasajeros: 4,
      estado: 'PENDIENTE_PROGRAMACION',
      canal: 'whatsapp',
      nombre_solicitante: 'Sandra Martínez',
      telefono_solicitante: '3167890123',
      identificacion_solicitante: '39111222',
      descripcion_recorrido: 'Brigada de vacunación rural',
      nombre_paciente: 'Varios — brigada comunitaria',
      observaciones: 'Transporte de equipo médico y 4 profesionales'
    },

    // ═══ RECIBIDA — bandeja de la dependencia (aún no aprueba) ═══
    {
      dependencia_id: 7, // Cultura
      usuario_id: admin.id,
      fecha_servicio: dMasDias(5),
      horario_solicitud: '9am a 5pm',
      origen: 'Casa de la Cultura',
      destino: 'Teatro Colón, Bogotá',
      pasajeros: 15,
      estado: 'RECIBIDA',
      canal: 'whatsapp',
      nombre_solicitante: 'Juan Pablo Ríos',
      telefono_solicitante: '3112223344',
      identificacion_solicitante: '1012345678',
      descripcion_recorrido: 'Salida pedagógica del grupo de danza folclórica al Teatro Colón',
      observaciones: 'Grupo de adultos mayores — requiere vehículo con acceso cómodo'
    },

    // ═══ PROGRAMADA — con asignación, pendiente de confirmación por WhatsApp ═══
    {
      dependencia_id: 3, // Infraestructura
      usuario_id: admin.id,
      fecha_servicio: dMasDias(1),
      horario_solicitud: '7am a 12m',
      origen: 'Sopó centro',
      destino: 'Vereda Gratamira - Puente vehicular',
      pasajeros: 4,
      estado: 'PROGRAMADA',
      canal: 'web',
      nombre_solicitante: 'Patricia Rodríguez Castro',
      telefono_solicitante: '3156781234',
      identificacion_solicitante: '39876543',
      descripcion_recorrido: 'Supervisión obra puente vehicular con equipo técnico',
      observaciones: 'Llevar casco y chaleco reflectivo'
    },

    // ═══ EN_EJECUCION — servicio en curso hoy ═══
    {
      dependencia_id: 6, // Movilidad
      usuario_id: admin.id,
      fecha_servicio: hoy,
      horario_solicitud: '8am a 2pm',
      origen: 'Alcaldía Sopó',
      destino: 'Chía - Curaduría Urbana',
      pasajeros: 2,
      estado: 'EN_EJECUCION',
      canal: 'web',
      nombre_solicitante: 'Felipe Ortiz',
      telefono_solicitante: '3108877665',
      identificacion_solicitante: '79223344',
      observaciones: 'Trámite urgente de licencias'
    },

    // ═══ FINALIZADA — servicios históricos ═══
    {
      dependencia_id: 9, // Deportes
      usuario_id: admin.id,
      fecha_servicio: dMasDias(-5),
      horario_solicitud: '6am a 8pm',
      origen: 'Coliseo Municipal',
      destino: 'Chía - Torneo intermunicipal',
      pasajeros: 20,
      estado: 'FINALIZADA',
      canal: 'web',
      nombre_solicitante: 'Coordinador Deportes',
      telefono_solicitante: '3104445566',
      identificacion_solicitante: '80123456',
      observaciones: 'Delegación de fútbol infantil'
    },
    {
      dependencia_id: 13, // Educación
      usuario_id: admin.id,
      fecha_servicio: dMasDias(-2),
      horario_solicitud: '7am a 4pm',
      origen: 'IED Pablo VI',
      destino: 'Parque Jaime Duque',
      pasajeros: 35,
      estado: 'FINALIZADA',
      canal: 'web',
      nombre_solicitante: 'Rectora IED Pablo VI',
      telefono_solicitante: '3206655443',
      identificacion_solicitante: '52889900',
      descripcion_recorrido: 'Salida pedagógica de grado 6°',
      observaciones: 'Regreso a las 4pm'
    },

    // ═══ CANCELADA — con motivo ═══
    {
      dependencia_id: 8, // Agropecuaria
      usuario_id: admin.id,
      fecha_servicio: dMasDias(-1),
      horario_solicitud: '8am a 12m',
      origen: 'Alcaldía Sopó',
      destino: 'Vereda Aposentos - Finca La Esperanza',
      pasajeros: 3,
      estado: 'CANCELADA',
      canal: 'whatsapp',
      nombre_solicitante: 'Ingeniero Agrícola',
      telefono_solicitante: '3205556677',
      identificacion_solicitante: '80456789',
      motivo_cancelacion: 'El productor rural reprogramó la visita por clima adverso. Se reagendará la próxima semana.',
      observaciones: 'Asesoría técnica cultivo'
    },

    // ═══ RECHAZADA — no cumple criterios ═══
    {
      dependencia_id: 10, // Despacho
      usuario_id: admin.id,
      fecha_servicio: dMasDias(7),
      horario_solicitud: '10am a 3pm',
      origen: 'Sopó',
      destino: 'Cartagena',
      pasajeros: 6,
      estado: 'RECHAZADA',
      canal: 'web',
      nombre_solicitante: 'Solicitante genérico',
      telefono_solicitante: '3000000000',
      identificacion_solicitante: '1000000000',
      observaciones: 'Viaje fuera del alcance permitido para vehículos municipales'
    },
  ];

  const [first] = await knex('solicitudes').insert(solicitudes).returning(['id', 'estado']);

  // Historial básico para cada solicitud
  const todas = await knex('solicitudes').select('id', 'estado').where('id', '>=', first.id);
  for (const s of todas) {
    await knex('historial_solicitudes').insert({
      solicitud_id: s.id,
      estado_anterior: null,
      estado_nuevo: 'RECIBIDA',
      usuario_id: admin.id,
      notas: 'Solicitud creada (seed de demo)'
    });
    if (s.estado !== 'RECIBIDA') {
      await knex('historial_solicitudes').insert({
        solicitud_id: s.id,
        estado_anterior: 'RECIBIDA',
        estado_nuevo: s.estado,
        usuario_id: admin.id,
        notas: 'Transición directa (seed de demo)'
      });
    }
  }

  // Asignaciones para PROGRAMADA, EN_EJECUCION, FINALIZADA
  const programada = todas.find(s => s.estado === 'PROGRAMADA');
  const enEjecucion = todas.find(s => s.estado === 'EN_EJECUCION');
  const finalizadas = todas.filter(s => s.estado === 'FINALIZADA');

  if (programada) {
    const solData = await knex('solicitudes').where({ id: programada.id }).first();
    await knex('asignaciones').insert({
      solicitud_id: programada.id,
      vehiculo_id: vehPrado.id,
      conductor_id: cond1.id,
      fecha: solData.fecha_servicio,
      hora_inicio: '07:00:00',
      hora_fin: '12:00:00'
    });
    await knex('calendario_vehiculos').insert({
      vehiculo_id: vehPrado.id, fecha: solData.fecha_servicio,
      hora_inicio: '07:00:00', hora_fin: '12:00:00',
      solicitud_id: programada.id, tipo_bloqueo: 'servicio'
    });
    await knex('calendario_conductores').insert({
      conductor_id: cond1.id, fecha: solData.fecha_servicio,
      hora_inicio: '07:00:00', hora_fin: '12:00:00',
      solicitud_id: programada.id
    });
  }

  if (enEjecucion) {
    const solData = await knex('solicitudes').where({ id: enEjecucion.id }).first();
    await knex('asignaciones').insert({
      solicitud_id: enEjecucion.id,
      vehiculo_id: vehCamioneta.id,
      conductor_id: cond2.id,
      fecha: solData.fecha_servicio,
      hora_inicio: '08:00:00',
      hora_fin: '14:00:00',
      km_inicial: 45120
    });
    await knex('calendario_vehiculos').insert({
      vehiculo_id: vehCamioneta.id, fecha: solData.fecha_servicio,
      hora_inicio: '08:00:00', hora_fin: '14:00:00',
      solicitud_id: enEjecucion.id, tipo_bloqueo: 'servicio'
    });
    await knex('calendario_conductores').insert({
      conductor_id: cond2.id, fecha: solData.fecha_servicio,
      hora_inicio: '08:00:00', hora_fin: '14:00:00',
      solicitud_id: enEjecucion.id
    });
  }

  for (const [idx, f] of finalizadas.entries()) {
    const solData = await knex('solicitudes').where({ id: f.id }).first();
    const veh = idx === 0 ? vehVolqueta : vehCamioneta;
    const cond = idx === 0 ? cond1 : cond2;
    const kmIni = 30000 + idx * 5000;
    const kmFin = kmIni + 80 + idx * 40;
    await knex('asignaciones').insert({
      solicitud_id: f.id,
      vehiculo_id: veh.id,
      conductor_id: cond.id,
      fecha: solData.fecha_servicio,
      hora_inicio: '06:00:00',
      hora_fin: '20:00:00',
      km_inicial: kmIni,
      km_final: kmFin
    });
  }

  console.log(`[seed] ${solicitudes.length} solicitudes de demo insertadas en estados variados`);
};
