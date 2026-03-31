# Plan de Pruebas - Sistema de Transporte Alcaldia de Sopo

**Fecha:** 2026-03-30
**Version:** 1.0
**Sistema:** Sistema de Gestion de Transporte Municipal
**URL Local:** http://localhost

---

## Usuarios de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Administradora | admin@sopo.gov.co | Sopo2026* |
| Dependencia (Infra) | infra@sopo.gov.co | Sopo2026* |
| Dependencia (Gobierno) | gobierno@sopo.gov.co | Sopo2026* |
| Dependencia (Cultura) | cultura@sopo.gov.co | Sopo2026* |
| Conductor 1 | conductor1@sopo.gov.co | Sopo2026* |
| Conductor 2 | conductor2@sopo.gov.co | Sopo2026* |

---

## 1. AUTENTICACION Y SEGURIDAD

### 1.1 Login

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 1.1.1 | Login exitoso como admin | 1. Ir a /login 2. Ingresar admin@sopo.gov.co / Sopo2026* 3. Click "Iniciar Sesion" | Redirige a /admin con dashboard | [ ] |
| 1.1.2 | Login exitoso como dependencia | 1. Ingresar infra@sopo.gov.co / Sopo2026* | Redirige a /solicitudes con dashboard | [ ] |
| 1.1.3 | Login exitoso como conductor | 1. Ingresar conductor1@sopo.gov.co / Sopo2026* | Redirige a /servicios con dashboard | [ ] |
| 1.1.4 | Login con password incorrecto | 1. Ingresar admin@sopo.gov.co / password123 | Muestra error de credenciales invalidas | [ ] |
| 1.1.5 | Login con email inexistente | 1. Ingresar noexiste@sopo.gov.co / Sopo2026* | Muestra error de credenciales invalidas | [ ] |
| 1.1.6 | Login con campos vacios | 1. Dejar email y password vacios 2. Click "Iniciar Sesion" | Muestra validacion de campos requeridos | [ ] |

### 1.2 Sesion y Tokens

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 1.2.1 | Logout | 1. Login exitoso 2. Click "Cerrar Sesion" | Redirige a /login, token eliminado | [ ] |
| 1.2.2 | Acceso sin autenticacion | 1. Sin login, navegar a /admin | Redirige a /login | [ ] |
| 1.2.3 | Acceso con rol incorrecto | 1. Login como conductor 2. Navegar a /admin | Redirige a /no-autorizado | [ ] |
| 1.2.4 | Refresh de token | 1. Login exitoso 2. Esperar expiracion del access token 3. Hacer una accion | Token se renueva automaticamente, accion se completa | [ ] |

---

## 2. PORTAL DEPENDENCIA (Funcionario Solicitante)

### 2.1 Dashboard Dependencia

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.1.1 | Ver dashboard | 1. Login como infra@sopo.gov.co 2. Verificar dashboard | Muestra tarjetas con conteo por estado y solicitudes recientes | [ ] |
| 2.1.2 | Contadores actualizados | 1. Crear una solicitud 2. Volver al dashboard | Contador de ENVIADA incrementa en 1 | [ ] |

### 2.2 Crear Solicitud

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.2.1 | Crear solicitud exitosa | 1. Click "Nueva Solicitud" 2. Llenar: fecha (manana o posterior), hora inicio, origen, destino 3. Confirmar en modal de preview | Solicitud creada, redirige a detalle con estado ENVIADA | [ ] |
| 2.2.2 | Validacion fecha minima | 1. Intentar seleccionar fecha de hoy o anterior | No permite seleccionar, fecha minima es manana | [ ] |
| 2.2.3 | Campos obligatorios vacios | 1. Intentar enviar sin fecha, hora, origen o destino | Muestra error de validacion por campos requeridos | [ ] |
| 2.2.4 | Solicitud con todos los campos | 1. Llenar todos los campos: fecha, hora inicio, hora fin estimada, origen, destino, pasajeros, tipo servicio, contacto nombre, contacto telefono, observaciones | Solicitud creada con todos los datos visibles en detalle | [ ] |
| 2.2.5 | Preview antes de enviar | 1. Llenar formulario 2. Verificar modal de confirmacion | Modal muestra resumen de todos los datos ingresados | [ ] |

### 2.3 Listar Solicitudes

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.3.1 | Ver lista de solicitudes | 1. Click "Mis Solicitudes" | Muestra tabla con solicitudes de la dependencia del usuario | [ ] |
| 2.3.2 | Filtrar por estado | 1. Seleccionar filtro estado = ENVIADA | Solo muestra solicitudes con estado ENVIADA | [ ] |
| 2.3.3 | Filtrar por rango de fechas | 1. Seleccionar fecha_desde y fecha_hasta | Solo muestra solicitudes dentro del rango | [ ] |
| 2.3.4 | Paginacion | 1. Tener mas de 20 solicitudes 2. Navegar entre paginas | Paginacion funciona correctamente, 20 items por pagina | [ ] |
| 2.3.5 | No ve solicitudes de otra dependencia | 1. Login como infra@sopo.gov.co | Solo ve solicitudes de Secretaria de Infraestructura | [ ] |

### 2.4 Detalle de Solicitud

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.4.1 | Ver detalle completo | 1. Click en una solicitud de la lista | Muestra toda la info: fecha, hora, origen, destino, estado, historial | [ ] |
| 2.4.2 | Ver asignacion (si programada) | 1. Ver detalle de solicitud PROGRAMADA | Muestra vehiculo y conductor asignados | [ ] |
| 2.4.3 | Ver historial de cambios | 1. Ver detalle de solicitud con varios cambios de estado | Muestra timeline con cada cambio de estado | [ ] |

### 2.5 Cancelar Solicitud

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.5.1 | Cancelar solicitud ENVIADA | 1. Abrir detalle de solicitud ENVIADA 2. Click "Cancelar" 3. Escribir motivo (10+ chars) 4. Confirmar | Estado cambia a CANCELADA, motivo registrado | [ ] |
| 2.5.2 | Cancelar solicitud PENDIENTE_PROGRAMACION | 1. Abrir detalle en PENDIENTE_PROGRAMACION 2. Cancelar con motivo | Estado cambia a CANCELADA | [ ] |
| 2.5.3 | Motivo muy corto | 1. Intentar cancelar con motivo de menos de 10 caracteres | No permite cancelar, muestra validacion | [ ] |
| 2.5.4 | No puede cancelar PROGRAMADA | 1. Abrir detalle de solicitud PROGRAMADA | Boton cancelar no disponible | [ ] |

### 2.6 Transferir Solicitud

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 2.6.1 | Transferir a otra dependencia | 1. Abrir solicitud ENVIADA 2. Click "Transferir" 3. Seleccionar dependencia destino 4. Escribir motivo | Estado TRANSFERIDA, aparece en la otra dependencia | [ ] |
| 2.6.2 | No puede transferir PROGRAMADA | 1. Abrir solicitud PROGRAMADA | Boton transferir no disponible | [ ] |

---

## 3. PORTAL ADMINISTRADORA

### 3.1 Dashboard Admin

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.1.1 | Ver dashboard con KPIs | 1. Login como admin@sopo.gov.co | Muestra 7 tarjetas: Nuevas hoy, Pendientes programacion, Programadas, Confirmadas, En ejecucion, Servicios hoy, Docs por vencer | [ ] |
| 3.1.2 | Ver servicios del dia | 1. Verificar tabla de servicios del dia | Muestra hora, destino, vehiculo, conductor, estado de servicios programados para hoy | [ ] |
| 3.1.3 | KPIs reflejan datos reales | 1. Crear solicitud desde dependencia 2. Verificar dashboard admin | Contador "Nuevas hoy" incrementa | [ ] |

### 3.2 Gestion de Solicitudes (Admin)

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.2.1 | Listar todas las solicitudes | 1. Click "Solicitudes" | Muestra solicitudes de TODAS las dependencias | [ ] |
| 3.2.2 | Filtrar por dependencia | 1. Filtrar por dependencia = Infraestructura | Solo muestra solicitudes de esa dependencia | [ ] |
| 3.2.3 | Filtrar por estado | 1. Filtrar por estado = ENVIADA | Solo muestra solicitudes ENVIADA | [ ] |
| 3.2.4 | Filtrar por canal | 1. Filtrar por canal = web | Solo muestra solicitudes creadas por web | [ ] |
| 3.2.5 | Filtrar por rango de fechas | 1. Seleccionar rango de fechas | Solo muestra solicitudes en ese rango | [ ] |
| 3.2.6 | Filtros combinados | 1. Filtrar por estado + dependencia + fechas | Resultado correcto con todos los filtros aplicados | [ ] |

### 3.3 Programar Servicio

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.3.1 | Programar solicitud completa | 1. Abrir solicitud ENVIADA o PENDIENTE_PROGRAMACION 2. Click "Programar" 3. Seleccionar fecha, hora inicio, hora fin 4. Seleccionar vehiculo disponible 5. Seleccionar conductor disponible 6. Confirmar | Estado cambia a PROGRAMADA, asignacion creada, calendario bloqueado | [ ] |
| 3.3.2 | Verificar disponibilidad vehiculos | 1. En modal de programacion, seleccionar fecha/hora | Solo muestra vehiculos sin conflicto en ese horario | [ ] |
| 3.3.3 | Verificar disponibilidad conductores | 1. En modal de programacion, seleccionar fecha/hora | Solo muestra conductores sin conflicto en ese horario | [ ] |
| 3.3.4 | Vehiculo ya asignado no aparece | 1. Programar servicio con vehiculo X 2. Intentar programar otro servicio en mismo horario | Vehiculo X no aparece como disponible | [ ] |
| 3.3.5 | Conductor ya asignado no aparece | 1. Programar servicio con conductor Y 2. Intentar programar otro en mismo horario | Conductor Y no aparece como disponible | [ ] |

### 3.4 Rechazar / Cancelar Solicitud (Admin)

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.4.1 | Rechazar solicitud | 1. Abrir solicitud 2. Click "Rechazar" 3. Escribir motivo | Estado cambia a RECHAZADA, motivo registrado en historial | [ ] |
| 3.4.2 | Cancelar solicitud como admin | 1. Abrir solicitud 2. Click "Cancelar" 3. Escribir motivo | Estado cambia a CANCELADA | [ ] |

### 3.5 Gestion de Vehiculos

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.5.1 | Listar vehiculos | 1. Click "Vehiculos" | Muestra tabla con todos los vehiculos de la flota | [ ] |
| 3.5.2 | Filtrar por tipo | 1. Filtrar tipo = vehiculo | Solo muestra vehiculos (no maquinaria) | [ ] |
| 3.5.3 | Filtrar por estado | 1. Filtrar estado = disponible | Solo muestra vehiculos disponibles | [ ] |
| 3.5.4 | Crear vehiculo | 1. Click "Nuevo" 2. Llenar placa, tipo, marca, modelo, anio 3. Guardar | Vehiculo aparece en la lista | [ ] |
| 3.5.5 | Editar vehiculo | 1. Click editar en un vehiculo 2. Cambiar marca 3. Guardar | Datos actualizados en la lista | [ ] |
| 3.5.6 | Desactivar vehiculo | 1. Click eliminar en un vehiculo 2. Confirmar | Vehiculo desaparece de la lista (soft delete) | [ ] |
| 3.5.7 | Placa duplicada | 1. Intentar crear vehiculo con placa existente | Muestra error de placa duplicada | [ ] |

### 3.6 Gestion de Conductores

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.6.1 | Listar conductores | 1. Click "Conductores" | Muestra tabla con todos los conductores activos | [ ] |
| 3.6.2 | Crear conductor | 1. Click "Nuevo" 2. Llenar nombre, telefono, licencia, vencimiento 3. Guardar | Conductor aparece en la lista | [ ] |
| 3.6.3 | Editar conductor | 1. Click editar 2. Cambiar telefono 3. Guardar | Datos actualizados | [ ] |
| 3.6.4 | Desactivar conductor | 1. Click eliminar 2. Confirmar | Conductor desaparece de la lista | [ ] |

### 3.7 Gestion de Documentos

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.7.1 | Listar documentos | 1. Click "Documentos" | Muestra lista de documentos vehiculares | [ ] |
| 3.7.2 | Filtrar por tipo | 1. Filtrar tipo = SOAT | Solo muestra documentos SOAT | [ ] |
| 3.7.3 | Filtrar por estado | 1. Filtrar estado = vencido | Solo muestra documentos vencidos (rojo) | [ ] |
| 3.7.4 | Crear documento | 1. Click "Nuevo" 2. Seleccionar vehiculo, tipo (SOAT/Seguro/Tecnomecanica), fechas 3. Guardar | Documento creado con estado correcto segun fecha | [ ] |
| 3.7.5 | Colores por estado | 1. Verificar lista con documentos en distintos estados | Verde = vigente, Amarillo = por vencer, Rojo = vencido | [ ] |

### 3.8 Gestion de Novedades

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.8.1 | Listar novedades | 1. Click "Novedades" | Muestra novedades reportadas por conductores | [ ] |
| 3.8.2 | Filtrar por estado | 1. Filtrar estado = pendiente | Solo muestra novedades pendientes | [ ] |
| 3.8.3 | Filtrar por urgencia | 1. Filtrar urgencia = critica | Solo muestra novedades criticas | [ ] |
| 3.8.4 | Cambiar estado de novedad | 1. Seleccionar nuevo estado (en_revision, resuelto, etc.) | Estado se actualiza correctamente | [ ] |
| 3.8.5 | Badges de urgencia | 1. Verificar colores | Critica=rojo, Alta=naranja, Media=amarillo, Baja=gris | [ ] |

### 3.9 Combustible (Admin)

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 3.9.1 | Listar registros de combustible | 1. Click "Combustible" | Muestra tabla con todos los registros | [ ] |
| 3.9.2 | Filtrar por vehiculo | 1. Seleccionar un vehiculo | Solo muestra registros de ese vehiculo | [ ] |
| 3.9.3 | Filtrar por fechas | 1. Seleccionar rango de fechas | Solo registros en ese rango | [ ] |
| 3.9.4 | Tarjetas resumen | 1. Verificar tarjetas superiores | Muestra total galones y total invertido (COP) correctos | [ ] |

---

## 4. PORTAL CONDUCTOR

### 4.1 Dashboard Conductor

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 4.1.1 | Ver dashboard | 1. Login como conductor1@sopo.gov.co | Muestra 3 tarjetas: Servicios hoy, Novedades pendientes, Vehiculo asignado | [ ] |
| 4.1.2 | Ver servicios del dia | 1. Verificar lista de servicios | Muestra cards con servicios programados para hoy | [ ] |
| 4.1.3 | Ver vehiculo asignado | 1. Verificar tarjeta de vehiculo | Muestra placa y KM actual del vehiculo | [ ] |

### 4.2 Mis Servicios

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 4.2.1 | Listar servicios | 1. Click "Mis Servicios" | Muestra cards con servicios asignados | [ ] |
| 4.2.2 | Filtrar por fecha | 1. Seleccionar una fecha | Solo muestra servicios de esa fecha | [ ] |
| 4.2.3 | Ver detalle de servicio | 1. Click en un servicio | Muestra: fecha, horario, origen, destino, pasajeros, contacto, vehiculo | [ ] |

### 4.3 Iniciar y Finalizar Servicio

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 4.3.1 | Iniciar servicio | 1. Abrir servicio PROGRAMADA o CONFIRMADA 2. Click "Iniciar" 3. Ingresar km_inicial 4. Confirmar | Estado cambia a EN_EJECUCION, km registrado | [ ] |
| 4.3.2 | Finalizar servicio | 1. Abrir servicio EN_EJECUCION 2. Click "Finalizar" 3. Ingresar km_final 4. Confirmar | Estado cambia a FINALIZADA, km final registrado, km_actual del vehiculo actualizado | [ ] |
| 4.3.3 | No puede iniciar servicio ya iniciado | 1. Abrir servicio EN_EJECUCION | Boton "Iniciar" no disponible, solo "Finalizar" | [ ] |
| 4.3.4 | No puede finalizar servicio no iniciado | 1. Abrir servicio PROGRAMADA | Boton "Finalizar" no disponible, solo "Iniciar" | [ ] |

### 4.4 Combustible (Conductor)

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 4.4.1 | Registrar combustible | 1. Click "Combustible" 2. Llenar: fecha, galones, valor COP, KM 3. Enviar | Registro creado, aparece en historial | [ ] |
| 4.4.2 | Ver historial de combustible | 1. Verificar tabla inferior | Muestra todos los registros del vehiculo asignado | [ ] |
| 4.4.3 | Campos requeridos | 1. Intentar enviar sin llenar campos | Muestra validacion de campos requeridos | [ ] |

### 4.5 Novedades (Conductor)

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 4.5.1 | Reportar novedad | 1. Click "Novedades" 2. Seleccionar tipo (Dano mecanico, electrico, etc.) 3. Escribir descripcion 4. Seleccionar urgencia y puede_operar 5. Enviar | Novedad creada, aparece en historial y en admin | [ ] |
| 4.5.2 | Tipos de novedad | 1. Verificar dropdown de tipo | Muestra 7 opciones: Dano mecanico, electrico, carroceria, llanta, frenos, luces, otro | [ ] |
| 4.5.3 | Niveles de urgencia | 1. Verificar opciones | Muestra: baja, media, alta, critica | [ ] |
| 4.5.4 | Ver historial de novedades | 1. Verificar lista inferior | Muestra novedades reportadas con estado actual | [ ] |

---

## 5. FLUJO COMPLETO END-TO-END

### 5.1 Ciclo de vida completo de una solicitud

| # | Paso | Acciones | Resultado Esperado | Estado |
|---|------|----------|--------------------|--------|
| 5.1.1 | Dependencia crea solicitud | Login infra@sopo.gov.co > Nueva Solicitud > Llenar datos > Confirmar | Solicitud creada en estado ENVIADA | [ ] |
| 5.1.2 | Admin ve solicitud nueva | Login admin@sopo.gov.co > Dashboard | Contador "Nuevas hoy" incluye la solicitud | [ ] |
| 5.1.3 | Admin programa servicio | Solicitudes > Abrir solicitud > Programar > Seleccionar vehiculo y conductor disponibles | Estado cambia a PROGRAMADA, asignacion visible | [ ] |
| 5.1.4 | Conductor ve servicio asignado | Login conductor1@sopo.gov.co > Dashboard | Servicio aparece en "Servicios hoy" (si es para hoy) | [ ] |
| 5.1.5 | Conductor inicia servicio | Abrir servicio > Iniciar > Ingresar km_inicial | Estado EN_EJECUCION | [ ] |
| 5.1.6 | Conductor finaliza servicio | Abrir servicio > Finalizar > Ingresar km_final | Estado FINALIZADA, KM del vehiculo actualizado | [ ] |
| 5.1.7 | Admin verifica finalizacion | Dashboard admin | Servicio aparece como FINALIZADA | [ ] |
| 5.1.8 | Dependencia ve resultado | Login infra > Detalle solicitud | Estado FINALIZADA, historial completo visible | [ ] |

### 5.2 Flujo de cancelacion

| # | Paso | Acciones | Resultado Esperado | Estado |
|---|------|----------|--------------------|--------|
| 5.2.1 | Dependencia crea solicitud | Crear solicitud normalmente | Estado ENVIADA | [ ] |
| 5.2.2 | Dependencia cancela | Detalle > Cancelar > Motivo (10+ chars) | Estado CANCELADA | [ ] |
| 5.2.3 | Admin ve cancelacion | Admin > Solicitudes > Filtrar CANCELADA | Solicitud visible con motivo | [ ] |

### 5.3 Flujo de rechazo

| # | Paso | Acciones | Resultado Esperado | Estado |
|---|------|----------|--------------------|--------|
| 5.3.1 | Dependencia crea solicitud | Crear solicitud normalmente | Estado ENVIADA | [ ] |
| 5.3.2 | Admin rechaza | Admin > Solicitud > Rechazar > Motivo | Estado RECHAZADA | [ ] |
| 5.3.3 | Dependencia ve rechazo | Dependencia > Detalle | Estado RECHAZADA, motivo visible en historial | [ ] |

### 5.4 Flujo de transferencia

| # | Paso | Acciones | Resultado Esperado | Estado |
|---|------|----------|--------------------|--------|
| 5.4.1 | Infra crea solicitud | Login infra > Crear solicitud | Estado ENVIADA | [ ] |
| 5.4.2 | Infra transfiere a Gobierno | Detalle > Transferir > Seleccionar "Sec. Gobierno" > Motivo | Estado TRANSFERIDA | [ ] |
| 5.4.3 | Gobierno ve solicitud | Login gobierno@sopo.gov.co > Mis Solicitudes | Solicitud transferida visible en su lista | [ ] |

### 5.5 Flujo de novedad con mantenimiento

| # | Paso | Acciones | Resultado Esperado | Estado |
|---|------|----------|--------------------|--------|
| 5.5.1 | Conductor reporta novedad critica | Login conductor > Novedades > Tipo: Dano mecanico, Urgencia: critica, Puede operar: no | Novedad creada | [ ] |
| 5.5.2 | Admin ve novedad | Login admin > Novedades > Filtrar critica | Novedad visible con urgencia critica en rojo | [ ] |
| 5.5.3 | Admin cambia estado | Cambiar estado a "en_mantenimiento" | Estado actualizado | [ ] |
| 5.5.4 | Admin crea mantenimiento | Admin > (si aplica) crear mantenimiento para el vehiculo | Vehiculo pasa a estado "mantenimiento" | [ ] |

---

## 6. NAVEGACION Y UI

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 6.1 | Menu admin muestra 7 opciones | Login admin > Verificar navegacion | Dashboard, Solicitudes, Vehiculos, Conductores, Documentos, Novedades, Combustible | [ ] |
| 6.2 | Menu dependencia muestra 3 opciones | Login dependencia > Verificar navegacion | Dashboard, Nueva Solicitud, Mis Solicitudes | [ ] |
| 6.3 | Menu conductor muestra 4 opciones | Login conductor > Verificar navegacion | Dashboard, Mis Servicios, Combustible, Novedades | [ ] |
| 6.4 | Link activo resaltado | Navegar entre secciones | Link actual tiene estilo diferente (color primario) | [ ] |
| 6.5 | Nombre de usuario visible | Verificar header | Muestra nombre del usuario logueado | [ ] |
| 6.6 | Badges de estado con colores | Verificar en listas de solicitudes | Cada estado tiene su color: azul=ENVIADA, morado=PROGRAMADA, verde=CONFIRMADA, etc. | [ ] |

---

## 7. API HEALTH CHECK

| # | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|---|----------------|-------|--------------------|--------|
| 7.1 | Health endpoint | GET http://localhost:3000/api/health | Responde 200 OK | [ ] |
| 7.2 | API responde | GET http://localhost:3000/api/catalogos/tipos-servicio (con auth) | Retorna lista de tipos de servicio | [ ] |

---

## Resumen de Cobertura

| Modulo | Casos | Criticos |
|--------|-------|----------|
| Autenticacion | 10 | Login, roles, seguridad |
| Portal Dependencia | 17 | Crear solicitud, cancelar, transferir |
| Portal Admin | 27 | Programar servicio, CRUD flota, documentos |
| Portal Conductor | 14 | Iniciar/finalizar servicio, combustible, novedades |
| Flujos E2E | 16 | Ciclo completo, cancelacion, rechazo, transferencia |
| UI/Navegacion | 6 | Menus, badges, accesibilidad por rol |
| API | 2 | Health check |
| **TOTAL** | **92** | |

---

## Instrucciones de Ejecucion

1. Levantar el sistema: `docker compose up -d`
2. Ejecutar migraciones: `docker compose exec backend npx knex migrate:latest`
3. Ejecutar seeds: `docker compose exec backend npx knex seed:run`
4. Abrir http://localhost en el navegador
5. Ejecutar los casos en orden, marcando [ ] como [x] al pasar
6. Para flujos E2E, usar multiples ventanas/pestanas de incognito para simular diferentes usuarios
