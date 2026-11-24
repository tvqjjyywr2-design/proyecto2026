'use strict';

require('dotenv').config({ quiet: true });

const mysql = require('mysql2/promise');

async function main() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 15000,
  };

  console.log('Probando conexión MySQL...');
  console.log(`  Servidor : ${config.host}:${config.port}`);
  console.log(`  Usuario  : ${config.user}`);
  console.log(`  Base     : ${config.database}`);

  const connection = await mysql.createConnection(config);

  try {
    const [infoRows] = await connection.query(
      'SELECT DATABASE() AS base, USER() AS usuario, VERSION() AS version, NOW() AS fecha_servidor'
    );
    console.log('\nConexión OK');
    console.log(infoRows[0]);

    const [tables] = await connection.query('SHOW TABLES');
    const tableKey = `Tables_in_${config.database}`;
    const names = tables.map((row) => row[tableKey] || Object.values(row)[0]);

    console.log(`\nTablas encontradas (${names.length}):`);
    if (!names.length) {
      console.log('  (la base está vacía)');
    } else {
      for (const name of names) {
        const [[count]] = await connection.query(
          `SELECT COUNT(*) AS total FROM \`${name}\``
        );
        console.log(`  - ${name}: ${count.total} registros`);
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('\nConexión fallida');
  console.error(`  Código : ${error.code || 'N/D'}`);
  console.error(`  Error  : ${error.sqlMessage || error.message}`);
  process.exitCode = 1;
});
