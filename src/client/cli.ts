import { spawnSync } from 'child_process'
import knex, { Knex } from 'knex'
import yargs from 'yargs'
import { getConfig } from 'src/client/config'

const client = knex(getConfig())

function generate() {
  const { stdout, stderr } = spawnSync('java', ['-jar', 'generator.jar', 'schema.tdsl', 'src/client/generated'])
  if (stderr?.toString()) throw new Error(stderr.toString())

  console.log(stdout.toString())
}

async function reset(): Promise<void> {
  const dropTables = await importGeneratedFunction('dropTables')

  await dropTables(client)
  console.log('Tables have been dropped')
}

async function migrate(force = false): Promise<void> {
  if (force) await reset()

  const createTables = await importGeneratedFunction('createTables')

  await createTables(client)
  console.log('Tables have been created')
}

type GeneratedFunction = 'createTables' | 'dropTables'
type GeneratedFunctionReturn<T extends GeneratedFunction> =
  | (T extends 'createTables' ? (client: Knex) => Promise<void> : never)
  | (T extends 'dropTables' ? (client: Knex) => Promise<void> : never)

async function importGeneratedFunction<T extends GeneratedFunction>(name: T): Promise<GeneratedFunctionReturn<T>> {
  const filePath = `src/client/generated/${name}`

  try {
    return await import(filePath).then(module => module[name])
  } catch (e) {
    console.log(`Could not find client files for ${name} - generating now`)
    generate()
    return await import(filePath).then(module => module[name])
  }
}

async function main(): Promise<void> {
  try {
    await yargs
      .command('generate', 'Generate client', {}, () => generate())
      .command('reset', 'Reset database', {}, () => reset())
      .command('migrate', 'Migrate database', {
        force: {
          alias: 'f',
          type: 'boolean',
          default: false,
          description: 'Force migration by dropping tables beforehand'
        }
      }, (args) => migrate(args.force)).argv
  } catch (e) {
    console.error(e)
  } finally {
    await client.destroy()
  }
}

main().then()
