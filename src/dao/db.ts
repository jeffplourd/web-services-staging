import * as knex from 'knex'
import { postgres } from 'config'
import * as fs from 'fs'
import * as path from 'path'
import * as pg from 'pg'

const connection = {
  host : postgres.host,
  port: postgres.port,
  user : postgres.user,
  database : postgres.database,
  password: postgres.password,
  max: 10,
  idleTimeoutMillis: 30000
}



if (postgres.ssl) {
  console.log('ssl certs')
  connection['ssl'] = {
    ca: fs.readFileSync(path.resolve(postgres.ssl.ca)).toString(),
    key: fs.readFileSync(path.resolve(postgres.ssl.key)).toString(),
    cert: fs.readFileSync(path.resolve(postgres.ssl.cert)).toString()
  }
}

const pool = new pg.Pool(connection)

// let db = knex({
//   client: 'postgres',
//   connection,
//   debug: true,
//   pool: {
//     afterCreate: function (conn, done) {
//       console.log('connected')
//       done()
//     }
//   }
// })

export function query(text, values, callback) {
  console.log('query:', text, values)
  return pool.query(text, values, callback)
}

export function connect(callback) {
  return pool.connect(callback)
}

// export default pool
