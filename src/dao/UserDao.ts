import * as uuid from 'uuid'
import db from './db'
import { QueryBuilder } from 'knex'

export function getByEmail(email: string): QueryBuilder {
  return db.select().from('classkick.user').where({
    email: email
  });
}

export function getById(id: string): QueryBuilder {
  return db.select().from('classkick.user').where({
    id: id
  });
}

export function create(user: any): QueryBuilder {
  return db
    .insert({
      id: uuid.v1(),
      email: user.email,
      created: '2017-06-03 18:20:36',
      last_login: '2017-06-03 18:20:36'
    })
    .into('classkick.user')
}

export function getAll(): QueryBuilder {
  return db.select().from('classkick.user');
}
