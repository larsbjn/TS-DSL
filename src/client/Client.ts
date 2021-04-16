import { QueryHandler } from 'src/client/QueryHandler'
import { TypedClient, tableTypes, TableType } from 'src/client/generated'

export function generateClient(): TypedClient {
  const queryHandler = new QueryHandler()
  const client: Partial<TypedClient> = {}

  Object.entries(tableTypes).forEach(([typeName, tableType]) => {
    client[typeName as keyof TypedClient] = generateDelegate(queryHandler, tableType)
  })

  return client as TypedClient
}

interface Delegate {
  findFirst(args: any): any
  delete(where: any): Promise<number>
  create(data: any): Promise<any>
  update(args: any): Promise<any>
}

function generateDelegate(queryHandler: QueryHandler, tableType: TableType): Delegate {
  return {
    findFirst: args => queryHandler.findFirst.bind(queryHandler)(tableType, args),
    delete: args => Promise.resolve(0),
    create: args => Promise.resolve(),
    update: args => Promise.resolve()
  }
}
