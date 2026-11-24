'use strict';

require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Contraseña común para todas las cuentas de prueba.
const TEST_PASSWORD = 'Prueba2026!';

const admins = [
  {
    Apellido_y_Nombre: 'Acosta, Lucía',
    Email: 'admin.prueba01@golfstore.com',
    N_Movil: '+54 11 6000-0001',
    Usuario: 'adminprueba01',
    Rol: 'SuperAdmin',
    Activo: 1,
    Ultimo_Login: '2026-11-18 08:30:00',
    Intentos_Fallidos: 0,
  },
  {
    Apellido_y_Nombre: 'Bustos, Martín',
    Email: 'admin.prueba02@golfstore.com',
    N_Movil: '+54 11 6000-0002',
    Usuario: 'adminprueba02',
    Rol: 'Admin',
    Activo: 1,
    Ultimo_Login: '2026-11-17 17:45:00',
    Intentos_Fallidos: 1,
  },
  {
    Apellido_y_Nombre: 'Coronel, Sofía',
    Email: 'admin.prueba03@golfstore.com',
    N_Movil: '+54 11 6000-0003',
    Usuario: 'adminprueba03',
    Rol: 'Editor',
    Activo: 1,
    Ultimo_Login: '2026-11-16 10:20:00',
    Intentos_Fallidos: 0,
  },
  {
    Apellido_y_Nombre: 'Duarte, Pablo',
    Email: 'admin.prueba04@golfstore.com',
    N_Movil: '+54 11 6000-0004',
    Usuario: 'adminprueba04',
    Rol: 'Admin',
    Activo: 1,
    Ultimo_Login: '2026-11-15 09:05:00',
    Intentos_Fallidos: 2,
  },
  {
    Apellido_y_Nombre: 'Echeverría, Paula',
    Email: 'admin.prueba05@golfstore.com',
    N_Movil: '+54 11 6000-0005',
    Usuario: 'adminprueba05',
    Rol: 'Editor',
    Activo: 0,
    Ultimo_Login: '2026-10-01 14:00:00',
    Intentos_Fallidos: 5,
  },
  {
    Apellido_y_Nombre: 'Figueroa, Diego',
    Email: 'admin.prueba06@golfstore.com',
    N_Movil: '+54 11 6000-0006',
    Usuario: 'adminprueba06',
    Rol: 'Admin',
    Activo: 1,
    Ultimo_Login: null,
    Intentos_Fallidos: 0,
  },
  {
    Apellido_y_Nombre: 'Gutiérrez, Ana',
    Email: 'admin.prueba07@golfstore.com',
    N_Movil: '+54 11 6000-0007',
    Usuario: 'adminprueba07',
    Rol: 'Editor',
    Activo: 1,
    Ultimo_Login: '2026-11-13 11:10:00',
    Intentos_Fallidos: 1,
  },
  {
    Apellido_y_Nombre: 'Ledesma, Bruno',
    Email: 'admin.prueba08@golfstore.com',
    N_Movil: '+54 11 6000-0008',
    Usuario: 'adminprueba08',
    Rol: 'Admin',
    Activo: 1,
    Ultimo_Login: '2026-11-12 08:40:00',
    Intentos_Fallidos: 0,
  },
  {
    Apellido_y_Nombre: 'Molina, Carla',
    Email: 'admin.prueba09@golfstore.com',
    N_Movil: '+54 11 6000-0009',
    Usuario: 'adminprueba09',
    Rol: 'Editor',
    Activo: 0,
    Ultimo_Login: '2026-09-20 16:25:00',
    Intentos_Fallidos: 3,
  },
  {
    Apellido_y_Nombre: 'Navarro, Emiliano',
    Email: 'admin.prueba10@golfstore.com',
    N_Movil: '+54 11 6000-0010',
    Usuario: 'adminprueba10',
    Rol: 'Admin',
    Activo: 1,
    Ultimo_Login: '2026-11-10 19:00:00',
    Intentos_Fallidos: 0,
  },
];

const users = [
  {
    Apellido_y_Nombre: 'Álvarez, Martina',
    Residencia: 'Av. del Libertador 2200, CABA',
    N_Movil: '+54 11 7000-0001',
    Email: 'prueba01@golfstore.com',
    Usuario: 'prueba01',
    Recibe_Publicidad: 1,
    Fecha_Registracion: '2026-01-12 09:15:00',
    Email_Verificado: 1,
    Activo: 1,
    Ultimo_Acceso: '2026-11-18 10:00:00',
  },
  {
    Apellido_y_Nombre: 'Benítez, Nicolás',
    Residencia: 'Calle 50 1234, La Plata',
    N_Movil: '+54 221 7000-0002',
    Email: 'prueba02@golfstore.com',
    Usuario: 'prueba02',
    Recibe_Publicidad: 0,
    Fecha_Registracion: '2026-02-03 12:30:00',
    Email_Verificado: 1,
    Activo: 1,
    Ultimo_Acceso: '2026-11-17 15:20:00',
  },
  {
    Apellido_y_Nombre: 'Castro, Valentina',
    Residencia: 'Bv. San Juan 450, Córdoba',
    N_Movil: '+54 351 7000-0003',
    Email: 'prueba03@golfstore.com',
    Usuario: 'prueba03',
    Recibe_Publicidad: 1,
    Fecha_Registracion: '2026-03-21 08:45:00',
    Email_Verificado: 1,
    Activo: 1,
    Ultimo_Acceso: '2026-11-16 18:05:00',
  },
  {
    Apellido_y_Nombre: 'Domínguez, Facundo',
    Residencia: 'San Martín 789, Rosario',
    N_Movil: '+54 341 7000-0004',
    Email: 'prueba04@golfstore.com',
    Usuario: 'prueba04',
    Recibe_Publicidad: 0,
    Fecha_Registracion: '2026-04-08 16:10:00',
    Email_Verificado: 0,
    Activo: 1,
    Ultimo_Acceso: '2026-11-15 11:40:00',
  },
  {
    Apellido_y_Nombre: 'Escobar, Camila',
    Residencia: 'Ruta 9 km 12, Salta',
    N_Movil: '+54 387 7000-0005',
    Email: 'prueba05@golfstore.com',
    Usuario: 'prueba05',
    Recibe_Publicidad: 1,
    Fecha_Registracion: '2026-05-19 10:00:00',
    Email_Verificado: 1,
    Activo: 0,
    Ultimo_Acceso: '2026-09-01 09:30:00',
  },
  {
    Apellido_y_Nombre: 'Ferreyra, Tomás',
    Residencia: 'Av. Colón 2000, Mar del Plata',
    N_Movil: '+54 223 7000-0006',
    Email: 'prueba06@golfstore.com',
    Usuario: 'prueba06',
    Recibe_Publicidad: 0,
    Fecha_Registracion: '2026-06-02 14:25:00',
    Email_Verificado: 1,
    Activo: 1,
    Ultimo_Acceso: null,
  },
  {
    Apellido_y_Nombre: 'Giménez, Lucía',
    Residencia: 'Mitre 321, Mendoza',
    N_Movil: '+54 261 7000-0007',
    Email: 'prueba07@golfstore.com',
    Usuario: 'prueba07',
    Recibe_Publicidad: 1,
    Fecha_Registracion: '2026-07-14 11:55:00',
    Email_Verificado: 0,
    Activo: 1,
    Ultimo_Acceso: '2026-11-12 20:15:00',
  },
  {
    Apellido_y_Nombre: 'Herrera, Joaquín',
    Residencia: 'Sarmiento 654, Tucumán',
    N_Movil: '+54 381 7000-0008',
    Email: 'prueba08@golfstore.com',
    Usuario: 'prueba08',
    Recibe_Publicidad: 0,
    Fecha_Registracion: '2026-08-25 17:35:00',
    Email_Verificado: 1,
    Activo: 1,
    Ultimo_Acceso: '2026-11-11 13:10:00',
  },
  {
    Apellido_y_Nombre: 'Ibarra, Julieta',
    Residencia: 'Belgrano 987, Neuquén',
    N_Movil: '+54 299 7000-0009',
    Email: 'prueba09@golfstore.com',
    Usuario: 'prueba09',
    Recibe_Publicidad: 1,
    Fecha_Registracion: '2026-09-30 09:05:00',
    Email_Verificado: 1,
    Activo: 1,
    Ultimo_Acceso: '2026-11-10 08:50:00',
  },
  {
    Apellido_y_Nombre: 'Juárez, Mateo',
    Residencia: '9 de Julio 147, Bahía Blanca',
    N_Movil: '+54 291 7000-0010',
    Email: 'prueba10@golfstore.com',
    Usuario: 'prueba10',
    Recibe_Publicidad: 0,
    Fecha_Registracion: '2026-10-05 19:40:00',
    Email_Verificado: 0,
    Activo: 1,
    Ultimo_Acceso: null,
  },
];

const products = [
  {
    Nombre_Corto: 'Test Polo Tech Caballero',
    Descripcion: 'Polo técnico de golf con tejido transpirable y protección UV.',
    Precio: 389.9,
    Porcentaje_Oferta: 10,
    Stock: 40,
    Marca: 'FairwayPro',
    Tallas: 'S,M,L,XL',
    Tipo: 'Adulto Masculino',
  },
  {
    Nombre_Corto: 'Test Polo Aurora Dama',
    Descripcion: 'Polo femenino de secado rápido con detalles en contraste.',
    Precio: 429.0,
    Porcentaje_Oferta: 15,
    Stock: 35,
    Marca: 'GreenLine',
    Tallas: 'XS,S,M,L',
    Tipo: 'Adulto Femenino',
  },
  {
    Nombre_Corto: 'Test Pantalón Chino Tour',
    Descripcion: 'Pantalón chino elástico para caminar la cancha con comodidad.',
    Precio: 649.9,
    Porcentaje_Oferta: 0,
    Stock: 28,
    Marca: 'LinksWear',
    Tallas: '38,40,42,44',
    Tipo: 'Adulto Masculino',
  },
  {
    Nombre_Corto: 'Test Falda Sport Birdie',
    Descripcion: 'Falda deportiva con short interno y cintura elastizada.',
    Precio: 379.5,
    Porcentaje_Oferta: 20,
    Stock: 22,
    Marca: 'Birdie',
    Tallas: 'S,M,L',
    Tipo: 'Adulto Femenino',
  },
  {
    Nombre_Corto: 'Test Campera Windproof',
    Descripcion: 'Campera rompevientos liviana para rondas con viento.',
    Precio: 899.0,
    Porcentaje_Oferta: 25,
    Stock: 15,
    Marca: 'TeeMaster',
    Tallas: 'M,L,XL,XXL',
    Tipo: 'Adulto Masculino',
  },
  {
    Nombre_Corto: 'Test Conjunto Niño Eagle',
    Descripcion: 'Conjunto infantil de dos piezas con estampado de águilas.',
    Precio: 299.9,
    Porcentaje_Oferta: 5,
    Stock: 50,
    Marca: 'BirdieKids',
    Tallas: '4,6,8,10',
    Tipo: 'Infantil Niños',
  },
  {
    Nombre_Corto: 'Test Conjunto Niña Blossom',
    Descripcion: 'Conjunto infantil floral con calza y remera de algodón.',
    Precio: 329.9,
    Porcentaje_Oferta: 10,
    Stock: 45,
    Marca: 'LittleGolf',
    Tallas: '2,4,6,8',
    Tipo: 'Infantil Niñas',
  },
  {
    Nombre_Corto: 'Test Gorra Tour Visor',
    Descripcion: 'Gorra deportiva con visera curva y banda absorbente.',
    Precio: 149.9,
    Porcentaje_Oferta: 0,
    Stock: 80,
    Marca: 'FairwayPro',
    Tallas: 'Unica',
    Tipo: 'Adulto Masculino',
  },
  {
    Nombre_Corto: 'Test Media Deportiva Pack 3',
    Descripcion: 'Pack de tres pares de medias de golf con refuerzo en talón.',
    Precio: 89.9,
    Porcentaje_Oferta: 0,
    Stock: 0,
    Marca: 'GreenLine',
    Tallas: '35-38,39-42,43-46',
    Tipo: 'Adulto Femenino',
  },
  {
    Nombre_Corto: 'Test Chaqueta Links Dama',
    Descripcion: 'Chaqueta femenina abrigada con bolsillos laterales.',
    Precio: 759.0,
    Porcentaje_Oferta: 30,
    Stock: 18,
    Marca: 'LinksWear',
    Tallas: 'S,M,L,XL',
    Tipo: 'Adulto Femenino',
  },
];

const purchasePlans = [
  {
    userIndex: 0,
    productIndex: 0,
    cantidad: 1,
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'Tarjeta',
    Entregado: 0,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-01 10:00:00',
    Fecha_Pago: '2026-11-01 10:05:00',
    Fecha_Entrega: null,
  },
  {
    userIndex: 1,
    productIndex: 1,
    cantidad: 2,
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'Transferencia',
    Entregado: 1,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-02 12:20:00',
    Fecha_Pago: '2026-11-02 12:25:00',
    Fecha_Entrega: '2026-11-05 16:00:00',
  },
  {
    userIndex: 2,
    productIndex: 2,
    cantidad: 1,
    Tipo: 'En proceso',
    Estado_Pago: 'Pendiente',
    Metodo_Pago: null,
    Entregado: 0,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-18 09:10:00',
    Fecha_Pago: null,
    Fecha_Entrega: null,
  },
  {
    userIndex: 3,
    productIndex: 3,
    cantidad: 1,
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'MercadoPago',
    Entregado: 1,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-03 15:40:00',
    Fecha_Pago: '2026-11-03 15:42:00',
    Fecha_Entrega: '2026-11-06 11:30:00',
  },
  {
    userIndex: 4,
    productIndex: 4,
    cantidad: 1,
    Tipo: 'Finalizada',
    Estado_Pago: 'Rechazado',
    Metodo_Pago: 'Tarjeta',
    Entregado: 0,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-04 18:00:00',
    Fecha_Pago: null,
    Fecha_Entrega: null,
  },
  {
    userIndex: 5,
    productIndex: 5,
    cantidad: 3,
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'Efectivo',
    Entregado: 0,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-05 09:30:00',
    Fecha_Pago: '2026-11-05 09:35:00',
    Fecha_Entrega: null,
  },
  {
    userIndex: 6,
    productIndex: 6,
    cantidad: 2,
    Tipo: 'En proceso',
    Estado_Pago: 'Pendiente',
    Metodo_Pago: null,
    Entregado: 0,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-18 11:35:00',
    Fecha_Pago: null,
    Fecha_Entrega: null,
  },
  {
    userIndex: 7,
    productIndex: 7,
    cantidad: 1,
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'Tarjeta',
    Entregado: 1,
    Es_Black_Friday: 1,
    descuentoPct: 10,
    Fecha_Transaccion: '2026-11-17 20:30:00',
    Fecha_Pago: '2026-11-17 20:31:00',
    Fecha_Entrega: '2026-11-19 09:00:00',
  },
  {
    userIndex: 8,
    productIndex: 8,
    cantidad: 2,
    Tipo: 'Finalizada',
    Estado_Pago: 'Reembolsado',
    Metodo_Pago: 'MercadoPago',
    Entregado: 0,
    Es_Black_Friday: 0,
    descuentoPct: 0,
    Fecha_Transaccion: '2026-11-06 14:10:00',
    Fecha_Pago: '2026-11-06 14:12:00',
    Fecha_Entrega: null,
  },
  {
    userIndex: 9,
    productIndex: 9,
    cantidad: 1,
    Tipo: 'Finalizada',
    Estado_Pago: 'Pagado',
    Metodo_Pago: 'Transferencia',
    Entregado: 0,
    Es_Black_Friday: 1,
    descuentoPct: 15,
    Fecha_Transaccion: '2026-11-17 21:15:00',
    Fecha_Pago: '2026-11-17 21:20:00',
    Fecha_Entrega: null,
  },
];

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function priceWithOffer(product) {
  return round2(product.Precio * (1 - product.Porcentaje_Oferta / 100));
}

async function main() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 15000,
  };

  const connection = await mysql.createConnection(config);

  try {
    // Evita duplicar la carga si el script se ejecuta dos veces.
    const [[existingUsers]] = await connection.query(
      "SELECT COUNT(*) AS total FROM Usuarios WHERE Usuario LIKE 'prueba%'"
    );
    const [[existingAdmins]] = await connection.query(
      "SELECT COUNT(*) AS total FROM Administrador WHERE Usuario LIKE 'adminprueba%'"
    );
    const [[existingProducts]] = await connection.query(
      "SELECT COUNT(*) AS total FROM productos WHERE Nombre_Corto LIKE 'Test %'"
    );

    if (Number(existingUsers.total) || Number(existingAdmins.total) || Number(existingProducts.total)) {
      throw new Error(
        'Ya existen datos de prueba (usuarios prueba*, administradores adminprueba* o productos "Test *"). ' +
          'Carga cancelada para no duplicar registros.'
      );
    }

    const claveHash = await bcrypt.hash(TEST_PASSWORD, 10);

    await connection.beginTransaction();

    try {
      const adminIds = [];
      for (const admin of admins) {
        const [result] = await connection.query('INSERT INTO Administrador SET ?', [
          { ...admin, Clave: claveHash },
        ]);
        adminIds.push(result.insertId);
      }

      const userIds = [];
      for (const user of users) {
        const [result] = await connection.query('INSERT INTO Usuarios SET ?', [
          { ...user, Clave: claveHash },
        ]);
        userIds.push(result.insertId);
      }

      const productIds = [];
      for (const product of products) {
        const [result] = await connection.query('INSERT INTO productos SET ?', [product]);
        productIds.push(result.insertId);
      }

      const purchaseIds = [];
      for (const plan of purchasePlans) {
        const product = products[plan.productIndex];
        const unitPrice = priceWithOffer(product);
        const subtotal = round2(plan.cantidad * unitPrice);
        const discount = round2((subtotal * plan.descuentoPct) / 100);
        const importe = round2(subtotal - discount);

        const [result] = await connection.query('INSERT INTO Proceso_Compra SET ?', [
          {
            Tipo: plan.Tipo,
            Importe: importe,
            idUsuario: userIds[plan.userIndex],
            Entregado: plan.Entregado,
            Estado_Pago: plan.Estado_Pago,
            Metodo_Pago: plan.Metodo_Pago,
            Fecha_Transaccion: plan.Fecha_Transaccion,
            Fecha_Pago: plan.Fecha_Pago,
            Fecha_Entrega: plan.Fecha_Entrega,
            Es_Black_Friday: plan.Es_Black_Friday,
            Descuento_Aplicado: discount,
          },
        ]);
        purchaseIds.push(result.insertId);
      }

      let detailCount = 0;
      for (const [index, plan] of purchasePlans.entries()) {
        const product = products[plan.productIndex];
        const unitPrice = priceWithOffer(product);
        const subtotal = round2(plan.cantidad * unitPrice);

        await connection.query('INSERT INTO Detalle_Compra SET ?', [
          {
            idTransaccion: purchaseIds[index],
            idProductos: productIds[plan.productIndex],
            Cantidad: plan.cantidad,
            Precio_Unitario: unitPrice,
            Subtotal: subtotal,
          },
        ]);
        detailCount += 1;
      }

      await connection.commit();

      console.log('Carga de datos de prueba completada.\n');
      console.log(`Administrador : ${admins.length} registros (ids ${adminIds[0]}..${adminIds.at(-1)})`);
      console.log(`Usuarios      : ${users.length} registros (ids ${userIds[0]}..${userIds.at(-1)})`);
      console.log(`productos     : ${products.length} registros (ids ${productIds[0]}..${productIds.at(-1)})`);
      console.log(`Proceso_Compra: ${purchaseIds.length} registros (ids ${purchaseIds[0]}..${purchaseIds.at(-1)})`);
      console.log(`Detalle_Compra: ${detailCount} registros`);
      console.log(`\nContraseña de cuentas de prueba: ${TEST_PASSWORD}`);
      console.log('Usuarios: prueba01 .. prueba10');
      console.log('Admins  : adminprueba01 .. adminprueba10');
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log('\nTotales actuales por tabla:');
    for (const table of [
      'Administrador',
      'Usuarios',
      'productos',
      'Proceso_Compra',
      'Detalle_Compra',
    ]) {
      const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      console.log(`  - ${table}: ${count.total}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('\nError en la carga de datos de prueba:');
  console.error(`  ${error.sqlMessage || error.message}`);
  process.exitCode = 1;
});
