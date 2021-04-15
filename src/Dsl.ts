import { CheckSelect, UserArgs, UserGetPayload } from './client/generated/types'

export type User = {
  id: number
  name: string
  address: string | null
  post: Post | null
}

export type Post = {
  id: number
  text: string
}

type Constraints<T> = { [key in keyof T]?: Array<(value: T) => boolean> }

const userConstraints: Constraints<User> = {
  address: [(value => value.address !== undefined)],
  id: [value => value.id !== 0]
}

const postConstraints: Constraints<Post> = {
  text: [value => value.text.length > 0]
}

type ConstraintMap = Map<string, Constraints<any>>

// const constraints: ConstraintMap = new Map([
//   ['user', userConstraints],
//   ['post', postConstraints]
// ])

export type Subset<T, U> = {
  [key in keyof T]: key extends keyof U ? T[key] : never
}

function getPayload<T extends UserArgs>(args?: Subset<T, UserArgs>): CheckSelect<T, User | null, UserGetPayload<T> | null> {
  // @ts-ignore
  return
}

const payload = getPayload({
  where: {
    firstName: {
      contains: ''
    }
  },
  select: {
    id: true,
    phone: true,
    address: {
      select: {
        zipcode: true,
        street: true
      }
    }
  },
  // include: {
  //   address: true
  // }
})
