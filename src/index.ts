import { client } from 'src/Dsl'
import dotenv from 'dotenv'

dotenv.config()

async function test() {
  const user = await client.user.findFirst({ id: { in: 1, lt: 1 }, AND: { id: { lt: 2 } } }, { id: true })
  // client.user.findFirst({ name: 'test' })
  // const userSelect = client.user.findFirst({ id: 1 }, { id: true })
  console.log(user)
}

test().then()
