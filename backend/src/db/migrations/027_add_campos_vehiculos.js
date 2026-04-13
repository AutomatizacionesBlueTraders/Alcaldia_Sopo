exports.up = function (knex) {
  return knex.schema.alterTable('vehiculos', (t) => {
    t.string('placa_inventario').nullable();
    t.string('propiedad').nullable();
    t.string('custodia_administrativa').nullable();
    t.string('uso_operativo').nullable();
    t.string('no_licencia_transito').nullable();
    t.string('tipo_servicio').nullable();
    t.string('clase_vehiculo').nullable();
    t.string('linea').nullable();
    t.string('motor').nullable();
    t.string('chasis').nullable();
    t.string('vin').nullable();
    t.integer('cilindraje').nullable();
    t.decimal('capacidad_toneladas', 10, 2).nullable();
    t.integer('capacidad_pasajeros').nullable();
    t.string('tipo_carroceria').nullable();
    t.string('tipo_combustible').nullable();
    t.string('fecha_matricula').nullable();
    t.string('sec_transito').nullable();
    t.text('descripcion').nullable();
    t.string('cod_fasecolda').nullable();
    t.decimal('valor_asegurado', 15, 2).nullable();
    t.text('observaciones').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('vehiculos', (t) => {
    t.dropColumn('placa_inventario');
    t.dropColumn('propiedad');
    t.dropColumn('custodia_administrativa');
    t.dropColumn('uso_operativo');
    t.dropColumn('no_licencia_transito');
    t.dropColumn('tipo_servicio');
    t.dropColumn('clase_vehiculo');
    t.dropColumn('linea');
    t.dropColumn('motor');
    t.dropColumn('chasis');
    t.dropColumn('vin');
    t.dropColumn('cilindraje');
    t.dropColumn('capacidad_toneladas');
    t.dropColumn('capacidad_pasajeros');
    t.dropColumn('tipo_carroceria');
    t.dropColumn('tipo_combustible');
    t.dropColumn('fecha_matricula');
    t.dropColumn('sec_transito');
    t.dropColumn('descripcion');
    t.dropColumn('cod_fasecolda');
    t.dropColumn('valor_asegurado');
    t.dropColumn('observaciones');
  });
};
