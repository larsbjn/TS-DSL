import { Knex } from 'knex'
import { join } from 'path'
import dotenv from 'dotenv'
// @ts-ignore
import knexStringcase from 'knex-stringcase'

dotenv.config({ path: join(__dirname, 'generated/.env') })

export function getConfig(): Knex.Config {
  return knexStringcase({
    debug: false,
    client: 'mysql2',
    connection: {
      host: process.env.DATABASE_HOST!,
      database: process.env.DATABASE_NAME,
      port: Number(process.env.DATABASE_PORT!),
      user: process.env.DATABASE_USER,
    }
  })
}
