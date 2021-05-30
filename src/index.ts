import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()

async function test() {
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

  console.log('Created:', newLars)
  console.log('Created:', newFred)

  const lars = await client.user.findFirst({
    where: {
      id: { gte: 1 },
      firstName: { contains: 'L' },
      lastName: 'Larsen',
      NOT: { email: { contains: 'yahoo' } }
    },
    select: {
      id: true,
      firstName: true,
      phone: true
    }
  })

  console.log('Found:', lars)

  const updatedLars = await client.user.update({
    where: {
      firstName: 'Lars'
    },
    data: {
      lastName: 'Jørgensen'
    }
  })

  console.log('Updated:', updatedLars)

  /*const numberOfLarsRemoved = await client.user.delete({
    firstName: 'Lars'
  })

  console.log('Lars\' purged:', numberOfLarsRemoved)*/
}

test().finally(() => process.exit())
