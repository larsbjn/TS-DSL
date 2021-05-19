import { Knex } from 'knex'
import { join } from 'path'
import dotenv from 'dotenv'
// @ts-ignore
import knexStringcase from 'knex-stringcase'

dotenv.config({ path: join(__dirname, 'generated/.env') })

export function getConfig(): Knex.Config {
  return knexStringcase({
    debug: false,
    client: 'sqlite3',
    connection: {
      filename: process.env.FILEPATH
    }
  })
}
