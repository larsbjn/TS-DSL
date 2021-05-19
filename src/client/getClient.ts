import { QueryEngine } from 'src/client/QueryEngine'
import {Client, queries, QueryClient, tableData, TableData} from 'src/client/generated'

let client: QueryClient

export function getClient(): QueryClient {
  if (client) return client
  const queryEngine = new QueryEngine()
  const newClient: Partial<QueryClient> = {}

  Object.entries(tableData).forEach(([typeName, tableData]) => {
    newClient[typeName as keyof Client] = generateDelegate(queryEngine, tableData)
  })

  Object.entries(queries).forEach(([funcName, func]) => {
    newClient[funcName as keyof Client] = func
  })

  return client = newClient as QueryClient
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
