import { Knex } from 'knex'
import dotenv from 'dotenv'

dotenv.config()

export const config: Knex.Config = {
  debug: false,
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST!,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER,
  }
}
