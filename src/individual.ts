import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()

async function test() {
    const client = getClient()
    const user = await client.test(99)
    const fred = await client.selectUser(100)
    console.log(user)
    console.log(fred)
}

test().finally(() => process.exit())
