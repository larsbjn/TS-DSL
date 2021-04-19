import { QueryEngine } from 'src/client/QueryEngine'
import { Client, tableData, TableData } from 'src/client/generated'

let client: Client

export function getClient(): Client {
  if (client) return client
  const queryEngine = new QueryEngine()
  const newClient: Partial<Client> = {}

  Object.entries(tableData).forEach(([typeName, tableData]) => {
    newClient[typeName as keyof Client] = generateDelegate(queryEngine, tableData)
  })

  return client = newClient as Client
}

interface Delegate {
  findFirst(args: any): any
  delete(where: any): Promise<number>
  create(data: any): Promise<any>
  update(args: any): Promise<any>
}

function generateDelegate(queryHandler: QueryEngine, tableData: TableData): Delegate {
  return {
    findFirst: args => queryHandler.findFirst.bind(queryHandler)(tableData, args),
    delete: args => queryHandler.delete.bind(queryHandler)(tableData, args),
    create: args => queryHandler.create.bind(queryHandler)(tableData, args),
    update: args => queryHandler.update.bind(queryHandler)(tableData, args)
  }
}
