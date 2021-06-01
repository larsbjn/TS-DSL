import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()

async function generateData() {
    const client = getClient()

    const newLars = await client.user.create({
        firstName: 'Lars',
        lastName: 'Larsen',
        age: 99,
        email: 'lars@larsen.com',
        phone: '12345678'
    })

    const newFred = await client.user.create({
        firstName: 'Frederik',
        lastName: 'Frederiksen',
        age: 100,
        email: 'frederik@frederiksen.com',
        phone: '87654321'
    })
}

async function test() {
    await generateData()
    const client = getClient()
    const users = await client.allUsers()
    const userLastname = await client.selectLastNameOverLegalAgeByFirstName("Lars")
    const deleteUsers = await client.deleteUserByFirstNameOrUnderCertainAge("Lars", 23)

    console.log(users)
    console.log(userLastname)
    console.log("Deleted count: " + deleteUsers)
}

test().finally(() => process.exit())
