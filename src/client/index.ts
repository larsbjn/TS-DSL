import { Knex } from 'knex'

// @ts-ignore
declare module 'src/client/generated/createTables' {
  export default function (knex: Knex): Promise<void>
}

// @ts-ignore
export { createTables } from 'src/client/generated/createTables'
