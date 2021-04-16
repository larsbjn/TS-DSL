import knex, { Knex } from 'knex'
import { config } from 'src/client/config'
import { TableType, constraints as clientConstraints, TypedClient } from 'src/client/generated'

export class QueryHandler {
  private readonly client: Knex

  constructor() {
    this.client = knex(config)
  }

  findFirst(
    tableType: TableType,
    { where, select }: {
      where: WhereInput<any>,
      select: SelectTest<any>,
    }
  ): Promise<any> {
    let query = this.client(tableType.tableName)

    query = this.generateWhereClause(query, where, tableType)

    if (select) query = this.generateSelectClause(query, select!, tableType)

    console.log(query.toQuery())

    return query.first()
  }

  async create(tableType: TableType, data: Record<string, unknown>): Promise<any> {
  	const constraints = clientConstraints[tableType.tableName as keyof TypedClient]
  }

  private generateSelectClause(query: Knex.QueryBuilder, select: Select<any>, tableType: TableType): Knex.QueryBuilder {
    for (const [key, value] of Object.entries(select)) {
      if (value === undefined) continue
      if (value) query = query.select(`${tableType.tableName}.${key}`)
    }

    return query
  }

  private generateWhereClause(query: Knex.QueryBuilder, where: WhereInput<any>, tableType: TableType): Knex.QueryBuilder {
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
    query: Knex.QueryBuilder, key: keyof WhereInputProp<any>, arg: WhereInputProp<any>[string] | null, tableType: TableType
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
    query: Knex.QueryBuilder, key: string, arg: [K, any[K]], tableType: TableType
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
