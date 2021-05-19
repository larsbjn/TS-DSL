import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()

async function test() {
    const client = getClient()
    console.log(await client.test(99))
}

test().finally(() => process.exit())
