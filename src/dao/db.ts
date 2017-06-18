import * as knex from 'knex'
import { postgres } from 'config'

const connection = {
  host: postgres.host,
  port: postgres.port,
  user: postgres.user,
  database: postgres.database,
  password: postgres.password,
}

let db = knex({
  client: 'postgres',
  connection
})

export default db
