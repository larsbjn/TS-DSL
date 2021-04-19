import dotenv from 'dotenv'
import { getClient } from 'src/client/getClient'

dotenv.config()

async function test() {
  const client = getClient()

  const user = await client.user.findFirst({
    where: {
      id: 1,
      firstName: { contains: 'L' },
      // NOT: { id: { gte: 2, in: 3 } }
    },
    select: {
      id: true,
      firstName: true,
    }
  })

  console.log('Found:', user)

  const lars = await client.user.create({
    firstName: 'Lars',
    lastName: 'Larsen',
    age: 99,
    email: 'lars@larsen.com',
    phone: '12345678'
  })

  console.log('Created:', lars)

  const numberOfLarsRemoved = await client.user.delete({
    firstName: 'Lars'
  })

  console.log('Lars\' purged:', numberOfLarsRemoved)
}

test().finally(() => process.exit())
