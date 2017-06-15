import * as knex from 'knex'
import { postgres } from 'config'
import * as fs from 'fs'
import * as path from 'path'

const connection = {
  host : postgres.host,
  port: postgres.port,
  user : postgres.user,
  database : postgres.database,
  password: postgres.password,
  requestTimeout: 1
}

if (postgres.ssl) {
  console.log('ssl certs')
  connection['ssl'] = {
    ca: fs.readFileSync(path.resolve(postgres.ssl.ca)).toString(),
    key: fs.readFileSync(path.resolve(postgres.ssl.key)).toString(),
    cert: fs.readFileSync(path.resolve(postgres.ssl.cert)).toString()
  }
}

let db = knex({
  client: 'postgres',
  connection,
  debug: true,
  pool: {
    min: 2,
    max: 2,
    afterCreate: function (conn, done) {
      console.log('connected')
      done()
    }
  },
  acquireConnectionTimeout: 2
})



export default db
