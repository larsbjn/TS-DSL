import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()


    import knex from "knex";
    import {getConfig} from "src/client/config";

async function test() {
    const client = getClient()
    const users = await client.allUsers()
    const userLastname = await client.selectLastNameOverLegalAgeByFirstName("Lars")
    const deleteUsers = await client.deleteUserByFirstNameOrUnderCertainAge("Lars", 23)

    console.log(users)
    console.log(userLastname)
    console.log(deleteUsers)
}

test().finally(() => process.exit())
