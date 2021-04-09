import knex, { Knex } from 'knex'
import dotenv from 'dotenv'

dotenv.config()

const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST!,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER,
  }
}

const client = knex(config)

async function createDatabase(): Promise<void> {
  let query = client.schema

  query = query.dropTableIfExists('user')
  query = query.dropTableIfExists('address')

  query = query.createTable('user', function (table) {
    table.increments('id')
    table.string('name').notNullable()
    table.integer('age').notNullable()
    table.string('phone')
    table.string('email').notNullable()
    table.integer('address_id').unsigned()
  })

  query = query.createTable('address', function (table) {
    table.increments('id')
    table.string('street').notNullable()
    table.integer('zipcode').notNullable()
    table.string('city').notNullable()
    table.integer('user_id').unsigned()
  })

  query = query.alterTable('address', function (table) {
    table.foreign('user_id').references('user.id')
  })

  query = query.alterTable('user', function (table) {
    table.foreign('address_id').references('address.id')
  })

  return query
}

createDatabase().then(() => process.exit())
