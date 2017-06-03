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

export function create(user: object): QueryBuilder {
  return db.select().from('classkick.user');
}