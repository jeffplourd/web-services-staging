let migrate = require('sql-migrations');
let path = require('path');
let defaultConfig = require('../config/application.json');

migrate.run({
  basedir: __dirname,
  migrationsDir: path.resolve('./src/db/migrations'),
  user: process.env.postgres_user || defaultConfig.postgres.user,
  host: process.env.postgres_host || defaultConfig.postgres.host,
  port: process.env.postgres_port || defaultConfig.postgres.port,
  db: process.env.postgres_database || defaultConfig.postgres.database,
  password: process.env.postgres_password || defaultConfig.postgres.password
});