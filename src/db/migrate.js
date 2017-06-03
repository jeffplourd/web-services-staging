let migrate = require('sql-migrations');
let path = require('path');

migrate.run({
  basedir: __dirname,
  migrationsDir: path.resolve('./src/db/migrations'),
  user: process.env.postgres_user || 'postgres',
  host: process.env.postgres_host || '192.168.99.100',
  port: process.env.postgres_port || '5432',
  db: process.env.postgres_database || 'postgres'
});