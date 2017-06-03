import * as knex from 'knex';

let db = knex({
  client: 'postgres',
  connection: {
    host : process.env.postgres_host || '192.168.99.100',
    port: process.env.postgres_port || '5432',
    user : process.env.postgres_user || 'postgres',
    database : process.env.postgres_database || 'postgres'
  }
});

export default db;