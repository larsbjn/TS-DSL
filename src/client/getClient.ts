import { QueryEngine } from 'src/client/QueryEngine'
import {TableClient, Queries, queries, Client, tableData, TableData} from 'src/client/generated'

let client: Client

export function getClient(): Client {
  if (client) return client
  const queryEngine = new QueryEngine()
  const newClient: Partial<Client> = {}

  Object.entries(tableData).forEach(([typeName, tableData]) => {
    newClient[typeName as keyof TableClient] = generateDelegate(queryEngine, tableData)
  })

  Object.entries(queries).forEach(([funcName, func]) => {
    newClient[funcName as keyof Queries] = func
  })

  return client = newClient as Client
}

interface Delegate {
  findFirst(args: any): any
  delete(where: any): Promise<number>
  create(data: any): Promise<any>
  update(args: any): Promise<any>
}

function generateDelegate(queryEngine: QueryEngine, tableData: TableData): Delegate {
  return {
    findFirst: args => queryEngine.findFirst.bind(queryEngine)(tableData, args),
    delete: args => queryEngine.delete.bind(queryEngine)(tableData, args),
    create: args => queryEngine.create.bind(queryEngine)(tableData, args),
    update: args => queryEngine.update.bind(queryEngine)(tableData, args)
  }
}
