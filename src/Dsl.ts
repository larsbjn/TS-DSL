import knex, { Knex } from 'knex'
import dotenv from 'dotenv'

dotenv.config()

export type User = {
  id: number
  name: string
  address?: string
}

export type Post = {
  id: number
  text: string
}

type Constraints<T> = { [key in keyof T]?: Array<(value: any) => boolean> }

const userConstraints: Constraints<User> = {
  address: [(value => !!value)],
  id: [value => value !== 0]
}

const postConstraints: Constraints<Post> = {
  text: [value => value.length > 0]
}

type ConstraintMap<T = unknown> = Map<string, Constraints<T>>

const constraints: ConstraintMap = new Map([
  ['user', userConstraints],
  ['post', postConstraints]
])

export const config: Knex.Config = {
  debug: false,
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST!,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER,
  }
}

type FindFirstInputArgs<T> = {
  where: WhereInput<T>
  select?: Select<T>
}

class Client<T extends Record<string, any>> {
  private readonly client: Knex
  private readonly table: string
  private readonly constraints: Constraints<T>

  constructor(type: string) {
    this.client = knex(config)
    this.table = type
    this.constraints = constraints.get(type)!
  }

  async findFirst<W extends Select<T> | undefined>(
    { where, select }: FindFirstInputArgs<T>
  ): Promise<SelectReturnType<W, T> | undefined> {
    let query = this.client(this.table)

    query = this.generateWhereClause(query, where)

    if (select) query = this.generateSelectClause(query, select!)

    console.log(query.toQuery())

    // @ts-ignore
    return query.first() as SelectReturnType<W, T>
  }

  private generateSelectClause(query: Knex.QueryBuilder, select: Select<T>): Knex.QueryBuilder {
    for (const [key, value] of Object.entries(select)) {
      if (value === undefined) continue
      if (value) query = query.select(`${this.table}.${key}`)
    }

    return query
  }

  private generateWhereClause(query: Knex.QueryBuilder, where: WhereInput<T>): Knex.QueryBuilder {
    for (let [key, value] of Object.entries(where)) {
      if (value === undefined) continue

      if (key === 'AND') query = query.and
      else if (key === 'OR') query = query.or
      else if (key === 'NOT') query = query.not

      query = query.whereWrapped(queryBuilder => this.parseWhereArgs(queryBuilder, key, value))
    }

    return query
  }

  private parseWhereArgs(query: Knex.QueryBuilder, key: keyof WhereInputProp<T>, arg: WhereInputProp<T>[string]): Knex.QueryBuilder {
    // console.log('parseWhereArgs', key, arg)
    // @ts-ignore
    if (typeof arg !== 'object') query = this.parseWhereArg(query, String(key), ['equals', arg])

    for (let [argKey, argValue] of Object.entries(arg)) {
      if (argValue === undefined) continue

      if (typeof argValue === 'object' && !Array.isArray(argValue)) query = this.parseWhereArgs(query, argKey, argValue)
      else query = this.parseWhereArg(query, String(key), [argKey, argValue])
    }

    return query
  }

  private parseWhereArg<K extends keyof WhereInput<T>>(query: Knex.QueryBuilder, key: string, arg: [K, T[K]]): Knex.QueryBuilder {
    const [filterKey, value] = arg
    if (value === undefined) return query

    switch (filterKey as keyof StringFilter | IntFilter | DateTimeNullableFilter) {
      case 'in':
        return query.whereIn(`${this.table}.${key}`, Array.isArray(value) ? value : [value])
      // case 'notIn':
      //   return query.whereNotIn(key, Array.isArray(value) ? value : [value])
      case 'lt':
        return query.where(`${this.table}.${key}`, '<', value)
      case 'lte':
        return query.where(`${this.table}.${key}`, '<=', value)
      case 'gt':
        return query.where(`${this.table}.${key}`, '>', value)
      case 'gte':
        return query.orWhere(`${this.table}.${key}`, '>=', value)
      case 'contains':
        return query.where(`${this.table}.${key}`, 'like', `%${String(value)}%`)
      case 'startsWith':
        return query.where(`${this.table}.${key}`, 'like', `${String(value)}%`)
      case 'endsWith':
        return query.where(`${this.table}.${key}`, 'like', `%${String(value)}`)
      case 'equals':
        return query.where(`${this.table}.${key}`, value)
    }

    return query
  }

  findMany(args: T): T[] {
    // @ts-ignore
    return 'din mor'
  }

  create(args: T): T {
    for (const [key, value] of Object.entries(args)) {
      if (this.handleConstraint(key, value)) throw new Error(`Violated constraint for ${key}: ${value}`)
    }

    // @ts-ignore
    return {} as User
  }

  handleConstraint<T>(key: string, value: unknown): boolean {
    return this.constraints[key] ? this.constraints[key]!.every((constraint) => constraint(value)) : true
  }
}

export const client = {
  user: new Client<User>('user'),
  post: new Client<Post>('post'),
}

type SelectReturnType<W, T> =
  | (W extends undefined ? T : never)
  | (W extends Select<T> ? Partial<T> : never)

export type Enumerable<T> = T | Array<T>

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

type HasSelect = {
  select: any
}

export type SelectSubset<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : never
}

function find<T extends Record<string, unknown>>(where: T): Record<keyof T, T[keyof T]> {
  // @ts-ignore
  return 'test'
}
