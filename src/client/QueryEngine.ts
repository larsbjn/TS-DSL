import knex, { Knex } from 'knex'
import { getConfig } from 'src/client/config'
import { constraints as tableConstraints, TableData, Client } from 'src/client/generated'

export class QueryEngine {
  private readonly client: Knex

  constructor() {
    const config = getConfig()
    this.client = knex(config)
  }

  async findFirst(
    tableData: TableData,
    { where, select }: {
      where: WhereInput<any>,
      select: SelectTest<any>,
    }
  ): Promise<any> {
    let query = this.client(tableData.tableName)

    query = this.generateWhereClause(query, where, tableData)

    if (select) query = this.generateSelectClause(query, select!, tableData)

    return query.first()
  }

  async create(tableData: TableData, data: Record<string, unknown>): Promise<any> {
    try {
      if (!this.checkConstraints(tableData, data)) throw new Error(`A constraint failed during insert into ${tableData.tableName}`)

      const result = await this.client(tableData.tableName).insert(data)

      let id: unknown = result[0]
      if (data[tableData.primaryKey]) id = data[tableData.primaryKey]

      return this.client(tableData.tableName).first('*').where({ [tableData.primaryKey]: id })
    } catch (e) {
      console.log(e)
    }
  }

  async delete(tableData: TableData, where: WhereInput<any>): Promise<any> {
    let query = this.client(tableData.tableName)

    return this.generateWhereClause(query, where, tableData).delete()
  }

  private checkConstraints({ tableName }: TableData, data: Record<string, unknown>): boolean {
    const constraints = tableConstraints[tableName as keyof Client]

    if (!constraints) return true
    return Object.keys(data).every(key => constraints[key] ? constraints[key]!(data) : true)
  }

  private generateSelectClause(query: Knex.QueryBuilder, select: Select<any>, tableType: TableData): Knex.QueryBuilder {
    for (const [key, value] of Object.entries(select)) {
      if (value === undefined) continue
      if (value) query = query.select(`${tableType.tableName}.${key}`)
    }

    return query
  }

  private generateWhereClause(query: Knex.QueryBuilder, where: WhereInput<any>, tableType: TableData): Knex.QueryBuilder {
    for (let [key, value] of Object.entries(where)) {
      if (value === undefined) continue

      if (key === 'AND') query = query.and
      else if (key === 'OR') query = query.or
      else if (key === 'NOT') query = query.not

      query = query.whereWrapped(queryBuilder => this.parseWhereArgs(queryBuilder, key, value, tableType))
    }

    return query
  }

  private parseWhereArgs(
    query: Knex.QueryBuilder, key: keyof WhereInputProp<any>, arg: WhereInputProp<any>[string] | null, tableType: TableData
  ): Knex.QueryBuilder {
    // console.log('parseWhereArgs', key, arg)
    if (typeof arg !== 'object') return this.parseWhereArg(query, String(key), ['equals', arg], tableType)

    // @ts-ignore
    for (let [argKey, argValue] of Object.entries(arg)) {
      if (argValue === undefined) continue

      if (typeof argValue === 'object' && !Array.isArray(argValue)) {
        query = this.parseWhereArgs(query, argKey, argValue, tableType)
      } else query = this.parseWhereArg(query, String(key), [argKey, argValue], tableType)
    }

    return query
  }

  private parseWhereArg<K extends keyof WhereInput<any>>(
    query: Knex.QueryBuilder, key: string, arg: [K, any[K]], tableType: TableData
  ): Knex.QueryBuilder {
    const [filterKey, value] = arg
    if (value === undefined) return query

    switch (filterKey as keyof StringFilter | IntFilter | DateTimeNullableFilter) {
      case 'in':
        return query.whereIn(`${tableType.tableName}.${key}`, Array.isArray(value) ? value : [value])
      // case 'notIn':
      //   return query.whereNotIn(key, Array.isArray(value) ? value : [value])
      case 'lt':
        return query.where(`${tableType.tableName}.${key}`, '<', value)
      case 'lte':
        return query.where(`${tableType.tableName}.${key}`, '<=', value)
      case 'gt':
        return query.where(`${tableType.tableName}.${key}`, '>', value)
      case 'gte':
        return query.orWhere(`${tableType.tableName}.${key}`, '>=', value)
      case 'contains':
        return query.where(`${tableType.tableName}.${key}`, 'like', `%${String(value)}%`)
      case 'startsWith':
        return query.where(`${tableType.tableName}.${key}`, 'like', `${String(value)}%`)
      case 'endsWith':
        return query.where(`${tableType.tableName}.${key}`, 'like', `%${String(value)}`)
      case 'equals':
        return query.where(`${tableType.tableName}.${key}`, value)
    }

    return query
  }
}

type ScalarKeys<T extends Record<string, unknown>> = Scalar<T>[keyof T]

type Scalar<T extends Record<string, unknown>> = {
  [key in keyof T]: T[key] extends object ? never : key
}

type SelectTest<T extends Record<string, unknown>> = {
  [key in ScalarKeys<T>]?: boolean
}

type Enumerable<T> = T | Array<T>

export type StringFilter = {
  equals?: string
  in?: Enumerable<string>
  // notIn?: Enumerable<string>
  lt?: string
  lte?: string
  gt?: string
  gte?: string
  contains?: string
  startsWith?: string
  endsWith?: string
  // not?: NestedStringFilter | string
}

export type IntFilter = {
  equals?: number
  in?: Enumerable<number>
  // notIn?: Enumerable<number>
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  // not?: NestedIntFilter | number
}

export type DateTimeNullableFilter = {
  equals?: Date | string | null
  in?: Enumerable<Date> | Enumerable<string> | null
  // notIn?: Enumerable<Date> | Enumerable<string> | null
  lt?: Date | string
  lte?: Date | string
  gt?: Date | string
  gte?: Date | string
  // not?: NestedDateTimeNullableFilter | Date | string | null
}

type Select<T extends Record<string, any>> = Partial<Record<keyof T, boolean>>
type WhereInput<T extends Record<string, any>> = WhereInputProp<T> & WhereInputConditionals<T>
type WhereInputProp<T extends Record<string, any>> = {
  [K in keyof T]?: WhereInputFilter<T[K]>
}

type WhereInputConditionals<T> = {
  AND?: Enumerable<WhereInputProp<T>>
  OR?: Enumerable<WhereInputProp<T>>
  NOT?: Enumerable<WhereInputProp<T>>
}

type WhereInputFilter<T extends number | string | Date> =
  | (T extends number ? IntFilter | number : never)
  | (T extends string ? StringFilter | string : never)
  | (T extends Date ? DateTimeNullableFilter : never)
