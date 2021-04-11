import { client } from 'src/Dsl'
import dotenv from 'dotenv'

dotenv.config()

async function test() {
  const user = await client.user.findFirst({
    where: {
      id: 1,
      name: { contains: 'J' },
      NOT: { id: { gte: 2, in: 3 } }
    },
    select: {
      id: true,
      name: true
    }
  })

  // const userSelect = client.user.findFirst({ id: 1 }, { id: true })
  console.log(user)
}

test().finally(() => process.exit())
