// Seed de información realista para la base de conocimiento de la Alcaldía de Sopó.
// Trámites y servicios típicos de una alcaldía municipal en Colombia, con detalle
// de requisitos, costos, horarios y canales de atención.
//
// Uso (desde container backend):
//   node src/scripts/seed_conocimiento_sopo.js

const db = require('../config/db');
const { embedDocumento, toVectorLiteral } = require('../utils/embeddings');

// ─── CATÁLOGO ───────────────────────────────────────────────────────────────
// Formato: { dep_nombre, categoria, titulo, contenido }
// dep_nombre se resuelve a dependencia_id por nombre.

const ITEMS = [
  // ════════ SECRETARÍA DE GOBIERNO (id=2) ════════
  {
    dep: 'Secretaría de Gobierno',
    categoria: 'Seguridad y convivencia',
    titulo: 'Certificado de residencia',
    contenido: `Documento oficial que acredita que una persona reside en el municipio de Sopó.
Requisitos:
- Cédula de ciudadanía original y copia
- Recibo de servicio público reciente a nombre del solicitante (luz, agua o gas, no mayor a 2 meses) o contrato de arrendamiento vigente
- Para menores: registro civil + cédula del acudiente

Pasos:
1. Acudir a la Secretaría de Gobierno en la Casa Municipal (Carrera 2 #3-43, Sopó)
2. Presentar los documentos al funcionario
3. Diligenciar el formulario único de solicitud
4. Esperar la verificación (mismo día si llega antes de las 2:00 p.m.)

Horario de atención: lunes a viernes de 7:30 a.m. a 12:00 m. y de 1:30 p.m. a 5:00 p.m.
Costo: gratis.
Tiempo de entrega: mismo día.
Canales: presencial únicamente.
Contacto: gobierno@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 103.`
  },
  {
    dep: 'Secretaría de Gobierno',
    categoria: 'Seguridad y convivencia',
    titulo: 'Denuncia por ruido o afectación a la tranquilidad',
    contenido: `Si un vecino, establecimiento comercial o evento excede los niveles de ruido permitidos puedes poner una queja ante Inspección de Policía adscrita a la Secretaría de Gobierno.
Niveles permitidos en zona residencial: 55 dB diurno / 45 dB nocturno (Resolución 627 de 2006).

Cómo reportar:
- Línea de CAI (Policía Nacional): 123
- Inspección de Policía Municipal: (601) 872-4444 ext. 120
- Presencialmente en la Casa Municipal con prueba (videos, audios con hora)

Si es un establecimiento comercial el trámite incluye visita técnica para medición de decibelios y puede derivar en comparendo ambiental o suspensión de actividad.
Marco legal: Ley 1801 de 2016 (Código Nacional de Convivencia), artículos 33 y 84.`
  },
  {
    dep: 'Secretaría de Gobierno',
    categoria: 'Apoyos sociales',
    titulo: 'Auxilio funerario para población vulnerable',
    contenido: `La Alcaldía ofrece apoyo económico o en especie (cofre, servicios exequiales básicos) a familias de escasos recursos cuyo familiar fallecido residía en Sopó.

Requisitos:
- Certificado de defunción
- Cédula del fallecido
- Certificación de SISBÉN grupos A, B o C1 hasta C3
- Recibo de servicio público del hogar del fallecido
- Declaración juramentada de no contar con recursos

Se cubre hasta 1 SMMLV dependiendo disponibilidad presupuestal.
Solicitar en Secretaría de Gobierno dentro de los 30 días siguientes al fallecimiento.
Contacto: (601) 872-4444 ext. 108.`
  },
  {
    dep: 'Secretaría de Gobierno',
    categoria: 'Seguridad y convivencia',
    titulo: 'Apelación de comparendo por convivencia',
    contenido: `Si recibiste un comparendo por infracción al Código de Policía (Ley 1801/2016) y consideras que fue injusto puedes solicitar revisión.

Plazos:
- Tienes 3 días hábiles desde la notificación para objetar
- La audiencia pública se realiza en un término no mayor a 3 días tras la objeción

Pasos:
1. Presentarte en Inspección de Policía Municipal con el comparendo
2. Diligenciar formulario de objeción explicando por qué no procede la sanción
3. Aportar pruebas (fotos, videos, testigos)
4. Asistir a la audiencia pública fijada

La sanción se suspende mientras se resuelve. Si no objetas en el plazo, el comparendo queda en firme y se traslada a cobro coactivo.
Dirección: Inspección de Policía — Casa Municipal, segundo piso.`
  },

  // ════════ SECRETARÍA DE MOVILIDAD (id=6) ════════
  {
    dep: 'Secretaría de Movilidad',
    categoria: 'Licencias',
    titulo: 'Tramitar o renovar licencia de conducción (pase)',
    contenido: `La licencia de conducción es el documento que autoriza conducir vehículos automotores. Se tramita en Centros de Reconocimiento de Conductores (CRC) y Centros de Enseñanza Automovilística (CEA) autorizados por el Ministerio de Transporte.

Por primera vez (categoría A2 moto / B1 carro particular):
- Certificado de aptitud física, mental y coordinación motriz (vigencia 90 días)
- Certificado de CEA de haber aprobado el curso teórico-práctico
- Cédula de ciudadanía
- Grupo sanguíneo y RH
- Tener 16 años cumplidos para moto y licencia A2; 18 para carro B1

Renovación:
- Certificado de aptitud vigente (no más de 90 días)
- Licencia actual
- Pagar derechos de trámite en el RUNT

Vigencia:
- Servicio particular: 10 años si eres menor de 60 años, 5 años entre 60-80, 1 año si mayor a 80
- Servicio público: 3 años

La Secretaría de Movilidad de Sopó NO expide directamente las licencias, pero orienta y entrega listado de CRC y CEA autorizados. Los trámites de licencia se hacen en un organismo de tránsito (Chía, Cajicá, Zipaquirá o Bogotá).
Contacto: movilidad@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 110.`
  },
  {
    dep: 'Secretaría de Movilidad',
    categoria: 'Multas y comparendos',
    titulo: 'Consultar comparendos de tránsito (multas)',
    contenido: `Para saber si tienes comparendos activos a tu nombre o a nombre de tu vehículo.

Por internet:
- Portal SIMIT nacional: https://www.fcm.org.co/simit
- Ingresa tu cédula o número de placa

Pasos:
1. Entrar a simit.org.co
2. Sección "Consulta tus infracciones"
3. Digitar cédula o placa
4. Consulta gratuita

Pago:
- En línea con PSE o tarjeta
- En bancos aliados
- Curso pedagógico (reduce 50% del valor si se hace dentro de 5 días hábiles)
- Curso + pago reducción del 25% entre el día 6 y 20

Si no pagas en 6 meses pasa a cobro coactivo con intereses y puede haber embargo del vehículo o comparendo a cuenta de RUNT.
La Secretaría de Movilidad de Sopó atiende aclaraciones, descargos y trámites de comparendos expedidos dentro del municipio.`
  },
  {
    dep: 'Secretaría de Movilidad',
    categoria: 'Tránsito',
    titulo: 'Informar el traslado de vehículo desde otro municipio',
    contenido: `Cuando adquieres un vehículo matriculado en otro municipio o compras un usado y quieres matricularlo en Sopó debes hacer el traslado de cuenta.

Requisitos:
- Formulario único de solicitud de trámite
- Fotocopia de cédula del propietario
- Tarjeta de propiedad original y copia
- Paz y salvo de impuestos del municipio de origen
- Paz y salvo de comparendos (SIMIT)
- Certificado de tradición del vehículo
- Recibo de pago de los derechos de trámite

El trámite se hace en el organismo de tránsito que tenga convenio con la Secretaría de Movilidad de Sopó (oficina más cercana: Chía).
Tiempo estimado: 5 a 15 días hábiles.
Una vez aprobado, el impuesto vehicular anual pasa a pagarse a la Gobernación de Cundinamarca como recaudo compartido con Sopó.`
  },

  // ════════ SECRETARÍA DE AMBIENTE (id=5) ════════
  {
    dep: 'Secretaría de Ambiente',
    categoria: 'Arbolado urbano',
    titulo: 'Solicitar poda, tala o traslado de árbol en espacio público',
    contenido: `Cuando un árbol en andén, parque o vía pública representa riesgo (ramas sobre redes eléctricas, inclinación peligrosa, bloqueo de alumbrado) puedes solicitar intervención a la Secretaría de Ambiente.

Requisitos:
- Derecho de petición escrito describiendo la situación
- Dirección exacta y fotografías del árbol
- Cédula del solicitante
- En caso de árboles en propiedad privada se requiere permiso formal del propietario y visita técnica

Proceso:
1. Radicar solicitud en ventanilla única o al correo ambiente@sopo-cundinamarca.gov.co
2. Visita técnica dentro de 10 días hábiles por ingeniero forestal
3. Concepto técnico (aprueba poda, tala o niega)
4. Si hay tala se exige compensación de 3 a 5 árboles nuevos sembrados

Casos urgentes (árbol caído, ramas sobre cables):
- Llamar al 123 o a la línea directa de Ambiente: (601) 872-4444 ext. 114
- Atención 24/7 con equipo de poda de emergencia

Costo: gratis cuando el árbol está en espacio público; en propiedad privada el propietario asume la poda o tala con empresa autorizada por la Corporación Autónoma Regional (CAR).`
  },
  {
    dep: 'Secretaría de Ambiente',
    categoria: 'Residuos',
    titulo: 'Recolección de residuos sólidos especiales y escombros',
    contenido: `Los residuos especiales (colchones, muebles, electrodomésticos) y escombros de construcciones NO se recogen en la ruta ordinaria de basuras. Hay que programar recolección específica.

Residuos voluminosos (colchones, muebles, nevera, lavadora):
- Operador: Aguas de la Sabana / EPS municipal
- Línea para agendar: 018000-918-234 o (601) 872-4444 ext. 115
- Servicio gratuito hasta 2 veces al año por hogar, volumen máximo 2 m³

Escombros de construcción:
- El generador (propietario u obra) debe contratar empresa autorizada
- Listado en la Secretaría de Ambiente
- Prohibido depositar en separadores, lotes baldíos o bordes del río Teusacá (Resolución CAR 1257 de 2018)
- Multas desde 4 SMLMV por disposición inadecuada

Puntos limpios:
- Sede administrativa de Ambiente (Cra 3 #4-28): recibe pilas, RAEE (residuos electrónicos), llantas usadas, aceite de cocina usado, medicamentos vencidos
- Horario: martes y jueves 8:00 a.m. - 12:00 m.`
  },
  {
    dep: 'Secretaría de Ambiente',
    categoria: 'Protección',
    titulo: 'Denuncia ambiental: contaminación, quemas, fauna silvestre',
    contenido: `Canales para reportar infracciones ambientales en el municipio de Sopó.

Situaciones comunes:
- Quemas a cielo abierto (prohibidas - Decreto 948/1995)
- Vertimiento de aguas residuales sin tratamiento a fuentes hídricas
- Captura, comercio o tenencia de fauna silvestre (tortugas, loros, iguanas)
- Tala de árboles sin permiso
- Contaminación por empresas (humo, olores, ruido)
- Minería sin licencia

Dónde reportar:
- Secretaría de Ambiente Sopó: ambiente@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 114
- CAR Cundinamarca (autoridad ambiental regional): línea 018000-915-358 o www.car.gov.co
- Policía Ambiental y Ecológica: 123
- Si es urgente hay riesgo inmediato: 123

Para que prospere la denuncia:
- Evidencia (fotos, videos, coordenadas)
- Fecha y hora del hecho
- Nombres o placas si son identificables
- Puedes denunciar anónimamente en la CAR

La Alcaldía puede imponer medidas preventivas inmediatas pero las sanciones las impone la CAR.`
  },

  // ════════ URBANISMO Y DESARROLLO TERRITORIAL (id=15) ════════
  {
    dep: 'Urbanismo y Desarrollo Territorial',
    categoria: 'Construcción',
    titulo: 'Licencia de construcción (obra nueva, ampliación, reforma)',
    contenido: `Necesaria para cualquier intervención física sobre un predio: edificar, ampliar, modificar estructura, demoler o cerrar.

Modalidades:
- Obra nueva
- Ampliación
- Adecuación
- Modificación
- Restauración
- Reforzamiento estructural
- Demolición
- Cerramiento

Requisitos generales:
- Solicitud en formulario único nacional
- Copia del certificado de libertad y tradición del predio (no mayor a 1 mes)
- Copia de cédula del propietario
- Pago del impuesto predial del año en curso
- Planos arquitectónicos firmados por arquitecto matriculado
- Planos estructurales + memorias de cálculo por ingeniero civil (obras +500 m²)
- Estudio de suelos (obras +500 m² o +3 pisos)
- Certificado energético para vivienda nueva
- Pago de expensas (liquidación según avalúo de la obra)

Tiempos:
- Estudio completo: 45 días hábiles
- Con observaciones: se suman los días de corrección
- Vigencia de la licencia: 24 meses (prorrogable 12 meses más)

No se expiden en Urbanismo de Sopó directamente - Sopó trabaja con Curaduría Urbana de Chía (curaduría zonal). La Secretaría orienta, hace cuenta previa y expide uso de suelo.
Contacto: urbanismo@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 118.`
  },
  {
    dep: 'Urbanismo y Desarrollo Territorial',
    categoria: 'Construcción',
    titulo: 'Certificado de uso del suelo',
    contenido: `Documento que indica si un predio permite determinada actividad (residencial, comercial, industrial, servicios, etc.) según el POT (Plan de Ordenamiento Territorial) del municipio.

Es obligatorio para:
- Apertura de cualquier establecimiento comercial
- Licencias de construcción
- Legalización de inmuebles
- Registro de empresa en Cámara de Comercio

Requisitos:
- Formulario único de solicitud
- Cédula del solicitante (original y copia)
- Copia del certificado de libertad y tradición (no mayor a 1 mes) o escritura pública
- Recibo de pago de los derechos del trámite (aproximadamente $35,000 COP en 2026)
- Si es arrendatario: contrato de arrendamiento + autorización del propietario

Tiempo: 8 días hábiles.
Vigencia del certificado: 6 meses.

El POT de Sopó fue actualizado en 2023. Las actividades permitidas varían por zona: zona rural, zona urbana residencial, zona mixta, zona industrial. Antes de comprar o arrendar un local consulta este certificado para confirmar que tu negocio es viable.`
  },
  {
    dep: 'Urbanismo y Desarrollo Territorial',
    categoria: 'Nomenclatura',
    titulo: 'Asignación o aclaración de nomenclatura predial',
    contenido: `Para obtener la dirección oficial de un predio nuevo, aclarar una nomenclatura confusa o corregir errores.

Cuándo se solicita:
- Construcción nueva sin dirección asignada
- Subdivisión predial que genera varias unidades
- Actualización de nomenclatura por cambio del POT
- Errores en la dirección registrada en IGAC o servicios públicos

Requisitos:
- Solicitud escrita con datos del propietario y predio
- Copia de cédula
- Certificado de libertad y tradición
- Plano de localización del predio
- Fotografías del predio

Proceso:
1. Radicar en Urbanismo
2. Visita técnica del topógrafo municipal (dentro de 10 días)
3. Análisis con base en el plan de nomenclatura del municipio
4. Emisión de certificado con nomenclatura oficial

Costo: gratis para predios residenciales; aproximadamente $45,000 para comercial/industrial.
Tiempo: 15 días hábiles.`
  },

  // ════════ SECRETARÍA DE INFRAESTRUCTURA (id=3) ════════
  {
    dep: 'Secretaría de Infraestructura',
    categoria: 'Vías',
    titulo: 'Reportar huecos, baches o fallas en vías públicas',
    contenido: `Cuando una vía pública del municipio tiene huecos, grietas, hundimientos o falta de señalización.

Cómo reportar:
- App "Mi Sopó" (Android/iOS) — opción "Reportar daño vía pública"
- Línea directa de Infraestructura: (601) 872-4444 ext. 116
- Correo: infraestructura@sopo-cundinamarca.gov.co
- Presencial en la Casa Municipal oficina 304
- WhatsApp institucional: 320 650 7411

Datos que debes aportar:
- Dirección exacta o coordenadas GPS
- Fotografías del daño (mínimo 2)
- Descripción del problema
- Tu nombre y teléfono para seguimiento

Tiempos de respuesta:
- Emergencias que afectan movilidad o tráfico pesado: 48 horas
- Daños menores en vías urbanas: 15 a 30 días
- Vías rurales: 30 a 60 días sujeto a disponibilidad de maquinaria

Las vías nacionales (troncal del Norte, vía a Tocancipá) dependen del INVIAS - se reportan en www.invias.gov.co.
Las vías departamentales (vía Sopó-Cogua) dependen de la Gobernación de Cundinamarca.`
  },
  {
    dep: 'Secretaría de Infraestructura',
    categoria: 'Espacio público',
    titulo: 'Arreglo de andenes, espacios peatonales y parques',
    contenido: `Para reportar deterioros en andenes, rampas peatonales, puentes peatonales, parques o infraestructura deportiva pública.

Tipos de reportes:
- Andenes fracturados o con desniveles
- Falta de rampas para personas con movilidad reducida
- Juegos infantiles deteriorados
- Alumbrado público dañado (se coordina con Enel-Codensa)
- Grafitis en bienes de interés cultural (coordinar con Cultura)
- Bancas rotas o elementos de mobiliario urbano

Canales:
- App "Mi Sopó" — opción "Reporte de infraestructura"
- Formulario en línea: www.sopo-cundinamarca.gov.co/reportes
- Personería Municipal si hay riesgo para personas con discapacidad

Priorización:
1. Riesgo inminente para peatones (huecos en andenes de vías principales, rampas rotas)
2. Cercanía a colegios, centros de salud y adulto mayor
3. Resto por orden de llegada según disponibilidad presupuestal

Intervenciones pequeñas: 10-20 días.
Intervenciones mayores (repavimentación, obras civiles): sujetas a contratación y pueden tomar meses.`
  },
  {
    dep: 'Secretaría de Infraestructura',
    categoria: 'Servicios públicos',
    titulo: 'Alumbrado público dañado o sin funcionamiento',
    contenido: `El alumbrado público urbano de Sopó es operado por Enel-Codensa bajo convenio con la Alcaldía. En el área rural y veredas algunos tramos los opera directamente el municipio.

Cómo reportar:
- Enel-Codensa: línea 115 o app Mi Enel (luminarias identificadas con código de poste)
- Alcaldía de Sopó: para veredas o cuando Enel no responde en 72 horas
- Línea directa Infraestructura: (601) 872-4444 ext. 116

Qué reportar:
- Luminarias apagadas permanentemente
- Luminarias que parpadean o dan luz intermitente
- Postes caídos o inclinados
- Cables sueltos (peligro eléctrico - llamar 123 si es urgente)
- Zonas oscuras donde falta iluminación

Datos:
- Código del poste (calcomanía con número)
- Dirección exacta
- Número de luminarias afectadas
- Fecha desde cuando está dañada

Tiempos de respuesta Enel: 5-10 días hábiles en zona urbana, 15-30 en rural. Si supera el plazo, la Alcaldía escala el caso.`
  },

  // ════════ SALUD (id=11) ════════
  {
    dep: 'Salud',
    categoria: 'Vacunación',
    titulo: 'Esquema de vacunación gratuita del PAI',
    contenido: `El Programa Ampliado de Inmunizaciones (PAI) ofrece vacunación GRATIS a niños, gestantes y adultos mayores en puntos autorizados del municipio.

Vacunas disponibles para niños:
- Recién nacido: BCG, Hepatitis B
- 2, 4 y 6 meses: Pentavalente, Polio, Rotavirus, Neumococo
- 6 meses: Influenza (anual hasta los 23 meses)
- 12 meses: Triple Viral, Varicela
- 18 meses: DPT refuerzo, Polio refuerzo, Hepatitis A
- 5 años: DPT segundo refuerzo, Polio, Triple Viral
- 9 años niñas: VPH (3 dosis)

Para gestantes:
- Tétanos, Difteria, Tos Ferina (TdaP)
- Influenza estacional (campaña anual)

Adultos mayores:
- Influenza (campaña anual)
- Neumococo
- COVID-19 (según lineamientos Minsalud)

Puntos de vacunación:
- Hospital Divino Salvador de Sopó
- Centro de Salud Aposentos
- Brigadas móviles en veredas (anunciadas en emisora local)

Horario: lunes a viernes 7:00 a.m. - 4:00 p.m.
Requisitos: llevar carnet de vacunación. Si no tiene, se le abre uno en el sitio.
Gratuito para todos, incluso sin EPS.`
  },
  {
    dep: 'Salud',
    categoria: 'Afiliación',
    titulo: 'Afiliación al régimen subsidiado de salud (EPS subsidiada)',
    contenido: `Personas sin capacidad de pago pueden acceder gratuitamente al sistema de salud mediante afiliación al régimen subsidiado, a través de una EPS-S.

Requisitos:
- Estar encuestado en el SISBÉN con puntaje dentro de los grupos A, B o C1-C3
- Cédula de ciudadanía o documento de identidad
- Registro civil (menores de 7 años) o Tarjeta de Identidad (7-18)
- Residir en Sopó (certificar con recibo de servicio público)
- No estar afiliado actualmente al régimen contributivo

Proceso:
1. Confirmar puntaje SISBÉN (ver servicio de SISBÉN)
2. Elegir EPS-S disponibles en Cundinamarca (Famisanar, Compensar Subsidiado, Salud Total, Nueva EPS Subsidiado)
3. Solicitar afiliación en la oficina de la EPS o en Secretaría de Salud del municipio
4. Diligenciar formulario único de afiliación
5. Entrega del carnet dentro de 10 días hábiles

Mientras se activa la afiliación (máximo 30 días) tienes derecho a atención de urgencias en cualquier IPS sin pago.

Oficina de atención de salud Sopó:
Carrera 2 # 3-80, segundo piso
salud@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 124.`
  },
  {
    dep: 'Salud',
    categoria: 'Servicios',
    titulo: 'Solicitar citas médicas en el hospital Divino Salvador',
    contenido: `El Hospital Divino Salvador de Sopó es la IPS pública principal del municipio (nivel I de complejidad).

Servicios que ofrece:
- Medicina general
- Urgencias 24/7
- Odontología
- Promoción y prevención (P&P)
- Laboratorio clínico
- Farmacia ambulatoria
- Atención materno-infantil

Para agendar cita por primera vez:
- Llamar a la línea de citas: (601) 872-3030
- WhatsApp: 310 456 1234
- Presencialmente en el hospital de 6:00 a.m.
- Presentar EPS a la que estás afiliado + cédula

Portabilidad nacional: si tu EPS tiene convenio, te atienden.

Urgencias: no requieren cita. Ingreso directo 24/7. Triaje (clasificación) de 1 (grave) a 5 (no urgente). Los niveles 4 y 5 pueden ser remitidos a cita prioritaria de medicina general.

Remisiones a niveles II y III:
- Se tramitan a través del médico general
- Hospitales de referencia: Clínica Chía, Hospital de Zipaquirá, Hospital Universitario La Samaritana (Bogotá)

Dirección: Calle 5 # 2-60.
PQRS: hospital.divino.salvador@sopo-cundinamarca.gov.co.`
  },
  {
    dep: 'Salud',
    categoria: 'Servicios',
    titulo: 'Atención en salud mental y línea de emergencia psicológica',
    contenido: `La Secretaría de Salud ofrece atención primaria en salud mental gratuita para población de Sopó.

Servicios:
- Consulta de psicología individual (sesiones de 45 minutos)
- Terapia familiar
- Atención a víctimas de violencia (en coordinación con Comisaría de Familia)
- Rutas de atención en intento de suicidio
- Consumo de sustancias psicoactivas (PSAC)
- Prevención en instituciones educativas

Cómo acceder:
- Cita previa en el Hospital Divino Salvador (línea 601-872-3030)
- Remisión del médico general
- Los afiliados a EPS deben pedir cita en su IPS primaria

Línea 106 (Bogotá-Cundinamarca): línea de escucha anónima 24/7 para crisis emocionales y pensamientos suicidas. Gratuita.

Línea nacional 192 opción 4: salud mental, Ministerio de Salud.

Casos de emergencia (intento de suicidio, crisis aguda):
- Urgencias del Hospital Divino Salvador
- 123 para atención pre-hospitalaria
- Línea Alcaldía apoyo psicosocial: (601) 872-4444 ext. 125

Confidencialidad garantizada. Gratuito incluso sin afiliación.`
  },

  // ════════ DESARROLLO SOCIAL (id=12) ════════
  {
    dep: 'Desarrollo Social',
    categoria: 'Adulto mayor',
    titulo: 'Programa Colombia Mayor (subsidio para adultos mayores)',
    contenido: `Transferencia monetaria del Gobierno Nacional a personas mayores sin pensión y en condición de vulnerabilidad.

Requisitos para acceder:
- Ser colombiano
- Tener mínimo 54 años mujeres / 59 años hombres (3 años antes de edad de pensión)
- Residir en Sopó al menos 10 años continuos (certificado con recibo público o certificado de residencia)
- Estar en SISBÉN grupos A o B
- NO recibir pensión ni ingresos fijos
- No tener propiedades o bienes de gran valor

Monto (2026): aproximadamente $80.000 mensuales (puede variar por ajuste anual).
Entrega: cada 2 meses por giro en Banco Agrario o SUPERGIROS (notificado vía SMS).

Cómo inscribirse:
1. Acudir a Desarrollo Social de Sopó con cédula y SISBÉN vigente
2. Diligenciar formulario Colombia Mayor
3. Se valida y entra a lista de priorización
4. Cuando haya cupo disponible te llaman (pueden ser meses de espera)

Contacto: desarrollosocial@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 130.
Información nacional: www.prosperidadsocial.gov.co.`
  },
  {
    dep: 'Desarrollo Social',
    categoria: 'Familias',
    titulo: 'Ingreso Solidario y Renta Ciudadana',
    contenido: `Programas de transferencias monetarias no condicionadas de Prosperidad Social para hogares vulnerables.

Renta Ciudadana (reemplazó a Familias en Acción):
- Dirigido a hogares con niños, niñas, adolescentes, adultos mayores, personas con discapacidad
- Requisitos: estar en SISBÉN grupos A o B; residir en Colombia; no tener pensión
- Monto: depende del ciclo vital y composición familiar
- Entrega bimestral

Ingreso Solidario:
- Subsidio a hogares afectados por la pandemia y emergencia
- Prosperidad Social define periódicamente quién permanece como beneficiario
- Los nuevos registros se hacen según llamados masivos del Ministerio de Igualdad

Cómo consultar tu estado:
- Portal: www.prosperidadsocial.gov.co
- App "Prosperidad Social"
- Línea nacional: 01-8000-951-100
- Casa Municipal de Sopó — Desarrollo Social

Si ya eres beneficiario y tienes problemas:
- Novedades de cobro: oficinas del Banco Agrario, SUPERGIROS o Efecty
- Actualización de datos (cambio de dirección, teléfono): oficina de Desarrollo Social
- Si el banco te rechaza el giro: reporte dentro de 30 días`
  },
  {
    dep: 'Desarrollo Social',
    categoria: 'Mujeres',
    titulo: 'Programas para mujeres y ruta de atención a víctimas de violencia',
    contenido: `La Alcaldía de Sopó cuenta con una oficina de Mujer, Equidad y Género que coordina programas de empoderamiento, emprendimiento y atención a víctimas.

Programas vigentes:
- Escuela de Liderazgo de la Mujer Sopoleña (talleres mensuales)
- Créditos semilla para emprendedoras (convenio con Bancoldex)
- Capacitaciones técnicas (peluquería, gastronomía, manicure, costura)
- Cuidado infantil mientras la madre se capacita (convenio con ICBF)

Ruta de atención a víctimas de violencia de género:
1. Si estás en peligro inmediato: 123 (Policía) o 155 (Línea de mujer)
2. Comisaría de Familia de Sopó: (601) 872-4444 ext. 140 (atención 24/7 para medidas de protección)
3. Casa de la Mujer (Sopó): acompañamiento psicológico, jurídico y social. Gratuito y confidencial
4. Centro de salud: si hubo agresión física, acudir antes de 72 horas para profilaxis

Medidas de protección que puede ordenar la Comisaría:
- Desalojo del agresor
- Prohibición de acercamiento
- Acompañamiento policial
- Protección durante desplazamientos

Si la violencia es laboral o sexual en el trabajo: denuncia ante el Ministerio del Trabajo (línea 018000-112518).`
  },

  // ════════ EDUCACIÓN (id=13) ════════
  {
    dep: 'Educacion',
    categoria: 'Matrículas',
    titulo: 'Matrícula en instituciones educativas oficiales de Sopó',
    contenido: `Las matrículas en colegios públicos del municipio son gratuitas. Se abren convocatorias anualmente en octubre-noviembre para el año lectivo siguiente (enero).

Instituciones educativas oficiales:
- IED Pablo VI (sede urbana principal)
- IED Agustín Parra (mixto, sede rural)
- IED Rafael Uribe (veredal)
- Varias sedes rurales de preescolar y primaria

Requisitos generales:
- Registro civil y documento de identidad (tarjeta de identidad desde 7 años)
- Copia del carné de vacunación
- Certificado de notas del año anterior (si viene de otro colegio)
- Dos fotos 3x4
- Fotocopia del EPS activa
- Recibo de servicio público del lugar de residencia
- Padres: cédula y certificado laboral o de ingresos (para estratificación)

Proceso:
1. Consultar cupos disponibles en Secretaría de Educación o en el colegio
2. Diligenciar formulario de inscripción
3. Asistir a entrevista (preescolar) o prueba diagnóstica (otros grados)
4. Confirmación de cupo (noviembre-diciembre)
5. Matrícula formal en enero

Para traslados entre colegios:
- Paz y salvo académico y de textos del colegio anterior
- Hoja de vida académica (carpeta)

Gratuidad: todos los niveles desde preescolar hasta 11° son gratis. Alimentación escolar (PAE) incluida.
Contacto: educacion@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 135.`
  },
  {
    dep: 'Educacion',
    categoria: 'Primera infancia',
    titulo: 'Hogares Comunitarios y Centros de Desarrollo Infantil (CDI)',
    contenido: `Atención gratuita para niños y niñas de 0 a 5 años en modalidad integral (cuidado, alimentación, desarrollo). Opera en convenio Alcaldía-ICBF.

Modalidades:
- Hogares Comunitarios de Bienestar Familiar (HCB): hogares tradicionales, madres comunitarias, 1-5 años, medio tiempo
- CDI Institucional: centros especializados con jornada completa, profesionales en primera infancia, 1-4 años
- Modalidad familiar: acompañamiento en casa para madres gestantes y menores de 2 años

Requisitos para inscripción:
- Registro civil del niño
- Cédula de padres o acudiente
- Carnet de vacunación al día
- Certificación SISBÉN (prioridad grupos A y B)
- Certificado médico de salud del niño
- 2 fotos tamaño documento
- Inscripción en plataforma CUENTAME del ICBF

Jornada CDI: lunes a viernes 7:00 a.m. - 4:30 p.m.
Jornada HCB: medio día (4 horas)
Alimentación: 70% de requerimientos nutricionales diarios. Gratuita.

Inscripciones abiertas todo el año según disponibilidad. Prioridad para hogares vulnerables.

Dónde inscribirse:
- Centro Zonal ICBF Chía: (601) 593-1000
- Oficina municipal Primera Infancia — Casa Municipal de Sopó`
  },
  {
    dep: 'Educacion',
    categoria: 'Becas',
    titulo: 'Subsidios y becas para educación superior',
    contenido: `El municipio de Sopó ofrece estímulos a bachilleres y estudiantes de pregrado que cumplan condiciones académicas y económicas.

Beca Municipal Sopoleña:
- Cubre hasta 75% de matrícula en universidades públicas o privadas acreditadas
- Requisitos: ser egresado de colegio oficial de Sopó, puntaje Saber 11 > 300, residir en Sopó, SISBÉN A-C3
- Convocatoria anual en diciembre-enero

ICETEX Convenio Municipio:
- Convenio con ICETEX para crédito condonable
- Condonación hasta 60% si el estudiante regresa a Sopó a prestar servicio profesional

Otros programas nacionales:
- Generación E (Ministerio de Educación)
- Jóvenes en Acción (Prosperidad Social)
- Becas Francisco José de Caldas (Ministerio de Ciencia)
- Apoyo a madres cabeza de familia estudiantes

Requisitos comunes:
- Saber 11 del ICFES
- Admisión a programa de educación superior
- Certificado de estratificación
- SISBÉN o clasificación socioeconómica
- Certificado de notas del bachillerato

Inscripciones: oficina de Educación (segundo piso Casa Municipal) o plataforma municipal.
Contacto: becas@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 137.`
  },

  // ════════ SECRETARÍA DE CULTURA (id=7) ════════
  {
    dep: 'Secretaría de Cultura',
    categoria: 'Eventos',
    titulo: 'Permiso para eventos y aglomeraciones en espacio público',
    contenido: `Para realizar conciertos, ferias, bazares, carreras, procesiones o cualquier evento en parques, calles o plazas públicas de Sopó.

Requisitos:
- Solicitud escrita con 30 días de anticipación
- Cédula del organizador
- Cámara de Comercio (si es empresa)
- Plan de contingencia (firmado por profesional en gestión del riesgo para eventos +500 personas)
- Plan de movilidad (si afecta tránsito)
- Póliza de responsabilidad civil extracontractual
- Autorización de SAYCO-ACINPRO (si hay música)
- Certificación de instalación eléctrica (si hay sonido)
- Plan de manejo de residuos

Requisitos adicionales por tipo:
- Bazar o feria: permiso sanitario de cada puesto de comida
- Concierto: gestión con Bomberos, Policía Nacional, Cruz Roja
- Carrera o caminata: cierres viales con Secretaría de Movilidad

Costo: depende del tipo de evento. Para eventos sin ánimo de lucro y culturales puede ser gratis.
Tiempo: 20 días hábiles de análisis.

Entidades que deben firmar el aval:
- Secretaría de Cultura (pertinencia cultural)
- Secretaría de Gobierno (orden público)
- Secretaría de Movilidad (tránsito)
- Bomberos voluntarios de Sopó (seguridad en el evento)

Contacto: cultura@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 132.`
  },
  {
    dep: 'Secretaría de Cultura',
    categoria: 'Formación',
    titulo: 'Casa de la Cultura: talleres y programas formativos gratis',
    contenido: `La Casa de la Cultura Municipal de Sopó ofrece formación gratuita en artes y oficios para todos los grupos etáreos.

Talleres permanentes:
- Música: guitarra, piano, técnica vocal, batería, producción musical
- Artes escénicas: teatro, danza folclórica, ballet, danza contemporánea
- Artes plásticas: dibujo, pintura, escultura, cerámica
- Literatura: escritura creativa, club de lectura
- Orquesta sinfónica juvenil (audición previa)
- Banda de marcha (niños y jóvenes)

Horarios:
- Mañana: 9:00 a.m. - 12:00 m (adulto mayor, amas de casa)
- Tarde: 2:00 p.m. - 6:00 p.m. (niños y adolescentes)
- Noche: 6:30 p.m. - 9:00 p.m. (jóvenes y adultos trabajadores)
- Sábado: jornada completa

Cómo inscribirse:
1. Ir a la Casa de la Cultura (Cra 2 # 4-80)
2. Llenar formulario de inscripción
3. Fotocopia de cédula
4. 1 foto tamaño documento
5. Para menores: consentimiento del acudiente

Inscripciones continuas. Sin costo.

Programas especiales:
- Cátedra Sopó: historia y cultura local
- Escuelas de formación en veredas (programa móvil)
- Semilleros de investigación cultural

Agenda cultural permanente: presentaciones, conciertos, exposiciones. Consulta en www.casaculturasopo.gov.co o en Facebook @CasaCulturaSopo.`
  },
  {
    dep: 'Secretaría de Cultura',
    categoria: 'Patrimonio',
    titulo: 'Sitios de interés cultural y turístico de Sopó',
    contenido: `Sopó tiene varios atractivos patrimoniales y naturales, declarados y por declarar, que son foco de identidad y turismo.

Patrimonio religioso:
- Iglesia Museo del Señor de la Piedra: templo colonial con imagen tallada en piedra del siglo XVI. Horario: martes a domingo 9:00 a.m. - 5:00 p.m.
- Iglesia Divino Salvador (parque principal): patrimonio arquitectónico

Patrimonio natural:
- Parque Ecológico Pionono: mirador 360° sobre la sabana de Bogotá. Senderos ecológicos. Costo: $8,000-15,000. Lunes cerrado
- Laguna de Pozo Azul: cuerpo de agua cristalina, sendero de 1 hora
- Cerro de la Cruz: sendero desafiante
- Reserva Río Teusacá: observación de aves

Cultura gastronómica:
- Alpina Factory Tour: visita guiada a la fábrica, degustación de yogures. Reservas con anticipación
- Restaurantes típicos con tamales, mazamorra chiquita, envueltos

Festividades:
- Festividades de la Virgen del Rosario (octubre)
- Festival del Yogur y el Queso (agosto)
- Carreras atléticas Sopó Corre (anual)
- Fiesta de Reyes Magos (enero)

Información turística:
- Punto de información turística: Parque Principal, sábados y domingos 9-5
- www.sopo-cundinamarca.gov.co/turismo
- turismo@sopo-cundinamarca.gov.co
- Guías certificados locales disponibles en el Parque Pionono`
  },

  // ════════ HACIENDA (id=27) ════════
  {
    dep: 'Hacienda',
    categoria: 'Impuesto predial',
    titulo: 'Pago del impuesto predial unificado',
    contenido: `Impuesto anual que grava la propiedad de bienes raíces (lotes, casas, apartamentos, fincas) ubicados en Sopó.

Fechas clave 2026:
- Facturación disponible: 15 de enero
- Descuento 10% por pronto pago: hasta 31 de marzo
- Descuento 5% por pronto pago: 1 abril - 31 mayo
- Plazo máximo sin intereses: 30 de junio
- Desde 1 julio: intereses de mora según tasa legal (actualmente ~22% efectivo anual)

Cómo consultar tu factura:
- Portal: www.sopo-cundinamarca.gov.co/hacienda/predial (necesitas matrícula inmobiliaria)
- Presencial: Tesorería en la Casa Municipal
- App "Mi Sopó"
- Por correo postal (llega a la dirección registrada)

Cómo pagar:
- En línea con PSE, tarjeta débito o crédito
- Bancos aliados (Davivienda, Banco de Bogotá, Banco Agrario, Colpatria)
- Pago por ventanilla en Tesorería
- Corresponsales no bancarios (Efecty, SURED) con el recibo

Exenciones y descuentos especiales:
- Adulto mayor pensionado con predio único: descuento 25% (requiere solicitud con cédula + certificación pensión + certificado único predio)
- Predio en zona rural o de producción agrícola: tarifa diferencial
- Víctima del conflicto armado registrada en RUV: exención 3 años

Predios nuevos (casas recién escrituradas):
- Avalúo lo fija el IGAC/catastro
- Primera liquidación puede demorar 3-6 meses

Contacto: hacienda@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 150.`
  },
  {
    dep: 'Hacienda',
    categoria: 'ICA',
    titulo: 'Impuesto de Industria y Comercio (ICA) para comerciantes',
    contenido: `Todo negocio, profesional o empresa que realice actividades gravadas en el municipio de Sopó debe declarar y pagar ICA.

Sujetos pasivos:
- Tiendas, almacenes, restaurantes, ferreterías, papelerías
- Empresas industriales (Alpina, Procter & Gamble)
- Profesionales (abogados, contadores, médicos con consultorio)
- Servicios: asesorías, transportes, educación privada
- Incluso si la actividad es ocasional (ventas en ferias, subcontrataciones)

Obligaciones:
- Registro Tributario Municipal (RTM): inscripción obligatoria al iniciar operaciones
- Declaraciones bimestrales (negocios grandes) o anuales (pequeños)
- Pago sobre ingresos brutos según tarifa por actividad:
  - Comercial: 5 a 7 por mil
  - Industrial: 2 a 6 por mil
  - Servicios: 3 a 10 por mil
  - Financieros: 10 por mil
- Retención de ICA cuando se contratan proveedores

Régimen simple de tributación (SIMPLE):
- Opcional para pequeños negocios
- Unifica ICA + otros impuestos en un solo pago
- Tarifas reducidas
- Inscripción en la DIAN (www.dian.gov.co)

Cómo inscribirse:
1. Llenar formulario Registro Tributario Municipal en Tesorería
2. Adjuntar RUT, cédula del representante, Cámara de Comercio (si aplica), uso del suelo
3. Certificado de matrícula
4. Apertura de cuenta contable para retenciones

Tiempo: 5 días hábiles.
Contacto: ica@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 152.`
  },

  // ════════ SISBEN (id=28) ════════
  {
    dep: 'Sisben',
    categoria: 'Encuesta',
    titulo: 'Solicitar encuesta del SISBÉN por primera vez',
    contenido: `El Sistema de Identificación de Potenciales Beneficiarios de Programas Sociales (SISBÉN) clasifica a los hogares según nivel de vulnerabilidad. Es gratuito y obligatorio para acceder a muchos subsidios estatales.

Grupos SISBÉN IV (vigente):
- A: pobreza extrema (A1 a A5)
- B: pobreza moderada (B1 a B7)
- C: vulnerable (C1 a C18)
- D: no pobre, no vulnerable (D1 a D21)

Requisitos para solicitar encuesta:
- Cédula de todos los integrantes mayores de 18 años
- Registro civil o tarjeta de identidad de menores
- Recibo de servicio público reciente (luz, agua)
- Residir en Sopó (al menos 3 meses)

Cómo solicitar:
1. Dirigirte a la Oficina SISBÉN en Casa Municipal de Sopó
2. Diligenciar formulario de solicitud de encuesta
3. Esperar asignación de encuestador (5 a 15 días hábiles)
4. El encuestador va a tu casa, aplica cuestionario de ~40 preguntas sobre vivienda, ingresos, composición familiar
5. Tras 30-60 días llega la clasificación nacional
6. Se consulta en www.sisben.gov.co con cédula

Horario de atención:
- Lunes a viernes 7:30 a.m. - 12:00 m. y 1:30 p.m. - 5:00 p.m.
- Oficina SISBÉN: primer piso Casa Municipal (Carrera 2 #3-43)

Contacto: sisben@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 160.
Línea nacional: 01-8000-910-001.`
  },
  {
    dep: 'Sisben',
    categoria: 'Actualización',
    titulo: 'Actualizar datos del SISBÉN (cambio de dirección, composición familiar)',
    contenido: `Si tu situación cambió (mudanza, nuevo hijo, fallecimiento, matrimonio, nuevo empleo, pérdida de empleo) debes solicitar actualización.

Cuándo actualizar:
- Cambio de dirección dentro o fuera del municipio
- Cambio en número de integrantes del hogar (nacimiento, defunción)
- Cambio de ingresos significativos
- Cambio de nivel educativo que afecte la clasificación
- Errores en los datos registrados

Requisitos:
- Cédula del jefe de hogar
- Documento que soporte el cambio (registro civil nuevo, acta de defunción, contrato de arrendamiento, recibo de servicio a la nueva dirección)
- Formulario de novedades SISBÉN

Tipos de novedad:
- Traslado dentro del mismo municipio: encuesta de inclusión/retiro
- Traslado entre municipios: nueva encuesta en municipio destino
- Inclusión de miembro: se actualiza el hogar
- Retiro de miembro: se actualiza

Tiempos:
- Inclusión simple: 5-10 días hábiles
- Cambio de dirección con nueva encuesta: 30-45 días hábiles
- Resultado nacional: 60-90 días hábiles después de aplicada la encuesta

Importante:
- Si te trasladaste y no actualizas, puedes perder beneficios porque los giros pueden no llegar
- La actualización es gratuita
- Fraude o datos falsos se sanciona: pérdida del SISBÉN + denuncia penal

Contacto: sisben@sopo-cundinamarca.gov.co | (601) 872-4444 ext. 160.`
  },
  {
    dep: 'Sisben',
    categoria: 'Consulta',
    titulo: 'Consultar clasificación y puntaje SISBÉN',
    contenido: `Puedes consultar en línea sin trámites tu clasificación actual.

Cómo consultar:
- Portal nacional: www.sisben.gov.co
- Seleccionar "Consultar grupo SISBÉN"
- Ingresar tipo y número de documento
- Se despliega grupo (A-B-C-D) y subgrupo

Qué significa el resultado:
- Grupo A (A1-A5): pobreza extrema. Acceso a todos los subsidios
- Grupo B (B1-B7): pobreza moderada. Acceso a la mayoría de subsidios
- Grupo C (C1-C18): vulnerable. Algunos subsidios (salud subsidiada solo C1-C3, adulto mayor hasta C7)
- Grupo D (D1-D21): no pobre. Solo algunos programas específicos

¿Por qué tengo un grupo diferente al que esperaba?
- El puntaje se calcula a nivel nacional con algoritmo que pondera: vivienda (tipo, materiales, servicios), educación, ingresos, ocupación, composición familiar
- Variables sensibles: bienes del hogar (TV, nevera, carro, moto), ubicación de la vivienda, tenencia (propia/arriendo)
- Si tienes moto, ese dato sube el puntaje

Cómo cambiar de grupo:
- No puedes "pedir" un grupo específico
- Si tu situación cambió, solicita actualización (ver trámite relacionado)
- Si crees que hay error en los datos, pide revisión de encuesta

Inconsistencias:
- Si detectas que tienes el SISBÉN a nombre de otra persona o con datos ajenos, reporta fraude en la oficina SISBÉN

Grupo en trámite: si aparece "No clasificado" o "En proceso", está dentro del plazo normal de 60-90 días tras la encuesta.`
  },
];

async function main() {
  // Resolver nombres a IDs una sola vez
  const deps = await db('dependencias').select('id', 'nombre').where({ activo: true });
  const mapaDep = Object.fromEntries(deps.map(d => [d.nombre, d.id]));

  // Buscar un usuario admin para firmar los registros
  const admin = await db('usuarios').where({ rol: 'admin' }).first();
  if (!admin) throw new Error('No hay usuario admin para asignar como autor');

  let ok = 0, fail = 0, skip = 0;
  for (const item of ITEMS) {
    const depId = mapaDep[item.dep];
    if (!depId) {
      console.error(`  ✗ Dependencia no encontrada: "${item.dep}"`);
      fail++;
      continue;
    }

    // Evitar duplicados por (dependencia_id, titulo)
    const existe = await db('base_conocimiento')
      .where({ dependencia_id: depId, titulo: item.titulo })
      .first();
    if (existe) {
      console.log(`  - SKIP (ya existe): ${item.titulo}`);
      skip++;
      continue;
    }

    const insertData = {
      dependencia_id: depId,
      usuario_id: admin.id,
      titulo: item.titulo,
      contenido: item.contenido,
      categoria: item.categoria,
    };

    // Generar embedding
    try {
      const texto = [item.titulo, item.contenido, item.categoria].filter(Boolean).join('\n\n');
      const vec = await embedDocumento(texto);
      insertData.embedding = db.raw('?::vector', [toVectorLiteral(vec)]);
    } catch (err) {
      console.error(`  ! embedding falló (se guarda sin vector): ${err.message}`);
    }

    try {
      await db('base_conocimiento').insert(insertData);
      console.log(`  ✓ ${item.dep} > ${item.titulo}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${item.titulo}: ${err.message}`);
      fail++;
    }

    // Rate limit amigable con la API de Gemini (plan free ~60 req/min)
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n[seed] Terminado. Nuevos=${ok}, Saltados(ya existían)=${skip}, Fallos=${fail}`);
  await db.destroy();
}

main().catch(err => {
  console.error('[seed] Error fatal:', err);
  process.exit(1);
});
