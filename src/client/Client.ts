import { User } from 'src/Dsl'
import { QueryHandler } from 'src/client/QueryHandler'
import { CheckSelect, SelectSubset, UserArgs, UserGetPayload } from './generated/types'

export interface TableType {
  typeName: string
  tableName: string
  relations?: Relation[]
}

interface Relation {
  typeName: string
  tableName: string
  foreignKey: string
}

type ClientPromise<T, Args, Payload> = CheckSelect<Args, Promise<T | null>, Promise<Payload | null>>

interface UserDelegate {
  findFirst<T extends UserArgs>(args: SelectSubset<T, UserArgs>): ClientPromise<User, T, UserGetPayload<T>>
}

interface TypedClient {
  user: UserDelegate
}

const user: TableType = {
  typeName: 'user',
  tableName: 'user',
  relations: [{
    typeName: 'post',
    tableName: 'post',
    foreignKey: 'post_id'
  }]
}

const post: TableType = {
  typeName: 'post',
  tableName: 'post'
}

export function generateClient(): TypedClient {
  console.log('generating client')
  const types: Record<keyof TypedClient, TableType> = {
    user: user
  }

  const queryHandler = new QueryHandler()
  const client: Partial<TypedClient> = {}

  Object.entries(types).forEach(([typeName, tableType]) => {
    client[typeName as keyof TypedClient] = generateDelegate(queryHandler, tableType)
  })

  return client as TypedClient
}

interface Delegate {
  findFirst(args: any): any
}

function generateDelegate(queryHandler: QueryHandler, tableType: TableType): Delegate {
  return {
    findFirst: args => queryHandler.findFirst.bind(queryHandler)(tableType, args)
  }
}
