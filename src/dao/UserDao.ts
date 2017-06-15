import * as uuid from 'uuid'
import * as db from './db'
import { QueryBuilder } from 'knex'

export function getByEmail(email: string) {
  // return db.select().from('classkick.user').where({
  //   email: email
  // });
  console.log('getByEmail')
  return new Promise((resolve) => {
    db.query('select * from classkick.user;', [], (data) => {
      console.log('create data', data)
      resolve(data)
    })
  })
}

export function getById(id: string) {
  // return db.select().from('classkick.user').where({
  //   id: id
  // });
  console.log('getById')
  return new Promise((resolve) => {
    db.query('select * from classkick.user;', [], (data) => {
      console.log('create data', data)
      resolve(data)
    })
  })
}

export function create(user: any) {
  // return db.insert({
  //   id: uuid.v1(),
  //   email: user.email,
  //   created: '2017-06-03 18:20:36',
  //   last_login: '2017-06-03 18:20:36'
  // }).into('classkick.user')
  console.log('create')
  return new Promise((resolve) => {
    db.query('select * from classkick.user;', [], (data) => {
      console.log('create data', data)
      resolve(data)
    })
  })
}

export function getAll() {
  // return db.select().from('classkick.user');
  console.log('getAll')
  return new Promise((resolve) => {
    db.query('select * from classkick.user;', [], (error, data) => {
      console.log('create data', error, data)
      resolve(data)
    })
  })
}
