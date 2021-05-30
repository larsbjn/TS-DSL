import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()


    import knex from "knex";
    import {getConfig} from "src/client/config";

async function test() {
    const client = getClient()
    const user = await client.allUsers(49)
    const user2 = await client.selectFirstNameOverAge(49)
    console.log(user)
    console.log(user2)
}

test().finally(() => process.exit())
