import * as knex from 'knex'
import { postgres } from 'config'
import * as fs from 'fs'
import * as path from 'path'
import * as pg from 'pg'

const connection = {
  host: process.env.DB_HOST || postgres.host,
  port: process.env.DB_PORT || postgres.port,
  user: process.env.DB_USER  || postgres.user,
  database: postgres.database,
  password: process.env.DB_PASSWORD || postgres.password,
}

console.log('connection config: ', connection)

// if (postgres.ssl) {
//   console.log('ssl certs')
//   connection['ssl'] = {
//     ca: fs.readFileSync(path.resolve(postgres.ssl.ca)).toString(),
//     key: fs.readFileSync(path.resolve(postgres.ssl.key)).toString(),
//     cert: fs.readFileSync(path.resolve(postgres.ssl.cert)).toString()
//   }
// }

let db = knex({
  client: 'postgres',
  connection
})

export default db
