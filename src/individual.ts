import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()

async function test() {
    const client = getClient()

}

test().finally(() => process.exit())
