import * as knex from 'knex'
import { postgres } from 'config'
import * as fs from 'fs'
import * as path from 'path'
import * as pg from 'pg'

const connection = {
  host : '127.0.0.1', //postgres.host,
  port: postgres.port,
  user : process.env.DB_USER  || postgres.user,
  database : postgres.database,
  password: process.env.DB_PASSWORD || postgres.password,
  // max: 10,
  // idleTimeoutMillis: 30000
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
  connection,
  pool: {
    afterCreate: function (conn, done) {
      console.log('connected')
      done()
    }
  }
})

export default db
