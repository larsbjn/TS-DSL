import dotenv from 'dotenv'
import { generateClient } from 'src/client/Client'

dotenv.config()

async function test() {
  const client = generateClient()

  const user = await client.user.findFirst({
    where: {
      id: 1,
      firstName: { contains: 'J' },
      // NOT: { id: { gte: 2, in: 3 } }
    },
    select: {
      id: true,
      firstName: true,
    }
  })

  const numberOfLarsRemoved = client.user.delete({
    firstName: 'Lars'
  })

  console.log('user', user)
}

test().finally(() => process.exit())
